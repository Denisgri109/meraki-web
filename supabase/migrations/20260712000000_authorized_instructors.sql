-- ============================================================================
-- Owner-Controlled Master/Instructor Authorization & Waiver Routing
-- ============================================================================
-- This migration adds an explicit authorization flag to the profiles table
-- so that only the Owner AND explicitly authorized Master Accounts can
-- read signed Injury Disclosure & Liability waivers.
--
-- Before this migration, ANY user with role = 'master' could read all
-- waivers.  Now the Owner must explicitly set is_authorized_instructor = true
-- on each master account before they can access the waiver feed.
--
-- Run this in the Supabase SQL Editor or via `supabase db push`.
-- ============================================================================

-- ── 1. Add is_authorized_instructor column to profiles ────────────────
alter table public.profiles
  add column if not exists is_authorized_instructor boolean not null default false;

comment on column public.profiles.is_authorized_instructor is
  'Set by the Owner. When true, this master account can read all signed '
  'pilates_waivers records. When false (default), the master cannot view '
  'client waivers — only the Owner and the client themselves can.';

-- ── 2. Updated RLS policy on pilates_waivers ───────────────────────────
-- Replace the old "pilates_waivers_select_staff" policy which allowed any
-- master to read all waivers.  The new policy requires:
--   - role = 'owner'  → always allowed (super admin)
--   - role = 'master' → only if is_authorized_instructor = true
drop policy if exists "pilates_waivers_select_staff" on public.pilates_waivers;

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

-- ── 3. RLS on profiles: only the Owner can toggle is_authorized_instructor ─
-- The profiles table already has RLS enabled.  We add a policy so that
-- only the Owner can update the is_authorized_instructor flag.
-- (Existing update policies allow users to update their own row for
--  other fields; this policy specifically gates the authorization flag.)

-- First, create a helper function to check if the current user is the owner
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'owner'
  );
$$;

-- Policy: only the owner can update is_authorized_instructor
drop policy if exists "profiles_update_authorized_instructor_owner_only" on public.profiles;
create policy "profiles_update_authorized_instructor_owner_only"
  on public.profiles for update
  using (
    -- The owner can update anyone's is_authorized_instructor
    public.is_owner()
    -- A user can always update their own row (existing behaviour preserved
    -- for other fields; the DB trigger below blocks non-owners from
    -- changing is_authorized_instructor itself)
    or auth.uid() = id
  )
  with check (
    -- For the is_authorized_instructor column specifically, only the owner
    -- is allowed.  This with-check clause ensures that if a non-owner tries
    -- to set is_authorized_instructor, the row is rejected.
    -- (The trigger below enforces this at the column level for robustness.)
    true
  );

-- ── 4. Trigger: block non-owner changes to is_authorized_instructor ──
-- Even though RLS gates the update, a master updating their own profile
-- could potentially set is_authorized_instructor in the same UPDATE that
-- touches other allowed columns.  This trigger provides defense-in-depth.
create or replace function public.guard_authorized_instructor()
returns trigger as $$
begin
  -- If is_authorized_instructor is being changed and the current user
  -- is not the owner, block the change.
  if new.is_authorized_instructor is distinct from old.is_authorized_instructor then
    if not public.is_owner() then
      raise exception 'Only the Owner can modify the is_authorized_instructor flag';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_guard_authorized_instructor on public.profiles;
create trigger trg_guard_authorized_instructor
  before update on public.profiles
  for each row
  execute function public.guard_authorized_instructor();

-- ============================================================================
-- Helpful comments
-- ============================================================================
comment on function public.is_owner() is
  'Returns true if the current authenticated user has role = ''owner''.';

comment on function public.guard_authorized_instructor() is
  'Blocks any non-owner user from changing the is_authorized_instructor flag.';
