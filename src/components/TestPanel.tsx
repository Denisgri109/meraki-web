'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  FlaskConical, X, UserCog, ChevronRight, Calendar, MessageSquare,
  ShoppingBag, Gift, RefreshCw, Database, Trash2, Loader2, CheckCircle2,
  AlertCircle, ClipboardList, Send, Settings as SettingsIcon, RotateCcw,
} from 'lucide-react';

// ─── Test accounts whitelist ──────────────────────────────────────────────
const TEST_ACCOUNTS: ReadonlyArray<{ email: string; label: string; id: string; role: 'owner' | 'client' | 'master' }> = [
  { email: 'test@gmail.com',       label: 'Test (Owner)', id: '744b77f1-e94f-4918-9c04-3b9f47288377', role: 'owner' },
  { email: 'testclient@gmail.com', label: 'Test Client',  id: '3f19e0f2-7e0b-4dc2-8a8e-3ac1939d9f1f', role: 'client' },
  { email: 'daxyburn@gmail.com',   label: 'Daxyburn',     id: 'aab4ab46-76d5-4a98-8487-2a6f1b8a2a1b', role: 'master' },
];
const TEST_EMAILS = TEST_ACCOUNTS.map((a) => a.email);
const emailToId = (email: string): string | undefined =>
  TEST_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase())?.id;

// ─── Per-account password cache ─────────────────────────────────────────
// Each test account stores its OWN password (they can differ). Switching
// between accounts therefore never invalidates another account's cache.
const PASSWORD_STORAGE_PREFIX = 'meraki:test-panel:password:';
const LEGACY_PASSWORD_KEY = 'meraki:test-panel:password';

const passwordKey = (email: string) => `${PASSWORD_STORAGE_PREFIX}${email.toLowerCase()}`;

function readSavedPassword(email: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(passwordKey(email)) || '';
  } catch {
    return '';
  }
}

function saveSavedPassword(email: string, pw: string) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(passwordKey(email), pw); } catch { /* ignore */ }
}

function clearSavedPassword(email: string) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(passwordKey(email)); } catch { /* ignore */ }
}

function clearAllSavedPasswords() {
  if (typeof window === 'undefined') return;
  try {
    for (const a of TEST_ACCOUNTS) window.localStorage.removeItem(passwordKey(a.email));
    window.localStorage.removeItem(LEGACY_PASSWORD_KEY);
  } catch { /* ignore */ }
}

// ─── Seed settings (persistent overrides applied to every seed action) ───
interface SeedSettings {
  clientEmail: string;        // who plays the client side
  masterEmail: string;        // who plays the master/professional side
  minutesOffset: string;      // booking start offset from now (minutes, signed). '' = action default
  durationMinutes: string;    // booking duration (minutes). '' = service default
  price: string;              // booking/order price (€). '' = service/product default
  notes: string;              // overrides `notes` field on appointments/orders/booking consults
  message: string;            // overrides client message / first chat message / consult message
  loyaltyAmount: string;      // amount used when clicking loyalty actions. '' = action default
  orderQuantity: string;      // quantity used for order actions. '' = action default
}

const DEFAULT_SETTINGS: SeedSettings = {
  clientEmail: 'testclient@gmail.com',
  masterEmail: 'daxyburn@gmail.com',
  minutesOffset: '',
  durationMinutes: '',
  price: '',
  notes: '',
  message: '',
  loyaltyAmount: '',
  orderQuantity: '',
};

const SETTINGS_STORAGE_KEY = 'meraki:test-panel:settings';

function readSettings(): SeedSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<SeedSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(s: SeedSettings) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ─── DB seed actions (executed via test-panel-seed edge function) ──────
interface SeedAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: string;
  action: string;
  params?: Record<string, unknown>;
  destructive?: boolean;
}

