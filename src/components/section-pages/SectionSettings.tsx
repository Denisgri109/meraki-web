'use client';

import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingSettingsPage from '@/app/dashboard/settings/page';

export default function SectionSettings() {
  return (
    <SectionPageWrapper title="Settings">
      <ExistingSettingsPage />
    </SectionPageWrapper>
  );
}
