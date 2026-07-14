'use client';

import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSection } from '@/contexts/SectionContext';
import { useModal } from '@/contexts/ModalContext';
import { Search, Star, Clock, ArrowRight, ArrowLeft, Calendar, CheckCircle2, Sparkles, User, Scissors, SlidersHorizontal, Loader2, ChevronLeft, ChevronRight, AlertCircle, CreditCard, Plus, MapPin, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Tables } from '@/types/database';
import type { SavedCard } from '@/components/PaymentMethodsManager';
import { CardBrandBadge } from '@/components/PaymentMethodsManager';
import { isMasterWithinRange } from '@/lib/location';
import { usePilatesWaiver } from '@/hooks/usePilatesWaiver';
import PilatesWaiverFormSheet from '@/components/PilatesWaiverFormSheet';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

type BookingError = Error & {
  context?: {
    json?: () => Promise<{ error?: string }>;
  };
};

type BookingUser = {
  id: string;
};

/** Short human label for a pass expiry, e.g. "expires in 12 days". */
function formatExpiryShort(expiresAt: string): string {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'expired';
  if (days === 1) return 'expires tomorrow';
  return `expires in ${days} days`;
}

type BookingDraft = {
  step: number;
  selectedServiceId: string | null;
  selectedMasterId: string | null;
  selectedPilatesSessionId: string | null;
  selectedDate: string;
  selectedTime: string;
  calendarMonth: string;
  selectedCategory: string;
  searchQuery: string;
  isMasterPreselected: boolean;
};

interface CheckoutFormProps {
  user: BookingUser | null;
  profile: { email?: string | null; stripe_customer_id?: string | null } | null;
  selectedService: Service | null;
  selectedMaster: Master | null;
  selectedPilatesSession: PilatesSession | null;
  selectedDate: string;
  selectedTime: string;
  onBookSuccess: () => void;
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
}

