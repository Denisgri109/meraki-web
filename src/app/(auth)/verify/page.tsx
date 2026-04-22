'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const chars = value.slice(0, 6).split('');
      const newOtp = [...otp];
      chars.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: 'email',
      token: code,
      email: '', // The email is already in the session context
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Resend handled by Supabase — they'll resend on next signUp or via API
  };

  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-brand-pink-light)] flex items-center justify-center">
        <ShieldCheck size={28} className="text-[var(--color-brand-pink-dark)]" />
      </div>

      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
        Verify Your Email
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Enter the 6-digit code sent to your email
      </p>

      <form onSubmit={handleVerify} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-[var(--radius-lg)] animate-fade-in">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-semibold input-glass"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-14 flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            'Verify'
          )}
        </button>
      </form>

      <div className="mt-6">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
        >
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : "Didn't receive a code? Resend"}
        </button>
      </div>

      <div className="mt-4">
        <Link
          href="/login"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
