import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { DEFAULT_REFUND_BODY } from '@/lib/constants/legal';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Merakí',
  description:
    'How to cancel a class, return a product or get a refund on a course, and the statutory rights that apply under Irish and EU consumer law.',
};

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund & Cancellation Policy"
      intro="How to cancel, what you get back, and how long it takes."
      contentKey="legal.refund_policy_body"
      defaultText={DEFAULT_REFUND_BODY}
    />
  );
}
