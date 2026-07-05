'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, Maximize2, Minimize2, ShoppingBag, Loader2, Smartphone,
  Radio, CheckCircle2, Clock, XCircle, TrendingUp, Package
} from 'lucide-react';
// Shared catalog — the server is the source of truth for the actual charge.
// These client values are used only to render the picker and encode the QR URL.
import { QR_CATALOG } from '@/lib/qr-catalog';

type ProductItem = typeof QR_CATALOG[number];

interface FeedTransaction {
  id: string;
  stripe_session_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  product_name: string | null;
  product_id: string | null;
  discount_applied: number;
  created_at: string;
  updated_at: string;
}

const PRODUCTS = QR_CATALOG;

const CHECKOUT_BASE_URL = 'https://meraki-ebon.vercel.app/dashboard/checkout';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function QrPaymentsPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(PRODUCTS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [transactions, setTransactions] = useState<FeedTransaction[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [stats, setStats] = useState({ totalSales: 0, completedCount: 0, pendingCount: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (role !== 'owner') {
      router.replace('/dashboard');
    }
  }, [authLoading, role, router]);

  const enterFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try { if (el.requestFullscreen) await el.requestFullscreen(); } catch { /* ignore */ }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Fetch initial recent transactions ────────────────────────────────
  useEffect(() => {
    if (role !== 'owner') return;
    let cancelled = false;

    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, stripe_session_id, amount, currency, status, product_name, product_id, discount_applied, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!cancelled && !error && data) {
        setTransactions(data as FeedTransaction[]);
      }
      if (!cancelled) setFeedLoading(false);
    };

    fetchInitial();
    return () => { cancelled = true; };
  }, [role, supabase]);

  // ── Realtime subscription on transactions ────────────────────────────
  useEffect(() => {
    if (role !== 'owner') return;

    const channel = supabase
      .channel('transactions-realtime-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const newTx = payload.new as FeedTransaction;
          setTransactions(prev =>
            [newTx, ...prev.filter(t => t.id !== newTx.id)].slice(0, 50)
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          const updatedTx = payload.new as FeedTransaction;

          setTransactions(prev => {
            const existing = prev.find(t => t.id === updatedTx.id);
            const wasNotCompleted = !existing || existing.status !== 'completed';

            if (wasNotCompleted && updatedTx.status === 'completed') {
              setFlashId(updatedTx.id);
              try { navigator.vibrate([100, 50, 200]); } catch { /* unsupported */ }
              setTimeout(() => setFlashId(prev => prev === updatedTx.id ? null : prev), 5000);
            }

            return prev.map(t => (t.id === updatedTx.id ? updatedTx : t));
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, supabase]);

  // ── Compute today's stats ─────────────────────────────────────────────
  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayMs = startOfDay.getTime();

    const todayTx = transactions.filter(t => new Date(t.created_at).getTime() >= todayMs);
    const completed = todayTx.filter(t => t.status === 'completed');
    const pending = todayTx.filter(t => t.status === 'pending');

    setStats({
      totalSales: completed.reduce((sum, t) => sum + Number(t.amount), 0),
      completedCount: completed.length,
      pendingCount: pending.length,
    });
  }, [transactions]);

  if (authLoading || role !== 'owner') {
    return (
      <div className="max-w-7xl mx-auto p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[var(--color-brand-pink-dark)]" size={32} />
      </div>
    );
  }

  // Generate the clean checkout URL encoded in the QR
  const qrUrl = selectedProduct
    ? `${CHECKOUT_BASE_URL}?productId=${encodeURIComponent(selectedProduct.id)}&price=${Math.round(selectedProduct.price * 100)}&name=${encodeURIComponent(selectedProduct.name)}`
    : '';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in">
      <style>{`
        @keyframes flashGreen {
          0%   { background-color: rgba(34,197,94,0.45); transform: scale(1.02); box-shadow: 0 0 24px rgba(34,197,94,0.4); }
          30%  { background-color: rgba(34,197,94,0.25); }
          100% { background-color: transparent; transform: scale(1); box-shadow: none; }
        }
        .flash-green { animation: flashGreen 5s ease-out; }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .pulse-ring { animation: pulseRing 1.5s ease-out 2; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-[var(--color-surface-light)] hover:bg-[var(--color-brand-pink-light)] flex items-center justify-center transition-colors border border-[var(--color-border-light)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">QR Payment Board</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">On-site self-checkout &mdash; live payment feed</p>
          </div>
        </div>
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-emerald-700">LIVE</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Today&apos;s Sales</span>
          </div>
          <p className="text-xl font-black text-[var(--color-text-primary)]">&euro;{stats.totalSales.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Completed</span>
          </div>
          <p className="text-xl font-black text-[var(--color-text-primary)]">{stats.completedCount}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Pending</span>
          </div>
          <p className="text-xl font-black text-[var(--color-text-primary)]">{stats.pendingCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT: Product Selector ───────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
            <ShoppingBag size={16} className="text-[var(--color-brand-pink-dark)]" />
            Select Product
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {PRODUCTS.map((prod) => {
              const isSelected = selectedProduct?.id === prod.id;
              return (
                <button
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`text-left p-4 rounded-[var(--radius-xl)] transition-all flex flex-col justify-between border cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-brand-pink-light)] border-[var(--color-brand-pink)] ring-1 ring-[var(--color-brand-pink)] shadow-[var(--shadow-pink)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-brand-pink-muted)] hover:shadow-sm'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)] text-sm">{prod.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">{prod.description}</p>
                  </div>
                  <span className="text-lg font-black text-[var(--color-text-accent)] mt-2">
                    &euro;{prod.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CENTER: QR Code Display ──────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div
            ref={wrapperRef}
            className={`relative ${
              isFullscreen
                ? 'fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8 text-white'
                : 'rounded-[var(--radius-2xl)] p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white shadow-xl flex flex-col items-center border border-gray-800/60'
            }`}
          >
            {!isFullscreen && (
              <>
                <div className="absolute right-0 top-0 w-44 h-44 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-full -mr-12 -mt-12 pointer-events-none" />
                <div className="absolute left-0 bottom-0 w-36 h-36 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full -ml-12 -mb-12 pointer-events-none" />
              </>
            )}

            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="flex items-center gap-3 w-full border-b border-gray-800/70 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-lg">
                  &euro;
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-200">On-Site Checkout QR</h3>
                  <p className="text-xs text-gray-400">Scan to pay on phone</p>
                </div>
              </div>

              {selectedProduct ? (
                <div className="flex flex-col items-center w-full">
                  <div className="text-center mb-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-pink-400 font-semibold mb-1">
                      {selectedProduct.name}
                    </p>
                    <p className="text-3xl font-black text-white">
                      &euro;{selectedProduct.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl shadow-2xl transition-all hover:scale-[1.01]">
                    <QRCodeSVG
                      value={qrUrl}
                      size={isFullscreen ? 360 : 200}
                      level="H"
                      bgColor="white"
                      fgColor="#111827"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5 justify-center">
                    <Smartphone size={12} className="text-pink-400" />
                    Client scans with phone camera to pay
                  </p>

                  <div className="flex items-center gap-3 mt-5">
                    {!isFullscreen ? (
                      <button
                        onClick={enterFullscreen}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 text-xs font-bold hover:scale-105 transition-all shadow-md cursor-pointer hover:bg-gray-100"
                      >
                        <Maximize2 size={13} /> Fullscreen
                      </button>
                    ) : (
                      <button
                        onClick={exitFullscreen}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 text-xs font-bold hover:scale-105 transition-all shadow-md cursor-pointer hover:bg-gray-100"
                      >
                        <Minimize2 size={13} /> Exit
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-gray-500 text-sm">
                  Select a product to view QR code
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Real-Time Transaction Feed ───────────────────────── */}
        <div className="lg:col-span-4">
          <div className="glass-card p-5 h-full flex flex-col" style={{ maxHeight: '640px' }}>
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Radio size={16} className="text-emerald-500" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Live Payment Feed</h2>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Realtime
              </span>
            </div>

            {feedLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-[var(--color-brand-pink-dark)]" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <Package size={32} className="text-[var(--color-text-muted)] mb-3" />
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No transactions yet</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Payments will appear here instantly</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {transactions.map((tx) => {
                  const isFlashing = flashId === tx.id;
                  const isCompleted = tx.status === 'completed';
                  const isPending = tx.status === 'pending';
                  const isFailed = tx.status === 'failed';

                  return (
                    <div
                      key={tx.id}
                      className={`rounded-xl p-3 border transition-all ${
                        isFlashing
                          ? 'flash-green border-emerald-300 pulse-ring'
                          : isCompleted
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : isPending
                              ? 'bg-amber-50/60 border-amber-200'
                              : 'bg-red-50/60 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            {isCompleted && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                            {isPending && <Clock size={14} className="text-amber-600 shrink-0" />}
                            {isFailed && <XCircle size={14} className="text-red-600 shrink-0" />}
                            <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                              {tx.product_name || 'Unknown Item'}
                            </span>
                          </div>
                          {isFlashing && (
                            <p className="text-sm font-black text-emerald-700 mb-1 animate-fade-in">
                              Payment Successful &mdash; {tx.product_name || 'Item'} &mdash; &euro;{Number(tx.amount).toFixed(2)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
                            <span>&euro;{Number(tx.amount).toFixed(2)}</span>
                            {Number(tx.discount_applied) > 0 && (
                              <span className="text-emerald-600 font-semibold">&minus;&euro;{Number(tx.discount_applied).toFixed(2)} voucher</span>
                            )}
                            <span>{formatTime(tx.created_at)}</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : isPending
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
