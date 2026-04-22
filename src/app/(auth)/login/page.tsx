'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <h1
            className="font-[family-name:var(--font-playfair)]"
            style={{
              fontSize: '48px',
              fontStyle: 'italic',
              color: 'var(--color-primary)',
              textShadow: '0 0 15px rgba(212, 138, 130, 0.4)',
              margin: 0,
            }}
          >
            Merakí
          </h1>
          {/* Glow behind logo */}
          <div
            style={{
              position: 'absolute',
              inset: '-16px',
              background: 'rgba(212,138,130,0.08)',
              borderRadius: '9999px',
              filter: 'blur(20px)',
              zIndex: -1,
            }}
          />
        </div>
        <p
          style={{
            marginTop: '12px',
            fontSize: '10px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--color-brand-pink-dark)',
            fontWeight: 500,
            opacity: 0.7,
          }}
        >
          Beauty With Soul
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ width: '100%' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(0,0,0,0.35)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              paddingLeft: '4px',
            }}
          >
            Email Address
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Mail
              size={18}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="input-glass"
              style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ width: '100%' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(0,0,0,0.35)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              paddingLeft: '4px',
            }}
          >
            Password
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Lock
              size={18}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="input-glass"
              style={{ paddingLeft: '44px', paddingRight: '48px', width: '100%', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(0,0,0,0.3)',
                padding: 0,
                display: 'flex',
              }}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href="/forgot-password"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-brand-pink-dark)',
              textDecoration: 'none',
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            width: '100%',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: '8px',
          }}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
        </button>

        {/* Register link */}
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
