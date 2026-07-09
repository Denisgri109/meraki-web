import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/services/pilates/[id]/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Pilates Studio">
      <ExistingPage />
    </SectionPageWrapper>
  );
}