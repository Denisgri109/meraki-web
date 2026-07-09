/**
 * Safe localStorage / sessionStorage helpers.
 *
 * Every read is wrapped in try/catch so that a corrupted value, a disabled
 * storage (private mode), or a SecurityError on a cross-origin iframe can
 * never throw and crash the React tree (the #1 cause of White Screen of Death).
 *
 * Usage:
 *   import { safeGetJSON, safeSetJSON } from '@/lib/safeStorage';
 *
 *   const draft = safeGetJSON<BookingDraft>('meraki:booking-draft', null);
 *   safeSetJSON('meraki:booking-draft', draft);
 */

// ─── localStorage ─────────────────────────────────────────────────────────

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Reads and JSON.parses a localStorage value.
 * Returns `fallback` if the key is missing, the value is null, or parsing fails.
 */
export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * JSON.stringifies and writes a value to localStorage.
 * Returns false if the write fails (e.g. QuotaExceededError).
 */
export function safeSetJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ─── sessionStorage ────────────────────────────────────────────────────────

export function safeSessionGetItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSetItem(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionRemoveItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function safeSessionGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSessionSetJSON(key: string, value: unknown): boolean {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
