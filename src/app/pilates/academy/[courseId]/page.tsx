import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/academy/[courseId]/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Course">
      <ExistingPage />
    </SectionPageWrapper>
  );
}