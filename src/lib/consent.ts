/**
 * Cookie / third-party storage consent.
 *
 * Merakí sets no advertising or analytics cookies, so the only thing that
 * actually needs consent under S.I. 336/2011 reg. 5(3) is storage set by
 * embedded third parties — the YouTube and Vimeo players used in course
 * lessons. Everything else is strictly necessary and is exempt.
 *
 * The consent record itself is stored in localStorage rather than a cookie so
 * that it is never transmitted, and is treated as strictly necessary (it exists
 * only to honour the choice the user made).
 */

export const CONSENT_STORAGE_KEY = 'meraki-cookie-consent';

/** Bump when the categories change; an older version re-asks. */
export const CONSENT_VERSION = 1;

/** Re-ask after 6 months, per EDPB guidance on consent refresh. */
export const CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 183;

export interface ConsentRecord {
  version: number;
  /** Third-party video players (YouTube, Vimeo). */
  embeds: boolean;
  /** Epoch ms the choice was made. Kept as proof of consent. */
  decidedAt: number;
}

export type ConsentState = ConsentRecord | null;

/** Reads the stored decision, returning null when absent, stale or invalid. */
export function readConsent(): ConsentState {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (typeof parsed.embeds !== 'boolean') return null;
    if (typeof parsed.decidedAt !== 'number') return null;
    if (Date.now() - parsed.decidedAt > CONSENT_MAX_AGE_MS) return null;
    return parsed as ConsentRecord;
  } catch {
    // Private browsing, disabled storage, or corrupt JSON — ask again.
    return null;
  }
}

/** Persists a decision. Returns the record actually stored. */
export function writeConsent(embeds: boolean): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    embeds,
    decidedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable — the choice holds for this page view only.
  }
  return record;
}

/** Forgets the decision so the banner reappears. */
export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}

// ─── External store, for useSyncExternalStore ────────────────────────────────
// Reading localStorage in a `useEffect` and calling setState causes a cascading
// render on every page. `useSyncExternalStore` is the supported way to read a
// browser store that does not exist during server rendering: the server
// snapshot is `null` (nothing consented to), and the client subscribes.

type Listener = () => void;

const listeners = new Set<Listener>();

/** Cached so that `getSnapshot` returns a stable reference between renders. */
let cachedRaw: string | null | undefined;
let cachedRecord: ConsentState = null;

function snapshot(): ConsentState {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedRecord = readConsent();
  }
  return cachedRecord;
}

export const consentStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    // Another tab writing the same key should update this one too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === CONSENT_STORAGE_KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },
  getSnapshot: snapshot,
  /** Server render and the first hydration pass: assume nothing is consented. */
  getServerSnapshot: (): ConsentState => null,
  /** Call after any write so subscribers re-read. */
  emit() {
    cachedRaw = undefined;
    listeners.forEach((l) => l());
  },
};
