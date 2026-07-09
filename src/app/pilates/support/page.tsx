import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/support/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Support">
      <ExistingPage />
    </SectionPageWrapper>
  );
}