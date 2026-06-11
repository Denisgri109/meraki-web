import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="flex-grow pt-16 pb-32 px-6 section-warm relative overflow-hidden">
        <div className="blob-purple -bottom-40 right-0 opacity-10" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-playfair)] italic text-[var(--color-text-primary)] mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Last updated: June 2026</p>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-[var(--radius-3xl)] text-sm text-[var(--color-text-secondary)] space-y-8 leading-relaxed shadow-sm border border-gray-100">
            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Merakí platform, including our website and mobile application (collectively, the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">2. Description of Service</h2>
              <p>
                Merakí provides a platform connecting clients with professional beauty and wellness specialists (each a "Master" or "Specialist"). The Platform allows users to book appointments, purchase products, and access educational content. Merakí acts as an intermediary platform and is not a provider of beauty or wellness services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">3. User Accounts</h2>
              <p>
                To access most features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information and to keep your credentials secure. You are responsible for all activities that occur under your account and must notify us immediately of any unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">4. Booking and Cancellations</h2>
              <p>
                Appointments booked on the Platform are subject to the respective professional's cancellation policy. Cancellations made more than 24 hours before a scheduled appointment receive a full refund. Cancellations made within 24 hours of the appointment are subject to a 50% cancellation fee. No-shows will be charged 100% of the scheduled service amount to the payment method on file.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">5. Payments</h2>
              <p>
                All payments, including service deposits and full bookings, are processed securely through our third-party payment partner (Stripe). Prices are displayed in Euros and include applicable taxes unless stated otherwise. By providing a payment method, you authorize charges in accordance with these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">6. Refunds</h2>
              <p>
                Refunds are processed automatically where applicable under the cancellation policy. Please allow 1 to 10 business days for the funds to appear in your account, depending on your bank and financial institution.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">7. Intellectual Property</h2>
              <p>
                All content, features, and functionality on the Platform, including but not limited to text, logos, designs, graphics, code, and interfaces, are the exclusive property of Merakí and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Merakí shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising out of your use of the Platform or the services rendered by independent professionals.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms of Service at any time. We will indicate the date of the latest update at the top. Your continued use of the Platform following the posting of any changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">10. Contact Information</h2>
              <p>
                If you have any questions regarding these Terms, please contact our Legal team at{' '}
                <a href="mailto:legal@merakiapp.com" className="text-[var(--color-primary)] font-semibold hover:underline">
                  legal@merakiapp.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
