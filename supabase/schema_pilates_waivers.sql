-- ============================================================================
-- Pilates Injury Disclosure & Liability Waiver
-- ============================================================================
-- This table stores a client's signed injury disclosure and liability waiver.
-- One row per user (enforced by unique constraint on user_id).
-- A signed waiver is required before a client can book any Pilates class.
--
-- Run this in the Supabase SQL Editor or via `supabase db push`.
-- ============================================================================

create table if not exists public.pilates_waivers (
  id                          uuid primary key default gen_random_uuid(),

  -- The client who signed the waiver
  user_id                     uuid not null references auth.users(id) on delete cascade,

  -- Injury disclosure
  has_injuries                boolean     not null default false,
  injury_details              text,

  -- Emergency contact (stored as columns for queryability)
  emergency_contact_name         text,
  emergency_contact_relationship text,
  emergency_contact_phone         text,

  -- Digital signature
  signature_name              text        not null,
  signed_at                   timestamptz not null default now(),

  -- Version of the terms that were agreed to (lets you re-prompt if T&Cs change)
  terms_version               text        not null default '2.0',

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ── One waiver per user ──────────────────────────────────────────────
create unique index if not exists pilates_waivers_user_id_uniq
  on public.pilates_waivers (user_id);

-- ── Updated-at trigger ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pilates_waivers_updated_at on public.pilates_waivers;
create trigger trg_pilates_waivers_updated_at
  before update on public.pilates_waivers
  for each row
  execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.pilates_waivers enable row level security;

-- A client can read their own waiver
drop policy if exists "pilates_waivers_select_own" on public.pilates_waivers;
create policy "pilates_waivers_select_own"
  on public.pilates_waivers for select
  using (auth.uid() = user_id);

-- A client can insert their own waiver
drop policy if exists "pilates_waivers_insert_own" on public.pilates_waivers;
create policy "pilates_waivers_insert_own"
  on public.pilates_waivers for insert
  with check (auth.uid() = user_id);

-- A client can update their own waiver
drop policy if exists "pilates_waivers_update_own" on public.pilates_waivers;
create policy "pilates_waivers_update_own"
  on public.pilates_waivers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Studio owners/masters can read waivers for their clients
-- (comment out or adjust the role check if your schema uses different role values)
drop policy if exists "pilates_waivers_select_staff" on public.pilates_waivers;
create policy "pilates_waivers_select_staff"
  on public.pilates_waivers for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'master')
    )
  );

-- ============================================================================
-- Helpful comment
-- ============================================================================
comment on table public.pilates_waivers is
  'Pilates injury disclosure and liability waiver. One row per user. '
  'Checked before allowing Pilates class bookings.';
