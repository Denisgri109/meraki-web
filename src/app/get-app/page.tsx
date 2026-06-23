'use client';

import React from 'react';
import { MainNavbar } from '@/components/MainNavbar';
import { Footer } from '@/components/Footer';
import { Smartphone, Check, Play, Apple, ArrowLeft, Star, Download } from 'lucide-react';
import Link from 'next/link';

export default function GetAppPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <MainNavbar />

      <main className="flex-grow pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden section-warm">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob-pink -top-20 -left-40 opacity-40" />
          <div className="blob-purple -bottom-40 right-10 opacity-30" />
          <div className="blob-mint top-1/4 -right-20 opacity-20" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-6">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mt-6">
            {/* Left Column: Copy, Features, Buttons */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)] mb-4">
                  <Star size={12} className="fill-[var(--color-brand-pink-dark)]" />
                  <span>Now Available on Mobile</span>
                </span>
                
                <h1 className="text-4xl sm:text-5xl font-[family-name:var(--font-playfair)] italic text-[var(--color-text-primary)] leading-tight">
                  Merakí is Better on the Go
                </h1>
                
                <p className="mt-4 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                  Download the official Merakí mobile application to enjoy real-time messaging, instant booking updates, stamp tag scanning, and personalized alerts designed just for you.
                </p>
              </div>

              {/* App Features checklist */}
              <div className="space-y-3.5">
                {[
                  { title: "NFC Stamp Card Pairing", desc: "Scan and pair physical loyalty tags directly with your phone's NFC reader." },
                  { title: "Push Notifications", desc: "Instant reminders when your beauty session is approved, rescheduled, or cancelled." },
                  { title: "Direct Master Messaging", desc: "Real-time chat with push alerts so you never miss custom instructions from professionals." },
                  { title: "Academy Offline Learning", desc: "Watch video courses, submit academy homework, and complete tests on the go." }
                ].map((feat, idx) => (
                  <div key={idx} className="flex gap-3 items-start max-w-lg">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--color-brand-pink-light)] flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[var(--color-brand-pink-dark)] stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{feat.title}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Store Download Buttons */}
              <div className="pt-4 border-t border-[var(--color-brand-pink)]/15">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Download Now</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Apple App Store */}
                  <a
                    href="https://apps.apple.com/app/meraki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-[var(--color-text-primary)] text-white hover:bg-black px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 group border border-white/5 cursor-pointer"
                  >
                    <Apple size={28} className="text-white shrink-0 group-hover:scale-105 transition-transform" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Download on the</p>
                      <p className="text-base font-bold tracking-tight">App Store</p>
                    </div>
                  </a>

                  {/* Google Play Store */}
                  <a
                    href="https://play.google.com/store/apps/details?id=com.meraki.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-[var(--color-text-primary)] text-white hover:bg-black px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 group border border-white/5 cursor-pointer"
                  >
                    <Play size={26} className="text-white fill-white shrink-0 group-hover:scale-105 transition-transform" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Get it on</p>
                      <p className="text-base font-bold tracking-tight">Google Play</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Smartphone Frame Mockup */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-72 h-[560px] bg-neutral-900 rounded-[45px] p-3 shadow-2xl border-4 border-neutral-800 ring-[12px] ring-neutral-900 ring-offset-2 ring-offset-pink-50 animate-float">
                {/* Speaker & Sensor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-12 h-1 bg-neutral-800 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full ml-3" />
                </div>

                {/* Internal Screen mockup */}
                <div className="w-full h-full bg-[#121212] rounded-[36px] overflow-hidden flex flex-col relative pt-8 px-4 text-white">
                  {/* Status Bar */}
                  <div className="flex justify-between px-2 text-[10px] text-neutral-400 font-semibold mb-4">
                    <span>9:41</span>
                    <div className="flex gap-1.5 items-center">
                      <span>5G</span>
                      <div className="w-4 h-2 bg-neutral-400 rounded-sm" />
                    </div>
                  </div>

                  {/* Mock App Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-[family-name:var(--font-playfair)] italic text-pink-400">Merakí</span>
                    <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-pink-400">
                      M
                    </div>
                  </div>

                  {/* Mock Screen Content */}
                  <div className="space-y-4 overflow-y-hidden flex-1 pb-4">
                    {/* Welcome Card */}
                    <div className="bg-neutral-900/80 border border-pink-500/10 rounded-2xl p-3.5 space-y-1">
                      <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Welcome Back</p>
                      <h4 className="text-xs font-black">Find your next glow up</h4>
                    </div>

                    {/* Quick booking card */}
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-neutral-400">Next Appointment</span>
                        <span className="text-[9px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full font-bold">Confirmed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs">💇‍♀️</div>
                        <div>
                          <p className="text-[11px] font-bold">Balayage & Hair Cut</p>
                          <p className="text-[9px] text-neutral-400">Tomorrow at 10:30 AM</p>
                        </div>
                      </div>
                    </div>

                    {/* Loyalty stamp card */}
                    <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-3.5 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 text-6xl">✨</div>
                      <p className="text-[9px] uppercase tracking-widest font-black opacity-85">Loyalty Stamp Card</p>
                      <h4 className="text-xs font-bold mt-1">4 of 8 Stamps Collected</h4>
                      <div className="flex gap-2 mt-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px]">🌸</div>
                        ))}
                        {[5, 6, 7, 8].map((i) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-black/25 border border-white/20" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation bar mockup */}
                  <div className="mt-auto border-t border-neutral-800/80 pt-2.5 pb-4 flex justify-around text-neutral-400">
                    <div className="flex flex-col items-center gap-0.5 text-pink-400">
                      <Smartphone size={15} />
                      <span className="text-[8px] font-bold">Home</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-4 h-4 rounded-full bg-neutral-800" />
                      <span className="text-[8px]">Book</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-4 h-4 rounded-full bg-neutral-800" />
                      <span className="text-[8px]">Rewards</span>
                    </div>
                  </div>
                </div>

                {/* Home Indicator bar */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-neutral-800 rounded-full z-20" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