const SEED_ACTIONS: SeedAction[] = [
  // Bookings / Appointments
  {
    id: 'appt-pending',
    label: 'Booking — Pending',
    description: 'Create a pending appointment (testclient → daxyburn) in 1 hour',
    icon: Calendar,
    category: 'Bookings',
    action: 'create_appointment',
    params: { status: 'pending', when: 'future', minutes_offset: 60 },
  },
  {
    id: 'appt-confirmed',
    label: 'Booking — Confirmed',
    description: 'Create a confirmed appointment tomorrow',
    icon: Calendar,
    category: 'Bookings',
    action: 'create_appointment',
    params: { status: 'confirmed', when: 'future', minutes_offset: 1440 },
  },
  {
    id: 'appt-completed',
    label: 'Booking — Completed (past)',
    description: 'Create a past appointment marked completed',
    icon: Calendar,
    category: 'Bookings',
    action: 'create_appointment',
    params: { status: 'completed', when: 'past', minutes_offset: -1440 },
  },
  {
    id: 'appt-cancelled',
    label: 'Booking — Cancelled',
    description: 'Create a cancelled appointment',
    icon: Calendar,
    category: 'Bookings',
    action: 'create_appointment',
    params: { status: 'cancelled', when: 'future', minutes_offset: 240 },
  },

  // Consultations
  {
    id: 'photo-consult-pending',
    label: 'Photo Consultation — Pending',
    description: 'Client requests a photo consultation from daxyburn',
    icon: ClipboardList,
    category: 'Consultations',
    action: 'create_photo_consultation',
    params: { status: 'pending' },
  },
  {
    id: 'photo-consult-responded',
    label: 'Photo Consultation — Responded',
    description: 'Photo consultation with master reply',
    icon: ClipboardList,
    category: 'Consultations',
    action: 'create_photo_consultation',
    params: {
      status: 'responded',
      master_reply: 'Yes, totally doable! Estimated 2 hours. Book a slot whenever.',
    },
  },
  {
    id: 'booking-consult-pending',
    label: 'Booking Consultation — Pending',
    description: 'Pre-booking consultation request',
    icon: ClipboardList,
    category: 'Consultations',
    action: 'create_booking_consultation',
    params: { status: 'pending' },
  },
  {
    id: 'booking-consult-approved',
    label: 'Booking Consultation — Approved',
    description: 'Pre-booking consultation approved by master',
    icon: ClipboardList,
    category: 'Consultations',
    action: 'create_booking_consultation',
    params: { status: 'approved' },
  },

  // Chat
  {
    id: 'chat-create',
    label: 'Start Chat (client → master)',
    description: 'Create conversation + first message from client',
    icon: MessageSquare,
    category: 'Chat',
    action: 'create_conversation_with_message',
  },
  {
    id: 'chat-reply',
    label: 'Add Master Reply',
    description: 'Append a message from master to the existing chat',
    icon: Send,
    category: 'Chat',
    action: 'add_chat_message',
  },

  // Loyalty
  {
    id: 'loyalty-add-100',
    label: 'Add 100 loyalty points',
    description: 'Increment testclient loyalty_points by 100',
    icon: Gift,
    category: 'Loyalty',
    action: 'add_loyalty_points',
    params: { amount: 100 },
  },
  {
    id: 'loyalty-add-500',
    label: 'Add 500 loyalty points',
    description: 'Increment testclient loyalty_points by 500',
    icon: Gift,
    category: 'Loyalty',
    action: 'add_loyalty_points',
    params: { amount: 500 },
  },

  // Shop
  {
    id: 'order-pending',
    label: 'Create shop order — Pending',
    description: '1× first active product as a pending order',
    icon: ShoppingBag,
    category: 'Shop',
    action: 'create_order',
    params: { status: 'pending', quantity: 1 },
  },
  {
    id: 'order-paid',
    label: 'Create shop order — Paid',
    description: '2× first active product as a paid order',
    icon: ShoppingBag,
    category: 'Shop',
    action: 'create_order',
    params: { status: 'paid', quantity: 2 },
  },

  // Cleanup
  {
    id: 'clear-all',
    label: 'Clear ALL test data',
    description: 'Delete appointments, consultations, chats, orders belonging to the 3 test accounts. Resets loyalty points.',
    icon: Trash2,
    category: 'Cleanup',
    action: 'clear_test_data',
    destructive: true,
  },
];

const CATEGORIES = [...new Set(SEED_ACTIONS.map((s) => s.category))];

interface SeedResult {
  ok: boolean;
  action: string;
  label: string;
  message: string;
  data?: unknown;
  at: number;
}

