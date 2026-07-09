import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/debug/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Debug">
      <ExistingPage />
    </SectionPageWrapper>
  );
}