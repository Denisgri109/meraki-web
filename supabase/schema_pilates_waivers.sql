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

  -- The client who signed the waiver.
  -- FK targets profiles(id), NOT auth.users(id), so PostgREST can resolve the
  -- embedded join `profiles!pilates_waivers_user_id_fkey(...)` used by the
  -- owner-facing waivers page.  profiles.id is itself a CASCADE FK to
  -- auth.users(id), so user-existence integrity is preserved.
  -- (Originally referenced auth.users(id); repointed 2026-07-16 — see
  --  migration 20260716000000_repoint_pilates_waivers_fk_to_profiles.sql)
  user_id                     uuid not null references public.profiles(id) on delete cascade,

  -- ── v2.0 columns (kept for backward compatibility; NULL for v3.0 submissions) ──
  has_injuries                boolean     not null default false,
  injury_details              text,
  emergency_contact_name         text,
  emergency_contact_relationship text,
  emergency_contact_phone         text,
  signature_name              text,
  signed_at                   timestamptz not null default now(),

  -- Version of the terms that were agreed to (lets you re-prompt if T&Cs change)
  terms_version               text        not null default '2.0',

  -- ── v3.0 Health Screening Questionnaire columns ──────────────────────
  injuries_joint_problems     text,
  pilates_experience          text,
  has_illnesses               boolean     default false,
  illness_details             text,
  pregnancy_status            text,
  medication_details          text,
  exercise_history            text,
  practitioner_recommended    boolean     default false,
  goals_expectations          text,
  has_bone_condition          boolean     default false,

  -- ── v3.0 Consent columns ─────────────────────────────────────────────
  agreed_terms_of_use         boolean     default false,
  agreed_email_marketing      boolean     default false,
  agreed_sms_marketing        boolean     default false,
  agreed_liability_waiver     boolean     default false,

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

-- ── Owner + explicitly authorized masters can read all waivers ──────
-- The old policy allowed any master to read waivers.  The new policy
-- requires is_authorized_instructor = true for masters.
-- The Owner always has full access regardless of the flag.
drop policy if exists "pilates_waivers_select_staff" on public.pilates_waivers;
drop policy if exists "pilates_waivers_select_authorized_staff" on public.pilates_waivers;
create policy "pilates_waivers_select_authorized_staff"
  on public.pilates_waivers for select
  using (
    -- Owner always has full access
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'owner'
    )
    -- Master only if explicitly authorized by the Owner
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'master'
        and p.is_authorized_instructor = true
    )
  );

-- ============================================================================
-- Helpful comment
-- ============================================================================
comment on table public.pilates_waivers is
  'Pilates injury disclosure and liability waiver. One row per user. '
  'Checked before allowing Pilates class bookings. '
  'Only the Owner and explicitly authorized masters (is_authorized_instructor = true) '
  'can read waivers from other clients.';
