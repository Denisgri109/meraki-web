import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/services/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Services">
      <ExistingPage />
    </SectionPageWrapper>
  );
}