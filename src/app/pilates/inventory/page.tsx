import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/inventory/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Inventory">
      <ExistingPage />
    </SectionPageWrapper>
  );
}