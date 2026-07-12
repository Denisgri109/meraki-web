-- ============================================================================
-- Secure Voucher & Discount Code System
-- ============================================================================
-- This migration expands the existing vouchers table (migration 20260703)
-- to support four discount types, hard 7-day expiration, owner attribution,
-- and a dedicated voucher_redemptions table for usage tracking.
--
-- Discount Types:
--   free_month    — Type A: 100% off a 1-month Pilates membership/package
--   percentage    — Type B: X% off any single booking or package (e.g., 50)
--   free_trial    — Type C: 100% off a single class booking
--   fixed_amount  — Type D: fixed cash discount (e.g., EUR 15.00)
--
-- Security:
--   - All validation happens server-side via the redeem_voucher RPC
--   - Row locking (FOR UPDATE) prevents concurrent over-redemption
--   - RLS restricts voucher creation to the Owner only
--   - 7-day hard expiration on voucher creation
--   - 7-day benefit expiration on redemption
--
-- Run this in the Supabase SQL Editor or via `supabase db push`.
-- ============================================================================

-- ── 1. Expand vouchers table ────────────────────────────────────────────
-- The existing vouchers table already has: id, code, discount_value,
-- discount_type, package_id, max_uses, current_uses, is_active, created_at.
-- We add: created_by, expires_at, benefit_expires_days, updated_at, description.

alter table public.vouchers
  add column if not exists created_by          uuid        references auth.users(id) on delete set null,
  add column if not exists expires_at          timestamptz not null default (now() + interval '7 days'),
  add column if not exists benefit_expires_days int       not null default 7,
  add column if not exists updated_at          timestamptz not null default now(),
  add column if not exists description         text;

comment on column public.vouchers.expires_at is
  'Hard expiration: the voucher cannot be claimed/redeemed after this date. '
  'Defaults to 7 days from creation.';

comment on column public.vouchers.benefit_expires_days is
  'Number of days the granted benefit (credit, pass, free class) remains '
  'valid after redemption. Defaults to 7 (the 7-day usage rule).';

comment on column public.vouchers.created_by is
  'The Owner who created this voucher. NULL for legacy rows.';

-- ── 1a. Expand discount_type CHECK constraint ───────────────────────────
-- The original discount_type accepted 'percentage' | 'fixed'.
-- We add 'free_month', 'free_trial', 'fixed_amount' while keeping
-- 'fixed' for backward compatibility (mapped to 'fixed_amount').
alter table public.vouchers
  drop constraint if exists vouchers_discount_type_check;

alter table public.vouchers
  add constraint vouchers_discount_type_check
  check (discount_type in ('free_month', 'percentage', 'free_trial', 'fixed_amount', 'fixed'));

-- ── 1b. Unique code constraint ──────────────────────────────────────────
create unique index if not exists vouchers_code_uniq
  on public.vouchers (code);

-- ── 1c. Index for owner lookups ─────────────────────────────────────────
create index if not exists vouchers_created_by_idx
  on public.vouchers (created_by);

create index if not exists vouchers_expires_at_idx
  on public.vouchers (expires_at);

-- ── 1d. Updated-at trigger for vouchers ─────────────────────────────────
-- Reuse the set_updated_at function from migration 20260711000000 if it
-- exists; otherwise create it (idempotent).
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_vouchers_updated_at on public.vouchers;
create trigger trg_vouchers_updated_at
  before update on public.vouchers
  for each row
  execute function public.set_updated_at();

-- ── 2. voucher_redemptions table ────────────────────────────────────────
-- Tracks every redemption: who, when, which voucher, and the benefit
-- expiration date (redeemed_at + benefit_expires_days).
-- A unique partial index on (user_id, voucher_id) prevents a single user
-- from redeeming the same single-use voucher twice.

create table if not exists public.voucher_redemptions (
  id                uuid        primary key default gen_random_uuid(),

  voucher_id        uuid        not null references public.vouchers(id) on delete cascade,
  user_id           uuid        not null references auth.users(id) on delete cascade,

  -- When the redemption happened
  redeemed_at       timestamptz not null default now(),

  -- When the granted benefit expires (redeemed_at + benefit_expires_days)
  -- NULL if the voucher is a pure discount (no lingering benefit)
  benefit_expires_at timestamptz,

  -- Optional links to the booking/order that consumed this redemption
  appointment_id    uuid        references public.appointments(id) on delete set null,
  order_id          uuid        references public.orders(id) on delete set null,

  -- 'active' = benefit still valid, 'used' = benefit consumed, 'expired' = past benefit_expires_at
  status            text        not null default 'active'
                                check (status in ('active', 'used', 'expired')),

  -- The discount amount that was applied (in cents, for audit)
  discount_applied  integer     not null default 0,

  created_at        timestamptz not null default now()
);

