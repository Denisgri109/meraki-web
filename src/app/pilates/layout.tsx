import { DashboardShell } from '@/components/DashboardShell';

export default function PilatesLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell section="pilates">{children}</DashboardShell>;
}
