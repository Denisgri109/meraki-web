import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/cart/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Cart">
      <ExistingPage />
    </SectionPageWrapper>
  );
}