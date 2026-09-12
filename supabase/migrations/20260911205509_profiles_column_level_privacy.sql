-- Applied to the live database 2026-09-11.
--
-- Closes AUDIT_2026-08-30 finding DB-2.
--
-- The row policy on `profiles` already limits which rows a signed-in user can
-- see (own row, plus every master/owner, plus people they share an appointment
-- or conversation with). What it cannot do is limit which *columns*, because
-- Postgres RLS is row-level only. So every client could read the email, phone
-- number, push token and Stripe identifiers of every master and owner.
--
-- Fixed with column-level GRANTs on the base table, plus two narrow escape
-- hatches for the cases that genuinely need the contact columns:
--   * get_my_profile()        - the caller's own complete row
--   * profiles_with_contact   - contact details for people the caller is
--                               entitled to see them for (self, owner, staff
--                               sharing an appointment, chat counterpart)

-- 1. anon has no business reading profiles at all.
REVOKE ALL ON public.profiles FROM anon;

-- 2. Replace the blanket SELECT grant with a column list.
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id,
  full_name,
  avatar_url,
  bio,
  role,
  is_master,
  is_verified,
  is_authorized_instructor,
  master_status,
  can_view_qr_pay,
  specialties,
  years_of_experience,
  city,
  country,
  country_code,
  state,
  state_code,
  latitude,
  longitude,
  timezone,
  currency,
  currency_code,
  commission_rate,
  loyalty_points,
  search_radius_km,
  service_radius_km,
  onboarding_completed,
  location_setup_completed,
  created_at,
  updated_at
) ON public.profiles TO authenticated;

-- Deliberately NOT granted: email, phone, push_token, push_token_updated_at,
-- stripe_customer_id, stripe_connect_id, stripe_connect_status,
-- verification_documents, notification_preferences, invited_by,
-- invite_accepted_at, tos_accepted, tos_accepted_at, tos_version,
-- age_confirmed, age_confirmed_at, privacy_version, marketing_email_consent,
-- marketing_sms_consent, marketing_consent_updated_at.

-- 3. The caller's own complete row.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

COMMENT ON FUNCTION public.get_my_profile() IS
  'Returns the calling user''s own complete profile row, including the contact '
  'and consent columns that are not granted on the base table. Scoped to '
  'auth.uid(), so it cannot be used to read anyone else.';

-- 4. Contact details, only for people the caller is entitled to see them for.
--    The predicate mirrors the row policy on `profiles` minus its
--    "every master and owner is visible" branch, which is what made contact
--    details readable by the whole user base in the first place.
--
--    NOTE: this view runs as its definer on purpose, which the Supabase linter
--    flags as `security_definer_view`. That is the point - column privileges
--    are role-wide and cannot be made row-aware, so the WHERE clause below is
--    the authorisation boundary. Do not "fix" the lint by switching it to
--    security_invoker; that would simply make the view unreadable.
DROP VIEW IF EXISTS public.profiles_with_contact;

CREATE VIEW public.profiles_with_contact
WITH (security_invoker = false) AS
SELECT p.*
FROM public.profiles p
WHERE p.id = auth.uid()
   OR public.is_owner()
   OR (public.is_staff() AND public.shares_appointment_with(p.id))
   OR public.shares_conversation_with(p.id);

REVOKE ALL ON public.profiles_with_contact FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_with_contact TO authenticated;

COMMENT ON VIEW public.profiles_with_contact IS
  'Profiles including email, phone and notification settings, restricted to '
  'rows the caller may legitimately see them for: their own, any row when the '
  'caller is the owner, clients a staff member shares an appointment with, and '
  'chat counterparts. Runs as its definer on purpose - the WHERE clause is the '
  'authorisation, because column privileges on the base table are role-wide '
  'and cannot be made row-aware.';

-- 5. Profile rows are created by the handle_new_user trigger on auth.users,
--    never by the apps. The old policy allowed any signed-in user to insert an
--    arbitrary row with WITH CHECK (true).
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.profiles;
CREATE POLICY "Users may only insert their own profile row"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
