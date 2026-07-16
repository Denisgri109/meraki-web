import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/class-packages/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Passes">
      <ExistingPage />
    </SectionPageWrapper>
  );
}
