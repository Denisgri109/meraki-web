'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, Maximize2, Minimize2, Ticket, Loader2,
} from 'lucide-react';

export default function LoyaltyQrPage() {
  const router = useRouter();
  const { user, role, profile, loading: authLoading } = useAuth();

  const isMasterOrOwner = role === 'master' || role === 'owner';

  // Fullscreen
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Role guard
  useEffect(() => {
    if (authLoading) return;
    if (!isMasterOrOwner) router.replace('/dashboard/loyalty');
  }, [authLoading, isMasterOrOwner, router]);

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

  // Derived values
  const displayValue = user ? `stamp:${user.id}` : '';
  const masterName = profile?.full_name || 'Your salon';

  if (authLoading || !isMasterOrOwner) {
    return (
      <div className="max-w-3xl mx-auto p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-brand-pink-dark)]" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/loyalty"
            className="w-10 h-10 rounded-full bg-[var(--color-surface-light)] hover:bg-[var(--color-brand-pink-light)] flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Loyalty Stamp QR</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Display this QR for clients to collect stamps</p>
          </div>
        </div>
      </div>

      {/* QR display card (also acts as fullscreen target) */}
      <div
        ref={wrapperRef}
        className={`relative ${
          isFullscreen
            ? 'fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8 text-white'
            : 'rounded-[var(--radius-2xl)] p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl mb-6 overflow-hidden'
        }`}
      >
        {!isFullscreen && (
          <>
            <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute left-1/2 bottom-0 w-32 h-32 bg-gradient-to-t from-purple-500/15 to-transparent rounded-full -mb-12 pointer-events-none" />
          </>
        )}

        <div className={`relative z-10 flex flex-col items-center ${isFullscreen ? 'w-full max-w-2xl' : ''}`}>
          {isFullscreen && (
            <p className="text-white/60 text-xs uppercase tracking-[0.3em] mb-4">{masterName}</p>
          )}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`rounded-2xl flex items-center justify-center shadow-lg ${
                isFullscreen ? 'w-12 h-12 bg-gradient-to-br from-amber-400 to-pink-400' : 'w-10 h-10 bg-gradient-to-br from-amber-400 to-pink-400'
              }`}
            >
              <Ticket size={isFullscreen ? 24 : 18} className="text-white" />
            </div>
            <div>
              <h3 className={`font-bold ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                Collect a loyalty stamp
              </h3>
              <p className={`text-white/70 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                Clients scan this static QR to stamp their loyalty card
              </p>
            </div>
          </div>

          <div className={`bg-white rounded-3xl shadow-2xl ${isFullscreen ? 'p-12' : 'p-8'}`}>
            {displayValue ? (
              <QRCodeSVG
                value={displayValue}
                size={isFullscreen ? 420 : 260}
                level="H"
                bgColor="white"
                fgColor="#1a1a1a"
              />
            ) : (
              <div className={`${isFullscreen ? 'w-[420px] h-[420px]' : 'w-[260px] h-[260px]'} flex items-center justify-center text-gray-400 text-sm`}>
                No QR available
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 ${isFullscreen ? 'mt-8' : 'mt-6'}`}>
            {!isFullscreen ? (
              <button
                onClick={() => void enterFullscreen()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg"
              >
                <Maximize2 size={14} /> Full screen
              </button>
            ) : (
              <button
                onClick={() => void exitFullscreen()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg"
              >
                <Minimize2 size={14} /> Exit full screen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help */}
      {!isFullscreen && (
        <div className="glass-card p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-text-muted)] mb-2">How clients scan</p>
          <ul className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
            <li className="flex gap-2"><span className="text-amber-500">•</span> They open <strong>Loyalty → Scan</strong> in the Meraki mobile app or website.</li>
            <li className="flex gap-2"><span className="text-amber-500">•</span> Camera reads the QR, and validates their completed appointment automatically.</li>
            <li className="flex gap-2"><span className="text-amber-500">•</span> Only one stamp per completed appointment is allowed to prevent abuse.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
