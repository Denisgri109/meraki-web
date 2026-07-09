import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingPage from '@/app/dashboard/chat/page';

export default function Page() {
  return (
    <SectionPageWrapper title="Messages">
      <ExistingPage />
    </SectionPageWrapper>
  );
}