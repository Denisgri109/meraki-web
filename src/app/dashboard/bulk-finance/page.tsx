'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useModal } from '@/contexts/ModalContext';
import {
  Users, Gift, Ticket, Wallet, Loader2, CheckCircle, AlertCircle, Ban,
} from 'lucide-react';

type TargetScope = 'all' | 'clients' | 'masters';

interface Voucher {
  id: string;
  code: string;
  is_active: boolean;
}

interface ClassPackage {
  id: string;
  name: string;
  total_credits: number;
  price_cents: number;
}

interface BulkResult {
  totalUsers: number;
  successCount: number;
  failureCount: number;
  voucherCode?: string;
  failures: Array<{ userId: string; error: string }>;
}

export default function BulkFinancePage() {
  const { role, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useModal();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const [profileCount, setProfileCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  // Issue Vouchers form
  const [issueVoucherCode, setIssueVoucherCode] = useState('');
  const [issueScope, setIssueScope] = useState<TargetScope>('all');

  // Grant Credits form
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState('bonus');
  const [creditReason, setCreditReason] = useState('');
  const [creditScope, setCreditScope] = useState<TargetScope>('all');

  // Grant Passes form
  const [passPackageId, setPassPackageId] = useState('');
  const [passScope, setPassScope] = useState<TargetScope>('all');

  // Pay Vouchers form
  const [payAmountCents, setPayAmountCents] = useState('');
  const [payDescription, setPayDescription] = useState('');
  const [payScope, setPayScope] = useState<TargetScope>('all');

  const fetchInitialData = useCallback(async () => {
    try {
      const [vRes, pRes, cRes] = await Promise.all([
        fetch('/api/vouchers', { method: 'GET' }),
        fetch('/api/class-packages', { method: 'GET' }),
        fetch('/api/bulk-finance/profile-count?scope=all', { method: 'GET' }),
      ]);

      if (vRes.ok) {
        const { vouchers: vData } = await vRes.json() as { vouchers: Voucher[] };
        setVouchers(vData.filter((v) => v.is_active));
      }

      if (pRes.ok) {
        const { packages: pData } = await pRes.json() as { packages: ClassPackage[] };
        setPackages(pData || []);
      }

      if (cRes.ok) {
        const { count } = await cRes.json() as { count: number };
        setProfileCount(count);
      }
    } catch {
      // Non-critical — forms still work without dropdowns
    }
  }, []);

  useEffect(() => {
    if (role === 'owner') {
      fetchInitialData();
    }
  }, [role, fetchInitialData]);

  const updateProfileCount = async (scope: TargetScope) => {
    try {
      const res = await fetch(`/api/bulk-finance/profile-count?scope=${scope}`, { method: 'GET' });
      if (res.ok) {
        const { count } = await res.json() as { count: number };
        setProfileCount(count);
      }
    } catch {
      // Non-critical
    }
  };

  const handleIssueVouchers = async () => {
    if (!issueVoucherCode) {
      showToast('Select a voucher code', 'error');
      return;
    }
    const confirmed = await showConfirm(
      `This will issue vouchers to ${profileCount} accounts. Continue?`,
      'Confirm Bulk Operation',
      'Execute',
      'Cancel',
      'warning'
    );
    if (!confirmed) return;

    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch('/api/bulk-finance/issue-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode: issueVoucherCode, targetScope: issueScope }),
      });
      const data = await res.json() as BulkResult;
      if (!res.ok) throw new Error((data as unknown as { error: string }).error || 'Failed');

      setResult(data);
      showToast(`Issued to ${data.successCount}/${data.totalUsers} accounts`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleGrantCredits = async () => {
    const amount = Number(creditAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    const confirmed = await showConfirm(
      `This will grant ${amount} credits to ${profileCount} accounts. Continue?`,
      'Confirm Bulk Operation',
      'Execute',
      'Cancel',
      'warning'
    );
    if (!confirmed) return;

    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch('/api/bulk-finance/grant-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          creditType: creditType,
          reason: creditReason || 'Bulk credit grant',
          targetScope: creditScope,
        }),
      });
      const data = await res.json() as BulkResult;
      if (!res.ok) throw new Error((data as unknown as { error: string }).error || 'Failed');

      setResult(data);
      showToast(`Granted to ${data.successCount}/${data.totalUsers} accounts`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleGrantPasses = async () => {
    if (!passPackageId) {
      showToast('Select a package', 'error');
      return;
    }
    const confirmed = await showConfirm(
      `This will grant passes to ${profileCount} accounts. Continue?`,
      'Confirm Bulk Operation',
      'Execute',
      'Cancel',
      'warning'
    );
    if (!confirmed) return;

    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch('/api/bulk-finance/grant-passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: passPackageId, targetScope: passScope }),
      });
      const data = await res.json() as BulkResult;
      if (!res.ok) throw new Error((data as unknown as { error: string }).error || 'Failed');

      setResult(data);
      showToast(`Granted to ${data.successCount}/${data.totalUsers} accounts`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayVouchers = async () => {
    const amountCents = Math.round(Number(payAmountCents) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    const confirmed = await showConfirm(
      `This will distribute pay vouchers (€${(amountCents / 100).toFixed(2)}) to ${profileCount} accounts. Continue?`,
      'Confirm Bulk Operation',
      'Execute',
      'Cancel',
      'warning'
    );
    if (!confirmed) return;

    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch('/api/bulk-finance/pay-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          description: payDescription || 'Pay voucher distribution',
          targetScope: payScope,
        }),
      });
      const data = await res.json() as BulkResult;
      if (!res.ok) throw new Error((data as unknown as { error: string }).error || 'Failed');

      setResult(data);
      showToast(`Distributed to ${data.successCount}/${data.totalUsers} accounts (code: ${data.voucherCode})`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-brand-pink-dark)]" />
      </div>
    );
  }

  if (role !== 'owner') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="glass-card p-12">
          <Ban size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Owner Only</h1>
          <p className="text-[var(--color-text-secondary)]">This page is available for salon owners only.</p>
        </div>
      </div>
    );
  }

  const scopeOptions: { value: TargetScope; label: string }[] = [
    { value: 'all', label: 'All Accounts' },
    { value: 'clients', label: 'Clients Only' },
    { value: 'masters', label: 'Masters Only' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Bulk Finance Operations</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Distribute vouchers, credits, and passes to all accounts</p>
      </div>

      <div className="glass-card p-4 flex items-center gap-3">
        <Users size={18} className="text-[var(--color-brand-pink-dark)]" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {profileCount} accounts will be affected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Issue Vouchers */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <Gift size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Issue Vouchers</h2>
          </div>
          <div className="space-y-3">
            <select
              value={issueVoucherCode}
              onChange={(e) => setIssueVoucherCode(e.target.value)}
              className="input-glass w-full text-sm"
              disabled={processing}
            >
              <option value="">Select a voucher code...</option>
              {vouchers.map((v) => (
                <option key={v.id} value={v.code}>{v.code}</option>
              ))}
            </select>
            <select
              value={issueScope}
              onChange={(e) => { setIssueScope(e.target.value as TargetScope); updateProfileCount(e.target.value as TargetScope); }}
              className="input-glass w-full text-sm"
              disabled={processing}
            >
              {scopeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={handleIssueVouchers}
              disabled={processing}
              className="btn-pink w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
              Issue to {profileCount} accounts
            </button>
          </div>
        </div>

        {/* Grant Credits */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Grant Credits</h2>
          </div>
          <div className="space-y-3">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Amount"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              className="input-glass w-full text-sm"
              disabled={processing}
            />
            <input
              type="text"
              placeholder="Credit type (e.g. bonus)"
              value={creditType}
              onChange={(e) => setCreditType(e.target.value)}
              className="input-glass w-full text-sm"
              disabled={processing}
            />
            <input
              type="text"
              placeholder="Reason (optional)"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              className="input-glass w-full text-sm"
              disabled={processing}
            />
            <select
              value={creditScope}
              onChange={(e) => { setCreditScope(e.target.value as TargetScope); updateProfileCount(e.target.value as TargetScope); }}
              className="input-glass w-full text-sm"
              disabled={processing}
            >
              {scopeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={handleGrantCredits}
              disabled={processing}
              className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
              Grant to {profileCount} accounts
            </button>
          </div>
        </div>

        {/* Grant Passes */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
              <Ticket size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Grant Passes</h2>
          </div>
          <div className="space-y-3">
            <select
              value={passPackageId}
              onChange={(e) => setPassPackageId(e.target.value)}
              className="input-glass w-full text-sm"
              disabled={processing}
            >
              <option value="">Select a package...</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.total_credits} classes)</option>
              ))}
            </select>
            <select
              value={passScope}
              onChange={(e) => { setPassScope(e.target.value as TargetScope); updateProfileCount(e.target.value as TargetScope); }}
              className="input-glass w-full text-sm"
              disabled={processing}
            >
              {scopeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={handleGrantPasses}
              disabled={processing}
              className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
              Grant to {profileCount} accounts
            </button>
          </div>
        </div>

        {/* Pay Vouchers */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Pay Vouchers</h2>
          </div>
          <div className="space-y-3">
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount in EUR (e.g. 15.00)"
              value={payAmountCents}
              onChange={(e) => setPayAmountCents(e.target.value)}
              className="input-glass w-full text-sm"
              disabled={processing}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={payDescription}
              onChange={(e) => setPayDescription(e.target.value)}
              className="input-glass w-full text-sm"
              disabled={processing}
            />
            <select
              value={payScope}
              onChange={(e) => { setPayScope(e.target.value as TargetScope); updateProfileCount(e.target.value as TargetScope); }}
              className="input-glass w-full text-sm"
              disabled={processing}
            >
              {scopeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={handlePayVouchers}
              disabled={processing}
              className="btn-pink w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
              Distribute to {profileCount} accounts
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {result && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            {result.failureCount === 0 ? (
              <CheckCircle size={20} className="text-emerald-500" />
            ) : (
              <AlertCircle size={20} className="text-amber-500" />
            )}
            <h3 className="font-bold text-[var(--color-text-primary)]">Operation Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{result.totalUsers}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">{result.successCount}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Success</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{result.failureCount}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Failed</p>
            </div>
          </div>
          {result.voucherCode && (
            <p className="text-xs text-[var(--color-text-muted)] mt-3 text-center">
              Voucher code created: <span className="font-mono font-bold">{result.voucherCode}</span>
            </p>
          )}
          {result.failures && result.failures.length > 0 && (
            <div className="mt-4 space-y-1 max-h-32 overflow-y-auto">
              {result.failures.map((f, i) => (
                <p key={i} className="text-xs text-red-500">{f.userId}: {f.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
