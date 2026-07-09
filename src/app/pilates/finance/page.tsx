import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/finance/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Finance">
      <ExistingPage />
    </SectionPageWrapper>
  );
}