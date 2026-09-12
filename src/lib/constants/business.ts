/**
 * Single source of truth for the legally-required business identity.
 *
 * Irish and EU law require an information society service provider to publish
 * its identity, geographic address and contact details in a form that is
 * "easily, directly and permanently accessible":
 *
 *  - S.I. 68/2003, reg. 8  (European Communities (Directive 2000/31/EC)
 *    Regulations 2003) — name, geographic address, email, supervisory body,
 *    professional body, VAT number.
 *  - Companies Act 2014, s. 1302 — a company's registered name, registered
 *    number, place of registration and registered office must appear on its
 *    websites.
 *  - Consumer Rights Act 2022, Part 3 — pre-contract information for distance
 *    contracts, including the trader's identity, address and complaint address.
 *
 * ⚠️ ACTION REQUIRED — the placeholders below must be replaced with the real
 * registered details before this can be relied on. They are deliberately
 * rendered verbatim on the public legal pages so that an unfilled value is
 * impossible to miss.
 */

/** Set to `true` once every `TODO` placeholder below has been replaced. */
export const BUSINESS_DETAILS_VERIFIED = false;

export const BUSINESS = {
  /** Public-facing brand name. */
  tradingName: 'Merakí',

  /** Registered company name as it appears in the CRO register. */
  legalName: 'TODO — registered company name (e.g. "Meraki Wellness Limited")',

  /** CRO company registration number. */
  companyNumber: 'TODO — CRO number',

  /** Country of registration. */
  placeOfRegistration: 'Republic of Ireland',

  /** Registered office address, as filed with the CRO. */
  registeredOffice: {
    line1: 'TODO — registered office address line 1',
    line2: '',
    city: 'TODO — city',
    county: 'TODO — county',
    eircode: 'TODO — Eircode',
    country: 'Ireland',
  },

  /**
   * Irish VAT number, or `null` if not yet VAT-registered.
   * Registration thresholds (from 1 January 2025): €42,500 for services and
   * €85,000 for goods in any rolling 12-month period.
   */
  vatNumber: null as string | null,

  /** General contact address. */
  email: 'hello@merakiapp.com',

  /** Data-protection contact. Must be monitored — GDPR replies are due in 30 days. */
  privacyEmail: 'privacy@merakiapp.com',

  /** Complaints / refunds contact. */
  supportEmail: 'support@merakiapp.com',

  /** Legal notices. */
  legalEmail: 'legal@merakiapp.com',

  /** Accessibility feedback contact (European Accessibility Act). */
  accessibilityEmail: 'accessibility@merakiapp.com',

  /**
   * Published phone number. The previous value (+44 20 7123 4567) was a
   * placeholder London number and has been removed — publishing a number that
   * does not reach the trader is itself a consumer-law breach.
   */
  phone: null as string | null,

  /** Support hours shown next to the contact details. */
  supportHours: 'Monday to Friday, 9am – 6pm (Irish time)',

  /** Currency actually charged. */
  currency: 'EUR',
  currencySymbol: '€',
} as const;

/** Formatted one-line registered office, skipping empty parts. */
export const REGISTERED_ADDRESS_LINE = [
  BUSINESS.registeredOffice.line1,
  BUSINESS.registeredOffice.line2,
  BUSINESS.registeredOffice.city,
  BUSINESS.registeredOffice.county,
  BUSINESS.registeredOffice.eircode,
  BUSINESS.registeredOffice.country,
]
  .filter(Boolean)
  .join(', ');

/** Supervisory authority for data protection. */
export const DATA_PROTECTION_AUTHORITY = {
  name: 'Data Protection Commission',
  address: '6 Pembroke Row, Dublin 2, D02 X963, Ireland',
  website: 'https://www.dataprotection.ie',
  complaintsUrl: 'https://www.dataprotection.ie/en/contact/how-contact-us',
} as const;

/** Consumer protection / ADR bodies a customer can be pointed at. */
export const CONSUMER_BODIES = {
  ccpc: {
    name: 'Competition and Consumer Protection Commission (CCPC)',
    website: 'https://www.ccpc.ie',
  },
  eccIreland: {
    name: 'European Consumer Centre Ireland',
    website: 'https://www.eccireland.ie',
  },
} as const;

/** Minimum age to hold an account. Ireland's digital age of consent is 16. */
export const MINIMUM_AGE = 16;

/** Date the current legal document set took effect. */
export const LEGAL_EFFECTIVE_DATE = '11 September 2026';
