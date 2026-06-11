import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MainNavbar />

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="flex-grow pt-16 pb-32 px-6 section-lavender relative overflow-hidden">
        <div className="blob-pink -top-20 -left-40 opacity-10" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-playfair)] italic text-[var(--color-text-primary)] mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Last updated: June 2026</p>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-[var(--radius-3xl)] text-sm text-[var(--color-text-secondary)] space-y-8 leading-relaxed shadow-sm border border-gray-100">
            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">1. Introduction</h2>
              <p>
                Welcome to Merakí. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you as to how we collect and process your personal data when you visit our website or use our mobile application (collectively, the "Platform"), regardless of where you access it from, and tell you about your privacy rights and how the law protects you.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">2. Information We Collect</h2>
              <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Identity Data</strong> includes first name, last name, username, or similar identifier.</li>
                <li><strong>Contact Data</strong> includes email address, billing address, telephone number, country, and city.</li>
                <li><strong>Financial Data</strong> includes payment card details (securely handled by Stripe).</li>
                <li><strong>Transaction Data</strong> includes details about payments to and from you, and details of services and products you have booked or purchased on the Platform.</li>
                <li><strong>Usage and Technical Data</strong> includes internet protocol (IP) address, login data, browser type/version, time zone setting, operating system, and platform usage analytics.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">3. How We Use Your Information</h2>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>To provide our services, manage bookings and appointments, facilitate payments, and maintain your account profile.</li>
                <li>To send transaction notifications, push notifications, and email confirmations.</li>
                <li>Where it is necessary for our legitimate interests (e.g., improving Platform performance and user experience).</li>
                <li>To comply with a legal or regulatory obligation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">4. Data Security</h2>
              <p>
                We implement industry-standard technical and organizational security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. In addition, payment details are securely processed and stored by our PCI-compliant payment provider (Stripe) and are never stored directly on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">5. Data Sharing</h2>
              <p>
                We share your personal data only with trusted third-party service providers necessary to deliver our services (including payment processing via Stripe, database hosting, and notification delivery services). We require all third parties to respect the security of your data and treat it in accordance with the law. We never sell your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">6. Your Rights</h2>
              <p>
                Under GDPR and applicable privacy laws, you have rights in relation to your personal data. These include the right to request access, correction, erasure, restriction of processing, data portability, and the right to object to processing. You may exercise these rights or manage your settings within the Platform or by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">7. Cookies & Tracking</h2>
              <p>
                Our Platform uses cookies and mobile analytics identifiers to distinguish you from other users and to analyze usage patterns. You can configure your browser to refuse all or some browser cookies, or opt out of analytics tracking in your device settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">8. Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. Account data is deleted or anonymized upon request, subject to legal retention obligations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">9. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy, our privacy practices, or wish to exercise your legal rights, please contact our Data Protection team at{' '}
                <a href="mailto:privacy@merakiapp.com" className="text-[var(--color-primary)] font-semibold hover:underline">
                  privacy@merakiapp.com
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
