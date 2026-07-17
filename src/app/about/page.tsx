'use client';

import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';
import { EditableText } from '@/components/editable/EditableText';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      {/* ── About Content ───────────────────────────────────────── */}
      <main className="flex-grow pt-16 pb-32 px-6 section-warm relative overflow-hidden">
        <div className="blob-pink -top-20 -left-40 opacity-30" />
        <div className="blob-purple -bottom-20 right-0 opacity-20" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <EditableText
              contentKey="about.eyebrow"
              fallback="Our Story"
              as="p"
              className="text-xs tracking-[4px] uppercase text-[var(--color-brand-pink-dark)] font-semibold mb-3"
            />
            <EditableText
              contentKey="about.heading"
              fallback="Beauty With Soul"
              as="h1"
              className="text-4xl sm:text-5xl font-[family-name:var(--font-playfair)] italic text-[var(--color-text-primary)] mb-6"
            />
          </div>

          <div className="glass-card p-8 sm:p-12 rounded-[var(--radius-3xl)] text-base text-[var(--color-text-secondary)] space-y-6 leading-relaxed shadow-xl border border-white/40">
            <EditableText
              contentKey="about.paragraph1"
              fallback={'Welcome to Merakí, your premium destination for all things beauty. The word "Merakí" is a Greek word often used to describe doing something with soul, creativity, or love — when you put "something of yourself" into what you\'re doing, whatever it may be.'}
              as="p"
              multiline
            />
            <EditableText
              contentKey="about.paragraph2"
              fallback="Founded on the belief that beauty is an expression of the inner self, our platform connects you with top-tier professionals, curated products, and expert knowledge all in one seamless place."
              as="p"
              multiline
            />
            <EditableText
              contentKey="about.paragraph3"
              fallback="Whether you are looking to book your next transforming hair appointment, find the perfect skincare routine, or learn a new makeup technique from our academy, Merakí provides an unparalleled, luxury experience."
              as="p"
              multiline
            />
            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-center">
              <Link href="/register" className="btn-pink px-8 py-3 text-sm shadow-glow rounded-full inline-block">
                <EditableText contentKey="about.cta" fallback="Join the Merakí Family" as="span" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
