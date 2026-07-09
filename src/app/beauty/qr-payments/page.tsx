import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/qr-payments/page';

export default function Page() {
  return (
    <SectionPageWrapper title="QR Payments">
      <ExistingPage />
    </SectionPageWrapper>
  );
}