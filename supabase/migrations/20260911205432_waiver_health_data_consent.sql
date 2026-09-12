-- Applied to the live database 2026-09-11.
--
-- Explicit consent for processing health data on the Pilates waiver.
--
-- The health screening questionnaire collects data concerning health:
-- injuries, illnesses, disabilities, pregnancy status, medication and bone
-- health. That is special category data under GDPR art. 9(1), and processing
-- it is prohibited unless one of the art. 9(2) conditions applies.
--
-- The condition available here is art. 9(2)(a) - "explicit consent". Explicit
-- means a separate, express statement about the health data specifically; the
-- existing `agreed_terms_of_use` and `agreed_liability_waiver` boxes are about
-- the contract and the liability waiver, and neither satisfies art. 9(2)(a).
--
-- Existing rows are left NULL rather than defaulted to true: back-filling a
-- consent nobody gave would be worse than recording that it is missing.
-- Clients with a NULL value must be asked again - see COMPLIANCE.md.

ALTER TABLE public.pilates_waivers
  ADD COLUMN IF NOT EXISTS agreed_health_data_processing boolean,
  ADD COLUMN IF NOT EXISTS health_data_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS health_data_consent_version text;

COMMENT ON COLUMN public.pilates_waivers.agreed_health_data_processing IS
  'Explicit consent under GDPR art. 9(2)(a) to process health data. NULL means the waiver predates the consent question and the client must be asked again.';
COMMENT ON COLUMN public.pilates_waivers.health_data_consent_at IS
  'When explicit health-data consent was given.';
COMMENT ON COLUMN public.pilates_waivers.health_data_consent_version IS
  'Version of the health screening document the consent was given against.';
