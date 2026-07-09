import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/analytics/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Analytics">
      <ExistingPage />
    </SectionPageWrapper>
  );
}