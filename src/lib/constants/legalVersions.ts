/**
 * Version stamps for the legal documents.
 *
 * Recorded against every consent so that, if a document changes, it is
 * possible to tell which wording a given user actually agreed to — GDPR
 * art. 7(1) requires the controller to be able to demonstrate that.
 *
 * Bump the relevant entry whenever the substance of a document changes.
 * A cosmetic edit (typo, formatting) does not need a bump; anything that
 * changes what the user is agreeing to does, and a material change also needs
 * existing users to be asked again.
 */
export const LEGAL_VERSIONS = {
  /**
   * 3.0 — splits the seller model: Merakí sells goods, courses, passes and its
   * own Pilates classes; independent specialists sell their own treatments and
   * Merakí acts as their booking and payment agent.
   */
  tos: '3.0',

  /**
   * 2.0 — first version that states a legal basis per data category, names
   * health data as special category data, and gives real retention periods.
   */
  privacy: '2.0',

  /** 1.0 — first published cookie policy. */
  cookies: '1.0',

  /** 2.0 — rewritten for the split seller model. */
  refunds: '2.0',

  /**
   * 1.0 — terms between Merakí and the self-employed specialists, published
   * because the EU Platform-to-Business Regulation (2019/1150) requires an
   * online intermediation service to publish them.
   */
  professionalTerms: '1.0',

  /** 3.0 — matches the `terms_version` already stored on `pilates_waivers`. */
  healthScreening: '3.0',
} as const;