export function TestPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  // Input state only. Persistent cache lives in localStorage per account.
  const [password, setPassword] = useState<string>('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAccount, setPendingAccount] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Bookings');
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [results, setResults] = useState<SeedResult[]>([]);
  const [settings, setSettings] = useState<SeedSettings>(() => readSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const updateSetting = <K extends keyof SeedSettings>(key: K, value: SeedSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      writeSettings(next);
      return next;
    });
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    writeSettings({ ...DEFAULT_SETTINGS });
  };

  const hasCustomSettings =
    settings.clientEmail !== DEFAULT_SETTINGS.clientEmail ||
    settings.masterEmail !== DEFAULT_SETTINGS.masterEmail ||
    settings.minutesOffset.trim() !== '' ||
    settings.durationMinutes.trim() !== '' ||
    settings.price.trim() !== '' ||
    settings.notes.trim() !== '' ||
    settings.message.trim() !== '' ||
    settings.loyaltyAmount.trim() !== '' ||
    settings.orderQuantity.trim() !== '';

  const userEmail = user?.email?.toLowerCase();
  const isTestAccount = userEmail && TEST_EMAILS.includes(userEmail);

  if (!isTestAccount) return null;

  const pushResult = (r: Omit<SeedResult, 'at'>) => {
    setResults((prev) => [{ ...r, at: Date.now() }, ...prev].slice(0, 8));
  };

  // ─── Account switch ─────────────────────────────────────────────────
  const performSignIn = async (targetEmail: string, pw: string): Promise<string | null> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: targetEmail, password: pw });
    return error?.message ?? null;
  };

  const handleAccountSwitch = async (targetEmail: string, overridePw?: string) => {
    if (targetEmail === userEmail) return;

    // Per-account cache first; fall back to the legacy single-key cache for
    // existing installs that haven't migrated yet.
    const perAccount = readSavedPassword(targetEmail);
    const legacy = typeof window !== 'undefined'
      ? (() => { try { return window.localStorage.getItem(LEGACY_PASSWORD_KEY); } catch { return null; } })()
      : null;
    const pw = overridePw ?? perAccount ?? legacy ?? '';

    if (!pw) {
      setPassword('');
      setPendingAccount(targetEmail);
      setShowPasswordPrompt(true);
      return;
    }

    setSwitching(true);
    setSwitchError(null);

    try {
      const errorMessage = await performSignIn(targetEmail, pw);

      if (errorMessage) {
        const isInvalidCreds =
          /invalid.*credentials/i.test(errorMessage) ||
          /invalid_grant/i.test(errorMessage) ||
          /invalid login/i.test(errorMessage);

        if (isInvalidCreds) {
          // Wrong password for THIS account only. Clear only this account's
          // cache (legacy key too, in case it was supplying the bad value).
          clearSavedPassword(targetEmail);
          if (typeof window !== 'undefined') {
            try { window.localStorage.removeItem(LEGACY_PASSWORD_KEY); } catch { /* ignore */ }
          }
          setPassword('');
          setPendingAccount(targetEmail);
          setSwitchError(`Saved password is wrong for ${targetEmail}. Enter the correct one.`);
          setShowPasswordPrompt(true);
          setSwitching(false);
          return;
        }

        setSwitchError(errorMessage);
        setSwitching(false);
        return;
      }

      // The supplied password worked. If it came from the legacy key or from
      // an explicit prompt, persist it under the per-account key so future
      // switches don't need to ask again.
      if (perAccount !== pw) saveSavedPassword(targetEmail, pw);

      // Success → hard reload to reset client state
      setOpen(false);
      setSwitching(false);
      window.location.assign('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Switch failed';
      setSwitchError(message);
      setSwitching(false);
    }
  };

  const handlePasswordSubmit = () => {
    const pw = password.trim();
    if (!pw || !pendingAccount) {
      setShowPasswordPrompt(false);
      setPendingAccount(null);
      return;
    }
    // Save under the target account's key so this account never re-prompts.
    saveSavedPassword(pendingAccount, pw);
    setShowPasswordPrompt(false);
    const target = pendingAccount;
    setPendingAccount(null);
    handleAccountSwitch(target, pw);
  };

  // ─── DB seed actions ────────────────────────────────────────────────
  // Merge user settings into the action's hardcoded params. Empty strings in
  // settings mean "use the action default / DB default" so we don't send them.
  const buildParams = (act: SeedAction): Record<string, unknown> => {
    const base = { ...(act.params || {}) } as Record<string, unknown>;

    // Actors
    const clientId = emailToId(settings.clientEmail);
    const masterId = emailToId(settings.masterEmail);
    if (clientId) base.client_id = clientId;
    if (masterId) base.master_id = masterId;

    // Free-form text overrides (apply to all actions; edge function ignores unrelated fields)
    if (settings.notes.trim()) base.notes = settings.notes.trim();
    if (settings.message.trim()) base.message = settings.message.trim();

    // Booking-specific overrides
    if (act.action === 'create_appointment') {
      if (settings.minutesOffset.trim()) base.minutes_offset = Number(settings.minutesOffset);
      if (settings.durationMinutes.trim()) base.duration_minutes = Number(settings.durationMinutes);
      if (settings.price.trim()) base.price = Number(settings.price);
    }

    // Loyalty override
    if (act.action === 'add_loyalty_points' && settings.loyaltyAmount.trim()) {
      base.amount = Number(settings.loyaltyAmount);
    }

    // Order overrides
    if (act.action === 'create_order') {
      if (settings.orderQuantity.trim()) base.quantity = Number(settings.orderQuantity);
      if (settings.price.trim()) base.price = Number(settings.price);
    }

    return base;
  };

  const runSeedAction = async (act: SeedAction) => {
    if (act.destructive) {
      const ok = window.confirm(
        `This will delete test data for all 3 test accounts. Continue?`
      );
      if (!ok) return;
    }

    setRunningAction(act.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('test-panel-seed', {
        body: { action: act.action, params: buildParams(act) },
      });

      if (error) {
        pushResult({ ok: false, action: act.action, label: act.label, message: error.message });
        return;
      }
      if (data && (data as { error?: string }).error) {
        const errObj = data as { error: string; details?: string };
        pushResult({
          ok: false,
          action: act.action,
          label: act.label,
          message: `${errObj.error}${errObj.details ? ` — ${errObj.details}` : ''}`,
        });
        return;
      }

      const summary = (data as { summary?: Record<string, number>; row?: unknown }) || {};
      let msg = 'Success';
      if (summary.summary) {
        const total = Object.values(summary.summary).reduce((a, b) => a + b, 0);
        msg = `Cleared ${total} rows: ${Object.entries(summary.summary).map(([k, v]) => `${k}=${v}`).join(', ')}`;
      } else if (summary.row && typeof summary.row === 'object') {
        const r = summary.row as Record<string, unknown>;
        msg = `Created row ${r.id ?? '(no id)'}${r.status ? ` (${r.status})` : ''}`;
      }

      pushResult({ ok: true, action: act.action, label: act.label, message: msg, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      pushResult({ ok: false, action: act.action, label: act.label, message });
    } finally {
      setRunningAction(null);
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  return (
    <>
      {/* ─── FAB ────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer group"
        title="QA Test Panel"
        aria-label="Open test panel"
      >
        <FlaskConical size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* ─── Panel ─────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div
            ref={panelRef}
            className="relative w-full sm:w-[440px] max-h-[90vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in sm:mr-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-2">
                <FlaskConical size={20} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">QA Test Panel</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Account */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-gray-500">Signed in:</span>
              <span className="text-xs font-bold text-gray-800 truncate">{userEmail}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* ── Account switcher ───────────────────────────── */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                  <UserCog size={14} /> Switch Account
                </h3>
                <div className="space-y-1.5">
                  {TEST_ACCOUNTS.map((account) => {
                    const isCurrent = account.email === userEmail;
                    return (
                      <button
                        key={account.email}
                        onClick={() => handleAccountSwitch(account.email)}
                        disabled={isCurrent || switching}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold'
                            : 'bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-700'
                        } ${switching ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                            {account.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{account.label}</p>
                            <p className="text-[10px] text-gray-400">{account.email}</p>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-indigo-500 uppercase">Active</span>
                        ) : switching ? (
                          <RefreshCw size={14} className="animate-spin text-gray-400" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {switchError && (
                  <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-1.5 rounded-lg flex items-start gap-1.5">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    <span>{switchError}</span>
                  </p>
                )}
              </section>

              {/* ── Seed settings ──────────────────────────────── */}
              <section>
                <button
                  onClick={() => setSettingsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <SettingsIcon size={14} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Seed Settings</span>
                    {hasCustomSettings && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${settingsOpen ? 'rotate-90' : ''}`} />
                </button>

                {settingsOpen && (
                  <div className="mt-2 p-3 border border-gray-200 rounded-xl space-y-3 bg-white">
                    {/* Client / Master */}
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Client (signs as)</span>
                        <select
                          value={settings.clientEmail}
                          onChange={(e) => updateSetting('clientEmail', e.target.value)}
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {TEST_ACCOUNTS.map((a) => (
                            <option key={a.email} value={a.email}>{a.label} — {a.email}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Master (other side)</span>
                        <select
                          value={settings.masterEmail}
                          onChange={(e) => updateSetting('masterEmail', e.target.value)}
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {TEST_ACCOUNTS.map((a) => (
                            <option key={a.email} value={a.email}>{a.label} — {a.email}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* Booking timing */}
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Start offset (min)</span>
                        <input
                          type="number"
                          value={settings.minutesOffset}
                          onChange={(e) => updateSetting('minutesOffset', e.target.value)}
                          placeholder="action default"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Duration (min)</span>
                        <input
                          type="number"
                          min="5"
                          value={settings.durationMinutes}
                          onChange={(e) => updateSetting('durationMinutes', e.target.value)}
                          placeholder="service"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Price (€)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.price}
                          onChange={(e) => updateSetting('price', e.target.value)}
                          placeholder="default"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>
                    </div>

                    {/* Loyalty / Order */}
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Loyalty amount</span>
                        <input
                          type="number"
                          value={settings.loyaltyAmount}
                          onChange={(e) => updateSetting('loyaltyAmount', e.target.value)}
                          placeholder="action default"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Order quantity</span>
                        <input
                          type="number"
                          min="1"
                          value={settings.orderQuantity}
                          onChange={(e) => updateSetting('orderQuantity', e.target.value)}
                          placeholder="action default"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>
                    </div>

                    {/* Notes / Message */}
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Notes (appointments / orders / booking consults)
                      </span>
                      <textarea
                        value={settings.notes}
                        onChange={(e) => updateSetting('notes', e.target.value)}
                        placeholder="[QA] Seeded by test panel"
                        rows={2}
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Message (photo consult / chat first message)
                      </span>
                      <textarea
                        value={settings.message}
                        onChange={(e) => updateSetting('message', e.target.value)}
                        placeholder="[QA] Could you do this style for me?"
                        rows={2}
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </label>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-gray-400">Saved automatically.</p>
                      <button
                        onClick={resetSettings}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={11} /> Reset to defaults
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* ── Seed actions ───────────────────────────────── */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                  <Database size={14} /> Database Seeders
                </h3>
                <div className="text-[11px] text-gray-500 mb-3 space-y-1">
                  <p>
                    Service-role inserts via <code className="px-1 py-0.5 bg-gray-100 rounded">test-panel-seed</code>.
                    The signed-in account does NOT affect who the data belongs to — the
                    <strong> Seed Settings</strong> above do.
                  </p>
                  <p>
                    Client: <code className="px-1 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">{settings.clientEmail}</code>
                    {' '}· Master: <code className="px-1 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">{settings.masterEmail}</code>
                  </p>
                </div>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => {
                    const items = SEED_ACTIONS.filter((s) => s.category === category);
                    const isExpanded = expandedCategory === category;
                    return (
                      <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <span className="text-sm font-semibold text-gray-700">{category}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">{items.length}</span>
                            <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            {items.map((act) => {
                              const Icon = act.icon;
                              const isRunning = runningAction === act.id;
                              return (
                                <button
                                  key={act.id}
                                  onClick={() => runSeedAction(act)}
                                  disabled={isRunning}
                                  className={`w-full flex items-start gap-3 px-3 py-2.5 transition-colors text-left border-b last:border-b-0 border-gray-50 cursor-pointer ${
                                    act.destructive
                                      ? 'hover:bg-red-50/60'
                                      : 'hover:bg-indigo-50/60'
                                  } ${isRunning ? 'opacity-60' : ''}`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    act.destructive ? 'bg-red-100' : 'bg-indigo-100'
                                  }`}>
                                    {isRunning ? (
                                      <Loader2 size={14} className={`animate-spin ${act.destructive ? 'text-red-600' : 'text-indigo-600'}`} />
                                    ) : (
                                      <Icon size={14} className={act.destructive ? 'text-red-600' : 'text-indigo-600'} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${act.destructive ? 'text-red-700' : 'text-gray-800'}`}>{act.label}</p>
                                    <p className="text-[11px] text-gray-400 leading-tight">{act.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Recent results ─────────────────────────────── */}
              {results.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Recent results</h3>
                  <div className="space-y-1.5">
                    {results.map((r, i) => (
                      <div
                        key={`${r.at}-${i}`}
                        className={`text-[11px] px-3 py-2 rounded-lg flex items-start gap-2 ${
                          r.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {r.ok ? (
                          <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle size={12} className="mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{r.label}</p>
                          <p className="opacity-80 break-words">{r.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Test accounts only</span>
              <button
                onClick={() => {
                  clearAllSavedPasswords();
                  setPassword('');
                }}
                className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer"
              >
                Clear saved passwords
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Password prompt ──────────────────────────────────── */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowPasswordPrompt(false); setPendingAccount(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Enter Test Password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Password for {pendingAccount ? <code className="px-1 py-0.5 bg-gray-100 rounded">{pendingAccount}</code> : 'this account'}.
              Saved locally for this account only — other accounts keep their own.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowPasswordPrompt(false); setPendingAccount(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer"
              >
                Save & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
