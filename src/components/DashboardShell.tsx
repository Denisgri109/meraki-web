'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SectionProvider, type Section } from '@/contexts/SectionContext';
import { ToastProvider } from '@/components/Toast';
import { Footer } from '@/components/Footer';
import { MainNavbar } from '@/components/MainNavbar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import LocationGateModal from '@/components/LocationGateModal';
import { ModalProvider } from '@/contexts/ModalContext';

interface DashboardShellProps {
  section: Section;
  children: ReactNode;
}

export function DashboardShell({ section, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, session, profile } = useAuth();
  const { isLocationMissing, onLocationSaved } = useAutoLocation();

  const sectionPath = `/${section}`;
  const isCheckoutPage = pathname?.startsWith(`${sectionPath}/checkout`);

  useEffect(() => {
    if (!loading && !session && !isCheckoutPage) {
      router.replace('/login');
    }
  }, [loading, router, session, isCheckoutPage]);

  useEffect(() => {
    if (loading || !session || !profile) return;
    const isMaster = profile.role === 'master';
    const onboardingDone = profile.onboarding_completed === true;
    const onOnboarding = pathname?.startsWith(`${sectionPath}/onboarding`);

    if (isMaster && !onboardingDone && !onOnboarding) {
      router.replace(`${sectionPath}/onboarding`);
    } else if ((!isMaster || onboardingDone) && onOnboarding) {
      router.replace(`${sectionPath}/dashboard`);
    }
  }, [loading, session, profile, pathname, router, sectionPath]);

  if (loading && !session && !isCheckoutPage) {
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
    <SectionProvider section={section}>
      <ModalProvider>
        <div className="min-h-screen flex flex-col gradient-mesh relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="blob-pink -top-20 -right-20 opacity-40" />
            <div className="blob-purple -bottom-32 -left-20 opacity-30" />
            <div className="blob-mint top-1/3 -right-32 opacity-25" />
            <div className="blob-coral -bottom-10 right-1/4 opacity-20" />
          </div>
          <NotificationsProvider>
            <MainNavbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ToastProvider>{children}</ToastProvider>
            </main>
            <Footer />
          </NotificationsProvider>

          {isLocationMissing && <LocationGateModal onSaved={onLocationSaved} />}
        </div>
      </ModalProvider>
    </SectionProvider>
  );
}
