import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { DEFAULT_PROFESSIONAL_TERMS_BODY } from '@/lib/constants/legal';

export const metadata: Metadata = {
  title: 'Terms for Specialists — Merakí',
  description:
    'The agreement between Merakí and the self-employed beauty and wellness specialists who take bookings through the platform: commission, payouts, ranking, suspension and complaints.',
};

/**
 * Published because the EU Platform-to-Business Regulation (2019/1150)
 * requires an online intermediation service to set out its terms with business
 * users in plain language and keep them "easily available at all stages of the
 * commercial relationship, including the pre-contractual stage" — which means
 * a public URL, not a document handed over after signing up.
 */
export default function ProfessionalTermsPage() {
  return (
    <LegalDocument
      title="Terms for Specialists"
      intro="For the self-employed specialists who take bookings through Merakí — commission, payouts, ranking and how disputes are handled."
      contentKey="legal.professional_terms_body"
      defaultText={DEFAULT_PROFESSIONAL_TERMS_BODY}
    />
  );
}
