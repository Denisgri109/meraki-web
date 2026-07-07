import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HeroBannerProps {
  firstName: string;
  role: string | null;
}

export function HeroBanner({ firstName, role }: HeroBannerProps) {
  return (
    <div className="relative rounded-[var(--radius-2xl)] overflow-hidden mb-8 sm:mb-10 h-[220px] sm:h-[280px] lg:h-[300px]">
      <img
        src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80&auto=format&fit=crop"
        alt="Beauty salon atmosphere"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Sparkles size={16} className="text-[var(--color-brand-pink)] sm:size-5" />
          <span className="text-[10px] sm:text-xs tracking-[3px] uppercase text-[var(--color-brand-pink)] font-bold">
            Welcome Back
          </span>
          <Sparkles size={16} className="text-[var(--color-brand-pink)] sm:size-5" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 drop-shadow-lg leading-tight">
          Hello, {firstName}
        </h1>
        <p className="text-white/90 text-xs sm:text-sm lg:text-base max-w-xs sm:max-w-md lg:max-w-lg font-medium px-2">
          {role === 'master'
            ? "Here's your schedule overview for today."
            : role === 'owner'
              ? "Here's your platform performance today."
              : 'Ready to book your next beauty experience?'}
        </p>
        <Link
          href="/dashboard/booking"
          className="btn-pink inline-flex items-center gap-2 mt-4 sm:mt-6 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm shadow-lg"
        >
          Book Now <ArrowRight size={14} className="sm:size-4" />
        </Link>
      </div>
    </div>
  );
}
