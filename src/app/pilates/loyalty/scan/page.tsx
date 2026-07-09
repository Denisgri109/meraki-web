import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/loyalty/scan/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Scan">
      <ExistingPage />
    </SectionPageWrapper>
  );
}