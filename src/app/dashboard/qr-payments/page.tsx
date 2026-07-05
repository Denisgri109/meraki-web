'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { QRCodeSVG } from 'qrcode.react';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants/images';
import {
  ArrowLeft, Maximize2, Minimize2, ShoppingBag, Loader2, Smartphone,
  Radio, CheckCircle2, Clock, XCircle, TrendingUp, Package, Plus,
  Tag, X, Search, Image as ImageIcon, Store, Trash2
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface QrProduct {
  id: string;
  name: string;
  description: string | null;
  retail_price: number;
  image_url: string | null;
  category: string | null;
  stock_count: number | null;
  is_active: boolean | null;
  qr_enabled: boolean;
}

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

const CHECKOUT_BASE_URL = 'https://meraki-ebon.vercel.app/dashboard/checkout';

const EMPTY_NEW_PRODUCT = {
  name: '',
  description: '',
  image_url: '',
  retail_price: '',
  stock_count: '50',
  category: 'On-Site',
};

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
  const { showToast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<QrProduct | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Products
  const [qrProducts, setQrProducts] = useState<QrProduct[]>([]);
  const [shopProducts, setShopProducts] = useState<QrProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showShopPanel, setShowShopPanel] = useState(false);
  const [shopSearch, setShopSearch] = useState('');

  // Add Product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_NEW_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);

  // Realtime transaction feed
  const [transactions, setTransactions] = useState<FeedTransaction[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [stats, setStats] = useState({ totalSales: 0, completedCount: 0, pendingCount: 0 });

  // ── Auth guard (owner-only) ──────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (role !== 'owner') {
      router.replace('/dashboard');
    }
  }, [authLoading, role, router]);

  // ── Fetch products (qr_enabled + shop) ───────────────────────────────────
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, retail_price, image_url, category, stock_count, is_active, qr_enabled')
      .order('name', { ascending: true })
      .limit(200);

    if (error) {
      showToast(error.message, 'error');
      setProductsLoading(false);
      return;
    }
    const all = (data as QrProduct[]) || [];
    const enabled = all.filter((p) => p.qr_enabled && p.is_active !== false);
    const available = all.filter((p) => !p.qr_enabled && p.is_active !== false);
    setQrProducts(enabled);
    setShopProducts(available);
    setSelectedProduct((prev) => prev ? (enabled.find((p) => p.id === prev.id) ?? enabled[0] ?? null) : (enabled[0] ?? null));
    setProductsLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    if (role !== 'owner') return;
    fetchProducts();
  }, [role, fetchProducts]);

  // ── Realtime on products (new/edited items appear live) ──────────────────
  useEffect(() => {
    if (role !== 'owner') return;
    const channel = supabase
      .channel('qr-products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => { fetchProducts(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [role, supabase, fetchProducts]);

  // ── Fetch initial transactions ───────────────────────────────────────────
  useEffect(() => {
    if (role !== 'owner') return;
    let cancelled = false;
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, stripe_session_id, amount, currency, status, product_name, product_id, discount_applied, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!cancelled && !error && data) setTransactions(data as FeedTransaction[]);
      if (!cancelled) setFeedLoading(false);
    };
    fetchInitial();
    return () => { cancelled = true; };
  }, [role, supabase]);

  // ── Realtime transaction feed ────────────────────────────────────────────
  useEffect(() => {
    if (role !== 'owner') return;
    const channel = supabase
      .channel('transactions-realtime-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const newTx = payload.new as FeedTransaction;
          setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)].slice(0, 50));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          const updatedTx = payload.new as FeedTransaction;
          setTransactions((prev) => {
            const existing = prev.find((t) => t.id === updatedTx.id);
            const wasNotCompleted = !existing || existing.status !== 'completed';
            if (wasNotCompleted && updatedTx.status === 'completed') {
              setFlashId(updatedTx.id);
              try { navigator.vibrate?.([100, 50, 200]); } catch { /* unsupported */ }
              setTimeout(() => setFlashId((prev) => (prev === updatedTx.id ? null : prev)), 5000);
            }
            return prev.map((t) => (t.id === updatedTx.id ? updatedTx : t));
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [role, supabase]);

  // ── Compute today's stats ────────────────────────────────────────────────
  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayMs = startOfDay.getTime();
    const todayTx = transactions.filter((t) => new Date(t.created_at).getTime() >= todayMs);
    const completed = todayTx.filter((t) => t.status === 'completed');
    const pending = todayTx.filter((t) => t.status === 'pending');
    setStats({
      totalSales: completed.reduce((sum, t) => sum + Number(t.amount), 0),
      completedCount: completed.length,
      pendingCount: pending.length,
    });
  }, [transactions]);

  // ── Fullscreen handlers ──────────────────────────────────────────────────
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

  // ── Add a new on-site product ────────────────────────────────────────────
  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) { showToast('Enter a product name.', 'error'); return; }
    const priceNum = Number(newProduct.retail_price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) { showToast('Enter a valid price.', 'error'); return; }
    const stockNum = Number(newProduct.stock_count) || 0;

    setSavingProduct(true);
    try {
      const { data, error } = await supabase.from('products').insert({
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || null,
        image_url: newProduct.image_url.trim() || null,
        retail_price: priceNum,
        wholesale_price: priceNum,
        stock_count: stockNum,
        category: newProduct.category.trim() || 'On-Site',
        is_active: true,
        qr_enabled: true,
      }).select();
      if (error) throw error;
      if (data && data[0]) {
        const created = data[0] as unknown as QrProduct;
        setQrProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedProduct(created);
      }
      showToast('Product added to QR board!', 'success');
      setShowAddModal(false);
      setNewProduct(EMPTY_NEW_PRODUCT);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add product', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  // ── Toggle a shop product onto the QR board ──────────────────────────────
  const toggleQrEnabled = async (product: QrProduct, enable: boolean) => {
    const prevQr = [...qrProducts];
    const prevShop = [...shopProducts];
    if (enable) {
      setQrProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
      setShopProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setQrProducts((prev) => prev.filter((p) => p.id !== product.id));
      setShopProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
      if (selectedProduct?.id === product.id) setSelectedProduct(null);
    }
    try {
      const { error } = await supabase.from('products').update({ qr_enabled: enable }).eq('id', product.id);
      if (error) throw error;
      showToast(enable ? `${product.name} added to QR board` : `${product.name} removed from QR board`, 'success');
    } catch (err: unknown) {
      setQrProducts(prevQr);
      setShopProducts(prevShop);
      showToast(err instanceof Error ? err.message : 'Failed to update product', 'error');
    }
  };

  // ── Render gates ─────────────────────────────────────────────────────────
  if (authLoading || role !== 'owner') {
    return (
      <div className="max-w-7xl mx-auto p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[var(--color-brand-pink-dark)]" size={32} />
      </div>
    );
  }

  // The QR URL encodes the real product id; the server resolves the price.
  const qrUrl = selectedProduct
    ? `${CHECKOUT_BASE_URL}?productId=${encodeURIComponent(selectedProduct.id)}&price=${Math.round(selectedProduct.retail_price * 100)}&name=${encodeURIComponent(selectedProduct.name)}`
    : '';

  const filteredShopProducts = shopProducts.filter((p) => {
    const q = shopSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q);
  });

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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-[var(--color-surface-light)] hover:bg-[var(--color-brand-pink-light)] flex items-center justify-center transition-colors border border-[var(--color-border-light)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">QR Payment Board</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">On-site self-checkout — live payment feed</p>
          </div>
        </div>
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
          <p className="text-xl font-black text-[var(--color-text-primary)]">€{stats.totalSales.toFixed(2)}</p>
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
        {/* ── LEFT: Products + Add + Shop toggle ─────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
              <ShoppingBag size={16} className="text-[var(--color-brand-pink-dark)]" />
              Products
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">({qrProducts.length})</span>
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-pink inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
            >
              <Plus size={14} /> Add Product
            </button>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin text-[var(--color-brand-pink-dark)]" />
            </div>
          ) : qrProducts.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <Package size={28} className="mx-auto text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No QR products yet</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Add a product or pull one from the shop below.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {qrProducts.map((prod) => {
                const isSelected = selectedProduct?.id === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    className={`text-left p-3 rounded-2xl transition-all flex items-center gap-3 border cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-brand-pink-light)] border-[var(--color-brand-pink)] ring-1 ring-[var(--color-brand-pink)] shadow-[var(--shadow-pink)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-brand-pink-muted)] hover:shadow-sm'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--color-surface-light)] shrink-0">
                      <img src={prod.image_url || DEFAULT_PRODUCT_IMAGE} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-[var(--color-text-primary)] truncate">{prod.name}</p>
                      {prod.description && (
                        <p className="text-xs text-[var(--color-text-muted)] truncate">{prod.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-[var(--color-text-accent)]">€{Number(prod.retail_price).toFixed(2)}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleQrEnabled(prod, false); }}
                        className="text-[10px] text-[var(--color-text-muted)] hover:text-red-500 mt-0.5 inline-flex items-center gap-0.5"
                        title="Remove from QR board"
                      >
                        <Trash2 size={10} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Shop products collapsible */}
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => setShowShopPanel((v) => !v)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Store size={14} className="text-[var(--color-brand-pink-dark)]" />
                Shop Products
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">({shopProducts.length})</span>
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{showShopPanel ? 'Hide' : 'Show'}</span>
            </button>
            {showShopPanel && (
              <div className="px-3 pb-3 space-y-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search shop products…"
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="input-glass w-full pl-9 py-2 text-xs"
                  />
                </div>
                {filteredShopProducts.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] text-center py-3">
                    {shopProducts.length === 0 ? 'All shop products are already on the board.' : 'No matches.'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {filteredShopProducts.map((prod) => (
                      <div key={prod.id} className="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border-light)]">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--color-surface)] shrink-0">
                          <img src={prod.image_url || DEFAULT_PRODUCT_IMAGE} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{prod.name}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">€{Number(prod.retail_price).toFixed(2)}{prod.category ? ` · ${prod.category}` : ''}</p>
                        </div>
                        <button
                          onClick={() => toggleQrEnabled(prod, true)}
                          className="text-[10px] font-bold text-[var(--color-brand-pink-dark)] hover:text-[var(--color-brand-pink)] inline-flex items-center gap-0.5 shrink-0 px-2 py-1 rounded-lg hover:bg-[var(--color-brand-pink-light)]"
                        >
                          <Plus size={11} /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER: QR Code Display ─────────────────────────────────────── */}
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
                  €
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
                      €{Number(selectedProduct.retail_price).toFixed(2)}
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
                  Select or add a product to view QR code
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Real-Time Transaction Feed ───────────────────────────── */}
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
                              Payment Successful — {tx.product_name || 'Item'} — €{Number(tx.amount).toFixed(2)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
                            <span>€{Number(tx.amount).toFixed(2)}</span>
                            {Number(tx.discount_applied) > 0 && (
                              <span className="text-emerald-600 font-semibold">−€{Number(tx.discount_applied).toFixed(2)} voucher</span>
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

      {/* ── Add Product Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-card w-full max-w-md p-6 shadow-2xl my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <Plus size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Add On-Site Product</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Appears instantly on the QR board</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <label className="label-upper">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="input-glass w-full"
                  placeholder="e.g. Merakí Cozy Socks"
                  disabled={savingProduct}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-upper">Price (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.retail_price}
                    onChange={(e) => setNewProduct({ ...newProduct, retail_price: e.target.value })}
                    className="input-glass w-full"
                    placeholder="16.00"
                    disabled={savingProduct}
                  />
                </div>
                <div>
                  <label className="label-upper">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock_count}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_count: e.target.value })}
                    className="input-glass w-full"
                    placeholder="50"
                    disabled={savingProduct}
                  />
                </div>
              </div>

              <div>
                <label className="label-upper">Category</label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="input-glass w-full"
                  placeholder="On-Site"
                  disabled={savingProduct}
                />
              </div>

              <div>
                <label className="label-upper flex items-center gap-1"><ImageIcon size={11} /> Image URL</label>
                <input
                  type="url"
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  className="input-glass w-full"
                  placeholder="https://… (leave blank for default)"
                  disabled={savingProduct}
                />
                {newProduct.image_url && (
                  <div className="mt-2 w-14 h-14 rounded-xl overflow-hidden bg-[var(--color-surface-light)] border border-[var(--color-border-light)]">
                    <img src={newProduct.image_url} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="label-upper">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="input-glass w-full resize-none"
                  rows={2}
                  placeholder="Short description shown to the customer"
                  disabled={savingProduct}
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-brand-pink-light)] border border-[var(--color-brand-pink-muted)]">
                <Tag size={13} className="text-[var(--color-brand-pink-dark)]" />
                <span className="text-[11px] font-semibold text-[var(--color-brand-pink-dark)]">
                  QR-enabled & active — ready to scan and pay immediately.
                </span>
              </div>

              <button
                onClick={handleAddProduct}
                disabled={savingProduct}
                className="btn-pink w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProduct ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving…</>
                ) : (
                  <><Plus size={16} /> Add to QR Board</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
