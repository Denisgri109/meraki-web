'use client';

import { Sparkles, Activity, ArrowRight } from 'lucide-react';
import type { SectionId } from './SectionSwitcher';

interface SectionLandingProps {
  onSelect: (section: SectionId) => void;
}

export function SectionLanding({ onSelect }: SectionLandingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 gradient-mesh relative overflow-hidden">
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
          Two worlds, one platform. Select a section to explore.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full animate-scale-in">
        <button
          onClick={() => onSelect('beauty')}
          className="section-landing-card section-landing-card-beauty p-8 sm:p-10 text-left group"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8A0B4] to-[#C47A90] shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
            <Sparkles size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Beauty Section
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
            Book salon appointments, shop curated products, and learn from expert courses — all your beauty needs in one place.
          </p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-pink-dark)] group-hover:gap-3 transition-all">
            Explore Beauty
            <ArrowRight size={16} />
          </span>
        </button>

        <button
          onClick={() => onSelect('pilates')}
          className="section-landing-card section-landing-card-pilates p-8 sm:p-10 text-left group"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#34D399] to-[#10B981] shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
            <Activity size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Pilates Section
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
            Join group classes, view weekly schedules, and book sessions with expert instructors for every level.
          </p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 group-hover:gap-3 transition-all">
            Explore Pilates
            <ArrowRight size={16} />
          </span>
        </button>
      </div>
    </div>
  );
}
