'use client';

import { useState, type ReactNode } from 'react';
import { usePilatesWaiver } from '@/hooks/usePilatesWaiver';
import { useAuth } from '@/contexts/AuthContext';
import PilatesWaiverFormSheet from '@/components/PilatesWaiverFormSheet';

interface PilatesWaiverGateProps {
  children: ReactNode;
}

export function PilatesWaiverGate({ children }: PilatesWaiverGateProps) {
  const { user, role } = useAuth();
  const { hasWaiver, loading, checkWaiver } = usePilatesWaiver();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isStaff = role === 'master' || role === 'owner';
  const shouldPrompt = !loading && !hasWaiver && !!user && !isStaff;

  return (
    <>
      {children}
      <PilatesWaiverFormSheet
        open={shouldPrompt || sheetOpen}
        onSigned={async () => {
          // Re-check the waiver so this gate's hasWaiver updates to true.
          // The form sheet uses its own usePilatesWaiver instance; without
          // this re-check, shouldPrompt stays true and the sheet never closes.
          await checkWaiver();
          setSheetOpen(false);
        }}
        onDismiss={() => setSheetOpen(false)}
      />
    </>
  );
}
