import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/passes/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Passes">
      <ExistingPage />
    </SectionPageWrapper>
  );
}
