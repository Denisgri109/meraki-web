'use client';

import { useState, type ReactNode } from 'react';
import { usePilatesWaiver } from '@/hooks/usePilatesWaiver';
import { useAuth } from '@/contexts/AuthContext';
import PilatesWaiverFormSheet from '@/components/PilatesWaiverFormSheet';

interface PilatesWaiverGateProps {
  children: ReactNode;
}

export function PilatesWaiverGate({ children }: PilatesWaiverGateProps) {
  const { user } = useAuth();
  const { hasWaiver, loading } = usePilatesWaiver();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isStaff = user?.user_metadata?.role === 'master' || user?.user_metadata?.role === 'owner';
  const shouldPrompt = !loading && !hasWaiver && !!user && !isStaff;

  return (
    <>
      {children}
      <PilatesWaiverFormSheet
        open={shouldPrompt || sheetOpen}
        onSigned={() => setSheetOpen(false)}
        onDismiss={() => setSheetOpen(false)}
      />
    </>
  );
}
