'use client';

import { useEffect } from 'react';

/**
 * global-error.tsx
 *
 * Next.js App Router's last-resort error boundary.  This catches errors
 * that the regular <ErrorBoundary> component CANNOT — specifically errors
 * thrown inside the root layout itself or during SSR hydration.
 *
 * Without this file, a crash in the root layout produces a permanent
 * white screen because React has no boundary above the root layout to
 * fall back to.  This file MUST be a complete HTML document (it replaces
 * the entire <html> tree when it activates).
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError] Uncaught error:', error);
  }, [error]);

  const handleClearData = () => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#FFF5F5',
          color: '#2D2D2D',
        }}
      >
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 32,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              margin: '0 0 8px',
            }}
          >
            Merakí
          </h1>
          <p style={{ fontSize: 18, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
            We hit an unexpected error. Your data is safe — try reloading. If
            the page keeps failing, clearing the app&apos;s stored data usually
            fixes it.
          </p>
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <button
              onClick={reset}
              style={{
                background: 'linear-gradient(135deg, #E6A4B4, #d88a9c)',
                color: '#fff',
                border: 'none',
                borderRadius: 9999,
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                maxWidth: 280,
              }}
            >
              Reload page
            </button>
            <button
              onClick={handleClearData}
              style={{
                background: 'transparent',
                color: '#2D2D2D',
                border: '2px solid #2D2D2D',
                borderRadius: 9999,
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                cursor: 'pointer',
                width: '100%',
                maxWidth: 280,
              }}
            >
              Clear data &amp; reload
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && (
            <pre
              style={{
                marginTop: 32,
                textAlign: 'left',
                fontSize: 12,
                background: 'rgba(0,0,0,0.05)',
                borderRadius: 8,
                padding: 16,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#6B7280',
                overflow: 'auto',
              }}
            >
              <strong>{error.name}: {error.message}</strong>
              {'\n'}
              {error.stack}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
