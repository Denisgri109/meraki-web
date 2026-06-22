'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useModal } from '@/contexts/ModalContext';
import {
  FlaskConical, RefreshCw, ChevronRight, Trash2, Loader2, CheckCircle2, AlertCircle, UserCog,
} from 'lucide-react';
import {
  TEST_ACCOUNTS, TEST_EMAILS, type SeedResult,
} from '@/lib/test-panel';

// ─── Seed action type ────────────────────────────────────────────────────
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

export default function TestPanelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showConfirm, showPrompt } = useModal();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAccount, setPendingAccount] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [results, setResults] = useState<SeedResult[]>([]);

  const userEmail = user?.email?.toLowerCase();
  const isTestAccount = userEmail && TEST_EMAILS.includes(userEmail);

  const pushResult = useCallback((r: Omit<SeedResult, 'at'>) => {
    setResults((prev) => [{ ...r, at: Date.now() }, ...prev].slice(0, 20));
  }, []);

  // ─── Account switch ───────────────────────────────────────────────
  const performSignIn = async (targetEmail: string, pw: string): Promise<string | null> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: targetEmail, password: pw });
    return error?.message ?? null;
  };

  const handleAccountSwitch = async (targetEmail: string, overridePw?: string) => {
    if (targetEmail === userEmail) return;

    if (!overridePw) {
      setPassword('');
      setPendingAccount(targetEmail);
      setShowPasswordPrompt(true);
      return;
    }

    setSwitching(true);
    setSwitchError(null);
    try {
      const errorMessage = await performSignIn(targetEmail, overridePw);
      if (errorMessage) {
        const isInvalidCreds = /invalid.*credentials|invalid_grant|invalid login/i.test(errorMessage);
        if (isInvalidCreds) {
          setPassword('');
          setPendingAccount(targetEmail);
          setSwitchError(`Password wrong for ${targetEmail}. Enter the correct one.`);
          setShowPasswordPrompt(true);
          setSwitching(false);
          return;
        }
        setSwitchError(errorMessage);
        setSwitching(false);
        return;
      }
      setSwitching(false);
      window.location.assign('/dashboard/test-panel');
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Switch failed');
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
    setShowPasswordPrompt(false);
    const target = pendingAccount;
    setPendingAccount(null);
    handleAccountSwitch(target, pw);
  };

  // ─── Seed action runner ───────────────────────────────────────────
  const runSeedAction = async (act: SeedAction) => {
    if (act.action === 'nuclear_wipe') {
      const ok1 = await showConfirm(
        '☢️ NUCLEAR WIPE\n\nThis will permanently delete ALL rows from EVERY content table in the database:\n• All appointments, services, products\n• All orders, payments, refunds\n• All chats, consultations\n• All loyalty cards, stamps, rewards\n• All supplies, inventory\n• All schedules, availability\n\nUser accounts will NOT be deleted.\n\nAre you absolutely sure?',
        '☢️ Nuclear Wipe',
        'Yes, Nuclear Wipe',
        'Cancel',
        'danger'
      );
      if (!ok1) return;
      const typed = await showPrompt('Type NUKE to confirm the nuclear wipe:', 'Nuclear Wipe Confirmation', 'NUKE');
      if (typed?.trim().toUpperCase() !== 'NUKE') {
        pushResult({ ok: false, action: act.action, label: act.label, message: 'Nuclear wipe cancelled — confirmation phrase did not match.' });
        return;
      }
    }

    setRunningAction(act.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('test-panel-seed', {
        body: { action: act.action, params: {} },
      });

      if (error) {
        pushResult({ ok: false, action: act.action, label: act.label, message: error.message });
        return;
      }
      if (data && (data as { error?: string }).error) {
        const errObj = data as { error: string; details?: string };
        pushResult({ ok: false, action: act.action, label: act.label, message: `${errObj.error}${errObj.details ? ` — ${errObj.details}` : ''}` });
        return;
      }

      const summary = (data as { summary?: Record<string, number>; total_deleted?: number; row?: Record<string, unknown> }) || {};
      let msg = 'Success';
      if (summary.summary) {
        const nonZero = Object.entries(summary.summary).filter(([, v]) => v > 0);
        const failed = Object.entries(summary.summary).filter(([, v]) => v === -1);
        const total = summary.total_deleted ?? nonZero.reduce((a, [, v]) => a + v, 0);
        msg = `☢️ Wiped ${total} rows across ${nonZero.length} tables.`;
        if (failed.length > 0) msg += ` ⚠ ${failed.length} tables had errors: ${failed.map(([k]) => k).join(', ')}`;
      }

      pushResult({ ok: true, action: act.action, label: act.label, message: msg, data });
    } catch (err) {
      pushResult({ ok: false, action: act.action, label: act.label, message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setRunningAction(null);
    }
  };

  // ─── Guard ────────────────────────────────────────────────────────
  if (!isTestAccount) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <FlaskConical size={48} className="text-gray-300 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">QA Test Panel</h1>
        <p className="text-gray-500">Sign in with a test account to access the test panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12 pt-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center shadow-lg mb-2">
          <FlaskConical size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">QA Testing Tools</h1>
        <p className="text-sm text-gray-500">Easily switch accounts or perform a clean slate reset.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {/* Account Switcher Section */}
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5 justify-center">
            <UserCog size={14} /> Switch Account
          </h3>
          <div className="space-y-2">
            {TEST_ACCOUNTS.map((account) => {
              const isCurrent = account.email === userEmail;
              return (
                <button
                  key={account.email}
                  onClick={() => handleAccountSwitch(account.email)}
                  disabled={isCurrent || switching}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-semibold shadow-sm'
                      : 'bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/35 text-gray-600'
                  } ${switching ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${isCurrent ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                      {account.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{account.label}</p>
                      <p className="text-[10px] text-gray-400">{account.email}</p>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase bg-indigo-100/50 px-2 py-0.5 rounded-full">Active</span>
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
            <p className="text-xs text-red-500 mt-3 bg-red-50 px-3 py-2 rounded-xl flex items-start gap-1.5">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>{switchError}</span>
            </p>
          )}
        </div>

        {/* Nuclear Wipe / Clean Slate Section */}
        <div className="p-6 bg-gray-50/50">
          <button
            onClick={() => runSeedAction({
              id: 'nuclear-wipe',
              label: 'NUCLEAR WIPE — Clean Slate',
              description: 'Wipe EVERY row from ALL content tables (appointments, services, products, orders, chats, loyalty, supplies, schedule, etc). User accounts are preserved. This is irreversible.',
              icon: Trash2,
              category: 'Cleanup',
              action: 'nuclear_wipe',
              destructive: true
            })}
            disabled={!!runningAction}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-all cursor-pointer ${
              runningAction === 'nuclear-wipe'
                ? 'bg-red-400 cursor-wait'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98]'
            }`}
          >
            {runningAction === 'nuclear-wipe' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Wiping database...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Nuclear Wipe / Clean Slate</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-3">
            Wipes all data tables. Preserves registered user accounts. Irreversible.
          </p>
        </div>
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Reset Status</h3>
            <button onClick={() => setResults([])} className="text-[10px] text-gray-400 hover:text-red-500 cursor-pointer">Clear</button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <div
                key={`${r.at}-${i}`}
                className={`text-[11px] px-3 py-2.5 rounded-xl flex items-start gap-2 ${r.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}
              >
                {r.ok ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : <AlertCircle size={12} className="mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{r.label}</p>
                  <p className="opacity-80 break-words">{r.message}</p>
                </div>
                <span className="text-[9px] text-gray-400 shrink-0">{new Date(r.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <div className="text-center text-[10px] text-gray-400">
        <span>Test accounts only</span>
      </div>

      {/* ─── Password Prompt Modal ────────────────────────────────── */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowPasswordPrompt(false); setPendingAccount(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Enter Test Password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Password for {pendingAccount ? <code className="px-1 py-0.5 bg-gray-100 rounded">{pendingAccount}</code> : 'this account'}.
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
              <button onClick={() => { setShowPasswordPrompt(false); setPendingAccount(null); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
                Cancel
              </button>
              <button onClick={handlePasswordSubmit} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer">
                Save & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
