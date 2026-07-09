import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/academy/qa/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Q&A">
      <ExistingPage />
    </SectionPageWrapper>
  );
}