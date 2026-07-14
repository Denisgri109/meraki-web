'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import type { ClassPackage } from '@/types/database';
import {
  ArrowLeft, Ticket, Plus, Loader2, Power, X, AlertCircle,
  Layers, Euro, CalendarClock, Sparkles,
} from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  total_credits: '10',
  price_euros: '',
  validity_days: '',
  description: '',
};

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function ClassPackagesPage() {
  const { role, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadPackages = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/class-packages', { method: 'GET' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load packages');
      setPackages(json.packages ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load packages', 'error');
    } finally {
      setLoadingList(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (role !== 'owner') return;
    loadPackages();
  }, [authLoading, role, loadPackages]);

  // Role guard — owners only.
  if (!authLoading && role !== 'owner') {
    return (
      <div className="animate-fade-in max-w-md mx-auto py-20 text-center">
        <AlertCircle size={40} className="text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Owner only</h1>
        <p className="text-[var(--color-text-muted)] mb-6">This page is restricted to the salon Owner.</p>
        <Link href="/dashboard" className="btn-primary inline-flex px-6 py-3 text-sm">Go Home</Link>
      </div>
    );
  }

  const handleCreate = async () => {
    if (form.name.trim().length < 2) {
      showToast('Name must be at least 2 characters', 'error');
      return;
    }
    const credits = parseInt(form.total_credits, 10);
    if (!Number.isInteger(credits) || credits <= 0) {
      showToast('Total credits must be a positive whole number', 'error');
      return;
    }
    const euros = parseFloat(form.price_euros);
    if (Number.isNaN(euros) || euros < 0) {
      showToast('Enter a valid price', 'error');
      return;
    }
    const validity = form.validity_days.trim() === '' ? null : parseInt(form.validity_days, 10);
    if (validity !== null && (!Number.isInteger(validity) || validity <= 0)) {
      showToast('Validity days must be a positive whole number or blank', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/class-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          total_credits: credits,
          price_cents: Math.round(euros * 100),
          validity_days: validity,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create package');
      showToast(`Package "${json.package.name}" created!`, 'success');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await loadPackages();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create package', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: ClassPackage) => {
    try {
      const res = await fetch('/api/class-packages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pkg.id, is_active: !pkg.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update package');
      setPackages(prev => prev.map(p => (p.id === pkg.id ? json.package : p)));
      showToast(`${pkg.name} ${json.package.is_active ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update package', 'error');
    }
  };

  const activeCount = packages.filter(p => p.is_active).length;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-20">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)] mb-1">Class Packages</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Define purchasable bundles of Pilates classes (10-pack, 20-pack…).</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-bold"
        >
          <Plus size={16} /> New Package
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600"><Layers size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{packages.length}</p>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Total</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><Power size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{activeCount}</p>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Active</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600"><Ticket size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{packages.reduce((s, p) => s + p.total_credits, 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Credits offered</p>
            </div>
          </div>
        </div>
      </div>

      {loadingList ? (
        <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Ticket size={40} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">No packages yet</h3>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">Create your first class package so clients can buy a bundle of classes.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-bold">
            <Plus size={16} /> Create Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className={`glass-card p-6 ${pkg.is_active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{pkg.name}</h3>
                  {pkg.description && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{pkg.description}</p>}
                </div>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${pkg.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {pkg.is_active ? 'Active' : 'Hidden'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-4">
                <span className="inline-flex items-center gap-1.5"><Layers size={14} className="text-violet-500" /> {pkg.total_credits} classes</span>
                <span className="inline-flex items-center gap-1.5"><Euro size={14} className="text-emerald-500" /> {formatPrice(pkg.price_cents)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock size={14} className="text-pink-500" /> {pkg.validity_days ? `${pkg.validity_days}d` : 'No expiry'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-light)]">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {pkg.total_credits > 0 ? `${formatPrice(pkg.price_cents / pkg.total_credits)} / class` : '—'}
                </span>
                <button
                  onClick={() => toggleActive(pkg)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                    pkg.is_active
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Power size={12} /> {pkg.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white"><Sparkles size={18} /></div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">New Class Package</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400" aria-label="Close"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 10-Class Pass"
                  className="input-glass w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Classes</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.total_credits}
                    onChange={e => setForm(f => ({ ...f, total_credits: e.target.value }))}
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Price (€)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price_euros}
                    onChange={e => setForm(f => ({ ...f, price_euros: e.target.value }))}
                    placeholder="e.g. 120.00"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                  Validity (days) <span className="normal-case font-normal text-[var(--color-text-muted)]">— blank = never expires</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.validity_days}
                  onChange={e => setForm(f => ({ ...f, validity_days: e.target.value }))}
                  placeholder="e.g. 90"
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="A short description clients see at checkout."
                  rows={2}
                  className="input-glass w-full resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl font-bold bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 btn-primary py-3 font-bold disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
