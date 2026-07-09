import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/earnings/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Earnings">
      <ExistingPage />
    </SectionPageWrapper>
  );
}