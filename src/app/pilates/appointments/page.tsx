import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/appointments/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Appointments">
      <ExistingPage />
    </SectionPageWrapper>
  );
}