'use client';

import Link from 'next/link';
import { DEFAULT_PRODUCT_IMAGE_HERO } from '@/lib/constants/images';
import { EditableText } from '@/components/editable/EditableText';
import { EditableImage } from '@/components/editable/EditableImage';

interface BeautySectionProps {
  isOwner: boolean;
}

export function BeautySection({ isOwner }: BeautySectionProps) {
  return (
    <div className="animate-section-in">
      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <EditableImage
            contentKey="landing.hero.image_url"
            fallback="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80&auto=format&fit=crop"
            alt="Luxury beauty salon"
            imgClassName="w-full h-full object-cover"
            pathPrefix="site-content/hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(232,160,180,0.15)] via-black/40 to-black/70" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-slide-up">
          <EditableText
            contentKey="landing.hero.badge"
            fallback="Beauty With Soul"
            as="p"
            className="text-xs tracking-[5px] uppercase text-[var(--color-brand-pink-light)] font-semibold mb-6 drop-shadow-md"
          />
          <EditableText
            contentKey="landing.hero.title"
            fallback="Your Premium Beauty Destination"
            as="h1"
            className="text-5xl sm:text-6xl lg:text-7xl font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-pink-200 leading-tight mb-6 drop-shadow-lg"
          />
          <EditableText
            contentKey="landing.hero.subtitle"
            fallback="Book appointments with top professionals, shop curated products, and learn from expert courses — all in one place."
            as="p"
            multiline
            className="text-lg text-white/90 leading-relaxed mb-10 max-w-xl mx-auto drop-shadow"
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isOwner ? (
              <Link href="/dashboard" className="btn-pink px-10 py-4 text-sm shadow-glow">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-pink px-10 py-4 text-sm shadow-glow">
                  <EditableText contentKey="landing.hero.cta_primary" fallback="Get Started Free" as="span" />
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-white/40 text-white px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-all"
                >
                  <EditableText contentKey="landing.hero.cta_secondary" fallback="Sign In" as="span" />
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-6 section-warm relative overflow-hidden">
        <div className="blob-pink -top-20 -left-40 opacity-30" />
        <div className="blob-purple -bottom-20 right-0 opacity-20" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <EditableText
              contentKey="landing.how_it_works.badge"
              fallback="How It Works"
              as="p"
              className="text-xs tracking-[4px] uppercase text-[var(--color-brand-pink-dark)] font-semibold mb-3"
            />
            <EditableText
              contentKey="landing.how_it_works.title"
              fallback="Beauty Made Simple"
              as="h2"
              className="text-3xl sm:text-4xl font-semibold text-[var(--color-text-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', titleKey: 'landing.how_it_works.step1_title', titleFallback: 'Discover', descKey: 'landing.how_it_works.step1_desc', descFallback: 'Browse top-rated beauty professionals and services in your area', imgKey: 'landing.how_it_works.step1_image', imgFallback: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop', step: '01' },
              { num: '2', titleKey: 'landing.how_it_works.step2_title', titleFallback: 'Book', descKey: 'landing.how_it_works.step2_desc', descFallback: 'Choose your service, pick a date, and confirm your appointment instantly', imgKey: 'landing.how_it_works.step2_image', imgFallback: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80&auto=format&fit=crop', step: '02' },
              { num: '3', titleKey: 'landing.how_it_works.step3_title', titleFallback: 'Glow', descKey: 'landing.how_it_works.step3_desc', descFallback: 'Enjoy your beauty experience and earn loyalty rewards with every visit', imgKey: 'landing.how_it_works.step3_image', imgFallback: DEFAULT_PRODUCT_IMAGE_HERO, step: '03' },
            ].map((item) => (
              <div key={item.step} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-[var(--radius-2xl)] overflow-hidden mb-5 relative">
                  <EditableImage
                    contentKey={item.imgKey}
                    fallback={item.imgFallback}
                    alt={item.titleFallback}
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    pathPrefix={`site-content/step-${item.num}`}
                  />
                  <span className="absolute top-4 left-4 text-xs font-bold tracking-widest text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
                    STEP {item.step}
                  </span>
                </div>
                <EditableText
                  contentKey={item.titleKey}
                  fallback={item.titleFallback}
                  as="h3"
                  className="text-xl font-semibold text-[var(--color-text-primary)] mb-2"
                />
                <EditableText
                  contentKey={item.descKey}
                  fallback={item.descFallback}
                  as="p"
                  multiline
                  className="text-sm text-[var(--color-text-secondary)] leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-6 section-lavender relative overflow-hidden">
        <div className="blob-mint -bottom-20 -right-20 opacity-30" />
        <div className="blob-gold top-10 -left-10 opacity-20" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <EditableText
                contentKey="landing.features.badge"
                fallback="Everything You Need"
                as="p"
                className="text-xs tracking-[4px] uppercase text-[var(--color-brand-pink-dark)] font-semibold mb-3"
              />
              <EditableText
                contentKey="landing.features.title"
                fallback="One Platform, Endless Beauty"
                as="h2"
                className="text-3xl sm:text-4xl font-semibold text-[var(--color-text-primary)] mb-6"
              />
              <div className="space-y-5">
                {[
                  { emoji: '📅', title: 'Smart Booking', desc: 'Book appointments with real-time availability', badge: 'icon-badge-pink' },
                  { emoji: '🛍️', title: 'Beauty Shop', desc: 'Shop curated products from top brands', badge: 'icon-badge-amber' },
                  { emoji: '🎓', title: 'Academy', desc: 'Learn from professional courses and tutorials', badge: 'icon-badge-blue' },
                  { emoji: '🎁', title: 'Loyalty Rewards', desc: 'Earn points and unlock exclusive perks', badge: 'icon-badge-green' },
                  { emoji: '💬', title: 'Direct Chat', desc: 'Message your stylist directly in-app', badge: 'icon-badge-purple' },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-4 group">
                    <div className={`icon-badge ${f.badge} group-hover:scale-110 transition-transform duration-300`}>
                      <span>{f.emoji}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)]">{f.title}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[var(--radius-2xl)] overflow-hidden shadow-2xl">
              <EditableImage
                contentKey="landing.features.image_url"
                fallback="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&auto=format&fit=crop"
                alt="Beauty services"
                imgClassName="w-full h-full object-cover"
                pathPrefix="site-content/features"
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── Testimonial / CTA ──────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <EditableImage
            contentKey="landing.testimonial.image_url"
            fallback="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80&auto=format&fit=crop"
            alt="Salon atmosphere"
            imgClassName="w-full h-full object-cover"
            pathPrefix="site-content/testimonial"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black/60 to-pink-900/50" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <EditableText
            contentKey="landing.testimonial.badge"
            fallback="Join Thousands of Happy Clients"
            as="p"
            className="text-xs tracking-[4px] uppercase text-pink-300 font-bold mb-4 drop-shadow-md"
          />
          <EditableText
            contentKey="landing.testimonial.quote"
            fallback="Merakí transformed how I do beauty. Everything I need in one beautiful app."
            as="h2"
            multiline
            className="text-3xl sm:text-4xl font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200 mb-6 drop-shadow-lg"
          />
          <EditableText
            contentKey="landing.testimonial.author"
            fallback="— Sarah K., London"
            as="p"
            className="text-white/80 text-sm mb-10 font-medium"
          />
          {isOwner ? (
            <Link href="/dashboard" className="inline-block btn-pink px-10 py-4 text-sm shadow-glow">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/register" className="inline-block btn-pink px-10 py-4 text-sm shadow-glow">
              <EditableText contentKey="landing.testimonial.cta" fallback="Start Your Journey" as="span" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