function CheckoutForm({ user, profile, selectedService, selectedMaster, selectedPilatesSession, selectedDate, selectedTime, onBookSuccess, submitting, setSubmitting }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const supabase = createClient();
  const { showAlert } = useModal();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedPm, setSelectedPm] = useState<string>('new');

  // ── Class pass / credit redemption (Pilates only) ──────────────────────
  // When booking a Pilates session, clients with an active class pass can
  // pay with 1 credit instead of a card. The redeem_class_credit RPC does
  // the atomic decrement + booking server-side.
  const isPilatesService = selectedService?.category === 'Pilates';
  type PassSummary = {
    user_pass_id: string;
    name: string;
    remaining_credits: number;
    expires_at: string | null;
  };
  const [activePasses, setActivePasses] = useState<PassSummary[]>([]);
  const [useCredit, setUseCredit] = useState(false);
  const totalCredits = activePasses.reduce((s, p) => s + p.remaining_credits, 0);

  useEffect(() => {
    if (!user || !isPilatesService) {
      setActivePasses([]);
      setUseCredit(false);
      return;
    }
    let cancelled = false;
    const loadPasses = async () => {
      try {
        const { data, error } = await supabase.rpc('get_active_pass_summary', {});
        if (cancelled || error) return;
        const summaries = (data ?? []) as PassSummary[];
        setActivePasses(summaries);
        // Auto-select credit if the user has credits (most convenient default).
        setUseCredit(summaries.reduce((s, p) => s + p.remaining_credits, 0) > 0);
      } catch { /* ignore — paid path still works */ }
    };
    loadPasses();
    return () => { cancelled = true; };
  }, [user, isPilatesService, supabase]);

  useEffect(() => {
    // If the user toggles between credit and card, keep selectedPm valid.
    if (useCredit) return;
  }, [useCredit]);

  const usingSavedCard = selectedPm !== 'new';

  const processStripePayment = async (bookingMasterId: string, bookingHostName: string) => {
    let paymentMethodId: string;
    let setupIntentId: string | null = null;
    let customerId: string | undefined = profile?.stripe_customer_id || undefined;

    if (usingSavedCard) {
      paymentMethodId = selectedPm;
    } else {
      const cardElement = elements!.getElement(CardElement);
      if (!cardElement) throw new Error('Enter your card details');

      const { data: setupIntentData, error: setupError } = await supabase.functions.invoke('setup-intent', {
        body: { user_email: profile?.email, customer_id: customerId },
      });
      if (setupError) throw setupError;

      const { setupIntent, error: confirmSetupError } = await stripe!.confirmCardSetup(
        setupIntentData.clientSecret,
        { payment_method: { card: cardElement } }
      );
      if (confirmSetupError) throw confirmSetupError;

      paymentMethodId = setupIntent!.payment_method as string;
      setupIntentId = setupIntentData.setupIntentId;
      customerId = setupIntentData.customerId;
    }

    const amountToPay = Math.round(selectedService!.base_price * 100);

    const { data: paymentIntentData, error: piError } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: amountToPay,
        currency: 'eur',
        customer_id: customerId,
        payment_method_id: paymentMethodId,
        master_id: bookingMasterId,
        description: `Booking with ${bookingHostName}`,
        capture_method: 'automatic',
      }
    });
    if (piError) throw piError;

    const { error: confirmPaymentError } = await stripe!.confirmCardPayment(
      paymentIntentData.clientSecret,
      usingSavedCard ? { payment_method: paymentMethodId } : undefined
    );
    if (confirmPaymentError) throw confirmPaymentError;

    return { setupIntentId, paymentIntentData };
  };

  const handleBook = async () => {
    if (!user || !selectedService || !selectedDate || !selectedTime) return;
    const isPilates = selectedService.category === 'Pilates';
    if (isPilates && !selectedPilatesSession) return;
    if (!isPilates && !selectedMaster) return;
    const appointmentStartDate = isPilates ? null : getAppointmentDateTime(selectedDate, selectedTime);
    if (!isPilates && !appointmentStartDate) {
      await showAlert('Please choose a valid future date and time before booking.', 'Booking Verification');
      return;
    }
    const bookingMasterId = selectedPilatesSession?.host?.profile_id || selectedPilatesSession?.owner_id || selectedMaster?.id;
    const bookingHostName = selectedPilatesSession?.host?.display_name || selectedMaster?.full_name || 'Pilates host';
    if (!bookingMasterId) return;
    if (bookingMasterId === user.id) {
      await showAlert('You cannot book an appointment with yourself.', 'Booking Verification');
      return;
    }

    // Card path needs Stripe + Elements.
    if (!useCredit) {
      if (!stripe || (!usingSavedCard && !elements)) return;
    }

    setSubmitting(true);
    try {
      // ── Credit path: skip Stripe entirely, redeem 1 credit atomically.
      if (useCredit && isPilates && selectedPilatesSession && activePasses[0]) {
        const { error: redeemError } = await supabase.rpc('redeem_class_credit', {
          p_session_id: selectedPilatesSession.id,
          p_user_pass_id: activePasses[0].user_pass_id,
        });
        if (redeemError) throw redeemError;
        onBookSuccess();
        return;
      }

      // ── Paid path: charge via Stripe, then create the booking.
      const { setupIntentId, paymentIntentData } = await processStripePayment(bookingMasterId, bookingHostName);

      const { error: bookError } = isPilates && selectedPilatesSession
        ? await supabase.rpc('book_pilates_session', {
          p_session_id: selectedPilatesSession.id,
          p_stripe_setup_intent_id: setupIntentId ?? undefined,
          p_stripe_payment_intent_id: paymentIntentData.paymentIntentId,
          p_deposit_amount: selectedService.base_price,
          p_deposit_payment_intent_id: paymentIntentData.paymentIntentId,
        })
        : await supabase.rpc(
          'book_appointment_with_confirmation',
          {
              p_master_id: bookingMasterId,
              p_service_id: selectedService.id,
              p_start_time: appointmentStartDate!.toISOString(),
              p_stripe_setup_intent_id: setupIntentId ?? undefined,
              p_stripe_payment_intent_id: paymentIntentData.paymentIntentId,
              p_deposit_amount: selectedService.base_price,
              p_deposit_payment_intent_id: paymentIntentData.paymentIntentId,
          }
        );
      if (bookError) throw bookError;

      onBookSuccess();
    } catch (err: unknown) {
      console.error('Booking failed:', err);
      const bookingError = err as BookingError;
      let msg = bookingError.message || 'Failed to create booking. Please try again.';
      if (bookingError.context && typeof bookingError.context.json === 'function') {
        try { const errData = await bookingError.context.json(); if (errData && errData.error) msg = errData.error; } catch {}
      }
      await showAlert(msg, 'Booking Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* ── Class credit option (Pilates only) ─────────────────────────── */}
      {isPilatesService && (
        <div className="p-4 bg-white/60 border border-white rounded-xl mb-4 shadow-sm">
          <h4 className="font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Ticket size={18} /> Class Pass
          </h4>
          {totalCredits > 0 ? (
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                useCredit
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/20'
                  : 'border-[var(--color-border-light)] hover:border-emerald-400/40'
              }`}
            >
              <input
                type="checkbox"
                checked={useCredit}
                onChange={(e) => setUseCredit(e.target.checked)}
                className="accent-emerald-600"
              />
              <div className="flex-1">
                <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                  Book with 1 class credit
                </span>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {totalCredits} credit{totalCredits === 1 ? '' : 's'} available
                  {activePasses[0]?.expires_at ? ` · ${formatExpiryShort(activePasses[0].expires_at)}` : ''}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Free
              </span>
            </label>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-[var(--color-border-light)] bg-[var(--color-surface-light)]/40">
              <p className="text-sm text-[var(--color-text-secondary)]">No class credits available.</p>
              <a
                href="/dashboard/passes"
                className="text-xs font-bold text-[var(--color-brand-pink-dark)] hover:underline"
              >
                Buy a class pass →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Payment details (hidden when redeeming a credit) ───────────── */}
      {!useCredit && (
      <div className="p-4 bg-white/60 border border-white rounded-xl mb-6 shadow-sm">
         <h4 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <CreditCard size={18} /> Payment Details
         </h4>

         {loadingCards ? (
           <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] py-4">
             <Loader2 size={16} className="animate-spin" /> Loading payment methods...
           </div>
         ) : savedCards.length > 0 ? (
           <div className="space-y-2 mb-4">
             {savedCards.map(card => (
               <label
                 key={card.id}
                 className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                   selectedPm === card.id
                     ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/20'
                     : 'border-[var(--color-border-light)] hover:border-[var(--color-primary)]/30'
                 }`}
               >
                 <input
                   type="radio"
                   name="payment_method"
                   value={card.id}
                   checked={selectedPm === card.id}
                   onChange={() => setSelectedPm(card.id)}
                   className="accent-[var(--color-primary)]"
                 />
                 <CardBrandBadge brand={card.brand} />
                 <span className="font-semibold text-sm text-[var(--color-text-primary)]">•••• {card.last4}</span>
                 <span className="text-xs text-[var(--color-text-muted)]">{String(card.expMonth).padStart(2, '0')}/{card.expYear}</span>
                 {card.isDefault && (
                   <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 ml-auto">Default</span>
                 )}
               </label>
             ))}
             <label
               className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                 selectedPm === 'new'
                   ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/20'
                   : 'border-[var(--color-border-light)] hover:border-[var(--color-primary)]/30'
               }`}
             >
               <input
                 type="radio"
                 name="payment_method"
                 value="new"
                 checked={selectedPm === 'new'}
                 onChange={() => setSelectedPm('new')}
                 className="accent-[var(--color-primary)]"
               />
               <Plus size={16} className="text-[var(--color-text-muted)]" />
               <span className="text-sm font-medium text-[var(--color-text-secondary)]">Use a new card</span>
             </label>
           </div>
         ) : null}

         {(!usingSavedCard || savedCards.length === 0) && (
           <div className="p-4 bg-white rounded-lg border border-pink-100 shadow-inner">
             <CardElement options={{
               style: {
                 base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                 invalid: { color: '#9e2146' },
               },
             }} />
           </div>
         )}

         <p className="text-xs text-[var(--color-text-secondary)] mt-3">
           You will be charged €{selectedService?.base_price ?? 0} today for your booking.
         </p>
      </div>
      )}
      <button
        onClick={handleBook}
        disabled={submitting || (!useCredit && (!stripe || (!usingSavedCard && !elements)))}
        className="w-full btn-primary py-4 text-lg font-bold shadow-xl shadow-pink-500/20 hover:shadow-2xl hover:shadow-pink-500/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Confirming Appointment...' : useCredit ? 'Book with 1 Credit' : 'Confirm & Book Appointment'}
      </button>
    </div>
  );
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  duration_minutes: number;
  category: string | null;
  image_url: string | null;
  created_by: string | null;
}

interface Master {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  specialties: string[] | string | null;
  city: string | null;
  country: string | null;
  state: string | null;
  state_code: string | null;
  latitude: number | null;
  longitude: number | null;
  bio: string | null;
  years_of_experience?: number | null;
}

type PilatesSettings = Tables<'pilates_settings'>;
type PilatesHost = Tables<'pilates_hosts'>;
type PilatesBooking = Pick<Tables<'pilates_session_bookings'>, 'id' | 'status'>;
type PilatesSession = Tables<'pilates_class_sessions'> & {
  host: PilatesHost | null;
  pilates_session_bookings: PilatesBooking[] | null;
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80&auto=format&fit=crop',
];

const SERVICE_CATEGORIES = ['All', 'Nails', 'Lashes', 'Brows', 'Hair', 'Makeup', 'Skincare', 'Pilates', 'Other'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DEFAULT_AVAILABILITY_START = '09:00';
const DEFAULT_AVAILABILITY_END = '19:00';
const BOOKING_DRAFT_STORAGE_PREFIX = 'meraki:booking:draft:';

type MasterAvailability = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type BlockedSlot = {
  start_time: string;
  end_time: string;
};

const normalizeTimeString = (value: string | null | undefined) => {
  if (!value) return '';
  const trimmed = value.slice(0, 5);
  return TIME_PATTERN.test(trimmed) ? trimmed : '';
};

const generateTimeSlotsForRange = (start: string, end: string) => {
  const startNorm = normalizeTimeString(start) || DEFAULT_AVAILABILITY_START;
  const endNorm = normalizeTimeString(end) || DEFAULT_AVAILABILITY_END;
  const [startHour, startMin] = startNorm.split(':').map(Number);
  const [endHour, endMin] = endNorm.split(':').map(Number);
  const slots: string[] = [];
  let hour = startHour;
  let minute = startMin;
  while (hour < endHour || (hour === endHour && minute <= endMin)) {
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    minute += 30;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  return slots;
};

const getStartOfToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateFromKey = (dateKey: string) => {
  if (!DATE_KEY_PATTERN.test(dateKey)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const isSelectableDateKey = (dateKey: string) => {
  const date = getDateFromKey(dateKey);
  return Boolean(date && date >= getStartOfToday());
};

const getAppointmentDateTime = (dateKey: string, time: string) => {
  if (!isSelectableDateKey(dateKey) || !TIME_PATTERN.test(time)) return null;
  const date = getDateFromKey(dateKey);
  if (!date) return null;
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  return date;
};

const buildCalendarWeeks = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDay = new Date(firstDay);
  startDay.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + weekIndex * 7 + dayIndex);
      return date;
    })
  );
};

const formatDateLabel = (dateKey: string) => {
  const date = getDateFromKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
};

const parseBookingDraft = (value: string | null) => {
  if (!value) return null;
  try {
    const draft = JSON.parse(value) as Partial<BookingDraft>;
    return {
      step: typeof draft.step === 'number' && draft.step >= 1 && draft.step <= 4 ? draft.step : 1,
      selectedServiceId: typeof draft.selectedServiceId === 'string' ? draft.selectedServiceId : null,
      selectedMasterId: typeof draft.selectedMasterId === 'string' ? draft.selectedMasterId : null,
      selectedPilatesSessionId: typeof draft.selectedPilatesSessionId === 'string' ? draft.selectedPilatesSessionId : null,
      selectedDate: typeof draft.selectedDate === 'string' && DATE_KEY_PATTERN.test(draft.selectedDate) ? draft.selectedDate : '',
      selectedTime: typeof draft.selectedTime === 'string' && TIME_PATTERN.test(draft.selectedTime) ? draft.selectedTime : '',
      calendarMonth: typeof draft.calendarMonth === 'string' && DATE_KEY_PATTERN.test(draft.calendarMonth) ? draft.calendarMonth : '',
      selectedCategory: typeof draft.selectedCategory === 'string' ? draft.selectedCategory : 'All',
      searchQuery: typeof draft.searchQuery === 'string' ? draft.searchQuery : '',
      isMasterPreselected: draft.isMasterPreselected === true,
    };
  } catch {
    return null;
  }
};

export default function BookingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { buildPath, isPilates } = useSection();
  const draftStorageKey = user?.id ? `${BOOKING_DRAFT_STORAGE_PREFIX}${user.id}` : null;
  const initialBookingDraft = useMemo(() => {
    if (!draftStorageKey || typeof window === 'undefined') return null;
    return parseBookingDraft(sessionStorage.getItem(draftStorageKey));
  }, [draftStorageKey]);

  const [step, setStep] = useState(() => initialBookingDraft?.step ?? 1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => initialBookingDraft?.searchQuery ?? '');
  const [selectedCategory, setSelectedCategory] = useState(() => initialBookingDraft?.selectedCategory ?? 'All');
  const [profileModalMaster, setProfileModalMaster] = useState<Master | null>(null);
  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [showWaiverSheet, setShowWaiverSheet] = useState(false);
  const { checkWaiver: checkPilatesWaiver } = usePilatesWaiver();

  const fetchAndShowProfile = async (profileId: string) => {
    if (!profileId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, specialties, city, country, state, state_code, latitude, longitude, bio, years_of_experience')
        .eq('id', profileId)
        .single();
      if (!error && data) {
        setProfileModalMaster(data as Master);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    if (!profileModalMaster?.id) {
      setPortfolioPhotos([]);
      return;
    }
    const fetchPortfolio = async () => {
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('master_id', profileModalMaster.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          setPortfolioPhotos(data);
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
      }
    };
    fetchPortfolio();
  }, [profileModalMaster?.id, supabase]);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  
  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(() => initialBookingDraft?.selectedServiceId ?? null);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(() => initialBookingDraft?.selectedMasterId ?? null);
  const [selectedPilatesSessionId, setSelectedPilatesSessionId] = useState<string | null>(() => initialBookingDraft?.selectedPilatesSessionId ?? null);
  const [selectedDate, setSelectedDate] = useState<string>(() => initialBookingDraft?.selectedDate ?? '');
  const [selectedTime, setSelectedTime] = useState<string>(() => initialBookingDraft?.selectedTime ?? '');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const restoredCalendarMonth = initialBookingDraft?.calendarMonth ? getDateFromKey(initialBookingDraft.calendarMonth) : null;
    if (restoredCalendarMonth) {
      return new Date(restoredCalendarMonth.getFullYear(), restoredCalendarMonth.getMonth(), 1);
    }
    const today = getStartOfToday();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isMasterPreselected, setIsMasterPreselected] = useState(() => initialBookingDraft?.isMasterPreselected ?? false);
  const [pilatesSettings, setPilatesSettings] = useState<PilatesSettings | null>(null);
  const [pilatesSessions, setPilatesSessions] = useState<PilatesSession[]>([]);
  const [loadingPilatesSessions, setLoadingPilatesSessions] = useState(false);
  const [masterAvailability, setMasterAvailability] = useState<MasterAvailability[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [serviceProfessionalIds, setServiceProfessionalIds] = useState<Record<string, string[]>>({});
  const [bookedSlotKeys, setBookedSlotKeys] = useState<string[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services]
  );
  const selectedMaster = useMemo(
    () => masters.find((master) => master.id === selectedMasterId) ?? null,
    [selectedMasterId, masters]
  );
  const selectedPilatesSession = useMemo(
    () => pilatesSessions.find((session) => session.id === selectedPilatesSessionId) ?? null,
    [pilatesSessions, selectedPilatesSessionId]
  );

  useEffect(() => {
    if (!draftStorageKey) return;

    if (step === 5) {
      sessionStorage.removeItem(draftStorageKey);
      return;
    }

    const draft: BookingDraft = {
      step,
      selectedServiceId,
      selectedMasterId,
      selectedPilatesSessionId,
      selectedDate,
      selectedTime,
      calendarMonth: toDateKey(calendarMonth),
      selectedCategory,
      searchQuery,
      isMasterPreselected,
    };

    sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [calendarMonth, draftStorageKey, isMasterPreselected, searchQuery, selectedCategory, selectedDate, selectedMasterId, selectedPilatesSessionId, selectedServiceId, selectedTime, step]);

  // User location used for the country + state match AND haversine fallback.
  const userCountry = ((profile as Record<string, unknown> | null)?.country as string | null | undefined) ?? null;
  const userState = ((profile as Record<string, unknown> | null)?.state as string | null | undefined) ?? null;
  const userStateCode = ((profile as Record<string, unknown> | null)?.state_code as string | null | undefined) ?? null;
  const userLat = ((profile as Record<string, unknown> | null)?.latitude as number | null | undefined) ?? null;
  const userLng = ((profile as Record<string, unknown> | null)?.longitude as number | null | undefined) ?? null;
  const searchRadiusKm = ((profile as Record<string, unknown> | null)?.search_radius_km as number | null | undefined) ?? 100;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch services with their linked professionals' location data
        const serviceQuery = supabase
          .from('services')
          .select(
            '*, master_services!inner(is_available, master_id, master:profiles!master_services_master_id_fkey(country, state, state_code, latitude, longitude))'
          )
          .eq('is_active', true)
          .eq('master_services.is_available', true);

        if (isPilates) {
          serviceQuery.ilike('category', '%pilates%');
        } else {
          serviceQuery.not('category', 'ilike', '%pilates%');
        }

        const servicesRes = await serviceQuery.limit(60);

        const userLoc = {
          country: userCountry,
          state: userState,
          state_code: userStateCode,
          latitude: userLat,
          longitude: userLng,
        };

        // ── Services: keep only those offered by at least one in-range master
        // that is not the current user. Mirrors mobile BookingScreen.fetchServices.
        type ServiceRow = Service & {
          master_services?: Array<{
            is_available: boolean | null;
            master_id: string;
            master: {
              country: string | null;
              state: string | null;
              state_code: string | null;
              latitude: number | null;
              longitude: number | null;
            } | null;
          }>;
        };
        const rawServices = ((servicesRes.data as unknown as ServiceRow[]) || []);
        // Build service → professional-IDs mapping so Step 2 only shows
        // professionals who actually offer the selected service.
        const profMap: Record<string, string[]> = {};
        const allProfIds = new Set<string>();

        rawServices.forEach(service => {
          const links = service.master_services || [];
          if (!userCountry) {
            profMap[service.id] = [];
            return;
          }
          const validIds = links
            .filter(link => {
              if (!user?.id) return false;
              if (link.master_id === user.id) return false;
              if (!link.master) return false;
              return isMasterWithinRange(userLoc, link.master, searchRadiusKm);
            })
            .map(link => link.master_id);
          profMap[service.id] = validIds;
          validIds.forEach(id => allProfIds.add(id));
        });

        setServiceProfessionalIds(profMap);

        const filteredServices: Service[] = rawServices
          .filter(service => (profMap[service.id] || []).length > 0)
          .map(({ master_services: _ms, ...rest }) => rest as Service);
        setServices(filteredServices);

        // ── Professionals: fetch profiles for every professional linked to
        // at least one visible service (includes owners who offer services).
        const profIdArray = Array.from(allProfIds);
        let rawMasters: Master[] = [];
        if (profIdArray.length > 0) {
          const mastersRes = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, specialties, city, country, state, state_code, latitude, longitude, bio, years_of_experience')
            .in('id', profIdArray);
          rawMasters = ((mastersRes.data as unknown as Master[]) || []);
        }
        setMasters(rawMasters);

        // Check for masterId parameter in the URL
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const masterIdUrl = params.get('masterId');
          if (masterIdUrl && masterIdUrl !== user?.id) {
            const preSelected = rawMasters.find(m => m.id === masterIdUrl);
            if (preSelected) {
              setSelectedMasterId(preSelected.id);
              setIsMasterPreselected(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase, user?.id, userCountry, userState, userStateCode, isPilates]);

  useEffect(() => {
    const fetchPilatesSettings = async () => {
      if (selectedService?.category !== 'Pilates') {
        setPilatesSettings(null);
        return;
      }

      const { data } = await supabase
        .from('pilates_settings')
        .select('*')
        .eq('service_id', selectedService.id)
        .maybeSingle();

      setPilatesSettings(data || null);
    };

    fetchPilatesSettings();
  }, [selectedService?.id, selectedService?.category, supabase]);

  useEffect(() => {
    const fetchPilatesSessions = async () => {
      if (selectedService?.category !== 'Pilates') {
        setPilatesSessions([]);
        setSelectedPilatesSessionId(null);
        return;
      }

      setLoadingPilatesSessions(true);
      try {
        const startDate = new Date().toISOString().slice(0, 10);
        const endDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        await supabase.rpc('ensure_pilates_sessions', {
          p_service_id: selectedService.id,
          p_start_date: startDate,
          p_end_date: endDate,
        });
        const { data, error } = await supabase
          .from('pilates_class_sessions')
          .select('*, host:pilates_hosts(*), pilates_session_bookings(id, status)')
          .eq('service_id', selectedService.id)
          .gte('starts_at', new Date().toISOString())
          .lt('starts_at', new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString())
          .eq('status', 'scheduled')
          .order('starts_at');
        if (error) throw error;
        setPilatesSessions(((data as unknown as PilatesSession[]) || []).filter((session) => {
          const hostId = session.host?.profile_id || session.owner_id;
          return hostId !== user?.id;
        }));
      } catch (err) {
        console.error('Error loading Pilates sessions:', err);
      } finally {
        setLoadingPilatesSessions(false);
      }
    };

    fetchPilatesSessions();
  }, [selectedService?.id, selectedService?.category, supabase, user?.id]);

  const isPilatesService = selectedService?.category === 'Pilates';
  const today = getStartOfToday();
  const minimumCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const calendarWeeks = buildCalendarWeeks(calendarMonth);
  const canViewPreviousMonth = calendarMonth.getTime() > minimumCalendarMonth.getTime();
  const selectedDateLabel = selectedDate ? formatDateLabel(selectedDate) : 'Choose a day';
  const selectedHostId = selectedPilatesSession?.host?.profile_id || selectedPilatesSession?.owner_id || selectedMaster?.id;
  const isSelfBooking = Boolean(user?.id && selectedHostId === user.id);

  useEffect(() => {
    if (!selectedMasterId || isPilatesService) {
      setMasterAvailability([]);
      setBlockedSlots([]);
      return;
    }
    let cancelled = false;
    const fetchMasterSchedule = async () => {
      try {
        const [availabilityRes, blockedRes] = await Promise.all([
          supabase
            .from('master_availability')
            .select('day_of_week, start_time, end_time, is_available')
            .eq('master_id', selectedMasterId),
          supabase
            .from('blocked_slots')
            .select('start_time, end_time')
            .eq('master_id', selectedMasterId),
        ]);
        if (cancelled) return;
        setMasterAvailability((availabilityRes.data as MasterAvailability[]) || []);
        setBlockedSlots((blockedRes.data as BlockedSlot[]) || []);
      } catch (err) {
        if (!cancelled) console.error('Error loading master schedule:', err);
      }
    };
    fetchMasterSchedule();
    return () => {
      cancelled = true;
    };
  }, [selectedMasterId, isPilatesService, supabase]);

  useEffect(() => {
    if (!selectedMasterId || isPilatesService || !selectedDate || !DATE_KEY_PATTERN.test(selectedDate)) {
      setBookedSlotKeys([]);
      return;
    }
    let cancelled = false;
    const fetchBooked = async () => {
      setIsFetchingSlots(true);
      try {
        const { data } = await supabase
          .from('appointments')
          .select('start_time')
          .eq('master_id', selectedMasterId)
          .gte('start_time', `${selectedDate}T00:00:00`)
          .lt('start_time', `${selectedDate}T23:59:59`)
          .in('status', ['pending', 'confirmed']);
        if (cancelled) return;
        const keys = ((data as { start_time: string }[]) || []).map((apt) => {
          const d = new Date(apt.start_time);
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        });
        setBookedSlotKeys(keys);
      } catch (err) {
        if (!cancelled) console.error('Error fetching booked slots:', err);
      } finally {
        if (!cancelled) setIsFetchingSlots(false);
      }
    };
    fetchBooked();
    return () => {
      cancelled = true;
    };
  }, [selectedMasterId, isPilatesService, selectedDate, supabase]);

  const selectedDayAvailability = useMemo(() => {
    if (!selectedDate) return null;
    const date = getDateFromKey(selectedDate);
    if (!date) return null;
    const dayOfWeek = date.getDay();
    return (
      masterAvailability.find((a) => a.day_of_week === dayOfWeek && a.is_available) || null
    );
  }, [selectedDate, masterAvailability]);

  const timeSlots = useMemo(() => {
    if (isPilatesService) return [];
    if (!selectedDayAvailability) return [];
    return generateTimeSlotsForRange(
      selectedDayAvailability.start_time,
      selectedDayAvailability.end_time
    );
  }, [isPilatesService, selectedDayAvailability]);

  const isTimeSlotDisabled = (time: string) => {
    if (!selectedDate || isFetchingSlots) return true;
    const appointmentDate = getAppointmentDateTime(selectedDate, time);
    if (!appointmentDate) return true;
    if (bookedSlotKeys.includes(time)) return true;
    for (const blocked of blockedSlots) {
      const blockStart = new Date(blocked.start_time);
      const blockEnd = new Date(blocked.end_time);
      if (appointmentDate >= blockStart && appointmentDate < blockEnd) return true;
    }
    return false;
  };

  useEffect(() => {
    if (!selectedTime) return;
    if (isPilatesService) return;
    if (timeSlots.length > 0 && !timeSlots.includes(selectedTime)) {
      setSelectedTime('');
      return;
    }
    if (bookedSlotKeys.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [bookedSlotKeys, isPilatesService, selectedTime, timeSlots]);

  const dateTimeValidationMessage = isSelfBooking
    ? 'You cannot book an appointment with yourself.'
    : isPilatesService
    ? (!selectedPilatesSession ? 'Choose one available Pilates class.' : '')
    : !selectedDate
      ? 'Pick a day to see available times.'
      : !selectedDayAvailability
        ? 'This professional is not available on this day. Choose another date.'
        : !selectedTime
          ? 'Choose an available time for this date.'
          : isTimeSlotDisabled(selectedTime)
            ? 'This date and time is no longer available. Pick another slot.'
            : '';
  const canContinueToConfirmation = isPilatesService ? Boolean(selectedPilatesSession) && !dateTimeValidationMessage : !dateTimeValidationMessage;

  const changeCalendarMonth = (monthOffset: number) => {
    setCalendarMonth((currentMonth) => {
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
      return nextMonth < minimumCalendarMonth ? minimumCalendarMonth : nextMonth;
    });
  };

  const selectDateFromCalendar = (dateKey: string) => {
    if (!isSelectableDateKey(dateKey)) return;
    setSelectedDate(dateKey);
    setSelectedTime('');
  };

  const handleContinueToConfirmation = async () => {
    if (!canContinueToConfirmation) return;

    if (isPilatesService) {
      const hasWaiver = await checkPilatesWaiver();
      if (!hasWaiver) {
        setShowWaiverSheet(true);
        return;
      }
    }

    setStep(4);
  };

  const handleWaiverSigned = () => {
    setShowWaiverSheet(false);
    setStep(4);
  };

  const normalizedSearchQuery = searchQuery.toLowerCase();
  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(normalizedSearchQuery);
    return matchesCategory && matchesSearch;
  });
  const visibleCategories = SERVICE_CATEGORIES.filter((category) => {
    return category === 'All' || services.some((service) => service.category === category);
  });
  const getBookedCount = (session: PilatesSession) => session.pilates_session_bookings?.filter((booking) => booking.status === 'booked').length || 0;
  const getSpotsLeft = (session: PilatesSession) => Math.max(0, session.capacity - getBookedCount(session));
  const selectPilatesSession = (session: PilatesSession) => {
    const startsAt = new Date(session.starts_at);
    setSelectedPilatesSessionId(session.id);
    setSelectedDate(toDateKey(startsAt));
    setSelectedTime(startsAt.toTimeString().slice(0, 5));
  };
  const groupedPilatesSessions = pilatesSessions.reduce<Record<string, PilatesSession[]>>((acc, session) => {
    const key = new Date(session.starts_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    acc[key] = [...(acc[key] || []), session];
    return acc;
  }, {});

  // Only show professionals who actually offer the selected service in Step 2
  const relevantMasters = useMemo(() => {
    if (!selectedServiceId) return masters;
    const ids = serviceProfessionalIds[selectedServiceId] || [];
    return masters.filter(m => ids.includes(m.id));
  }, [masters, selectedServiceId, serviceProfessionalIds]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20 relative">
      
      {/* Decorative background blobs for extra vibrancy */}
      <div className="blob-pink fixed top-10 right-0 opacity-50 -z-10" />
      <div className="blob-purple fixed bottom-0 left-0 opacity-50 -z-10" />
      <div className="blob-mint fixed top-1/3 left-0 opacity-30 -z-10" />
      
      {/* Colorful Step Progress Indicator */}
      <div className="flex items-center justify-center gap-0 mb-8 px-4">
        {['Service', 'Professional', 'Date & Time', 'Confirm'].map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = step > stepNum;
          const isActive = step === stepNum;
          return (
            <div key={label} className="flex items-center" style={{ flex: idx < 3 ? 1 : undefined }}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`step-dot ${isCompleted ? 'step-dot-completed' : isActive ? 'step-dot-active' : 'step-dot-inactive'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-[var(--color-brand-pink-dark)]' : isCompleted ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'}`}>
                  {label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`step-line mx-2 ${isCompleted ? 'step-line-active' : 'step-line-inactive'}`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Hero Banner (Only show on step 1) */}
      {step === 1 && (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '220px' }}>
          <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&auto=format&fit=crop" alt="Book a beauty service" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} style={{ color: '#F9A8D4' }} />
              <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#F9A8D4', fontWeight: 700 }}>Book Now</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Find Your Perfect Service</h1>
          </div>
        </div>
      )}



      {/* STEP 1: Select Service */}
      {step === 1 && (
        <div className="animate-fade-in relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Select a Service</h2>
            {isMasterPreselected && selectedMaster && (
              <div className="text-sm font-semibold text-violet-600 bg-violet-100 px-3 py-1.5 rounded-full">
                Booking with {selectedMaster.full_name}
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
              <input 
                type="text" 
                placeholder="Search services..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="input-glass shadow-md shadow-pink-100/30" 
                style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }} 
              />
            </div>
            <button style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-light)', border: 'none', cursor: 'pointer', flexShrink: 0 }} className="shadow-md hover:shadow-lg transition-shadow">
              <SlidersHorizontal size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
            {visibleCategories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-md'
                      : 'bg-white/60 text-[var(--color-text-secondary)] border border-white hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="glass-card h-64 shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.length === 0 ? (
                <div className="col-span-full glass-card p-12 text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/50 rounded-bl-full mix-blend-multiply" />
                   <div className="text-[var(--color-text-muted)] text-lg">No services found matching &quot;{searchQuery}&quot;</div>
                </div>
              ) : filteredServices.map((service, idx) => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setSelectedPilatesSessionId(null);
                    setSelectedDate('');
                    setSelectedTime('');
                    if (service.category === 'Pilates') {
                      setSelectedMasterId(null);
                      setStep(3);
                    } else if (isMasterPreselected) {
                      setStep(3);
                    } else {
                      // Auto-select when only one professional offers this service
                      const linkedProfIds = serviceProfessionalIds[service.id] || [];
                      if (linkedProfIds.length === 1) {
                        setSelectedMasterId(linkedProfIds[0]);
                        setStep(3);
                      } else {
                        setStep(2);
                      }
                    }
                  }}
                  className="glass-card overflow-hidden hover:shadow-xl hover:-translate-y-2 hover:border-pink-500/30 transition-all duration-300 cursor-pointer group"
                >
                  <div className="h-40 relative overflow-hidden">
                    <img
                      src={service.image_url || fallbackImages[idx % fallbackImages.length]}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={18} className="text-pink-500" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[var(--color-text-primary)] group-hover:text-pink-600 transition-colors">{service.name}</h3>
                    
                    {(() => {
                      const linkedIds = serviceProfessionalIds[service.id] || [];
                      const providers = linkedIds
                        .map(id => masters.find(m => m.id === id))
                        .filter((m): m is Master => !!m);
                      if (providers.length === 0) return null;

                      const getDisplayName = (m: Master) => {
                        const name = m.full_name?.trim();
                        if (name && name.toLowerCase() !== 'owner' && name.toLowerCase() !== 'master') {
                          return name;
                        }
                        if (m.email) {
                          return m.email.split('@')[0];
                        }
                        return name || 'Professional';
                      };

                      const primaryName = getDisplayName(providers[0]);
                      return (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 flex items-center gap-1">
                          <User size={12} className="text-pink-500 shrink-0" />
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileModalMaster(providers[0]);
                            }}
                            className="truncate hover:text-pink-600 hover:underline cursor-pointer font-medium animate-fade-in"
                            title="View specialist profile"
                          >
                            {providers.length === 1 
                              ? `By ${primaryName}` 
                              : `By ${primaryName} & ${providers.length - 1} other${providers.length > 2 ? 's' : ''}`}
                          </span>
                        </p>
                      );
                    })()}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] bg-[var(--color-surface-light)] px-2 py-1 rounded-md">
                        <Clock size={14} /> <span>{service.duration_minutes} min</span>
                      </div>
                      <span className="text-lg font-bold text-gradient-pink">€{service.base_price?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Select Master */}
      {step === 2 && (
        <div className="animate-fade-in">
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Services
          </button>
          
          <div className="bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100 rounded-2xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center shadow-md">
                <Scissors size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-pink-600 uppercase tracking-widest">Selected Service</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{selectedService?.name}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-violet-700">€{selectedService?.base_price?.toFixed(2)} • {selectedService?.duration_minutes} min</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Choose a Professional</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relevantMasters.map((master) => (
              <div
                key={master.id}
                onClick={() => { setSelectedMasterId(master.id); setStep(3); }}
                className="glass-card p-5 hover:shadow-xl hover:border-violet-500/30 transition-all duration-300 cursor-pointer group flex items-center gap-5"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-surface-light)] border-2 border-white shadow-md flex-shrink-0">
                  {master.avatar_url ? (
                    <img src={master.avatar_url} alt={master.full_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[var(--color-text-muted)] bg-gradient-to-br from-gray-100 to-gray-200">
                      {master.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-violet-600 transition-colors">{master.full_name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{master.specialties || 'Beauty Professional'}</p>
                  {(master.state || master.city) && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-semibold text-[10px]">
                      {[master.city, master.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileModalMaster(master);
                  }}
                  className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-100 hover:scale-105 transition-all cursor-pointer mr-1 relative z-20 shrink-0"
                  title="View Profile"
                >
                  <User size={14} />
                </button>
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-light)] flex items-center justify-center group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors shrink-0">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Select Date & Time */}
      {step === 3 && (
        <div className="animate-fade-in">
          <button onClick={() => {
            const skipStep2 = selectedService?.category === 'Pilates' || isMasterPreselected || relevantMasters.length <= 1;
            setStep(skipStep2 ? 1 : 2);
          }} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to {selectedService?.category === 'Pilates' || isMasterPreselected || relevantMasters.length <= 1 ? 'Services' : 'Professionals'}
          </button>

          {/* Selected Service & Professional Banner */}
          <div className="bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center shadow-md shrink-0">
                <Scissors size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-pink-600 uppercase tracking-widest">Selected Service</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{selectedService?.name}</p>
              </div>
            </div>
            
            {!isPilatesService && selectedMaster && (
              <div 
                onClick={() => setProfileModalMaster(selectedMaster)}
                className="flex items-center gap-3 bg-white/60 hover:bg-white border border-pink-100 hover:border-pink-200 rounded-xl p-2.5 cursor-pointer transition-all shadow-sm group shrink-0"
                title="View Specialist Profile"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface-light)] border border-pink-100 shrink-0">
                  {selectedMaster.avatar_url ? (
                    <img src={selectedMaster.avatar_url} alt={selectedMaster.full_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--color-text-muted)] bg-gradient-to-br from-gray-100 to-gray-200">
                      {selectedMaster.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Professional</p>
                  <p className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-pink-600 transition-colors flex items-center gap-1">
                    {selectedMaster.full_name}
                    <User size={10} className="text-pink-500" />
                  </p>
                </div>
              </div>
            )}

            <div className="text-right sm:block hidden shrink-0">
              <p className="text-sm font-bold text-violet-700">€{selectedService?.base_price?.toFixed(2)} • {selectedService?.duration_minutes} min</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">{selectedService?.category === 'Pilates' ? 'Choose a Pilates Class' : 'Select Date & Time'}</h2>

          {selectedService?.category === 'Pilates' ? (
            <div className="glass-card p-6">
              {loadingPilatesSessions ? (
                <div className="flex items-center justify-center gap-2 py-12 text-[var(--color-text-muted)]">
                  <Loader2 size={18} className="animate-spin" /> Loading classes...
                </div>
              ) : pilatesSessions.length === 0 ? (
                <p className="text-center text-[var(--color-text-muted)] py-12">No Pilates classes are available yet.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPilatesSessions).map(([dateLabel, sessions]) => (
                    <div key={dateLabel}>
                      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">{dateLabel}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sessions.map((session) => {
                          const spotsLeft = getSpotsLeft(session);
                          const isFull = spotsLeft <= 0;
                          const isSelected = selectedPilatesSession?.id === session.id;
                          return (
                            <button
                              key={session.id}
                              disabled={isFull}
                              onClick={() => selectPilatesSession(session)}
                              className={`text-left rounded-2xl border p-4 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.01]' : isFull ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-violet-100 bg-white hover:-translate-y-1 hover:shadow-md'}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-lg font-bold text-[var(--color-text-primary)]">{new Date(session.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isFull ? 'bg-gray-200 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>{isFull ? 'Full' : `${spotsLeft} spots left`}</span>
                              </div>
                              <p 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const hostProfileId = session.host?.profile_id || session.owner_id;
                                  if (hostProfileId) {
                                    fetchAndShowProfile(hostProfileId);
                                  }
                                }}
                                className="mt-2 font-semibold text-violet-700 hover:text-violet-900 hover:underline cursor-pointer inline-flex items-center gap-1 relative z-20"
                                title="View Host Profile"
                              >
                                {session.host?.display_name || 'Pilates host'}
                                <User size={12} className="text-violet-500" />
                              </p>
                              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{session.level} · {Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000)} min</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1.08fr_0.92fr] gap-8">
              <div className="glass-card p-6 overflow-hidden relative">
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Calendar size={18} className="text-pink-500" /> Pick a Date
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">Select a day from the calendar only.</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 border border-white px-4 py-2 text-right shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500">Selected</p>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">{selectedDateLabel}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/70 bg-white/60 p-3 shadow-inner">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <button
                        type="button"
                        onClick={() => changeCalendarMonth(-1)}
                        disabled={!canViewPreviousMonth}
                        className="w-10 h-10 rounded-full bg-white text-[var(--color-text-secondary)] shadow-sm hover:text-pink-600 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={18} className="mx-auto" />
                      </button>
                      <div className="text-center">
                        <p className="text-lg font-extrabold text-[var(--color-text-primary)]">
                          {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">Past dates are blocked</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeCalendarMonth(1)}
                        className="w-10 h-10 rounded-full bg-white text-[var(--color-text-secondary)] shadow-sm hover:text-violet-600 hover:shadow-md transition-all"
                        aria-label="Next month"
                      >
                        <ChevronRight size={18} className="mx-auto" />
                      </button>
                    </div>

                    <table className="w-full table-fixed border-separate border-spacing-1">
                      <thead>
                        <tr>
                          {WEEKDAY_LABELS.map((day) => (
                            <th key={day} className="pb-2 text-center text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {calendarWeeks.map((week, weekIndex) => (
                          <tr key={weekIndex}>
                            {week.map((date) => {
                              const dateKey = toDateKey(date);
                              const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                              const isToday = dateKey === toDateKey(today);
                              const isSelected = selectedDate === dateKey;
                              const isSelectable = isCurrentMonth && isSelectableDateKey(dateKey);

                              return (
                                <td key={dateKey} className="p-0.5 align-middle">
                                  <button
                                    type="button"
                                    onClick={() => selectDateFromCalendar(dateKey)}
                                    disabled={!isSelectable}
                                    aria-pressed={isSelected}
                                    className={`relative w-full aspect-square rounded-2xl text-sm font-bold transition-all ${
                                      isSelected
                                        ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-500/25 scale-105'
                                        : isSelectable
                                          ? 'bg-white text-[var(--color-text-primary)] hover:-translate-y-0.5 hover:bg-pink-50 hover:text-pink-600 hover:shadow-md'
                                          : 'bg-transparent text-gray-300 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>{date.getDate()}</span>
                                    {isToday && (
                                      <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-500'}`} />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 overflow-hidden relative">
                <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-violet-300/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={18} className="text-violet-500" /> Available Times</h3>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">{selectedDate ? selectedDateLabel : 'Pick a date first'}</p>
                    </div>
                    {selectedTime && (
                      <div className="rounded-2xl bg-violet-50 px-4 py-2 text-right shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Time</p>
                        <p className="text-sm font-bold text-violet-700">{selectedTime}</p>
                      </div>
                    )}
                  </div>

                  {!selectedDate ? (
                    <div className="min-h-56 flex items-center justify-center p-8 border-2 border-dashed border-violet-100 bg-white/40 rounded-3xl">
                      <p className="text-[var(--color-text-muted)] text-center">Choose a day from the calendar to reveal available appointment times.</p>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="min-h-56 flex items-center justify-center p-8 border-2 border-dashed border-amber-200 bg-amber-50/40 rounded-3xl">
                      <p className="text-[var(--color-text-muted)] text-center">This professional is not available on this day. Pick another date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {timeSlots.map((time) => {
                        const isSelected = selectedTime === time;
                        const isDisabled = isTimeSlotDisabled(time);

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              if (!isDisabled) setSelectedTime(time);
                            }}
                            disabled={isDisabled}
                            className={`py-3.5 rounded-2xl text-sm font-bold transition-all border ${
                              isSelected
                                ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg shadow-violet-500/25 scale-105 border-transparent'
                                : isDisabled
                                  ? 'bg-gray-100/60 text-gray-300 border-transparent cursor-not-allowed'
                                  : 'bg-white/80 text-[var(--color-text-primary)] border-white hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {dateTimeValidationMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{dateTimeValidationMessage}</span>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleContinueToConfirmation}
              disabled={!canContinueToConfirmation}
              className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              Continue to Confirmation
              <ArrowRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Confirm */}
      {step === 4 && (
        <div className="animate-fade-in w-full max-w-2xl mx-auto">
          <button onClick={() => setStep(3)} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Date & Time
          </button>

          <div className="glass-card w-full p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-400/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-400/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-center mb-8 text-[var(--color-text-primary)]">Confirm Booking</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/40 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                      <Scissors size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Service</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{selectedService?.name}</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg text-gradient-pink">€{selectedService?.base_price?.toFixed(2)}</p>
                </div>

                <div 
                  onClick={() => {
                    if (selectedMaster) {
                      setProfileModalMaster(selectedMaster);
                    } else {
                      const hostProfileId = selectedPilatesSession?.host?.profile_id || selectedPilatesSession?.owner_id;
                      if (hostProfileId) {
                        fetchAndShowProfile(hostProfileId);
                      }
                    }
                  }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/40 shadow-sm hover:border-violet-200 hover:bg-violet-50/30 cursor-pointer transition-all group"
                  title="View Specialist Profile"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 overflow-hidden animate-fade-in">
                      {(() => {
                        const hostId = selectedPilatesSession?.host?.profile_id || selectedPilatesSession?.owner_id;
                        const matchingMaster = masters.find(m => m.id === hostId);
                        const avatarUrl = selectedMaster?.avatar_url || matchingMaster?.avatar_url;
                        if (avatarUrl) {
                          return <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />;
                        }
                        return <User size={20} />;
                      })()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{selectedService?.category === 'Pilates' ? 'Host' : 'Professional'}</p>
                      <p className="font-bold text-[var(--color-text-primary)] group-hover:text-violet-600 transition-colors">{selectedPilatesSession?.host?.display_name || selectedMaster?.full_name}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/40 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{selectedDateLabel} at {selectedTime}</p>
                    </div>
                  </div>
                  <p className="font-medium text-[var(--color-text-secondary)]">{selectedService?.duration_minutes} min</p>
                </div>

                {selectedService?.category === 'Pilates' && pilatesSettings && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 shadow-sm">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Pilates Session</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[var(--color-text-secondary)]">
                      <span>Level: <strong className="text-[var(--color-text-primary)]">{pilatesSettings.default_level || 'All levels'}</strong></span>
                      <span>Spaces left: <strong className="text-[var(--color-text-primary)]">{selectedPilatesSession ? getSpotsLeft(selectedPilatesSession) : pilatesSettings.default_capacity || 6}</strong></span>
                      <span>{pilatesSettings.equipment_provided ? 'Equipment provided' : 'Bring your own equipment'}</span>
                      {pilatesSettings.require_health_declaration && <span>Health declaration required</span>}
                    </div>
                  </div>
                )}
              </div>

              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  user={user}
                  profile={profile}
                  selectedService={selectedService}
                  selectedMaster={selectedMaster}
                  selectedPilatesSession={selectedPilatesSession}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onBookSuccess={() => setStep(5)}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Success */}
      {step === 5 && (
        <div className="animate-fade-in max-w-lg mx-auto text-center pt-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 animate-bounce-gentle">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Booking Confirmed!</h2>
          <p className="text-[var(--color-text-secondary)] mb-8 text-lg">
            Your appointment with <span className="font-bold text-[var(--color-text-primary)]">{selectedMaster?.full_name}</span> has been confirmed for <span className="font-bold text-[var(--color-text-primary)]">{selectedDateLabel}</span> at <span className="font-bold text-[var(--color-text-primary)]">{selectedTime}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push(buildPath('appointments'))} className="btn-primary px-8 py-3">
              View My Appointments
            </button>
            <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl font-bold bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] transition-colors">
              Book Another
            </button>
          </div>
        </div>
      )}

    {/* Professional Profile Modal */}
      {profileModalMaster && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setProfileModalMaster(null)} 
          />
          <div className="relative bg-white rounded-[2rem] shadow-2xl border border-pink-100 p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto transform scale-in z-30 scrollbar-thin">
            
            {/* Colorful top decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-pink-100/50 to-violet-100/30 rounded-bl-[8rem] -z-10" />
            
            <button 
              onClick={() => setProfileModalMaster(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Profile Details */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-lg overflow-hidden border-2 border-white">
                    {profileModalMaster.avatar_url ? (
                      <img src={profileModalMaster.avatar_url} alt={profileModalMaster.full_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      profileModalMaster.full_name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
                      {profileModalMaster.full_name || (profileModalMaster.email ? profileModalMaster.email.split('@')[0] : 'Specialist')}
                    </h3>
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-widest mt-1">
                      {(() => {
                        const specs = profileModalMaster.specialties;
                        if (!specs) return 'Beauty Professional';
                        if (Array.isArray(specs)) return specs.join(', ');
                        return String(specs);
                      })()}
                    </p>
                    
                    {profileModalMaster.years_of_experience != null && (
                      <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold text-[10px] uppercase tracking-wider">
                        ★ {profileModalMaster.years_of_experience} Years Experience
                      </span>
                    )}
                  </div>
                </div>

                {/* About Section */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">About & Bio</h4>
                  {profileModalMaster.bio ? (
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-pink-50/20 border border-pink-100/40 p-4 rounded-2xl">
                      {profileModalMaster.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)] italic bg-gray-50 border border-gray-100 p-4 rounded-2xl">No biography provided yet.</p>
                  )}
                </div>

                {/* Salon Location Section */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Salon Location</h4>
                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-pink-50 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
                    
                    <div className="flex items-start gap-2.5 relative z-10">
                      <MapPin className="text-pink-500 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">
                          {profileModalMaster.city ? `${profileModalMaster.city}` : 'Local Salon'}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {[profileModalMaster.state, profileModalMaster.country].filter(Boolean).join(', ') || 'Available for booking in country area'}
                        </p>
                      </div>
                    </div>

                    {/* Google Maps link if coords are available */}
                    {profileModalMaster.latitude && profileModalMaster.longitude ? (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${profileModalMaster.latitude},${profileModalMaster.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 w-full text-center py-2.5 rounded-xl text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-600 transition-all block border border-pink-100 hover:-translate-y-0.5"
                      >
                        📍 View on Google Maps
                      </a>
                    ) : (
                      <p className="text-[10px] text-[var(--color-text-muted)] italic border-t border-gray-50 pt-2">No coordinates set for map navigation.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Portfolio Grid */}
              <div className="flex flex-col h-full border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Portfolio & Gallery</h4>
                  <span className="text-[10px] font-bold text-pink-500 px-2 py-0.5 rounded-full bg-pink-50">
                    {portfolioPhotos.length} Photos
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px] scrollbar-thin pr-1">
                  {portfolioPhotos.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-2xl p-6 bg-gray-50/50">
                      <span className="text-2xl mb-2">📸</span>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">No portfolio photos uploaded</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">This professional hasn't shared any of their work yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pb-2">
                      {portfolioPhotos.map((photo) => (
                        <div 
                          key={photo.id}
                          onClick={() => setActivePhotoUrl(photo.image_url)}
                          className="group relative h-28 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md border border-gray-100 transition-all hover:scale-[1.02]"
                        >
                          <img 
                            src={photo.image_url} 
                            alt={photo.description || 'Portfolio work'} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center backdrop-blur-[2px]">
                            <p className="text-[10px] text-white font-medium line-clamp-3">
                              {photo.description || 'View larger'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setProfileModalMaster(null)} 
                className="w-full btn-primary py-3 rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Enlarged Photo View */}
      {activePhotoUrl && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/90 animate-fade-in">
          <button 
            onClick={() => setActivePhotoUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl font-bold transition-colors"
          >
            ✕
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10 relative scale-in">
            <img 
              src={activePhotoUrl} 
              alt="Enlarged portfolio work" 
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Pilates waiver form sheet — shown when booking Pilates without a signed waiver */}
      <PilatesWaiverFormSheet
        open={showWaiverSheet}
        onSigned={handleWaiverSigned}
        onDismiss={() => setShowWaiverSheet(false)}
      />

    </div>
  );
}
