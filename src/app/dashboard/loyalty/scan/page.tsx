'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import {
  ArrowLeft, Camera, Radio, Loader2, X, Sparkles, Gift, Star, RefreshCw, ScanLine,
} from 'lucide-react';
import { parseScanCode, shouldDebounceScan } from '@/lib/loyalty/scan';

// html5-qrcode is browser-only; load lazily
type Html5QrcodeModule = typeof import('html5-qrcode');

interface LoyaltyCard {
  id: string;
  master_id: string;
  name: string;
  description: string | null;
  stamps_required: number;
  reward_type: string;
  reward_value: number | null;
  is_active: boolean | null;
}

interface MasterInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

type ScanResult = {
  kind: 'stamp';
  cardName: string;
  masterName: string;
  collected: number;
  required: number;
  rewardAvailable: boolean;
  message?: string;
};

const QR_REGION_ID = 'meraki-qr-reader';

export default function LoyaltyScanPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();

  const isClient = role === 'client';

  // Mode: camera | nfc
  const [mode, setMode] = useState<'camera' | 'nfc'>('camera');

  // Camera state
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const moduleRef = useRef<Html5QrcodeModule | null>(null);
  const lastDecodedRef = useRef<{ text: string; at: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // NFC state
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  const nfcAbortRef = useRef<AbortController | null>(null);

  // Processing scan
  const [processing, setProcessing] = useState(false);

  // Last result banner
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  // Role guard
  useEffect(() => {
    if (authLoading) return;
    if (role && role !== 'client') {
      router.replace('/dashboard/loyalty');
    }
  }, [authLoading, role, router]);

  // Detect NFC support (Web NFC: Chromium Android only)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNfcSupported(true);
    }
  }, []);

  // ─── Stamp handler ────────────────────────────────────────────
  const handleStampScan = useCallback(
    async (masterId: string) => {
      if (!user) return;
      if (masterId === user.id) {
        showToast('You cannot scan your own QR code', 'error');
        return;
      }
      setProcessing(true);
      try {
        const { data, error } = await supabase.rpc('process_stamp_scan', {
          p_master_id: masterId,
          p_client_id: user.id,
        });
        if (error) throw error;
        
        const result = data as {
          success: boolean;
          stamps_collected?: number;
          stamps_required?: number;
          card_name?: string;
          master_name?: string;
          reward_available?: boolean;
          message: string;
        } | null;

        if (!result || result.success === false) {
          showToast(result?.message || 'Failed to process stamp', 'error');
          return;
        }

        setLastResult({
          kind: 'stamp',
          cardName: result.card_name || 'Loyalty Card',
          masterName: result.master_name || 'Master',
          collected: result.stamps_collected ?? 0,
          required: result.stamps_required ?? 8,
          rewardAvailable: result.reward_available ?? false,
          message: result.message,
        });

        showToast(
          result.reward_available ? 'Reward unlocked! 🎉' : result.message || 'Stamp added!',
          'success'
        );
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Stamp failed', 'error');
      } finally {
        setProcessing(false);
      }
    },
    [user, supabase, showToast],
  );

  const processDecodedText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const now = Date.now();

      if (shouldDebounceScan(text, now, lastDecodedRef.current)) {
        return;
      }
      lastDecodedRef.current = { text, at: now };

      const result = parseScanCode(text);
      if (result.type === 'invalid') {
        showToast('Invalid stamp QR', 'error');
        return;
      }

      if (result.type === 'stamp') {
        await handleStampScan(result.value);
      }
    },
    [handleStampScan, showToast],
  );

  // ─── Camera scanner lifecycle ────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    const inst = scannerRef.current;
    if (!inst) return;
    try {
      const state = inst.getState();
      // 2 = SCANNING, 3 = PAUSED in html5-qrcode
      if (state === 2 || state === 3) {
        await inst.stop();
      }
      await inst.clear();
    } catch {
      // ignore
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      if (!moduleRef.current) {
        moduleRef.current = await import('html5-qrcode');
      }
      const { Html5Qrcode } = moduleRef.current;
      const inst = new Html5Qrcode(QR_REGION_ID, { verbose: false });
      scannerRef.current = inst;
      await inst.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (decodedText) => {
          void processDecodedText(decodedText);
        },
        () => {
          // ignore per-frame errors
        },
      );
      setScanning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start camera';
      setCameraError(msg);
      setScanning(false);
    }
  }, [processDecodedText]);

  // Auto-start camera when in camera mode
  useEffect(() => {
    if (!isClient) return;
    if (mode !== 'camera') {
      void stopScanner();
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startScanner();
    return () => {
      void stopScanner();
    };
  }, [mode, isClient, startScanner, stopScanner]);

  // ─── NFC scanner lifecycle ───────────────────────────────────────────────
  const stopNfc = useCallback(() => {
    nfcAbortRef.current?.abort();
    nfcAbortRef.current = null;
    setNfcReading(false);
  }, []);

  const startNfc = useCallback(async () => {
    if (!nfcSupported) {
      showToast('NFC not supported on this device', 'error');
      return;
    }
    try {
      const ctrl = new AbortController();
      nfcAbortRef.current = ctrl;
      // @ts-expect-error: NDEFReader exists in Chromium Android
      const reader = new window.NDEFReader();
      await reader.scan({ signal: ctrl.signal });
      setNfcReading(true);
      reader.onreading = (event: { message: { records: Array<{ recordType: string; data: ArrayBuffer; encoding?: string }> }; serialNumber: string }) => {
        const decoder = new TextDecoder();
        let index = 0;
        const records = event.message.records;

        function processChunk() {
          const end = Math.min(index + 10, records.length);
          for (; index < end; index++) {
            const record = records[index];
            if (record.recordType === 'text' || record.recordType === 'url') {
              const text = decoder.decode(record.data);
              // strip URL prefix if it's a URL pointing to our scheme
              const stripped = text.replace(/^https?:\/\/[^?#]*[?#]?(?:meraki=)?/, '');
              void processDecodedText(stripped || text);
            }
          }
          if (index < records.length) {
            setTimeout(processChunk, 0);
          }
        }
        processChunk();
      };
      reader.onreadingerror = () => {
        showToast('NFC read error', 'error');
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start NFC';
      showToast(msg, 'error');
      setNfcReading(false);
    }
  }, [nfcSupported, processDecodedText, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mode !== 'nfc') stopNfc();
    return () => stopNfc();
  }, [mode, stopNfc]);

  // ─── Render ──────────────────────────────────────────────────────────────
  if (authLoading || !isClient) {
    return (
      <div className="max-w-2xl mx-auto p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-brand-pink-dark)]" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/loyalty"
          className="w-10 h-10 rounded-full bg-[var(--color-surface-light)] hover:bg-[var(--color-brand-pink-light)] flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Scan to Earn</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Collect loyalty stamps at the salon</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex p-1 mb-6 rounded-xl bg-[var(--color-surface-light)]">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'camera'
              ? 'bg-white shadow-sm text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Camera size={14} /> QR Camera
        </button>
        <button
          onClick={() => setMode('nfc')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'nfc'
              ? 'bg-white shadow-sm text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Radio size={14} /> NFC Tag
        </button>
      </div>

      {/* Camera mode */}
      {mode === 'camera' && (
        <div className="glass-card p-5 mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
            <div id={QR_REGION_ID} className="w-full h-full [&_video]:object-cover [&_video]:!w-full [&_video]:!h-full" />
            {/* Overlay frame */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-3/5 aspect-square border-2 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <div className="w-full h-full relative">
                  <ScanLine className="absolute inset-0 m-auto text-white/70 animate-pulse" size={40} />
                </div>
              </div>
            </div>
            {/* Status pill */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {scanning ? 'Scanning…' : 'Idle'}
            </div>
            {/* Processing overlay */}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-start gap-2">
              <X size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Camera unavailable</p>
                <p className="text-xs mt-0.5">{cameraError}</p>
                <button
                  onClick={() => void startScanner()}
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold cursor-pointer"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--color-text-muted)] mt-3 text-center">
            Point your camera at the master&apos;s QR code to collect a stamp.
          </p>
        </div>
      )}

      {/* NFC mode */}
      {mode === 'nfc' && (
        <div className="glass-card p-8 mb-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center shadow-lg mb-4">
            <Radio size={36} className="text-white" />
          </div>
          {!nfcSupported ? (
            <>
              <p className="font-bold text-[var(--color-text-primary)]">NFC not supported</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Web NFC works on Chrome / Edge for Android. Use the camera scanner instead.
              </p>
            </>
          ) : nfcReading ? (
            <>
              <p className="font-bold text-[var(--color-text-primary)]">Tap an NFC tag…</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Hold your phone near the master&apos;s NFC sticker.</p>
              <button
                onClick={stopNfc}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] text-sm font-semibold cursor-pointer"
              >
                <X size={14} /> Stop
              </button>
            </>
          ) : (
            <>
              <p className="font-bold text-[var(--color-text-primary)]">Ready to scan</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Tap the button, then hold your phone near the salon&apos;s NFC tag.</p>
              <button
                onClick={() => void startNfc()}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full btn-pink text-sm font-bold cursor-pointer hover:scale-105 transition-transform"
              >
                <Radio size={14} /> Start NFC scan
              </button>
            </>
          )}
        </div>
      )}

      {/* Last scan result */}
      {lastResult && (
        <div className="glass-card p-5 mb-6 border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--color-text-primary)]">
                {lastResult.rewardAvailable ? 'Reward unlocked!' : 'Stamp added'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {lastResult.cardName} • {lastResult.masterName} • {lastResult.collected}/{lastResult.required}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Array.from({ length: lastResult.required }).map((_, i) => {
              const filled = i < lastResult.collected;
              return (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    filled
                      ? 'bg-gradient-to-br from-amber-400 to-pink-400 border-transparent shadow-sm'
                      : 'bg-white/60 border-black/5'
                  }`}
                >
                  <Star size={12} className={filled ? 'text-white' : 'text-black/10'} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help card */}
      <div className="glass-card p-5">
        <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-text-muted)] mb-2">How it works</p>
        <ul className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
          <li className="flex gap-2"><span className="text-amber-500">•</span> Scan the master&apos;s <strong>Stamp QR</strong> or tap the NFC tag after each completed appointment to collect a stamp.</li>
          <li className="flex gap-2"><span className="text-amber-500">•</span> Unlock and redeem rewards automatically once you have collected enough stamps.</li>
        </ul>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-in { animation: scaleIn 0.25s ease-out; }
        #${QR_REGION_ID} video { width: 100% !important; height: 100% !important; object-fit: cover; }
      `}</style>
    </div>
  );
}
