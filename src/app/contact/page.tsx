'use client';

import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';
import { Mail, Phone, Clock } from 'lucide-react';
import { EditableText } from '@/components/editable/EditableText';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      {/* ── Contact Content ─────────────────────────────────────── */}
      <main className="flex-grow pt-16 pb-32 px-6 section-warm relative overflow-hidden">
        <div className="blob-pink -top-20 -right-20 opacity-40 blur-3xl" />
        <div className="blob-purple -bottom-40 left-0 opacity-30 blur-3xl" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-100 w-fit mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <EditableText contentKey="contact.eyebrow" fallback="Get in Touch" as="span" className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]" />
            </div>
            
            <EditableText
              contentKey="contact.heading"
              fallback="Let's craft your perfect look."
              as="h1"
              className="text-4xl sm:text-5xl lg:text-6xl font-[family-name:var(--font-playfair)] text-[var(--color-text-primary)] mb-6 leading-tight"
            />
            <EditableText
              contentKey="contact.paragraph"
              fallback="Have a question about our services, products, or your account? We're here to help. Reach out to our dedicated support team to start your journey."
              as="p"
              multiline
              className="text-base text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-md"
            />
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[var(--color-primary)] shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Mail size={20} strokeWidth={1.5} />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] mb-0.5">Email Us</p>
                  <a href="mailto:hello@merakiapp.com" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    <EditableText contentKey="contact.email" fallback="hello@merakiapp.com" as="span" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[var(--color-primary)] shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Phone size={20} strokeWidth={1.5} />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] mb-0.5">Call Us</p>
                  <a href="tel:+4402071234567" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    <EditableText contentKey="contact.phone" fallback="+44 (0) 20 7123 4567" as="span" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[var(--color-primary)] shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Clock size={20} strokeWidth={1.5} />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] mb-0.5">Opening Hours</p>
                  <EditableText contentKey="contact.hours" fallback="Mon-Fri, 9am - 6pm GMT" as="p" className="text-sm text-[var(--color-text-secondary)]" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
