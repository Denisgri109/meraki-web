import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { DEFAULT_PRIVACY_BODY } from '@/lib/constants/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy — Merakí',
  description:
    'How Merakí collects, uses and protects your personal data, the legal basis for each use, how long we keep it, and how to exercise your GDPR rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro="What we collect, why we collect it, who we share it with, and how to get it back or have it deleted."
      contentKey="legal.privacy_policy_body"
      defaultText={DEFAULT_PRIVACY_BODY}
    />
  );
}
