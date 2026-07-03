'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, Maximize2, Minimize2, ShoppingBag, Loader2, RefreshCw, Smartphone
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

const PRODUCTS: ProductItem[] = [
  { id: 'socks-16', name: 'Merakí Cozy Socks', price: 16.00, description: 'Soft, organic cotton salon socks' },
  { id: 'tshirt-25', name: 'Merakí Premium Tee', price: 25.00, description: 'Relaxed fit, ultra-soft daily wear' },
  { id: 'cap-20', name: 'Signature Dad Cap', price: 20.00, description: 'Embroidered logo, adjustable strap' },
  { id: 'towel-12', name: 'Microfiber Salon Towel', price: 12.50, description: 'Quick-dry, absorbent hair towel' },
  { id: 'tote-10', name: 'Canvas Tote Bag', price: 10.00, description: 'Eco-friendly, spacious everyday carry' },
  { id: 'combo-45', name: 'Ultimate Care Combo', price: 45.00, description: 'Socks + Tee + Tote bag premium bundle' },
];

export default function QrPaymentsPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(PRODUCTS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Role guard: Only owner role can view this admin dashboard
  useEffect(() => {
    if (authLoading) return;
    if (role !== 'owner') {
      router.replace('/dashboard');
    }
  }, [authLoading, role, router]);

  // Fullscreen handlers
  const enterFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {
      // ignore
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (authLoading || role !== 'owner') {
    return (
      <div className="max-w-7xl mx-auto p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[var(--color-brand-pink-dark)]" size={32} />
      </div>
    );
  }

  // Generate the static JSON QR payload representing product meta-information
  const qrPayload = selectedProduct
    ? JSON.stringify({
        type: 'meraki-product',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        priceInCents: Math.round(selectedProduct.price * 100),
      })
    : '';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-[var(--color-surface-light)] hover:bg-[var(--color-brand-pink-light)] flex items-center justify-center transition-colors border border-[var(--color-border-light)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">QR Payment Board</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Create purchase QR codes for on-site client self-checkout</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Product Selector Grid */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
            <ShoppingBag size={18} className="text-[var(--color-brand-pink-dark)]" />
            Select Store Inventory Item
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRODUCTS.map((prod) => {
              const isSelected = selectedProduct?.id === prod.id;
              return (
                <button
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`text-left p-5 rounded-[var(--radius-xl)] transition-all flex flex-col justify-between border cursor-pointer h-36 ${
                    isSelected
                      ? 'bg-[var(--color-brand-pink-light)] border-[var(--color-brand-pink)] ring-1 ring-[var(--color-brand-pink)] shadow-[var(--shadow-pink)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-brand-pink-muted)] hover:shadow-sm'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)] text-sm sm:text-base">{prod.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{prod.description}</p>
                  </div>
                  <span className="text-lg font-black text-[var(--color-text-accent)] mt-3">
                    €{prod.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: QR Payload Display Card */}
        <div className="lg:col-span-5">
          <div
            ref={wrapperRef}
            className={`relative ${
              isFullscreen
                ? 'fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8 text-white'
                : 'rounded-[var(--radius-2xl)] p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white shadow-xl flex flex-col items-center border border-gray-800/60'
            }`}
          >
            {/* Ambient glows (hidden in fullscreen to keep focus on QR) */}
            {!isFullscreen && (
              <>
                <div className="absolute right-0 top-0 w-44 h-44 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-full -mr-12 -mt-12 pointer-events-none" />
                <div className="absolute left-0 bottom-0 w-36 h-36 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full -ml-12 -mb-12 pointer-events-none" />
              </>
            )}

            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="flex items-center gap-3 w-full border-b border-gray-800/70 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-lg">
                  €
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-200">On-Site Checkout QR</h3>
                  <p className="text-xs text-gray-400">Ready to scan by client app</p>
                </div>
              </div>

              {selectedProduct ? (
                <div className="flex flex-col items-center w-full">
                  {/* Active Selected Item Header Info */}
                  <div className="text-center mb-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-pink-400 font-semibold mb-1">
                      {selectedProduct.name}
                    </p>
                    <p className="text-3xl font-black text-white">
                      €{selectedProduct.price.toFixed(2)}
                    </p>
                  </div>

                  {/* QR Core Container */}
                  <div className="bg-white p-6 rounded-3xl shadow-2xl transition-all hover:scale-[1.01]">
                    <QRCodeSVG
                      value={qrPayload}
                      size={isFullscreen ? 360 : 220}
                      level="H"
                      bgColor="white"
                      fgColor="#111827"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-5 flex items-center gap-1.5 justify-center">
                    <Smartphone size={12} className="text-pink-400" />
                    Scan with Merakí app on client phone to pay
                  </p>

                  {/* Action Tools */}
                  <div className="flex items-center gap-3 mt-6">
                    {!isFullscreen ? (
                      <button
                        onClick={enterFullscreen}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 text-xs font-bold hover:scale-105 transition-all shadow-md cursor-pointer hover:bg-gray-100"
                      >
                        <Maximize2 size={13} /> Display Fullscreen
                      </button>
                    ) : (
                      <button
                        onClick={exitFullscreen}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 text-xs font-bold hover:scale-105 transition-all shadow-md cursor-pointer hover:bg-gray-100"
                      >
                        <Minimize2 size={13} /> Exit Fullscreen
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
      </div>

      {/* Guide details */}
      <div className="mt-8 glass-card p-6 border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)]">
        <h4 className="text-xs uppercase tracking-wider font-bold text-[var(--color-text-muted)] mb-3">On-Site Self Checkout Instructions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[var(--color-text-secondary)]">
          <div className="space-y-1">
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand-pink-light)] text-[var(--color-text-accent)] font-bold flex items-center justify-center text-xs mb-2">1</div>
            <p className="font-semibold text-[var(--color-text-primary)]">Admin selects product</p>
            <p className="text-xs">Click any of the merchandise cards above to load the item metadata into the QR payload.</p>
          </div>
          <div className="space-y-1">
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand-pink-light)] text-[var(--color-text-accent)] font-bold flex items-center justify-center text-xs mb-2">2</div>
            <p className="font-semibold text-[var(--color-text-primary)]">Client scans QR</p>
            <p className="text-xs">Client opens "Scan to Pay" from their Merakí mobile app and scans the QR code on the tablet/screen.</p>
          </div>
          <div className="space-y-1">
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand-pink-light)] text-[var(--color-text-accent)] font-bold flex items-center justify-center text-xs mb-2">3</div>
            <p className="font-semibold text-[var(--color-text-primary)]">Personalized Checkout</p>
            <p className="text-xs">Client phone calls secure edge function, checks their active vouchers, applies discounts, and opens Stripe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
