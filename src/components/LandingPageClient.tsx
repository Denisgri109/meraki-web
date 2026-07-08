'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { EditModeToggle } from '@/components/editable/EditModeToggle';
import { SectionSwitcher, type SectionId } from '@/components/SectionSwitcher';
import { BeautySection } from '@/components/BeautySection';
import { PilatesSection } from '@/components/PilatesSection';
import { Footer } from '@/components/Footer';

const STORAGE_KEY = 'meraki:active-section';

interface LandingPageClientProps {
  isOwner: boolean;
}

export function LandingPageClient({ isOwner }: LandingPageClientProps) {
  const [view, setView] = useState<SectionId>('beauty');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === 'beauty' || saved === 'pilates') {
          setView(saved);
        }
      } catch {
        // ignore storage errors
      }
      setHydrated(true);
    });
  }, []);

  const handleSwitch = useCallback((section: SectionId) => {
    setView(section);
    try {
      window.localStorage.setItem(STORAGE_KEY, section);
    } catch {
      // ignore storage errors
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center animate-fade-in">
          <span className="text-3xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)]">
            Merakí
          </span>
          <div className="w-8 h-8 border-2 border-[var(--color-brand-pink)] border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Owner Top Bar ───────────────────────────────────────── */}
      {isOwner && (
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:block">You are viewing the public landing page</span>
              <EditModeToggle />
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent Section Switcher ────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <SectionSwitcher activeSection={view} onSwitch={handleSwitch} />
      </div>

      {/* ── Conditional Section Content ─────────────────────────── */}
      {view === 'beauty' && <BeautySection isOwner={isOwner} />}
      {view === 'pilates' && <PilatesSection isOwner={isOwner} />}

      <Footer />
    </div>
  );
}
