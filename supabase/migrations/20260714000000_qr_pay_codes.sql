-- ============================================================================
-- Owner-Controlled QR Payment Codes & Instructor Access Flag
-- ============================================================================
-- This migration introduces:
--   1. A `can_view_qr_pay` boolean flag on `profiles` (Owner-controlled).
--      When true, the master account (Instructor) may view the studio's QR
--      payment codes (Revolut / Bizum / bank-transfer / Stripe QR, etc.)
--      from their dashboard and present them to clients in-person.
--   2. A new `qr_pay_codes` table holding the payment-method QR assets.
--   3. RLS on `qr_pay_codes`:
--        - Owner: full CRUD
--        - Master with can_view_qr_pay=true: SELECT active rows only
--        - Everyone else: no access
--   4. A defense-in-depth trigger blocking non-owner changes to
--      `can_view_qr_pay` (mirrors the existing guard_authorized_instructor).
--
-- Builds on migration 20260712000000_authorized_instructors.sql, which
-- already created the `public.is_owner()` helper used below.
-- ============================================================================

-- ── 1. Add can_view_qr_pay column to profiles ──────────────────────────
alter table public.profiles
  add column if not exists can_view_qr_pay boolean not null default false;

comment on column public.profiles.can_view_qr_pay is
  'Set by the Owner. When true, this master account can view the studio''s '
  'qr_pay_codes (payment-method QR assets) to present to clients in-person. '
  'When false (default), the QR Pay panel is hidden from their dashboard.';

-- ── 2. Create qr_pay_codes table ────────────────────────────────────────
create table if not exists public.qr_pay_codes (
  id           uuid primary key default gen_random_uuid(),
  provider_name text not null check (length(btrim(provider_name)) >= 1),
  -- Exactly one QR source per row: an uploaded image OR a text/URL payload
  -- rendered live. The CHECK constraint below enforces mutual exclusivity.
  qr_image_url text,
  qr_payload   text,
  display_order integer not null default 0,
  is_active    boolean not null default true,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Exactly one of qr_image_url / qr_payload must be set
  constraint qr_pay_codes_exactly_one_source check (
    (qr_image_url is not null and qr_payload is null)
    or
    (qr_image_url is null and qr_payload is not null)
  )
);

comment on table public.qr_pay_codes is
  'Studio payment-method QR assets (Revolut, Bizum, bank transfer, etc.) '
  'the Owner uploads for in-person payments. Visible to the Owner always; '
  'visible to authorized instructors (can_view_qr_pay=true) when active.';

comment on column public.qr_pay_codes.qr_image_url is
  'Public URL of an uploaded QR image. Mutually exclusive with qr_payload.';
comment on column public.qr_pay_codes.qr_payload is
  'Raw text/URL payload rendered live as a QR via qrcode.react '
  '(e.g. an IBAN, a payment link). Mutually exclusive with qr_image_url.';
comment on column public.qr_pay_codes.display_order is
  'Manual sort order; lower renders first.';
comment on column public.qr_pay_codes.is_active is
  'Owner can deactivate a method without deleting it. Inactive rows are '
  'hidden from instructors but remain visible to the Owner.';

create index if not exists qr_pay_codes_display_order_idx
  on public.qr_pay_codes (display_order);
create index if not exists qr_pay_codes_active_idx
  on public.qr_pay_codes (is_active);

-- ── 3. Enable RLS + policies on qr_pay_codes ────────────────────────────
alter table public.qr_pay_codes enable row level security;

-- Owner: full CRUD on every row.
drop policy if exists "qr_pay_codes_owner_all" on public.qr_pay_codes;
create policy "qr_pay_codes_owner_all"
  on public.qr_pay_codes
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- Authorized instructor: read active rows only.
drop policy if exists "qr_pay_codes_select_authorized" on public.qr_pay_codes;
create policy "qr_pay_codes_select_authorized"
  on public.qr_pay_codes
  for select
  using (
    is_active = true
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'master'
        and p.can_view_qr_pay = true
    )
  );

-- ── 4. updated_at trigger (shared set_updated_at helper) ────────────────
-- Idempotent: the vouchers + pilates_waivers migrations already define this
-- function; CREATE OR REPLACE keeps things order-independent.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_qr_pay_codes_updated_at on public.qr_pay_codes;
create trigger trg_qr_pay_codes_updated_at
  before update on public.qr_pay_codes
  for each row
  execute function public.set_updated_at();

-- ── 5. Defense-in-depth: block non-owner changes to can_view_qr_pay ──
-- Mirrors guard_authorized_instructor(). Even if a future RLS policy or a
-- self-update path allowed a master to touch their own row, this trigger
-- refuses any change to can_view_qr_pay by a non-owner.
create or replace function public.guard_can_view_qr_pay()
returns trigger as $$
begin
  if new.can_view_qr_pay is distinct from old.can_view_qr_pay then
    if not public.is_owner() then
      raise exception 'Only the Owner can modify the can_view_qr_pay flag';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_guard_can_view_qr_pay on public.profiles;
create trigger trg_guard_can_view_qr_pay
  before update on public.profiles
  for each row
  execute function public.guard_can_view_qr_pay();

-- ── 6. Helpful comments ─────────────────────────────────────────────────
comment on function public.guard_can_view_qr_pay() is
  'Blocks any non-owner user from changing the can_view_qr_pay flag.';
