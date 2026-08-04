import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/clients/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Clients">
      <ExistingPage />
    </SectionPageWrapper>
  );
}
