'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  type ConsentState,
  clearConsent,
  consentStore,
  writeConsent,
} from '@/lib/consent';

interface ConsentContextValue {
  /** The stored decision, or null if none has been made. */
  consent: ConsentState;
  /** True once the client has read the stored decision (no banner flash). */
  ready: boolean;
  /** True when the banner should be on screen. */
  bannerOpen: boolean;
  /** Third-party embeds allowed. False until explicitly accepted. */
  embedsAllowed: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  /** Reopen the banner so the choice can be changed or withdrawn. */
  reopen: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // Read through an external store rather than an effect: on the server and on
  // the first hydration pass this is null, so nothing optional loads and the
  // markup matches, and no cascading render is triggered.
  const consent = useSyncExternalStore(
    consentStore.subscribe,
    consentStore.getSnapshot,
    consentStore.getServerSnapshot,
  );

  const hydrated = useSyncExternalStore(
    consentStore.subscribe,
    () => true,
    () => false,
  );

  const [forcedOpen, setForcedOpen] = useState(false);

  const acceptAll = useCallback(() => {
    writeConsent(true);
    consentStore.emit();
    setForcedOpen(false);
  }, []);

  const rejectOptional = useCallback(() => {
    writeConsent(false);
    consentStore.emit();
    setForcedOpen(false);
  }, []);

  const reopen = useCallback(() => {
    clearConsent();
    consentStore.emit();
    setForcedOpen(true);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      ready: hydrated,
      bannerOpen: hydrated && (forcedOpen || consent === null),
      embedsAllowed: consent?.embeds === true,
      acceptAll,
      rejectOptional,
      reopen,
    }),
    [consent, hydrated, forcedOpen, acceptAll, rejectOptional, reopen],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

/**
 * Consent state. Safe to call outside the provider — it then reports
 * "nothing consented to", which is the correct fail-closed default.
 */
export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (ctx) return ctx;
  return {
    consent: null,
    ready: false,
    bannerOpen: false,
    embedsAllowed: false,
    acceptAll: () => {},
    rejectOptional: () => {},
    reopen: () => {},
  };
}