-- Prevent a single user from redeeming the same voucher more than once
create unique index if not exists voucher_redemptions_user_voucher_uniq
  on public.voucher_redemptions (user_id, voucher_id);

-- Lookup indexes
create index if not exists voucher_redemptions_voucher_id_idx
  on public.voucher_redemptions (voucher_id);

create index if not exists voucher_redemptions_user_id_idx
  on public.voucher_redemptions (user_id);

create index if not exists voucher_redemptions_status_idx
  on public.voucher_redemptions (status);

-- ── 3. Row Level Security ───────────────────────────────────────────────

alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;

-- ── 3a. Vouchers: Owner can do everything ───────────────────────────────

drop policy if exists "vouchers_owner_all" on public.vouchers;
create policy "vouchers_owner_all"
  on public.vouchers for all
  using (public.is_owner())
  with check (public.is_owner());

-- Any authenticated user can read active, non-expired vouchers
-- (needed to validate a code during checkout)
drop policy if exists "vouchers_select_active" on public.vouchers;
create policy "vouchers_select_active"
  on public.vouchers for select
  using (
    is_active = true
    and expires_at > now()
  );

-- ── 3b. Voucher Redemptions ────────────────────────────────────────────

-- A user can read their own redemptions
drop policy if exists "voucher_redemptions_select_own" on public.voucher_redemptions;
create policy "voucher_redemptions_select_own"
  on public.voucher_redemptions for select
  using (auth.uid() = user_id);

-- The Owner can read all redemptions (monitoring)
drop policy if exists "voucher_redemptions_select_owner" on public.voucher_redemptions;
create policy "voucher_redemptions_select_owner"
  on public.voucher_redemptions for select
  using (public.is_owner());

-- Inserts are handled by the redeem_voucher RPC (security definer),
-- so we don't need a direct insert policy for regular users.
-- However, we add one as a fallback for the API route.
drop policy if exists "voucher_redemptions_insert_own" on public.voucher_redemptions;
create policy "voucher_redemptions_insert_own"
  on public.voucher_redemptions for insert
  with check (auth.uid() = user_id);

-- A user can update their own redemption status (e.g., mark as used)
drop policy if exists "voucher_redemptions_update_own" on public.voucher_redemptions;
create policy "voucher_redemptions_update_own"
  on public.voucher_redemptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The Owner can update any redemption
drop policy if exists "voucher_redemptions_update_owner" on public.voucher_redemptions;
create policy "voucher_redemptions_update_owner"
  on public.voucher_redemptions for update
  using (public.is_owner())
  with check (public.is_owner());

-- ── 4. redeem_voucher RPC (concurrency-safe) ──────────────────────────
-- This is the single entry point for redeeming a voucher.
-- It uses SELECT ... FOR UPDATE to lock the voucher row, preventing
-- two concurrent requests from both decrementing max_uses past zero.
--
-- Parameters:
--   p_code        — the voucher code (case-insensitive)
--   p_user_id     — the redeeming user's UUID
--   p_amount_cents — the original price in cents (for calculating discount)
--
-- Returns JSON: { success, message, voucher_id, discount_type, discount_value,
--                 discount_amount_cents, new_total_cents, benefit_expires_at }

