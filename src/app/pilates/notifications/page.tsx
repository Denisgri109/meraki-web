import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/notifications/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Notifications">
      <ExistingPage />
    </SectionPageWrapper>
  );
}