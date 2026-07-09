import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/academy/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Academy">
      <ExistingPage />
    </SectionPageWrapper>
  );
}