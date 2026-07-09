import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/academy/learn/[courseId]/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Learn">
      <ExistingPage />
    </SectionPageWrapper>
  );
}