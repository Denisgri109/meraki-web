import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/onboarding/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Onboarding">
      <ExistingPage />
    </SectionPageWrapper>
  );
}