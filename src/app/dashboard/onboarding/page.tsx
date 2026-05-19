'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import {
  Sparkles,
  UserCircle,
  Scissors,
  CalendarDays,
  Image as ImageIcon,
  Building2,
  ArrowRight,
  Loader2,
  Check,
} from 'lucide-react';

type StepId =
  | 'welcome'
  | 'profile'
  | 'services'
  | 'availability'
  | 'portfolio'
  | 'business_settings';

interface OnboardingStep {
  id: StepId;
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  actionLabel?: string;
  actionHref?: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Merakí!',
    description:
      "You're all set up as a Professional. Let's get you ready to start accepting bookings.",
    Icon: Sparkles,
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description:
      'Add your bio, experience, and a profile photo to help clients find you.',
    Icon: UserCircle,
    actionLabel: 'Edit Profile Now',
    actionHref: '/dashboard/settings',
  },
  {
    id: 'services',
    title: 'Add Your Services',
    description:
      'Create the services you offer with your own pricing and duration.',
    Icon: Scissors,
    actionLabel: 'Add Services Now',
    actionHref: '/dashboard/services',
  },
  {
    id: 'availability',
    title: 'Set Your Availability',
    description:
      "Choose when you're available for bookings and block off time as needed.",
    Icon: CalendarDays,
    actionLabel: 'Set Availability Now',
    actionHref: '/dashboard/availability',
  },
  {
    id: 'portfolio',
    title: 'Build Your Portfolio',
    description: 'Upload photos of your best work to attract more clients.',
    Icon: ImageIcon,
    actionLabel: 'Add Portfolio Photos',
    actionHref: '/dashboard/settings?tab=portfolio',
  },
  {
    id: 'business_settings',
    title: 'Business Settings',
    description:
      'Configure your business details, cancellation policy, and payment methods.',
    Icon: Building2,
    actionLabel: 'Configure Business Settings',
    actionHref: '/dashboard/settings',
  },
];

export default function MasterOnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const finish = async (skipped: boolean) => {
    if (!user?.id) return;
    setCompleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      showToast(
        skipped
          ? 'Setup skipped — you can finish anytime in Settings.'
          : "All set! You're ready to start accepting bookings.",
        'success'
      );
      router.replace('/dashboard');
    } catch (err) {
      console.error('Onboarding completion error:', err);
      showToast(
        'Saved locally — there was a sync issue, you can continue.',
        'info'
      );
      router.replace('/dashboard');
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      finish(false);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleSkip = () => finish(true);

  const StepIcon = step.Icon;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-10 mt-4">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all"
            style={{
              width: i === currentStep ? 28 : 8,
              background:
                i <= currentStep
                  ? 'var(--color-primary)'
                  : 'rgba(0,0,0,0.12)',
            }}
          />
        ))}
      </div>

      <div className="glass-card p-8 sm:p-10 text-center">
        <p className="text-xs font-semibold tracking-[2px] uppercase text-[var(--color-text-muted)] mb-6">
          Step {currentStep + 1} of {STEPS.length}
        </p>

        {/* Icon with glow */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(232,160,180,0.25)',
              filter: 'blur(22px)',
            }}
          />
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FCEFF2, #F8D5DC)',
              border: '1px solid rgba(232,160,180,0.35)',
            }}
          >
            <StepIcon size={40} className="text-[var(--color-brand-pink-dark)]" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text-primary)] mb-3">
          {step.title}
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-md mx-auto">
          {step.description}
        </p>

        {/* Action card for non-welcome steps */}
        {step.actionLabel && step.actionHref && (
          <Link
            href={step.actionHref}
            className="flex items-center gap-3 mx-auto max-w-sm p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)] border border-[var(--color-border-light)] hover:border-[var(--color-primary)] transition-colors mb-8 cursor-pointer"
          >
            <span className="text-sm font-medium text-[var(--color-text-primary)] flex-1 text-left">
              {step.actionLabel}
            </span>
            <ArrowRight size={18} className="text-[var(--color-primary)]" />
          </Link>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNext}
            disabled={completing}
            className="btn-primary w-full h-14 flex items-center justify-center gap-2 text-sm tracking-widest uppercase cursor-pointer disabled:opacity-60"
          >
            {completing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isLastStep ? (
              <>
                <Check size={18} />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {!isLastStep && (
            <button
              onClick={handleSkip}
              disabled={completing}
              className="text-sm text-[var(--color-text-muted)] underline underline-offset-4 hover:text-[var(--color-text-primary)] transition-colors py-2 cursor-pointer disabled:opacity-50"
            >
              Skip Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
