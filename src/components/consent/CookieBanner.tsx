'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useConsent } from '@/contexts/ConsentContext';

/**
 * Cookie consent banner.
 *
 * Deliberately not a dark pattern: accept and reject are the same size, the
 * same weight and the same visual prominence, both are one click, and nothing
 * optional loads before a choice is made. Dismissing without choosing is not
 * possible — there is no close button, because "ignoring the banner" is not
 * consent under the GDPR.
 */
export function CookieBanner() {
  const { bannerOpen, acceptAll, rejectOptional } = useConsent();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (bannerOpen) headingRef.current?.focus();
  }, [bannerOpen]);

  if (!bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-heading"
      aria-describedby="cookie-banner-description"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:p-6">
        <h2
          id="cookie-banner-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-base font-bold text-[var(--color-text-primary)] outline-none"
        >
          Cookies on Merakí
        </h2>

        <p
          id="cookie-banner-description"
          className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"
        >
          We use only the storage needed to sign you in and remember your basket — that
          needs no permission. We do not use advertising cookies or third-party analytics.
          The one thing we ask about is embedded course videos from YouTube and Vimeo,
          which set their own cookies when they load.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={acceptAll}
            className="flex-1 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-text-invert)] transition-opacity hover:opacity-90"
          >
            Accept optional cookies
          </button>
          <button
            type="button"
            onClick={rejectOptional}
            className="flex-1 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-light)]"
          >
            Reject optional cookies
          </button>
        </div>

        <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
          You can change this at any time from the Cookie settings link in the footer.{' '}
          <Link href="/cookie-policy" className="font-semibold underline underline-offset-2">
            Read the Cookie Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
