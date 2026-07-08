'use client';

import Link from 'next/link';
import { EditableText } from '@/components/editable/EditableText';
import { EditableImage } from '@/components/editable/EditableImage';

interface PilatesSectionProps {
  isOwner: boolean;
}

export function PilatesSection({ isOwner }: PilatesSectionProps) {
  return (
    <div className="animate-section-in">
      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <EditableImage
            contentKey="landing.pilates.hero.image_url"
            fallback="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1920&q=80&auto=format&fit=crop"
            alt="Pilates studio"
            imgClassName="w-full h-full object-cover"
            pathPrefix="site-content/pilates-hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(52,211,153,0.15)] via-black/40 to-black/70" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-slide-up">
          <EditableText
            contentKey="landing.pilates.hero.badge"
            fallback="Move With Purpose"
            as="p"
            className="text-xs tracking-[5px] uppercase text-emerald-300 font-semibold mb-6 drop-shadow-md"
          />
          <EditableText
            contentKey="landing.pilates.hero.title"
            fallback="Your Pilates Journey Starts Here"
            as="h1"
            className="text-5xl sm:text-6xl lg:text-7xl font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-emerald-200 leading-tight mb-6 drop-shadow-lg"
          />
          <EditableText
            contentKey="landing.pilates.hero.subtitle"
            fallback="Book group classes, follow weekly schedules, and train with expert instructors — for every level, every body."
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
                <Link href="/register" className="px-10 py-4 text-sm rounded-full font-semibold text-white bg-gradient-to-br from-[#34D399] to-[#10B981] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <EditableText contentKey="landing.pilates.hero.cta_primary" fallback="Book a Class" as="span" />
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-white/40 text-white px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-all"
                >
                  <EditableText contentKey="landing.pilates.hero.cta_secondary" fallback="Sign In" as="span" />
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
      <section className="py-16 sm:py-24 px-6 section-mint relative overflow-hidden">
        <div className="blob-mint -top-20 -left-40 opacity-30" />
        <div className="blob-pink -bottom-20 right-0 opacity-15" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <EditableText
              contentKey="landing.pilates.how_it_works.badge"
              fallback="How It Works"
              as="p"
              className="text-xs tracking-[4px] uppercase text-emerald-700 font-semibold mb-3"
            />
            <EditableText
              contentKey="landing.pilates.how_it_works.title"
              fallback="Pilates Made Simple"
              as="h2"
              className="text-3xl sm:text-4xl font-semibold text-[var(--color-text-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', titleKey: 'landing.pilates.how_it_works.step1_title', titleFallback: 'Explore', descKey: 'landing.pilates.how_it_works.step1_desc', descFallback: 'Browse weekly class schedules and find sessions that match your level', imgKey: 'landing.pilates.how_it_works.step1_image', imgFallback: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80&auto=format&fit=crop', step: '01' },
              { num: '2', titleKey: 'landing.pilates.how_it_works.step2_title', titleFallback: 'Book', descKey: 'landing.pilates.how_it_works.step2_desc', descFallback: 'Reserve your spot in a class, choose your instructor, and confirm instantly', imgKey: 'landing.pilates.how_it_works.step2_image', imgFallback: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80&auto=format&fit=crop', step: '02' },
              { num: '3', titleKey: 'landing.pilates.how_it_works.step3_title', titleFallback: 'Transform', descKey: 'landing.pilates.how_it_works.step3_desc', descFallback: 'Build strength, flexibility, and mindfulness with every session', imgKey: 'landing.pilates.how_it_works.step3_image', imgFallback: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80&auto=format&fit=crop', step: '03' },
            ].map((item) => (
              <div key={item.step} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-[var(--radius-2xl)] overflow-hidden mb-5 relative">
                  <EditableImage
                    contentKey={item.imgKey}
                    fallback={item.imgFallback}
                    alt={item.titleFallback}
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    pathPrefix={`site-content/pilates-step-${item.num}`}
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
                contentKey="landing.pilates.features.badge"
                fallback="Everything You Need"
                as="p"
                className="text-xs tracking-[4px] uppercase text-emerald-700 font-semibold mb-3"
              />
              <EditableText
                contentKey="landing.pilates.features.title"
                fallback="One Studio, Every Level"
                as="h2"
                className="text-3xl sm:text-4xl font-semibold text-[var(--color-text-primary)] mb-6"
              />
              <div className="space-y-5">
                {[
                  { emoji: '📅', title: 'Class Booking', desc: 'Reserve spots in group or private sessions', badge: 'icon-badge-green' },
                  { emoji: '👥', title: 'Expert Instructors', desc: 'Learn from certified Pilates teachers', badge: 'icon-badge-cyan' },
                  { emoji: '📊', title: 'Progress Tracking', desc: 'Monitor your improvements over time', badge: 'icon-badge-blue' },
                  { emoji: '🏋️', title: 'All Levels Welcome', desc: 'From beginner to advanced, find your fit', badge: 'icon-badge-amber' },
                  { emoji: '💬', title: 'Direct Chat', desc: 'Message your instructor directly', badge: 'icon-badge-purple' },
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
                contentKey="landing.pilates.features.image_url"
                fallback="https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80&auto=format&fit=crop"
                alt="Pilates class"
                imgClassName="w-full h-full object-cover"
                pathPrefix="site-content/pilates-features"
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
            contentKey="landing.pilates.testimonial.image_url"
            fallback="https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1600&q=80&auto=format&fit=crop"
            alt="Pilates studio atmosphere"
            imgClassName="w-full h-full object-cover"
            pathPrefix="site-content/pilates-testimonial"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-black/60 to-teal-900/50" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <EditableText
            contentKey="landing.pilates.testimonial.badge"
            fallback="Join Hundreds of Stronger Bodies"
            as="p"
            className="text-xs tracking-[4px] uppercase text-emerald-300 font-bold mb-4 drop-shadow-md"
          />
          <EditableText
            contentKey="landing.pilates.testimonial.quote"
            fallback="Pilates at Merakí changed how I move. The classes, the instructors — everything just clicks."
            as="h2"
            multiline
            className="text-3xl sm:text-4xl font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 mb-6 drop-shadow-lg"
          />
          <EditableText
            contentKey="landing.pilates.testimonial.author"
            fallback="— Emma R., London"
            as="p"
            className="text-white/80 text-sm mb-10 font-medium"
          />
          {isOwner ? (
            <Link href="/dashboard" className="inline-block px-10 py-4 text-sm rounded-full font-semibold text-white bg-gradient-to-br from-[#34D399] to-[#10B981] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/register" className="inline-block px-10 py-4 text-sm rounded-full font-semibold text-white bg-gradient-to-br from-[#34D399] to-[#10B981] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <EditableText contentKey="landing.pilates.testimonial.cta" fallback="Start Your Journey" as="span" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
