'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Star, Clock, ArrowRight, ArrowLeft, Calendar, CheckCircle2, Sparkles, User, Scissors, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

function CheckoutForm({ user, profile, selectedService, selectedMaster, selectedDate, selectedTime, onBookSuccess, submitting, setSubmitting }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const supabase = createClient();

  const handleBook = async () => {
    if (!stripe || !elements || !user || !selectedService || !selectedMaster || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const startTimeStr = `${selectedDate}T${selectedTime}:00`;
      const startDate = new Date(startTimeStr);
      
      const requestBody = {
        user_email: profile?.email,
        customer_id: profile?.stripe_customer_id,
      };

      const { data: setupIntentData, error: setupError } = await supabase.functions.invoke('setup-intent', { body: requestBody });
      if (setupError) throw setupError;

      const cardElement = elements.getElement(CardElement);
      const { setupIntent, error: confirmSetupError } = await stripe.confirmCardSetup(
        setupIntentData.clientSecret,
        { payment_method: { card: cardElement! } }
      );

      if (confirmSetupError) throw confirmSetupError;

      const amountToPay = Math.round(selectedService.base_price * 100);
      
      const { data: paymentIntentData, error: piError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
            amount: amountToPay,
            currency: 'eur',
            customer_id: setupIntentData.customerId,
            payment_method_id: setupIntent.payment_method,
            master_id: selectedMaster.id,
            description: `Booking with ${selectedMaster.full_name}`,
            capture_method: 'automatic',
        }
      });
      if (piError) throw piError;

      const { error: confirmPaymentError } = await stripe.confirmCardPayment(paymentIntentData.clientSecret);
      if (confirmPaymentError) throw confirmPaymentError;

      const { error: bookError } = await supabase.rpc(
        'book_appointment_with_confirmation',
        {
            p_master_id: selectedMaster.id,
            p_service_id: selectedService.id,
            p_start_time: startDate.toISOString(),
            p_stripe_setup_intent_id: setupIntentData.setupIntentId,
            p_stripe_payment_intent_id: paymentIntentData.paymentIntentId,
            p_deposit_amount: selectedService.base_price,
            p_deposit_payment_intent_id: paymentIntentData.paymentIntentId,
        }
      );
      if (bookError) throw bookError;

      onBookSuccess();
    } catch (err: any) {
      console.error('Booking failed:', err);
      let msg = err.message || 'Failed to create booking. Please try again.';
      if (err.context && typeof err.context.json === 'function') {
        try { const errData = await err.context.json(); if (errData && errData.error) msg = errData.error; } catch (e) {}
      }
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="p-4 bg-white/60 border border-white rounded-xl mb-6 shadow-sm">
         <h4 className="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            💳 Payment Details
         </h4>
         <div className="p-4 bg-white rounded-lg border border-pink-100 shadow-inner">
           <CardElement options={{
             style: {
               base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
               invalid: { color: '#9e2146' },
             },
           }} />
         </div>
         <p className="text-xs text-[var(--color-text-secondary)] mt-3">
           You will be charged €{selectedService.base_price} today for your booking.
         </p>
      </div>
      <button
        onClick={handleBook}
        disabled={submitting || !stripe || !elements}
        className="w-full btn-primary py-4 text-lg font-bold shadow-xl shadow-pink-500/20 hover:shadow-2xl hover:shadow-pink-500/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Confirming Appointment...' : 'Confirm & Book Appointment'}
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
}

interface Master {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  specialties: string | null;
  city: string | null;
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80&auto=format&fit=crop',
];

export default function BookingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  
  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isMasterPreselected, setIsMasterPreselected] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [servicesRes, mastersRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).limit(30),
          supabase.from('profiles').select('id, full_name, avatar_url, specialties, city').eq('is_master', true).limit(20),
        ]);
        setServices((servicesRes.data as unknown as Service[]) || []);
        const loadedMasters = (mastersRes.data as unknown as Master[]) || [];
        setMasters(loadedMasters);

        // Check for masterId parameter in the URL
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const masterIdUrl = params.get('masterId');
          if (masterIdUrl) {
            const preSelected = loadedMasters.find(m => m.id === masterIdUrl);
            if (preSelected) {
              setSelectedMaster(preSelected);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Time slots generator (mock available times for demo)
  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '14:00', '15:30', '16:00', '17:00'];



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
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="glass-card h-64 shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="col-span-full glass-card p-12 text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/50 rounded-bl-full mix-blend-multiply" />
                   <div className="text-[var(--color-text-muted)] text-lg">No services found matching "{searchQuery}"</div>
                </div>
              ) : services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((service, idx) => (
                <div
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(isMasterPreselected ? 3 : 2); }}
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
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] bg-[var(--color-surface-light)] px-2 py-1 rounded-md">
                        <Clock size={14} /> <span>{service.duration_minutes} min</span>
                      </div>
                      <span className="text-lg font-bold text-gradient-pink">£{service.base_price?.toFixed(2)}</span>
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
              <p className="text-sm font-bold text-violet-700">£{selectedService?.base_price?.toFixed(2)} • {selectedService?.duration_minutes} min</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Choose a Professional</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {masters.map((master) => (
              <div
                key={master.id}
                onClick={() => { setSelectedMaster(master); setStep(3); }}
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
                  <div className="flex items-center gap-1 mt-2">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">5.0</span>
                    <span className="text-xs text-[var(--color-text-muted)] ml-1">(120 reviews)</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-light)] flex items-center justify-center group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
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
          <button onClick={() => setStep(isMasterPreselected ? 1 : 2)} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to {isMasterPreselected ? 'Services' : 'Professionals'}
          </button>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Select Date & Time</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={18} className="text-pink-500" /> Pick a Date</h3>
              <input 
                type="date" 
                className="w-full input-glass p-4 text-lg cursor-pointer"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock size={18} className="text-violet-500" /> Available Times</h3>
              {selectedDate ? (
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        selectedTime === time 
                          ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-md scale-105'
                          : 'bg-[var(--color-surface-light)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-[var(--color-border)] rounded-xl">
                  <p className="text-[var(--color-text-muted)] text-center">Please select a date first to see available times.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setStep(4)}
              disabled={!selectedDate || !selectedTime}
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
                  <p className="font-bold text-lg text-gradient-pink">£{selectedService?.base_price?.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/40 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 overflow-hidden">
                      {selectedMaster?.avatar_url ? (
                        <img src={selectedMaster.avatar_url} className="w-full h-full object-cover" alt="Master" />
                      ) : <User size={20} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Professional</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{selectedMaster?.full_name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/40 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{selectedDate} at {selectedTime}</p>
                    </div>
                  </div>
                  <p className="font-medium text-[var(--color-text-secondary)]">{selectedService?.duration_minutes} min</p>
                </div>
              </div>

              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  user={user}
                  profile={profile}
                  selectedService={selectedService}
                  selectedMaster={selectedMaster}
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
            Your appointment with <span className="font-bold text-[var(--color-text-primary)]">{selectedMaster?.full_name}</span> has been confirmed for <span className="font-bold text-[var(--color-text-primary)]">{selectedDate}</span> at <span className="font-bold text-[var(--color-text-primary)]">{selectedTime}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/dashboard/appointments')} className="btn-primary px-8 py-3">
              View My Appointments
            </button>
            <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl font-bold bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] transition-colors">
              Book Another
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
