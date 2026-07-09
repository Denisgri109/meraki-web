import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/masters/[id]/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Master Profile">
      <ExistingPage />
    </SectionPageWrapper>
  );
}