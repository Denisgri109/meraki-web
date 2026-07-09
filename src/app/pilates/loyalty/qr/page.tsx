import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/loyalty/qr/page';

export default function Page() {
  return (
    <SectionPageWrapper title="QR Code">
      <ExistingPage />
    </SectionPageWrapper>
  );
}