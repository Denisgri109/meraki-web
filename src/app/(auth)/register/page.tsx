'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2, User, Scissors, Eye, EyeOff, Mail, Lock, Phone, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength meter
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 2 ? '#EF4444' : strength <= 3 ? '#F59E0B' : '#10B981';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!tosAccepted) {
      setError('Please accept the Terms of Service');
      return;
    }

    setError(null);
    setLoading(true);
    const { error: authError } = await signUp(
      email.trim().toLowerCase(),
      password,
      fullName.trim(),
      selectedRole,
      tosAccepted,
      '1.0'
    );
    setLoading(false);

    if (authError) {
      let msg = authError.message;
      if (msg?.includes('already registered') || msg?.includes('already exists')) {
        msg = 'This email is already registered. Please sign in instead.';
      }
      setError(msg);
    } else {
      router.push('/verify');
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(0,0,0,0.35)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    paddingLeft: '4px',
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(0,0,0,0.25)',
    pointerEvents: 'none',
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1
          className="font-[family-name:var(--font-playfair)]"
          style={{
            fontSize: '42px',
            fontStyle: 'italic',
            color: 'var(--color-primary)',
            margin: 0,
          }}
        >
          Merakí
        </h1>
        <p style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(0,0,0,0.4)', letterSpacing: '0.5px' }}>
          Join the Merakí community
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
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

        {/* Role Selection */}
        <div style={{ width: '100%' }}>
          <label style={labelStyle}>I am a...</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Client */}
            <button
              type="button"
              onClick={() => setSelectedRole('client')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '20px',
                borderRadius: 'var(--radius-xl)',
                border: `2px solid ${selectedRole === 'client' ? 'var(--color-primary)' : 'rgba(0,0,0,0.06)'}`,
                background: selectedRole === 'client' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.01)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: selectedRole === 'client' ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={24} style={{ color: selectedRole === 'client' ? 'var(--color-primary)' : 'rgba(0,0,0,0.3)' }} />
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: selectedRole === 'client' ? 700 : 600,
                  color: selectedRole === 'client' ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
                }}
              >
                Client
              </span>
            </button>
            {/* Professional */}
            <button
              type="button"
              onClick={() => setSelectedRole('master')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '20px',
                borderRadius: 'var(--radius-xl)',
                border: `2px solid ${selectedRole === 'master' ? 'var(--color-primary)' : 'rgba(0,0,0,0.06)'}`,
                background: selectedRole === 'master' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.01)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: selectedRole === 'master' ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Scissors size={24} style={{ color: selectedRole === 'master' ? 'var(--color-primary)' : 'rgba(0,0,0,0.3)' }} />
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: selectedRole === 'master' ? 700 : 600,
                  color: selectedRole === 'master' ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
                }}
              >
                Professional
              </span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div style={{ width: '100%' }}>
          <label style={labelStyle}>Full Name</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <User size={18} style={iconStyle} />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Julianne Moore"
              autoComplete="name"
              className="input-glass"
              style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Phone */}
        <div style={{ width: '100%' }}>
          <label style={labelStyle}>Phone Number</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Phone size={18} style={iconStyle} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+353 87 123 4567"
              autoComplete="tel"
              className="input-glass"
              style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ width: '100%' }}>
          <label style={labelStyle}>Email Address</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Mail size={18} style={iconStyle} />
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
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Lock size={18} style={iconStyle} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
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

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', paddingLeft: '4px', paddingRight: '4px' }}>
              <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '4px',
                      flex: 1,
                      borderRadius: '2px',
                      background: i <= strength ? strengthColor : 'rgba(0,0,0,0.08)',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: strengthColor,
                  textTransform: 'uppercase',
                  minWidth: '50px',
                  textAlign: 'right',
                }}
              >
                {strengthLabel}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ width: '100%' }}>
          <label style={labelStyle}>Confirm Password</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <ShieldCheck size={18} style={iconStyle} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="input-glass"
              style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* TOS */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={tosAccepted}
            onChange={(e) => setTosAccepted(e.target.checked)}
            style={{
              marginTop: '3px',
              width: '18px',
              height: '18px',
              accentColor: 'var(--color-primary)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.5)', lineHeight: '20px' }}>
            I agree to the{' '}
            <Link href="/terms" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Terms of Service
            </Link>{' '}
            &{' '}
            <Link href="/privacy" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
          </span>
        </label>

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
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
        </button>

        {/* Sign in link */}
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(0,0,0,0.35)', marginTop: '8px' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
