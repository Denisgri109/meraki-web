'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Activity, ArrowRight } from 'lucide-react';
import { EditModeToggle } from '@/components/editable/EditModeToggle';
import { SectionSwitcher, type SectionId } from '@/components/SectionSwitcher';

const STORAGE_KEY = 'meraki:active-section';

interface RootPortalProps {
  isOwner: boolean;
}

const SECTION_CARDS: Record<
  SectionId,
  {
    icon: typeof Sparkles;
    title: string;
    description: string;
    cta: string;
    cardClass: string;
    iconBg: string;
    ctaClass: string;
  }
> = {
  beauty: {
    icon: Sparkles,
    title: 'Beauty Section',
    description:
      'Book salon appointments, shop curated products, and learn from expert courses — all your beauty needs in one place.',
    cta: 'Enter Beauty',
    cardClass: 'section-landing-card-beauty',
    iconBg: 'from-[#E8A0B4] to-[#C47A90]',
    ctaClass: 'text-[var(--color-brand-pink-dark)]',
  },
  pilates: {
    icon: Activity,
    title: 'Pilates Section',
    description:
      'Join group classes, view weekly schedules, and book sessions with expert instructors for every level.',
    cta: 'Enter Pilates',
    cardClass: 'section-landing-card-pilates',
    iconBg: 'from-[#34D399] to-[#10B981]',
    ctaClass: 'text-emerald-700',
  },
};

export function RootPortal({ isOwner }: RootPortalProps) {
  const router = useRouter();
  const [view, setView] = useState<SectionId>('beauty');
  const [navigating, setNavigating] = useState<SectionId | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'beauty' || saved === 'pilates') {
        setView(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSwitch = useCallback((section: SectionId) => {
    setView(section);
    try {
      window.localStorage.setItem(STORAGE_KEY, section);
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSelect = useCallback(
    (section: SectionId) => {
      setNavigating(section);
      try {
        window.localStorage.setItem(STORAGE_KEY, section);
      } catch {
        // ignore storage errors
      }
      router.push(`/${section}/dashboard`);
    },
    [router]
  );

  const card = SECTION_CARDS[view];
  const Icon = card.icon;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Owner Top Bar ───────────────────────────────────────── */}
      {isOwner && (
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link href="/beauty/dashboard" className="text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors">
              ← Skip to Dashboard
            </Link>
            <EditModeToggle />
          </div>
        </div>
      )}

      {/* ── Floating Top-Right Section Toggle ───────────────────── */}
      <div className={`fixed right-4 z-50 ${isOwner ? 'top-[4.5rem]' : 'top-4'}`}>
        <SectionSwitcher activeSection={view} onSwitch={handleSwitch} />
      </div>

      {/* ── Selection Screen ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 gradient-mesh relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob-pink -top-20 -left-40 opacity-30" />
          <div className="blob-mint -bottom-20 -right-40 opacity-30" />
          <div className="blob-purple top-1/3 right-1/4 opacity-15" />
        </div>

        <div className="relative z-10 text-center mb-12 animate-slide-up">
          <span className="text-2xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)]">
            Merakí
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-[family-name:var(--font-playfair)] italic text-[var(--color-text-primary)]">
            Choose your experience
          </h1>
          <p className="mt-3 text-base text-[var(--color-text-secondary)] max-w-md mx-auto">
            Two worlds, one platform. Select a section to continue.
          </p>
        </div>

        <div key={view} className="relative z-10 w-full max-w-lg animate-scale-in">
          <button
            onClick={() => handleSelect(view)}
            disabled={navigating !== null}
            className={`section-landing-card ${card.cardClass} p-8 sm:p-10 text-left group disabled:opacity-60 w-full`}
          >
            <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${card.iconBg} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {navigating === view ? (
                <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon size={28} className="text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              {card.title}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
              {card.description}
            </p>
            <span className={`inline-flex items-center gap-2 text-sm font-semibold ${card.ctaClass} group-hover:gap-3 transition-all`}>
              {card.cta}
              <ArrowRight size={16} />
            </span>
          </button>
        </div>

        {/* Footer links */}
        <div className="relative z-10 mt-12 flex items-center gap-6 text-sm">
          <Link href="/login" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
