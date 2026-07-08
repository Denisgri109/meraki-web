'use client';

import { useSection } from '@/contexts/SectionContext';
import { Sparkles, Activity } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionPageWrapperProps {
  children: ReactNode;
  title: string;
}

export function SectionPageWrapper({ children, title }: SectionPageWrapperProps) {
  const { section, isPilates } = useSection();

  return (
    <div className="animate-fade-in">
      {/* Section context banner */}
      <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
        isPilates
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)] border border-[var(--color-brand-pink)]/20'
      }`}>
        {isPilates ? <Activity size={15} /> : <Sparkles size={15} />}
        <span>{title} — {section === 'pilates' ? 'Pilates' : 'Beauty'} Section</span>
      </div>
      {children}
    </div>
  );
}
