'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import type { Voucher } from '@/types/database';
import {
  ArrowLeft, Ticket, Plus, Loader2, Tag, Clock, Users, Power,
  X, AlertCircle, Gift, Percent, Euro, Sparkles,
} from 'lucide-react';

const DISCOUNT_TYPES = [
  { value: 'free_month', label: 'Free Month', desc: '100% off a 1-month Pilates membership', icon: Gift, color: 'from-pink-400 to-rose-400' },
  { value: 'percentage', label: 'Percentage Off', desc: 'X% off any single booking or package', icon: Percent, color: 'from-violet-400 to-purple-400' },
  { value: 'free_trial', label: 'Free Trial Class', desc: '100% off a single class booking', icon: Sparkles, color: 'from-emerald-400 to-teal-400' },
  { value: 'fixed_amount', label: 'Fixed Cash Discount', desc: 'Fixed amount off (e.g., EUR 15)', icon: Euro, color: 'from-amber-400 to-orange-400' },
] as const;

const EMPTY_FORM = {
  code: '',
  discount_type: 'percentage' as string,
  discount_value: '',
  max_uses: '1',
  description: '',
};

function discountLabel(v: Voucher): string {
  switch (v.discount_type) {
    case 'free_month': return 'Free Month (100% off)';
    case 'free_trial': return 'Free Trial Class (100% off)';
    case 'percentage': return `${v.discount_value}% off`;
    case 'fixed_amount':
    case 'fixed': return `EUR ${(v.discount_value / 100).toFixed(2)} off`;
    default: return v.discount_type;
  }
}

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function VouchersPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (role !== 'owner') router.replace('/dashboard');
  }, [authLoading, role, router]);

  const fetchVouchers = useCallback(async () => {
    const res = await fetch('/api/vouchers', { method: 'GET' });
    if (!res.ok) {
      showToast('Failed to load vouchers', 'error');
      setLoadingList(false);
      return;
    }
    const { vouchers: data } = await res.json() as { vouchers: Voucher[] };
    setVouchers(data);
    setLoadingList(false);
  }, [showToast]);

  useEffect(() => {
    if (role !== 'owner') return;
    fetchVouchers();
  }, [role, fetchVouchers]);

  const handleCreate = async () => {
    if (!form.code.trim() || form.code.trim().length < 3) {
      showToast('Code must be at least 3 characters', 'error');
      return;
    }
    const dv = Number(form.discount_value);
    if ((form.discount_type === 'percentage' || form.discount_type === 'fixed_amount') && (!Number.isFinite(dv) || dv <= 0)) {
      showToast('Enter a valid discount value', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        code: form.code.trim(),
        discount_type: form.discount_type,
        max_uses: Number(form.max_uses) || 1,
        description: form.description.trim() || undefined,
      };

      if (form.discount_type === 'percentage') {
        payload.discount_value = Number(form.discount_value);
      } else if (form.discount_type === 'fixed_amount') {
        payload.discount_value = Math.round(Number(form.discount_value) * 100);
      } else {
        payload.discount_value = 100;
      }

      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json() as { error: string };
        throw new Error(error);
      }

      const { voucher } = await res.json() as { voucher: Voucher };
      setVouchers((prev) => [voucher, ...prev]);
      showToast(`Voucher ${voucher.code} created!`, 'success');
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create voucher', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (v: Voucher) => {
    const res = await fetch('/api/vouchers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: v.id, is_active: !v.is_active }),
    });
    if (!res.ok) {
      showToast('Failed to update voucher', 'error');
      return;
    }
    const { voucher } = await res.json() as { voucher: Voucher };
    setVouchers((prev) => prev.map((x) => (x.id === voucher.id ? voucher : x)));
    showToast(`${voucher.code} ${voucher.is_active ? 'activated' : 'deactivated'}`, 'success');
  };

  if (authLoading || role !== 'owner') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--color-brand-pink-dark)]" />
      </div>
    );
  }

  const activeCount = vouchers.filter((v) => v.is_active && daysLeft(v.expires_at) > 0).length;
  const redeemedCount = vouchers.reduce((sum, v) => sum + v.current_uses, 0);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-[var(--color-surface-light)] hover:bg-[var(--color-brand-pink-light)] flex items-center justify-center transition-colors border border-[var(--color-border-light)]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Voucher Management</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Create and monitor discount codes</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-pink inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold"
        >
          <Plus size={16} /> Create Voucher
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={14} className="text-[var(--color-brand-pink-dark)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total</span>
          </div>
          <p className="text-xl font-black text-[var(--color-text-primary)]">{vouchers.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Power size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Active</span>
          </div>
          <p className="text-xl font-black text-[var(--color-text-primary)]">{activeCount}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Redeemed</span>
          </div>
          <p className="text-xl font-black text-[var(--color-text-primary)]">{redeemedCount}</p>
        </div>
      </div>

      {loadingList ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--color-brand-pink-dark)]" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Ticket size={36} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No vouchers yet</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Create your first discount code to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => {
            const left = daysLeft(v.expires_at);
            const expired = left <= 0;
            const exhausted = v.current_uses >= v.max_uses;
            const isActive = v.is_active && !expired && !exhausted;
            return (
              <div
                key={v.id}
                className={`glass-card p-5 flex items-center gap-4 border ${isActive ? '' : 'opacity-60'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center shrink-0">
                  <Tag size={22} className="text-[var(--color-brand-pink-dark)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-[var(--color-text-primary)] font-mono">{v.code}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : expired
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isActive ? 'Active' : expired ? 'Expired' : exhausted ? 'Exhausted' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{discountLabel(v)}</p>
                  {v.description && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{v.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] justify-end">
                    <Users size={12} />
                    <span>{v.current_uses} / {v.max_uses}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs justify-end ${expired ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`}>
                    <Clock size={12} />
                    <span>{expired ? 'Expired' : `${left}d left`}</span>
                  </div>
                  <button
                    onClick={() => toggleActive(v)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors ${
                      v.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {v.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="glass-card w-full max-w-lg p-6 shadow-2xl my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <Ticket size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Create Voucher</h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Expires in 7 days · Benefit valid 7 days after redemption</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <label className="label-upper">Voucher Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="input-glass w-full font-mono"
                  placeholder="SUMMER50"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label-upper">Discount Type *</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {DISCOUNT_TYPES.map((dt) => {
                    const selected = form.discount_type === dt.value;
                    const Icon = dt.icon;
                    return (
                      <button
                        key={dt.value}
                        onClick={() => setForm({ ...form, discount_type: dt.value })}
                        disabled={saving}
                        className={`text-left p-3 rounded-2xl border transition-all ${
                          selected
                            ? 'border-[var(--color-brand-pink)] bg-[var(--color-brand-pink-light)] ring-1 ring-[var(--color-brand-pink)]/20'
                            : 'border-[var(--color-border-light)] hover:border-[var(--color-brand-pink-muted)]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${dt.color} flex items-center justify-center mb-2`}>
                          <Icon size={15} className="text-white" />
                        </div>
                        <p className="text-xs font-bold text-[var(--color-text-primary)]">{dt.label}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{dt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(form.discount_type === 'percentage' || form.discount_type === 'fixed_amount') && (
                <div>
                  <label className="label-upper">
                    {form.discount_type === 'percentage' ? 'Percentage (%) *' : 'Amount (EUR) *'}
                  </label>
                  <input
                    type="number"
                    step={form.discount_type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="input-glass w-full"
                    placeholder={form.discount_type === 'percentage' ? '50' : '15.00'}
                    disabled={saving}
                  />
                </div>
              )}

              <div>
                <label className="label-upper">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  className="input-glass w-full"
                  placeholder="1"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label-upper">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-glass w-full"
                  placeholder="Summer promo — 50% off any booking"
                  disabled={saving}
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle size={13} className="text-amber-600 shrink-0" />
                <span className="text-[11px] font-semibold text-amber-700">
                  This voucher will expire in 7 days. Benefits (free month/trial) must be used within 7 days of redemption.
                </span>
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className="btn-pink w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating…</>
                ) : (
                  <><Plus size={16} /> Create Voucher</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
