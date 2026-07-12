import { DashboardShell } from '@/components/DashboardShell';
import { PilatesWaiverGate } from '@/components/PilatesWaiverGate';

export default function PilatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell section="pilates">
      <PilatesWaiverGate>{children}</PilatesWaiverGate>
    </DashboardShell>
  );
}
