import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/orders/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Orders">
      <ExistingPage />
    </SectionPageWrapper>
  );
}