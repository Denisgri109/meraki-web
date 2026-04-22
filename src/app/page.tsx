import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12">
        <span className="text-2xl font-[family-name:var(--font-playfair)] italic text-white drop-shadow-md">
          Merakí
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/90 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-white text-[var(--color-primary)] px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80&auto=format&fit=crop"
            alt="Luxury beauty salon"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-slide-up">
          <p className="text-xs tracking-[5px] uppercase text-[var(--color-brand-pink)] font-semibold mb-6">
            Beauty With Soul
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-[family-name:var(--font-playfair)] italic text-white leading-tight mb-6">
            Your Premium Beauty Destination
          </h1>
          <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-xl mx-auto">
            Book appointments with top professionals, shop curated products,
            and learn from expert courses — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-[var(--color-primary)] px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="border-2 border-white/40 text-white px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[4px] uppercase text-[var(--color-brand-pink-dark)] font-semibold mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--color-text-primary)]">
              Beauty Made Simple
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discover',
                desc: 'Browse top-rated beauty professionals and services in your area',
                img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop',
              },
              {
                step: '02',
                title: 'Book',
                desc: 'Choose your service, pick a date, and confirm your appointment instantly',
                img: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80&auto=format&fit=crop',
              },
              {
                step: '03',
                title: 'Glow',
                desc: 'Enjoy your beauty experience and earn loyalty rewards with every visit',
                img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&auto=format&fit=crop',
              },
            ].map((item) => (
              <div key={item.step} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-[var(--radius-2xl)] overflow-hidden mb-5 relative">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 text-xs font-bold tracking-widest text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    STEP {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[var(--color-surface-light)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs tracking-[4px] uppercase text-[var(--color-brand-pink-dark)] font-semibold mb-3">Everything You Need</p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--color-text-primary)] mb-6">
                One Platform, Endless Beauty
              </h2>
              <div className="space-y-5">
                {[
                  { emoji: '📅', title: 'Smart Booking', desc: 'Book appointments with real-time availability' },
                  { emoji: '🛍️', title: 'Beauty Shop', desc: 'Shop curated products from top brands' },
                  { emoji: '🎓', title: 'Academy', desc: 'Learn from professional courses and tutorials' },
                  { emoji: '🎁', title: 'Loyalty Rewards', desc: 'Earn points and unlock exclusive perks' },
                  { emoji: '💬', title: 'Direct Chat', desc: 'Message your stylist directly in-app' },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-4">
                    <span className="text-2xl">{f.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)]">{f.title}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[var(--radius-2xl)] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1633681122967-cdaa3b9a284c?w=800&q=80&auto=format&fit=crop"
                alt="Beauty services"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonial / CTA ──────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80&auto=format&fit=crop"
            alt="Salon atmosphere"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-xs tracking-[4px] uppercase text-[var(--color-brand-pink)] font-semibold mb-4">
            Join Thousands of Happy Clients
          </p>
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-playfair)] italic text-white mb-6">
            &ldquo;Merakí transformed how I do beauty. Everything I need in one beautiful app.&rdquo;
          </h2>
          <p className="text-white/70 text-sm mb-10">— Sarah K., London</p>
          <Link
            href="/register"
            className="inline-block bg-white text-[var(--color-primary)] px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/90 transition-all shadow-xl"
          >
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-[var(--color-primary)] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-2xl font-[family-name:var(--font-playfair)] italic">Merakí</span>
            <p className="text-white/50 text-sm mt-2">Beauty with soul</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Platform</h4>
            <div className="space-y-2 text-sm text-white/70">
              <Link href="/register" className="block hover:text-white transition-colors">Book Services</Link>
              <Link href="/register" className="block hover:text-white transition-colors">Shop Products</Link>
              <Link href="/register" className="block hover:text-white transition-colors">Academy Courses</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Company</h4>
            <div className="space-y-2 text-sm text-white/70">
              <Link href="#" className="block hover:text-white transition-colors">About Us</Link>
              <Link href="#" className="block hover:text-white transition-colors">Careers</Link>
              <Link href="#" className="block hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Legal</h4>
            <div className="space-y-2 text-sm text-white/70">
              <Link href="#" className="block hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="block hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Merakí. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
