'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SectionProvider } from '@/contexts/SectionContext';
import { ToastProvider } from '@/components/Toast';
import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import LocationGateModal from '@/components/LocationGateModal';
import { ModalProvider } from '@/contexts/ModalContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, session, profile } = useAuth();
  // Detect GPS coords + country once per signed-in profile, used by the
  // radius-based master / service filter on booking, discover, etc.
  const { isLocationMissing, onLocationSaved } = useAutoLocation();

  // The checkout page handles its own auth gate (with a "Continue as Guest"
  // option for QR payments), so it must NOT be redirected to /login here.
  const isCheckoutPage = pathname === '/dashboard/checkout';

  useEffect(() => {
    if (!loading && !session && !isCheckoutPage) {
      router.replace('/login');
    }
  }, [loading, router, session, isCheckoutPage]);

  // Redirect /dashboard → /beauty/dashboard (new route-based scoping)
  useEffect(() => {
    if (pathname === '/dashboard' && session) {
      router.replace('/beauty/dashboard');
    }
  }, [pathname, router, session]);

  // Gate masters who haven't completed onboarding — mirrors mobile MasterOnboardingScreen
  useEffect(() => {
    if (loading || !session || !profile) return;
    const isMaster = profile.role === 'master';
    const onboardingDone = profile.onboarding_completed === true;
    const onOnboarding = pathname?.startsWith('/dashboard/onboarding');

    if (isMaster && !onboardingDone && !onOnboarding) {
      router.replace('/dashboard/onboarding');
    } else if ((!isMaster || onboardingDone) && onOnboarding) {
      router.replace('/dashboard');
    }
  }, [loading, session, profile, pathname, router]);

  // Show the full-screen splash during initial load OR while the profile
  // is being fetched for a just-restored session.  The second guard
  // (session && !profile) closes a race condition: Supabase fires
  // INITIAL_SESSION synchronously, which sets `session` in React state
  // before `loadInitialSession()` has verified the token or fetched the
  // profile.  Without this guard, dashboard children render with a
  // potentially-stale session and a null profile, which can throw and
  // trigger the ErrorBoundary (white screen).
  // For checkout, always render children so guests can proceed.
  const showSplash =
    (!isCheckoutPage && loading && !session) ||
    (!isCheckoutPage && session && !profile);

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)] mb-2">Merakí</h1>
          <div className="w-8 h-8 border-2 border-[var(--color-brand-pink)] border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  if (!session && !isCheckoutPage) {
    return null;
  }

  return (
    <SectionProvider section="beauty">
      <ModalProvider>
        <div className="min-h-screen flex flex-col gradient-mesh relative">
          {/* Decorative background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="blob-pink -top-20 -right-20 opacity-40" />
            <div className="blob-purple -bottom-32 -left-20 opacity-30" />
            <div className="blob-mint top-1/3 -right-32 opacity-25" />
            <div className="blob-coral -bottom-10 right-1/4 opacity-20" />
          </div>
          <NotificationsProvider>
            <MainNavbar />

            {/* ── Page Content ───────────────────────────────────────────── */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ToastProvider>{children}</ToastProvider>
            </main>
            <Footer />
          </NotificationsProvider>

          {/* Location gate — blocks dashboard until country/city is set */}
          {isLocationMissing && <LocationGateModal onSaved={onLocationSaved} />}
        </div>
      </ModalProvider>
    </SectionProvider>
  );
}
