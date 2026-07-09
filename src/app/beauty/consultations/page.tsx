import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/consultations/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Consultations">
      <ExistingPage />
    </SectionPageWrapper>
  );
}