create or replace function public.redeem_voucher(
  p_code         text,
  p_user_id      uuid,
  p_amount_cents integer default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voucher      public.vouchers%rowtype;
  v_discount     integer := 0;
  v_new_total    integer := 0;
  v_benefit_exp  timestamptz;
  v_already      integer;
begin
  -- ── Look up the voucher with row lock ──────────────────────────────
  -- FOR UPDATE prevents a second concurrent call from reading this row
  -- until our transaction commits, preventing over-redemption.
  select *
    into v_voucher
    from public.vouchers
    where upper(code) = upper(p_code)
      and is_active = true
    for update;

  if not found then
    return json_build_object('success', false, 'message', 'Voucher code not found or inactive.');
  end if;

  -- ── Check hard expiration (7-day rule from creation) ──────────────────
  if v_voucher.expires_at <= now() then
    return json_build_object('success', false, 'message', 'This voucher has expired.');
  end if;

  -- ── Check usage limit ────────────────────────────────────────────────
  if v_voucher.current_uses >= v_voucher.max_uses then
    return json_build_object('success', false, 'message', 'This voucher has reached its usage limit.');
  end if;

  -- ── Check if user already redeemed this voucher ──────────────────────
  select count(*) into v_already
    from public.voucher_redemptions
    where user_id = p_user_id and voucher_id = v_voucher.id;

  if v_already > 0 then
    return json_build_object('success', false, 'message', 'You have already redeemed this voucher.');
  end if;

  -- ── Calculate discount based on type ────────────────────────────────
  if v_voucher.discount_type in ('free_month', 'free_trial') then
    -- 100% off
    v_discount := coalesce(p_amount_cents, 0);
    v_new_total := 0;
  elsif v_voucher.discount_type = 'percentage' then
    -- discount_value is the percentage (e.g., 50 = 50%)
    v_discount := round(coalesce(p_amount_cents, 0) * v_voucher.discount_value / 100);
    v_new_total := coalesce(p_amount_cents, 0) - v_discount;
  elsif v_voucher.discount_type in ('fixed_amount', 'fixed') then
    -- discount_value is the fixed amount in cents
    v_discount := least(v_voucher.discount_value, coalesce(p_amount_cents, 0));
    v_new_total := coalesce(p_amount_cents, 0) - v_discount;
  else
    return json_build_object('success', false, 'message', 'Unknown discount type.');
  end if;

  -- ── Compute benefit expiration ──────────────────────────────────────
  -- Only free_month and free_trial grant a lingering benefit (credit/pass).
  -- Percentage and fixed_amount are point-in-time discounts with no lingering benefit.
  if v_voucher.discount_type in ('free_month', 'free_trial') then
    v_benefit_exp := now() + (v_voucher.benefit_expires_days || ' days')::interval;
  else
    v_benefit_exp := null;
  end if;

  -- ── Record the redemption ───────────────────────────────────────────
  insert into public.voucher_redemptions (
    voucher_id, user_id, redeemed_at, benefit_expires_at, status, discount_applied
  ) values (
    v_voucher.id, p_user_id, now(), v_benefit_exp,
    case when v_benefit_exp is not null then 'active' else 'used' end,
    v_discount
  );

  -- ── Increment the voucher usage counter ─────────────────────────────
  update public.vouchers
    set current_uses = current_uses + 1
    where id = v_voucher.id;

  -- ── Deactivate the voucher if it's now exhausted ────────────────────
  if v_voucher.current_uses + 1 >= v_voucher.max_uses then
    update public.vouchers set is_active = false where id = v_voucher.id;
  end if;

  return json_build_object(
    'success', true,
    'message', 'Voucher applied successfully.',
    'voucher_id', v_voucher.id,
    'code', v_voucher.code,
    'discount_type', v_voucher.discount_type,
    'discount_value', v_voucher.discount_value,
    'discount_amount_cents', v_discount,
    'new_total_cents', v_new_total,
    'benefit_expires_at', v_benefit_exp
  );
end;
$$;

-- ── 5. Helper: mark expired redemptions ────────────────────────────────
-- Can be called by a cron job or on-demand to flip 'active' redemptions
-- whose benefit_expires_at has passed to 'expired'.
create or replace function public.expire_voucher_redemptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.voucher_redemptions
    set status = 'expired'
    where status = 'active'
      and benefit_expires_at is not null
      and benefit_expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ── 6. Comments ────────────────────────────────────────────────────────

comment on table public.vouchers is
  'Discount voucher codes created by the Owner. Supports four discount types: '
  'free_month, percentage, free_trial, fixed_amount. '
  'Hard expiration (expires_at) defaults to 7 days from creation.';

comment on table public.voucher_redemptions is
  'Tracks every voucher redemption. Links user_id to voucher_id with a unique '
  'constraint preventing reuse. Records the benefit_expires_at for the 7-day '
  'usage rule on credit-type vouchers (free_month, free_trial).';

comment on function public.redeem_voucher(text, uuid, integer) is
  'Concurrency-safe voucher redemption. Uses SELECT FOR UPDATE to prevent '
  'over-redemption. Validates expiration, usage limit, and per-user uniqueness. '
  'Returns JSON with discount calculation and new total.';
