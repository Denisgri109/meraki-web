'use client';

import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingBookingPage from '@/app/dashboard/booking/page';

export default function SectionBooking() {
  return (
    <SectionPageWrapper title="Book">
      <ExistingBookingPage />
    </SectionPageWrapper>
  );
}
