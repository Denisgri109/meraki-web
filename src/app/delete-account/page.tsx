import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';
import { BUSINESS } from '@/lib/constants/business';

export const metadata: Metadata = {
  title: 'Delete your account — Merakí',
  description:
    'How to delete your Merakí account and what happens to your data, including what we must keep and for how long.',
};

/**
 * Public account-deletion page.
 *
 * Google Play's User Data policy requires a deletion route that is reachable
 * from outside the app — a URL a reviewer (or a former user who has already
 * uninstalled) can open without signing in. Apple's Guideline 5.1.1(v)
 * requires deletion to be startable inside the app, which Settings already
 * does; this page documents both and is the URL to paste into the Play
 * Console "Data deletion" field.
 */
export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      <main id="main-content" className="flex-grow pt-16 pb-32 px-6 section-lavender">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-playfair)] italic text-[var(--color-text-primary)] mb-4">
            Delete your account
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-10">
            You can delete your Merakí account yourself, at any time, for free.
          </p>

          <div className="bg-white p-8 sm:p-12 rounded-[var(--radius-3xl)] shadow-sm border border-gray-100 text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-8">
            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
                In the app
              </h2>
              <p>
                Open <strong>Menu → Edit Profile</strong>, scroll to the bottom and choose{' '}
                <strong>Delete Account</strong>. You will be asked to confirm. Deletion starts
                immediately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
                On the website
              </h2>
              <p>
                Sign in and go to{' '}
                <Link href="/dashboard/settings" className="font-semibold underline underline-offset-2">
                  Settings → Account
                </Link>
                , then choose <strong>Delete Account</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
                If you cannot sign in
              </h2>
              <p>
                Email{' '}
                <a
                  href={`mailto:${BUSINESS.privacyEmail}?subject=Account%20deletion%20request`}
                  className="font-semibold underline underline-offset-2"
                >
                  {BUSINESS.privacyEmail}
                </a>{' '}
                from the address on the account. We will verify it is you and complete the deletion
                within 30 days, as the GDPR requires.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
                What is deleted
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your profile: name, email, phone, city, photo, password.</li>
                <li>Your saved card details, removed at Stripe.</li>
                <li>Chat messages, consultation photographs and course homework.</li>
                <li>Health screening answers, once the retention period below has passed.</li>
                <li>Your push notification token, immediately.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
                What we have to keep, and for how long
              </h2>
              <p>
                Some records cannot be deleted on request because we are legally required to hold
                them. These are separated from your profile and are not used for anything else.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  Invoices and payment records — 6 years from the end of the tax year, required by
                  Irish tax law.
                </li>
                <li>
                  Pilates health screening answers — 7 years, so that we can defend a personal-injury
                  claim within the limitation period.
                </li>
                <li>
                  A record that consent was given and later withdrawn — 2 years, as evidence under
                  GDPR article 7(1).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">
                Getting a copy first
              </h2>
              <p>
                If you want your data before it goes, email {BUSINESS.privacyEmail} and ask for an
                export. We send it within one month, in a machine-readable format, free of charge.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
