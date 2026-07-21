'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { DeleteButton } from '@/components/DeleteButton';
import type { ClassPackage, UserPass, CreditLedger } from '@/types/database';
import {
  Ticket, Loader2, Plus, Sparkles, ArrowLeft, CalendarClock,
  History, CheckCircle2, AlertCircle, Euro, Layers,
} from 'lucide-react';

const _stripePk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = _stripePk ? loadStripe(_stripePk) : null;

type PassWithPackage = UserPass & { class_packages: ClassPackage | null };
type LedgerRow = CreditLedger;

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiry';
  const d = new Date(expiresAt);
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Expires tomorrow';
  if (days < 30) return `Expires in ${days} days`;
  return `Expires ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function ledgerLabel(row: LedgerRow): string {
  switch (row.reason) {
    case 'purchase': return row.note || 'Purchased package';
    case 'booking': return row.note || 'Booked a class';
    case 'cancel_refund': return row.note || 'Refund — cancellation';
    case 'manual_grant': return row.note || 'Grant by owner';
    case 'expiry_adjustment': return row.note || 'Expiry adjustment';
    default: return row.note || row.reason;
  }
}

/** The embedded Stripe buy form for one package. */
function BuyPackageForm({
  pkg,
  onSuccess,
  onCancel,
}: {
  pkg: ClassPackage;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const { showToast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const startPayment = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      // Create the PaymentIntent via the existing edge function.
      const { data: piData, error: piError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: pkg.price_cents,
          currency: 'eur',
          description: `Class package: ${pkg.name}`,
          capture_method: 'automatic',
        },
      });
      if (piError) throw piError;
      setClientSecret(piData.clientSecret);
      setPaymentIntentId(piData.paymentIntentId);
      setSubmitting(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to start payment', 'error');
      setSubmitting(false);
    }
  };

  const confirmAndGrant = async () => {
    if (!stripe || !elements || !clientSecret || !paymentIntentId) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      showToast('Enter your card details', 'error');
      return;
    }
    try {
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (confirmError) throw confirmError;

      // Grant the pass idempotently on the server.
      const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('finalize-pass-purchase', {
        body: { package_id: pkg.id, payment_intent_id: paymentIntentId },
      });
      if (finalizeError) throw finalizeError;
      showToast(
        finalizeData?.already_granted
          ? 'Your pass was already activated.'
          : `${pkg.total_credits} classes added to your balance!`,
        'success'
      );
      onSuccess();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Payment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!clientSecret) {
      await startPayment();
    } else {
      setSubmitting(true);
      await confirmAndGrant();
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[var(--color-text-primary)]">{pkg.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{pkg.total_credits} classes</p>
          </div>
          <p className="text-xl font-bold text-gradient-pink">€{(pkg.price_cents / 100).toFixed(2)}</p>
        </div>
      </div>

      {!clientSecret ? (
        <button onClick={handlePay} disabled={submitting} className="w-full btn-primary py-3 font-bold disabled:opacity-50">
          {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : `Pay €${(pkg.price_cents / 100).toFixed(2)}`}
        </button>
      ) : (
        <>
          <div className="p-4 bg-white rounded-lg border border-pink-100 shadow-inner">
            <CardElement options={{
              style: {
                base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                invalid: { color: '#9e2146' },
              },
            }} />
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] transition-colors">Cancel</button>
            <button onClick={handlePay} disabled={submitting} className="flex-1 btn-primary py-3 font-bold disabled:opacity-50">
              {submitting ? 'Processing…' : `Pay & Activate`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PassesPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  const [passes, setPasses] = useState<PassWithPackage[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [catalog, setCatalog] = useState<ClassPackage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [buyingPackage, setBuyingPackage] = useState<ClassPackage | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [passesRes, ledgerRes, catalogRes] = await Promise.all([
        supabase
          .from('user_passes')
          .select('*, class_packages(*)')
          .eq('user_id', user.id)
          .order('purchased_at', { ascending: false }),
        supabase
          .from('credit_ledger')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        fetch('/api/class-packages').then(r => r.json()),
      ]);

      if (passesRes.error) throw passesRes.error;
      if (ledgerRes.error) throw ledgerRes.error;
      setPasses((passesRes.data as PassWithPackage[]) ?? []);
      setLedger((ledgerRes.data as LedgerRow[]) ?? []);
      setCatalog((catalogRes.packages as ClassPackage[]) ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load passes', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [user, supabase, showToast]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadAll();
  }, [authLoading, user, loadAll]);

  const totalCredits = passes
    .filter(p => p.status === 'active' && p.remaining_credits > 0 && (!p.expires_at || new Date(p.expires_at) > new Date()))
    .reduce((sum, p) => sum + p.remaining_credits, 0);

  const activePasses = passes.filter(
    p => p.status === 'active' && p.remaining_credits > 0 && (!p.expires_at || new Date(p.expires_at) > new Date())
  );
  const pastPasses = passes.filter(p => !activePasses.includes(p));

  if (authLoading || loadingData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-brand-pink-dark)]" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-20">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)] mb-1">My Class Passes</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Buy a bundle and redeem credits when booking Pilates classes.</p>
        </div>
      </div>

      {/* Total balance card */}
      <div className="glass-card p-6 mb-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white shadow-lg">
            <Ticket size={28} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Available credits</p>
            <p className="text-4xl font-bold text-[var(--color-text-primary)]">{totalCredits}</p>
          </div>
          {totalCredits === 0 && (
            <Link href="#buy" className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold">
              <Plus size={14} /> Buy a pass
            </Link>
          )}
        </div>
      </div>

      {/* Active passes */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-pink-500" /> Active passes
        </h2>
        {activePasses.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Ticket size={36} className="text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">You don&apos;t have any active class passes yet.</p>
            <Link href="#buy" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold">
              <Plus size={14} /> Buy your first pass
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activePasses.map(pass => {
              const pct = pass.initial_credits > 0 ? Math.round((pass.remaining_credits / pass.initial_credits) * 100) : 0;
              return (
                <div key={pass.id} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-[var(--color-text-primary)]">{pass.class_packages?.name ?? 'Class Pass'}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1 mt-0.5">
                        <CalendarClock size={12} /> {formatExpiry(pass.expires_at)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">{pass.remaining_credits}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">/ {pass.initial_credits} left</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-light)] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transaction history */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <History size={18} className="text-violet-500" /> Transaction history
        </h2>
        {ledger.length === 0 ? (
          <div className="glass-card p-6 text-center text-sm text-[var(--color-text-muted)]">No transactions yet.</div>
        ) : (
          <div className="glass-card divide-y divide-[var(--color-border-light)]">
            {ledger.map(row => {
              const positive = row.delta > 0;
              return (
                <div key={row.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${positive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {positive ? <Plus size={14} /> : <ArrowLeft size={14} className="rotate-45" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{ledgerLabel(row)}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{new Date(row.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{positive ? '+' : ''}{row.delta}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">bal {row.balance_after}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Buy a package */}
      <section id="buy">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <Euro size={18} className="text-emerald-500" /> Buy a package
        </h2>
        {catalog.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <AlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
            <p className="text-[var(--color-text-secondary)] text-sm">No class packages are available for purchase right now. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map(pkg => (
              <div key={pkg.id} className="glass-card p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white"><Layers size={16} /></div>
                  <h3 className="font-bold text-[var(--color-text-primary)]">{pkg.name}</h3>
                </div>
                {pkg.description && <p className="text-xs text-[var(--color-text-secondary)] mb-3 flex-1">{pkg.description}</p>}
                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)] mb-3">
                  <span className="inline-flex items-center gap-1"><Layers size={12} /> {pkg.total_credits} classes</span>
                  <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {pkg.validity_days ? `${pkg.validity_days}d` : 'No expiry'}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-gradient-pink">€{(pkg.price_cents / 100).toFixed(2)}</span>
                  {pkg.total_credits > 0 && (
                    <span className="text-xs text-[var(--color-text-muted)]">€{((pkg.price_cents / pkg.total_credits) / 100).toFixed(2)} / class</span>
                  )}
                </div>
                <button
                  onClick={() => setBuyingPackage(pkg)}
                  className="w-full btn-primary py-2.5 text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Buy
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Buy modal with Stripe Elements */}
      {buyingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8 w-full max-w-md scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Buy pass</h2>
              <button onClick={() => setBuyingPackage(null)} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400" aria-label="Close">✕</button>
            </div>
            <Elements stripe={stripePromise}>
              <BuyPackageForm
                pkg={buyingPackage}
                onCancel={() => setBuyingPackage(null)}
                onSuccess={() => {
                  setBuyingPackage(null);
                  loadAll();
                }}
              />
            </Elements>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-4 flex items-start gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              Payment is processed securely by Stripe. Your pass activates instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
