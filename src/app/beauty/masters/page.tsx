import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/masters/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Masters">
      <ExistingPage />
    </SectionPageWrapper>
  );
}