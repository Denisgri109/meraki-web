import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/checkout/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Checkout">
      <ExistingPage />
    </SectionPageWrapper>
  );
}