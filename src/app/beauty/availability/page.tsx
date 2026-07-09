import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/availability/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Availability">
      <ExistingPage />
    </SectionPageWrapper>
  );
}