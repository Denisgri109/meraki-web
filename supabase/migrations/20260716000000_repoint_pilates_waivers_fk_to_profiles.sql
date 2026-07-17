-- ============================================================================
-- Repoint pilates_waivers.user_id FK from auth.users to profiles
-- ============================================================================
-- Problem: The owner-facing waivers page (src/app/pilates/waivers/page.tsx)
-- joins `profiles!pilates_waivers_user_id_fkey(full_name, email, phone)` but
-- the FK `pilates_waivers_user_id_fkey` referenced auth.users, not profiles.
-- PostgREST could not resolve the embedded join → the query errored and the
-- page showed "Failed to load waivers".
--
-- Fix: Replace the FK to point to profiles(id) instead of auth.users(id).
-- profiles.id is itself a FK (CASCADE) to auth.users.id, so user-existence
-- integrity is preserved.  The constraint NAME stays the same, so the existing
-- query code needs no changes.  This matches the pattern already used by
-- scheduled_notifications (user_id → profiles).
--
-- Verified before migration: 0 orphaned waivers (every waiver's user_id exists
-- in profiles), so the FK swap is safe.
-- ============================================================================

alter table public.pilates_waivers
  drop constraint if exists pilates_waivers_user_id_fkey;

alter table public.pilates_waivers
  add constraint pilates_waivers_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
