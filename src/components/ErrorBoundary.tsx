'use client';

/**
 * ErrorBoundary
 *
 * Catches render-time errors anywhere in the child tree and shows a branded,
 * self-healing fallback instead of React's default behaviour (which, without a
 * boundary, tears down the entire app into a blank white screen).
 *
 * Why this exists: Merakí previously had no error boundary at all, so any single
 * throw during render — e.g. a stale value in localStorage / a Supabase session
 * field being an unexpected shape — blanked the whole site on both local and
 * production. Clearing localStorage "fixed" it only because it kept the user off
 * the page that crashed. This boundary stops that total-white-screen failure mode
 * for good and logs the real stack trace so the true culprit is visible.
 *
 * The fallback is intentionally hook-free and context-free: it must keep working
 * even if the thing that threw was a Provider (AuthProvider / CartProvider / …),
 * so it reads nothing from React context and touches only the browser directly.
 */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional label included in logs to identify which boundary caught it. */
  name?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const RELOAD_HINT_KEY = 'meraki:errorboundary:reloading';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the real failure in the console + transport it off-device so the
    // actual culprit (not the white-screen symptom) is discoverable.
    const boundaryName = this.props.name ?? 'ErrorBoundary';
    const componentStack = info.componentStack ?? '(no component stack)';
    console.error(`[${boundaryName}] render error:`, error);
    console.error(`[${boundaryName}] component stack:`, componentStack);

    // Best-effort remote report. Kept defensive so a reporting failure can never
    // re-trigger the boundary.
    try {
      const reportUrl = process.env.NEXT_PUBLIC_ERROR_REPORT_URL;
      if (reportUrl) {
        const body = JSON.stringify({
          source: 'web',
          boundary: boundaryName,
          message: error.message,
          stack: error.stack ?? null,
          componentStack,
          href: typeof window !== 'undefined' ? window.location.href : null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          at: new Date().toISOString(),
        });
        // `keepalive: true` lets the request outlive the page unload.
        fetch(reportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => { /* reporting is best-effort */ });
      }
    } catch {
      /* never let reporting throw */
    }
  }

  componentDidUpdate(): void {
    // If a previous "clear & reload" set the hint flag, consume it after
    // re-render so we don't loop on a persistently-broken state.
    if (this.state.error) return;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(RELOAD_HINT_KEY)) {
        window.sessionStorage.removeItem(RELOAD_HINT_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }

  private clearAppDataAndReload = (): void => {
    try {
      // Wipe the client-side stores that are known to cause stuck/crash loops
      // (Supabase auth token, cart, notifications seen-state, booking drafts).
      // Service workers / caches are left intact.
      if (typeof window !== 'undefined') {
        try { window.localStorage.clear(); } catch { /* ignore */ }
        try { window.sessionStorage.setItem(RELOAD_HINT_KEY, '1'); } catch { /* ignore */ }
      }
    } finally {
      // Hard reload to the site root so a bad client-side route / cached chunk
      // can't immediately re-trigger the same crash.
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  private reload = (): void => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(RELOAD_HINT_KEY, '1');
      }
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const showClearButton = !!(typeof window !== 'undefined' && window.localStorage);

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--color-background,#FFF5F5)]"
      >
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary,#2D2D2D)] mb-2">
            Merakí
          </h1>
          <p className="mt-6 text-lg font-semibold text-[var(--color-primary,#2D2D2D)]">
            Something went wrong
          </p>
          <p className="mt-2 text-sm text-[var(--color-primary-muted,#6B7280)]">
            We hit an unexpected error. Your data is safe — try reloading. If the
            page keeps failing, clearing the app&apos;s stored data usually fixes it.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.reload}
              className="btn-pink px-8 py-3 text-sm w-full sm:w-auto"
            >
              Reload page
            </button>
            {showClearButton && (
              <button
                type="button"
                onClick={this.clearAppDataAndReload}
                className="border-2 border-[var(--color-primary,#2D2D2D)] text-[var(--color-primary,#2D2D2D)] px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-black/5 transition-all w-full sm:w-auto"
              >
                Clear data &amp; reload
              </button>
            )}
          </div>

          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-8 mx-auto max-w-full overflow-auto text-left text-xs bg-black/5 rounded-lg p-4 text-[var(--color-primary-muted,#6B7280)] whitespace-pre-wrap break-words">
              <span className="font-bold block mb-1">{error.name}: {error.message}</span>
              {error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
