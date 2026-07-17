-- ============================================================================
-- Pilates Health Screening Questionnaire v3.0 — New Columns
-- ============================================================================
-- Adds 14 new columns to pilates_waivers for the redesigned health screening
-- questionnaire. Old columns (has_injuries, injury_details, emergency_contact_*,
-- signature_name) remain for backward compatibility with v2.0 waivers.
--
-- All new columns are nullable / defaulted so existing v2.0 rows are unaffected.
-- New v3.0 submissions populate these fields. terms_version distinguishes
-- v2.0 (old structure) from v3.0 (new structure).
--
-- Also makes signature_name nullable since v3.0 replaces the typed signature
-- with an agreement checkbox.
-- ============================================================================

alter table public.pilates_waivers
  add column if not exists injuries_joint_problems   text,
  add column if not exists pilates_experience        text,
  add column if not exists has_illnesses             boolean    default false,
  add column if not exists illness_details           text,
  add column if not exists pregnancy_status          text,
  add column if not exists medication_details        text,
  add column if not exists exercise_history          text,
  add column if not exists practitioner_recommended  boolean    default false,
  add column if not exists goals_expectations        text,
  add column if not exists has_bone_condition        boolean    default false,
  add column if not exists agreed_terms_of_use       boolean    default false,
  add column if not exists agreed_email_marketing    boolean    default false,
  add column if not exists agreed_sms_marketing      boolean    default false,
  add column if not exists agreed_liability_waiver   boolean    default false;

alter table public.pilates_waivers
  alter column signature_name drop not null;
