'use client';

import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import ExistingShopPage from '@/app/dashboard/shop/page';

export default function SectionShop() {
  return (
    <SectionPageWrapper title="Shop">
      <ExistingShopPage />
    </SectionPageWrapper>
  );
}
