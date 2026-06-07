import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HeroBannerProps {
  firstName: string;
  role: string | null;
}

export function HeroBanner({ firstName, role }: HeroBannerProps) {
  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '300px' }}>
      <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80&auto=format&fit=crop" alt="Beauty salon atmosphere" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.1))' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} style={{ color: 'var(--color-brand-pink)' }} />
          <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--color-brand-pink)', fontWeight: 700 }}>Welcome Back</span>
          <Sparkles size={18} style={{ color: 'var(--color-brand-pink)' }} />
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '12px', textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: '0 0 12px 0' }}>
          Hello, {firstName}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', maxWidth: '500px', fontWeight: 500 }}>
          {role === 'master'
            ? "Here's your schedule overview for today."
            : role === 'owner'
              ? "Here's your platform performance today."
              : 'Ready to book your next beauty experience?'}
        </p>
        <Link
          href="/dashboard/booking"
          className="btn-pink"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '24px', padding: '12px 32px', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          Book Now <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
