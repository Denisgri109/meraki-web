'use client';

import { useConsent } from '@/contexts/ConsentContext';

interface CookieSettingsLinkProps {
  /**
   * `inline` renders a plain link for the footer.
   * `floating` renders a fixed pill, used on the Cookie Policy page so the
   * control is reachable without scrolling back to the footer.
   */
  variant?: 'inline' | 'floating';
  className?: string;
}

/** Reopens the consent banner so a choice can be changed or withdrawn. */
export function CookieSettingsLink({
  variant = 'inline',
  className = '',
}: CookieSettingsLinkProps) {
  const { reopen } = useConsent();

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={reopen}
        className="fixed bottom-4 right-4 z-40 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] shadow-lg transition-colors hover:bg-[var(--color-surface-light)]"
      >
        Cookie settings
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={reopen}
      className={`block text-left transition-colors hover:text-white ${className}`}
    >
      Cookie settings
    </button>
  );
}
