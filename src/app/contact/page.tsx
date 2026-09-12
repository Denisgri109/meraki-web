'use client';

import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';
import { Mail, Clock, Building2, ShieldCheck, Accessibility } from 'lucide-react';
import { EditableText } from '@/components/editable/EditableText';
import { BUSINESS, REGISTERED_ADDRESS_LINE } from '@/lib/constants/business';

/**
 * Contact details.
 *
 * The trader identity block below is not decoration — S.I. 68/2003 reg. 8 and
 * the Consumer Rights Act 2022 require an easily accessible geographic address
 * and a contact route, and Companies Act 2014 s.1302 requires the registered
 * name and number. The previous placeholder phone number (+44 20 7123 4567)
 * was removed: publishing a number that does not reach the trader is worse
 * than publishing none.
 */
export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      <main
        id="main-content"
        className="flex-grow pt-16 pb-32 px-6 section-warm relative overflow-hidden"
      >
        <div className="blob-pink -top-20 -right-20 opacity-40 blur-3xl" aria-hidden="true" />
        <div className="blob-purple -bottom-40 left-0 opacity-30 blur-3xl" aria-hidden="true" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-100 w-fit mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" aria-hidden="true" />
              <EditableText
                contentKey="contact.eyebrow"
                fallback="Get in Touch"
                as="span"
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]"
              />
            </div>

            <EditableText
              contentKey="contact.heading"
              fallback="Let's craft your perfect look."
              as="h1"
              className="text-4xl sm:text-5xl lg:text-6xl font-[family-name:var(--font-playfair)] text-[var(--color-text-primary)] mb-6 leading-tight"
            />
            <EditableText
              contentKey="contact.paragraph"
              fallback="Have a question about our services, products, or your account? We're here to help. Reach out to our support team and we'll come back to you within one working day."
              as="p"
              multiline
              className="text-base text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-md"
            />

            <div className="space-y-6">
              <ContactRow
                icon={<Mail size={20} strokeWidth={1.5} aria-hidden="true" />}
                label="General enquiries"
              >
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <EditableText contentKey="contact.email" fallback={BUSINESS.email} as="span" />
                </a>
              </ContactRow>

              <ContactRow
                icon={<ShieldCheck size={20} strokeWidth={1.5} aria-hidden="true" />}
                label="Privacy and data requests"
              >
                <a
                  href={`mailto:${BUSINESS.privacyEmail}`}
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {BUSINESS.privacyEmail}
                </a>
              </ContactRow>

              <ContactRow
                icon={<Accessibility size={20} strokeWidth={1.5} aria-hidden="true" />}
                label="Accessibility problems"
              >
                <a
                  href={`mailto:${BUSINESS.accessibilityEmail}`}
                  className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {BUSINESS.accessibilityEmail}
                </a>
              </ContactRow>

              {BUSINESS.phone && (
                <ContactRow
                  icon={<Mail size={20} strokeWidth={1.5} aria-hidden="true" />}
                  label="Call us"
                >
                  <a
                    href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {BUSINESS.phone}
                  </a>
                </ContactRow>
              )}

              <ContactRow
                icon={<Clock size={20} strokeWidth={1.5} aria-hidden="true" />}
                label="Support hours"
              >
                <EditableText
                  contentKey="contact.hours"
                  fallback={BUSINESS.supportHours}
                  as="p"
                  className="text-sm text-[var(--color-text-secondary)]"
                />
              </ContactRow>

              <ContactRow
                icon={<Building2 size={20} strokeWidth={1.5} aria-hidden="true" />}
                label="Registered business"
              >
                <address className="not-italic text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {BUSINESS.legalName}
                  <br />
                  Registered in {BUSINESS.placeOfRegistration}, company number {BUSINESS.companyNumber}
                  <br />
                  {REGISTERED_ADDRESS_LINE}
                  {BUSINESS.vatNumber && (
                    <>
                      <br />
                      VAT number {BUSINESS.vatNumber}
                    </>
                  )}
                </address>
              </ContactRow>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[var(--color-primary)] shrink-0">
        {icon}
      </div>
      <div className="pt-1">
        <p className="text-sm font-bold text-[var(--color-text-primary)] mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
