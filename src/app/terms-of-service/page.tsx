import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { DEFAULT_TOS_BODY } from '@/lib/constants/legal';

export const metadata: Metadata = {
  title: 'Terms of Service — Merakí',
  description:
    'The agreement between you and Merakí covering accounts, bookings, payments, health and safety, and how disputes are handled.',
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro="The agreement between you and Merakí when you book, buy or learn with us."
      contentKey="legal.tos_body"
      defaultText={DEFAULT_TOS_BODY}
    />
  );
}
