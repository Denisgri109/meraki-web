-- Applied to the live database 2026-09-11.
--
-- Consent record-keeping on `profiles`.
--
-- GDPR art. 7(1) requires the controller to be able to *demonstrate* that a
-- data subject consented. Until now the only thing recorded at sign-up was
-- `tos_accepted` / `tos_accepted_at` / `tos_version`. Three things were
-- missing: marketing consent (needed separately and opt-in under S.I. 336/2011
-- reg. 13), age confirmation (Ireland's digital age of consent is 16), and
-- which version of the privacy notice the user was shown.
--
-- Every column defaults to the privacy-preserving value, so existing rows read
-- as "has not consented" rather than being opted in by omission.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_email_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_sms_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS age_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_version text;

COMMENT ON COLUMN public.profiles.marketing_email_consent IS
  'Opt-in consent for marketing email. Default false - silence is not consent.';
COMMENT ON COLUMN public.profiles.marketing_sms_consent IS
  'Opt-in consent for marketing SMS. Default false.';
COMMENT ON COLUMN public.profiles.marketing_consent_updated_at IS
  'When the marketing preference was last changed. Evidence under GDPR art. 7(1).';
COMMENT ON COLUMN public.profiles.age_confirmed IS
  'User confirmed at sign-up that they are at least 16 (Irish digital age of consent).';
COMMENT ON COLUMN public.profiles.privacy_version IS
  'Version of the Privacy Policy shown when the account was created or last re-consented.';

-- Audit trail for every consent change, so a withdrawal is provable too.
-- Append-only by construction: insert-own and select-own policies exist, and
-- no UPDATE or DELETE policy is defined, which is what makes it usable as
-- evidence.
CREATE TABLE IF NOT EXISTS public.consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- 'tos' | 'privacy' | 'marketing_email' | 'marketing_sms' | 'health_data'
  consent_type text NOT NULL,
  granted boolean NOT NULL,
  document_version text,
  -- Where the choice was made, e.g. 'web:register', 'mobile:settings'.
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_events_user_id_created_at_idx
  ON public.consent_events (user_id, created_at DESC);

ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_events_insert_own" ON public.consent_events;
CREATE POLICY "consent_events_insert_own"
  ON public.consent_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "consent_events_select_own" ON public.consent_events;
CREATE POLICY "consent_events_select_own"
  ON public.consent_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.consent_events FROM anon;
GRANT SELECT, INSERT ON public.consent_events TO authenticated;
