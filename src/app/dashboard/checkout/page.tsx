'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CardElement, Elements, useElements, useStripe,
  EmbeddedCheckoutProvider, EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  ArrowLeft, CheckCircle2, CreditCard, Loader2, MapPin, Package, ShoppingBag, Plus,
  ShieldCheck, Sparkles, Tag, AlertCircle, Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { EUROPEAN_COUNTRIES_SORTED, getCountryName, getShippingCost } from '@/lib/shipping';
import type { SavedCard } from '@/components/PaymentMethodsManager';
import { CardBrandBadge } from '@/components/PaymentMethodsManager';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants/images';
// Server-authoritative catalog. The price shown here is a PREVIEW only — the
// real charge is always resolved from the products table in the
// create-stripe-session edge function, keyed by productId.
import { fetchQrProduct, type QrCatalogProduct } from '@/lib/qr-catalog';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong';
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

// ============================================================================
// QR CHECKOUT FLOW — on-site single-item payment via Stripe Embedded Checkout
// (Apple Pay / Google Pay / Card). Triggered by ?productId=&price=&name= params.
// ============================================================================
interface CreateSessionResponse {
  url: string | null;
  sessionId: string;
  clientSecret: string | null;
  uiMode: 'hosted' | 'embedded';
  discountApplied: number;
  voucherCode: string | null;
}

function QrCheckoutFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const productId = searchParams.get('productId');
  // `price` and `name` from the URL are display hints ONLY. The authoritative
  // price/name come from the products table (and ultimately the server), so a
  // tampered URL can't influence the charge.
  const urlName = searchParams.get('name');
  const isSuccessParam = searchParams.get('success') === 'true';

  // Resolve the real product from the DB (async). Unknown/inactive/non-qr
  // productId → invalid checkout.
  const [catalogProduct, setCatalogProduct] = useState<QrCatalogProduct | null>(null);
  const [resolvingProduct, setResolvingProduct] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!productId) { if (!cancelled) setResolvingProduct(false); return; }
      const product = await fetchQrProduct(supabase, productId);
      if (!cancelled) {
        setCatalogProduct(product);
        setResolvingProduct(false);
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [productId, supabase]);

  const productName = catalogProduct?.name ?? urlName ?? 'Product';
  const priceEuros = catalogProduct?.price ?? 0;
  const hasValidParams = !!catalogProduct;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(isSuccessParam);
  const [sessionInfo, setSessionInfo] = useState<{ discountApplied: number; voucherCode: string | null } | null>(null);

  const handleCreateSession = async () => {
    if (!user || !catalogProduct) return;
    if (!stripePublishableKey) {
      setCreateError('Stripe is not configured. Ask the salon staff for help.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      // SECURITY: send productId only. The server resolves the real price/name
      // from its own PRODUCT_CATALOG. We do not send priceInCents — the server
      // ignores it even if a legacy client does.
      const { data, error } = await supabase.functions.invoke<CreateSessionResponse>(
        'create-stripe-session',
        {
          body: {
            productId: catalogProduct.id,
            userId: user.id,
            uiMode: 'embedded',
          },
        },
      );

      if (error) throw error;
      if (!data?.clientSecret) {
        throw new Error('Stripe could not start the payment session. Please try again.');
      }

      setSessionInfo({
        discountApplied: data.discountApplied ?? 0,
        voucherCode: data.voucherCode ?? null,
      });
      setClientSecret(data.clientSecret);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = () => {
    setShowSuccess(true);
    try { navigator.vibrate?.([100, 50, 100]); } catch { /* unsupported */ }
  };

  // ── Resolving product from DB (show spinner, not the error screen) ────────
  if (resolvingProduct) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-brand-pink-dark)]" />
      </div>
    );
  }

  // ── Invalid QR params ────────────────────────────────────────────────────
  if (!hasValidParams && !isSuccessParam) {
    return (
      <div className="animate-fade-in max-w-md mx-auto">
        <div className="glass-card p-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={30} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Invalid checkout link</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            This QR code is missing product details. Please ask the salon staff to generate a new QR code.
          </p>
          <Link href="/dashboard" className="btn-pink inline-flex px-6 py-3 text-sm">Go Home</Link>
        </div>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (showSuccess) {
    const finalAmount = sessionInfo?.discountApplied
      ? Math.max(priceEuros - sessionInfo.discountApplied, 0)
      : priceEuros;
    return (
      <div className="animate-fade-in max-w-md mx-auto">
        <style>{`
          @keyframes checkPop {
            0%   { transform: scale(0); opacity: 0; }
            55%  { transform: scale(1.25); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .check-pop { animation: checkPop 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes ringPulse {
            0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
            70%  { box-shadow: 0 0 0 22px rgba(16,185,129,0); }
            100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          }
          .ring-pulse { animation: ringPulse 1.6s ease-out 2; }
        `}</style>
        <div className="glass-card p-10 text-center">
          <div className="check-pop ring-pulse w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
            <CheckCircle2 size={52} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] mb-2">Payment Successful!</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Thank you{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Your payment has been confirmed.
          </p>

          <div className="bg-[var(--color-surface-light)] rounded-2xl p-5 text-left space-y-2 mb-6 border border-[var(--color-border-light)]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Item</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{productName || 'Product'}</span>
            </div>
            {sessionInfo?.discountApplied ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Original</span>
                  <span className="text-sm text-[var(--color-text-secondary)] line-through">€{priceEuros.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <Tag size={11} /> Voucher {sessionInfo.voucherCode}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600">−€{sessionInfo.discountApplied.toFixed(2)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-light)]">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">Paid</span>
              <span className="text-xl font-black text-emerald-600">€{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-6">
            <ShieldCheck size={13} className="text-emerald-500" />
            The salon has been notified. You can show this screen to staff.
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="btn-outline w-full py-3 text-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Auth gate: customer must be logged in to pay ─────────────────────────
  if (!authLoading && !user) {
    const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/dashboard/checkout';
    return (
      <div className="animate-fade-in max-w-md mx-auto">
        <div className="glass-card p-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center mx-auto mb-5">
            <Lock size={28} className="text-[var(--color-brand-pink-dark)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Log in to pay</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Please sign in or register at the salon help-desk to complete your purchase.
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/login?redirect=${encodeURIComponent(returnUrl)}`} className="btn-pink px-6 py-3 text-sm">Log In</Link>
            <Link href={`/register?redirect=${encodeURIComponent(returnUrl)}`} className="btn-outline px-6 py-3 text-sm">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-brand-pink-dark)]" />
      </div>
    );
  }

  // ── Main QR checkout screen ──────────────────────────────────────────────
  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-3">
          <Sparkles size={12} className="text-emerald-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">On-Site Checkout</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Pay for your item</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Secure payment via Stripe · Apple Pay · Google Pay</p>
      </div>

      {/* Product summary */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Item</p>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] truncate">{productName}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Product ID: {productId}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-[var(--color-text-primary)]">€{priceEuros.toFixed(2)}</p>
          </div>
        </div>
        {sessionInfo?.discountApplied ? (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <Tag size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">
              Voucher <span className="font-mono">{sessionInfo.voucherCode}</span> applied — you saved €{sessionInfo.discountApplied.toFixed(2)}!
            </span>
          </div>
        ) : null}
      </div>

      {/* Error state */}
      {createError && (
        <div className="glass-card p-5 mb-6 border-l-4 border-red-400 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700">Couldn't start payment</p>
              <p className="text-xs text-red-600 mt-0.5">{createError}</p>
            </div>
          </div>
          <button
            onClick={() => { setCreateError(null); handleCreateSession(); }}
            className="btn-outline w-full py-2.5 text-xs mt-3"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stripe Embedded Checkout — Apple Pay / Google Pay / Card */}
      {clientSecret && stripePromise ? (
        <div className="glass-card p-2 sm:p-4">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret, onComplete: handleComplete }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      ) : (
        <button
          onClick={handleCreateSession}
          disabled={creating}
          className="btn-pink w-full py-4 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {creating ? (
            <><Loader2 size={18} className="animate-spin" /> Preparing secure payment…</>
          ) : (
            <><Lock size={16} /> Pay €{priceEuros.toFixed(2)} Now</>
          )}
        </button>
      )}

      {!clientSecret && (
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          Powered by Stripe · 256-bit encrypted
        </p>
      )}
    </div>
  );
}

// ============================================================================
// CART CHECKOUT FLOW — existing shop checkout with shipping (preserved as-is)
// ============================================================================
function CartCheckoutForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const supabase = createClient();
  const { user, profile } = useAuth();
  const { items, getTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shippingName, setShippingName] = useState(profile?.full_name || '');
  const [shippingPhone, setShippingPhone] = useState(profile?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState(profile?.city || '');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('GB');
  const [notes, setNotes] = useState('');
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedPm, setSelectedPm] = useState<string>('new');

  const usingSavedCard = selectedPm !== 'new';

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('list-payment-methods', { body: {} });
        if (!error && data?.paymentMethods?.length) {
          setSavedCards(data.paymentMethods);
          const def = data.paymentMethods.find((c: SavedCard) => c.isDefault);
          setSelectedPm(def ? def.id : data.paymentMethods[0].id);
        }
      } catch { /* ignore */ }
      setLoadingCards(false);
    };
    load();
  }, [supabase]);

  const subtotal = getTotal();
  const shippingCost = getShippingCost(shippingCountry);
  const finalTotal = subtotal + shippingCost;

  const cardOptions = useMemo(() => ({
    style: {
      base: {
        fontSize: '16px',
        color: '#1A1A1A',
        '::placeholder': { color: '#9CA3AF' },
      },
      invalid: { color: '#EF4444' },
    },
  }), []);

  const validate = () => {
    if (!user) return 'Please log in to checkout.';
    if (items.length === 0) return 'Your cart is empty.';
    if (!shippingName.trim()) return 'Enter recipient full name.';
    if (!shippingPhone.trim()) return 'Enter delivery phone number.';
    if (!shippingAddress.trim()) return 'Enter street address.';
    if (!shippingCity.trim()) return 'Enter city.';
    if (!shippingPostalCode.trim()) return 'Enter postal code.';
    if (!stripe) return 'Stripe is still loading. Try again in a moment.';
    if (!usingSavedCard && !elements) return 'Stripe is still loading. Try again in a moment.';
    return null;
  };

  const checkStock = async () => {
    const itemIds = items.map((item) => item.id);
    const { data, error } = await supabase
      .from('products')
      .select('id, stock_count')
      .in('id', itemIds);

    if (error) throw new Error('Could not verify stock for items');

    const stockMap = new Map((data || []).map((p) => [p.id, p.stock_count]));

    for (const item of items) {
      const stockCount = stockMap.get(item.id);
      if (stockCount === undefined) {
        throw new Error(`Could not verify stock for ${item.name}`);
      }
      if (stockCount !== null && stockCount < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Only ${stockCount} available.`);
      }
    }
  };

  const sendOwnerNotification = async (confirmedOrderId: string) => {
    try {
      await supabase.functions.invoke('send-order-notification', {
        body: {
          order_id: confirmedOrderId,
          customer_name: shippingName || profile?.full_name || 'Customer',
          order_total: finalTotal,
        },
      });
    } catch (error) {
      console.error('Failed to send owner notification:', error);
    }
  };

  const handlePlaceOrder = async () => {
    const validationError = validate();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    if (!usingSavedCard) {
      const cardElement = elements?.getElement(CardElement);
      if (!cardElement) {
        showToast('Enter card details to continue.', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      await checkStock();

      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: toCents(finalTotal),
          currency: 'eur',
          customer_id: profile?.stripe_customer_id || undefined,
          payment_method_id: usingSavedCard ? selectedPm : undefined,
          description: `Shop Order: ${items.length} item(s) + shipping to ${getCountryName(shippingCountry)}`,
          capture_method: 'automatic',
        },
      });

      if (paymentIntentError) throw paymentIntentError;
      const clientSecret = paymentIntentData?.clientSecret as string | undefined;
      const paymentIntentId = paymentIntentData?.paymentIntentId as string | undefined;
      if (!clientSecret || !paymentIntentId) throw new Error('Stripe payment setup failed.');

      const paymentResult = usingSavedCard
        ? await stripe!.confirmCardPayment(clientSecret, { payment_method: selectedPm })
        : await stripe!.confirmCardPayment(clientSecret, {
            payment_method: {
              card: elements!.getElement(CardElement)!,
              billing_details: {
                name: shippingName.trim(),
                email: profile?.email || user?.email || undefined,
                phone: shippingPhone.trim(),
                address: {
                  line1: shippingAddress.trim(),
                  city: shippingCity.trim(),
                  postal_code: shippingPostalCode.trim(),
                  country: shippingCountry,
                },
              },
            },
          });

      if (paymentResult.error) throw new Error(paymentResult.error.message || 'Payment failed.');
      if (paymentResult.paymentIntent?.status !== 'succeeded') throw new Error('Payment was not completed.');

      const { data: finalizedOrder, error: finalizeError } = await supabase.functions.invoke('finalize-shop-order', {
        body: {
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          payment_intent_id: paymentIntentId,
          currency: 'eur',
          shipping: {
            name: shippingName.trim(),
            phone: shippingPhone.trim(),
            address: shippingAddress.trim(),
            city: shippingCity.trim(),
            postal_code: shippingPostalCode.trim(),
            country: shippingCountry,
            notes: notes.trim() || null,
          },
        },
      });

      if (finalizeError) throw finalizeError;
      const finalizedOrderId = finalizedOrder?.order_id as string | undefined;
      const alreadyFinalized = finalizedOrder?.already_finalized === true;
      if (!finalizedOrderId) throw new Error('Order finalization failed.');

      if (!alreadyFinalized) {
        await sendOwnerNotification(finalizedOrderId);
      }
      clearCart();
      setOrderId(finalizedOrderId);
      showToast('Order placed successfully!', 'success');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div className="glass-card p-12 text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
          <CheckCircle2 size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">Order Confirmed</h1>
        <p className="text-[var(--color-text-secondary)] mb-2">Your order #{orderId.slice(0, 8).toUpperCase()} has been placed.</p>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">We'll prepare your package and update shipping soon.</p>
        <button onClick={() => router.push('/dashboard/shop')} className="btn-pink px-8 py-3 text-sm">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_390px] gap-6 items-start">
      <div className="space-y-6">
        <section className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center">
              <MapPin size={20} className="text-[var(--color-brand-pink-dark)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-text-primary)]">Shipping Details</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Europe-wide delivery</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-upper">Full Name *</label>
              <input value={shippingName} onChange={(event) => setShippingName(event.target.value)} className="input-glass w-full" placeholder="Recipient name" />
            </div>
            <div>
              <label className="label-upper">Phone *</label>
              <input value={shippingPhone} onChange={(event) => setShippingPhone(event.target.value)} className="input-glass w-full" placeholder="Delivery phone" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-upper">Address *</label>
              <input value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} className="input-glass w-full" placeholder="Street address" />
            </div>
            <div>
              <label className="label-upper">City *</label>
              <input value={shippingCity} onChange={(event) => setShippingCity(event.target.value)} className="input-glass w-full" placeholder="City" />
            </div>
            <div>
              <label className="label-upper">Postal Code *</label>
              <input value={shippingPostalCode} onChange={(event) => setShippingPostalCode(event.target.value)} className="input-glass w-full" placeholder="Postal code" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-upper">Country *</label>
              <select value={shippingCountry} onChange={(event) => setShippingCountry(event.target.value)} className="input-glass w-full">
                {EUROPEAN_COUNTRIES_SORTED.map((country) => (
                  <option key={country.code} value={country.code}>{country.name} — €{country.shippingCost.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-upper">Order Notes</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="input-glass w-full resize-none" rows={3} placeholder="Delivery notes, preferences, or gift message" />
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-200 to-cyan-200 flex items-center justify-center">
              <CreditCard size={20} className="text-sky-600" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-text-primary)]">Payment</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Secure payment powered by Stripe</p>
            </div>
          </div>

          {!stripePublishableKey && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Missing `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in environment variables.
            </div>
          )}

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
                  <input type="radio" name="checkout_pm" value={card.id} checked={selectedPm === card.id} onChange={() => setSelectedPm(card.id)} className="accent-[var(--color-primary)]" />
                  <CardBrandBadge brand={card.brand} />
                  <span className="font-semibold text-sm text-[var(--color-text-primary)]">•••• {card.last4}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{String(card.expMonth).padStart(2, '0')}/{card.expYear}</span>
                  {card.isDefault && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 ml-auto">Default</span>}
                </label>
              ))}
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPm === 'new'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/20'
                    : 'border-[var(--color-border-light)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                <input type="radio" name="checkout_pm" value="new" checked={selectedPm === 'new'} onChange={() => setSelectedPm('new')} className="accent-[var(--color-primary)]" />
                <Plus size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">Use a new card</span>
              </label>
            </div>
          ) : null}

          {(!usingSavedCard || savedCards.length === 0) && (
            <div className="input-glass w-full py-4">
              <CardElement options={cardOptions} />
            </div>
          )}
        </section>
      </div>

      <aside className="glass-card p-6 sticky top-24">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center">
            <Package size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--color-text-primary)]">Review Order</h2>
            <p className="text-xs text-[var(--color-text-muted)]">{items.length} product{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-3 mb-5 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--color-surface-light)] shrink-0">
                    <img src={item.image_url || DEFAULT_PRODUCT_IMAGE} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{item.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Qty {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">€{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 text-sm mb-6 border-t border-[var(--color-border-light)] pt-4">
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Subtotal</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Shipping to {getCountryName(shippingCountry)}</span>
            <span>€{shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-[var(--color-text-primary)] border-t border-[var(--color-border-light)] pt-3">
            <span>Total</span>
            <span>€{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={handlePlaceOrder} disabled={submitting || !stripe || items.length === 0 || (!usingSavedCard && !elements)} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Pay & Place Order'}
        </button>
        <Link href="/dashboard/cart" className="btn-outline w-full py-3 text-sm flex items-center justify-center gap-2 mt-3">
          <ArrowLeft size={16} /> Back to Cart
        </Link>
      </aside>
    </div>
  );
}

function CartCheckoutPage() {
  const { items } = useCart();
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role === 'owner') {
      router.replace('/dashboard/inventory');
    }
  }, [authLoading, role, router]);

  if (authLoading || role === 'owner') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 size={34} className="animate-spin text-[var(--color-brand-pink-dark)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={34} className="text-[var(--color-brand-pink-dark)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">Nothing to checkout</h1>
          <p className="text-[var(--color-text-secondary)] mb-8">Your cart is empty.</p>
          <Link href="/dashboard/shop" className="btn-pink inline-flex px-7 py-3 text-sm">Browse Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <Link href="/dashboard/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4">
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-brand-pink-dark)] mb-2">Secure Checkout</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Complete your order</h1>
      </div>
      <Elements stripe={stripePromise}>
        <CartCheckoutForm />
      </Elements>
    </div>
  );
}

// ============================================================================
// ROUTER — detects QR params and selects the right flow. Wrapped in Suspense
// because useSearchParams() requires a Suspense boundary for Next.js 16 builds.
// ============================================================================
function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const hasQrParams = searchParams.has('productId');
  const isSuccessRedirect = searchParams.get('success') === 'true';

  if (hasQrParams || isSuccessRedirect) {
    return <QrCheckoutFlow />;
  }
  return <CartCheckoutPage />;
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[var(--color-brand-pink-dark)]" />
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
