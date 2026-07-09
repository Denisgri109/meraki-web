import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/supplies/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Supplies">
      <ExistingPage />
    </SectionPageWrapper>
  );
}