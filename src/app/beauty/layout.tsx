import { DashboardShell } from '@/components/DashboardShell';

export default function BeautyLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell section="beauty">{children}</DashboardShell>;
}
