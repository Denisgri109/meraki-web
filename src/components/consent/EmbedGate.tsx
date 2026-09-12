'use client';

import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useConsent } from '@/contexts/ConsentContext';

interface EmbedGateProps {
  /** Human name of the embed provider, e.g. 'YouTube'. */
  provider: string;
  /** Direct link so the content is still reachable without consenting. */
  sourceUrl: string;
  /** The iframe to render once consent (or a one-off unblock) is given. */
  children: React.ReactNode;
}

/**
 * Blocks a third-party embed until the viewer has agreed to optional cookies.
 *
 * Under S.I. 336/2011 the provider's cookies may not be set before consent,
 * and an iframe sets them the moment it loads — so the iframe must not be in
 * the DOM at all beforehand. "Load this once" is a valid, informed consent for
 * this single playback and is not persisted.
 */
export function EmbedGate({ provider, sourceUrl, children }: EmbedGateProps) {
  const { embedsAllowed, acceptAll } = useConsent();
  const [unblockedOnce, setUnblockedOnce] = useState(false);

  if (embedsAllowed || unblockedOnce) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[var(--color-surface-light)] p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-sm">
        <Play size={22} className="text-[var(--color-text-primary)]" aria-hidden="true" />
      </div>

      <div className="max-w-sm">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          This video is hosted by {provider}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          Playing it lets {provider} set cookies on your device. We do not load it until
          you say so.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setUnblockedOnce(true)}
          className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-invert)] transition-opacity hover:opacity-90"
        >
          Load this video once
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-light)]"
        >
          Always allow videos
        </button>
      </div>

      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] underline underline-offset-2"
      >
        Open on {provider} instead
        <ExternalLink size={12} aria-hidden="true" />
      </a>

      <Link
        href="/cookie-policy"
        className="text-xs text-[var(--color-text-secondary)] underline underline-offset-2"
      >
        Why are we asking?
      </Link>
    </div>
  );
}
