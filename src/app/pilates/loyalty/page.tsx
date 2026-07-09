import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/loyalty/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Loyalty">
      <ExistingPage />
    </SectionPageWrapper>
  );
}