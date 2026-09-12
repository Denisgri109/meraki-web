'use client';

import { Check } from 'lucide-react';

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Label content. Links inside are fine — the native input is separate. */
  children: React.ReactNode;
  /** Shown when a required box is left unticked after a submit attempt. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * A consent checkbox that is a real `<input type="checkbox">`.
 *
 * The previous implementation used a `<div role="checkbox">` with a hand-rolled
 * key handler. That reimplements what the browser already does and loses form
 * participation, autofill, and the platform's own high-contrast rendering. Here
 * the native input is visually hidden but still focusable, and the tick is
 * drawn from its `:checked` state, so keyboard, screen reader and Windows
 * High Contrast all behave correctly with no extra code.
 *
 * Consent boxes are never pre-ticked (GDPR recital 32 — silence or inactivity
 * is not consent), so there is deliberately no `defaultChecked`.
 */
export function ConsentCheckbox({
  id,
  checked,
  onChange,
  children,
  error,
  required = false,
  disabled = false,
}: ConsentCheckboxProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="relative flex-shrink-0" style={{ marginTop: '1px' }}>
          <input
            type="checkbox"
            id={id}
            checked={checked}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            onChange={(e) => onChange(e.target.checked)}
            className="peer absolute inset-0 h-5 w-5 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-text-accent)]"
            style={{
              borderColor: error
                ? 'var(--color-error)'
                : checked
                  ? 'var(--color-primary)'
                  : 'rgba(0,0,0,0.28)',
              background: checked ? 'var(--color-primary)' : 'transparent',
            }}
          >
            {checked && <Check size={13} color="#fff" strokeWidth={3} />}
          </span>
        </span>

        <label
          htmlFor={id}
          className="cursor-pointer text-[13px] leading-5 text-[var(--color-text-secondary)]"
        >
          {children}
          {required && (
            <span className="text-[var(--color-error)]" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      </div>

      {error && (
        <p
          id={errorId}
          className="mt-1.5 pl-8 text-xs font-medium text-[var(--color-error)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
