import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { DEFAULT_ACCESSIBILITY_BODY } from '@/lib/constants/legal';

export const metadata: Metadata = {
  title: 'Accessibility Statement — Merakí',
  description:
    'What Merakí has done to meet WCAG 2.2 AA, the gaps we still know about, and how to tell us something is blocking you.',
};

export default function AccessibilityPage() {
  return (
    <LegalDocument
      title="Accessibility Statement"
      intro="What works today, what does not yet, and how to reach a person if something blocks you."
      contentKey="legal.accessibility_statement_body"
      defaultText={DEFAULT_ACCESSIBILITY_BODY}
    />
  );
}
