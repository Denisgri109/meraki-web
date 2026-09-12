'use client';

import Link from 'next/link';
import { useSection } from '@/contexts/SectionContext';
import { useEditMode } from '@/contexts/EditContext';
import { EditableText } from '@/components/editable/EditableText';
import { CookieSettingsLink } from '@/components/consent/CookieSettingsLink';
import { BUSINESS, REGISTERED_ADDRESS_LINE } from '@/lib/constants/business';

export function Footer() {
  const { buildPath } = useSection();
  const { getContent } = useEditMode();
  const logoUrl = getContent('image.logo', '');

  return (
    <footer className="bg-[var(--color-primary)] text-[var(--color-text-invert)] py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${getContent('brand.logo_text', 'Merakí')} home`}
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          ) : (
            <EditableText contentKey="brand.logo_text" fallback="Merakí" as="span" className="text-2xl font-[family-name:var(--font-playfair)] italic" />
          )}
          <EditableText contentKey="footer.tagline" fallback="Beauty with soul" as="p" className="text-white/80 text-sm mt-2" />
        </div>

        <nav aria-label="Platform">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-3">Platform</h2>
          <div className="space-y-2 text-sm text-white/90">
            <Link href={buildPath('booking')} className="block hover:text-white transition-colors">Book Services</Link>
            <Link href={buildPath('shop')} className="block hover:text-white transition-colors">Shop Products</Link>
            <Link href={buildPath('academy')} className="block hover:text-white transition-colors">Academy Courses</Link>
          </div>
        </nav>

        <nav aria-label="Company">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-3">Company</h2>
          <div className="space-y-2 text-sm text-white/90">
            <Link href="/about" className="block hover:text-white transition-colors">About Us</Link>
            <Link href="/contact" className="block hover:text-white transition-colors">Contact</Link>
            <Link href="/accessibility" className="block hover:text-white transition-colors">Accessibility</Link>
          </div>
        </nav>

        <nav aria-label="Legal">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-3">Legal</h2>
          <div className="space-y-2 text-sm text-white/90">
            <Link href="/privacy-policy" className="block hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="block hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookie-policy" className="block hover:text-white transition-colors">Cookie Policy</Link>
            <Link href="/refund-policy" className="block hover:text-white transition-colors">Refunds &amp; Cancellations</Link>
            <Link href="/delete-account" className="block hover:text-white transition-colors">Delete your account</Link>
            <Link href="/professional-terms" className="block hover:text-white transition-colors">Terms for Specialists</Link>
            <CookieSettingsLink />
          </div>
        </nav>
      </div>

      {/*
        Companies Act 2014 s.1302 and S.I. 68/2003 reg. 8 require the registered
        name, number, place of registration and registered office to be shown on
        the website. Rendered from `business.ts` so there is one place to fix.
      */}
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/20 text-xs text-white/80 space-y-1.5">
        <p>
          {BUSINESS.legalName} — registered in {BUSINESS.placeOfRegistration}, company number{' '}
          {BUSINESS.companyNumber}. Registered office: {REGISTERED_ADDRESS_LINE}.
          {BUSINESS.vatNumber ? ` VAT number ${BUSINESS.vatNumber}.` : ''}
        </p>
        <p>
          Trading as {BUSINESS.tradingName}. Contact{' '}
          <a href={`mailto:${BUSINESS.email}`} className="underline underline-offset-2 hover:text-white">
            {BUSINESS.email}
          </a>
          {BUSINESS.phone ? ` · ${BUSINESS.phone}` : ''}
        </p>
        <p className="pt-2 text-white/70">
          © {new Date().getFullYear()}{' '}
          <EditableText contentKey="footer.copyright" fallback="Merakí. All rights reserved." as="span" />
        </p>
      </div>
    </footer>
  );
}
