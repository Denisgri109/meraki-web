import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { DEFAULT_COOKIE_BODY } from '@/lib/constants/legal';
import { CookieSettingsLink } from '@/components/consent/CookieSettingsLink';

export const metadata: Metadata = {
  title: 'Cookie Policy — Merakí',
  description:
    'Every cookie and storage entry Merakí uses, what it is for, how long it lasts, and how to change your choice.',
};

export default function CookiePolicyPage() {
  return (
    <>
      <LegalDocument
        title="Cookie Policy"
        intro="No advertising cookies, no third-party analytics. Here is everything we actually store."
        contentKey="legal.cookie_policy_body"
        defaultText={DEFAULT_COOKIE_BODY}
      />
      <CookieSettingsLink variant="floating" />
    </>
  );
}
