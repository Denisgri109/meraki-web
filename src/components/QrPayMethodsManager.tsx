'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { ImageUrlUpload } from '@/components/ImageUrlUpload';
import { QRCodeSVG } from 'qrcode.react';
import {
  Plus, Loader2, X, Trash2, Smartphone, Image as ImageIcon,
  Type, Pencil, Power, PowerOff, Star, StarOff,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface QrPayCode {
  id: string;
  provider_name: string;
  qr_image_url: string | null;
  qr_payload: string | null;
  display_order: number;
  is_active: boolean;
}

type SourceMode = 'image' | 'payload';

interface DraftState {
  provider_name: string;
  mode: SourceMode;
  qr_image_url: string;
  qr_payload: string;
  display_order: string;
  is_active: boolean;
}

const EMPTY_DRAFT: DraftState = {
  provider_name: '',
  mode: 'image',
  qr_image_url: '',
  qr_payload: '',
  display_order: '0',
  is_active: true,
};

// ─── Component ────────────────────────────────────────────────────────────
export function QrPayMethodsManager() {
  const { showToast } = useToast();

  const [codes, setCodes] = useState<QrPayCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: add or edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Fetch all codes (owner) ────────────────────────────────────────────
  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/qr-pay-codes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setCodes((data.codes as QrPayCode[]) || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load QR codes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  // ── Modal helpers ──────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowModal(true);
  };

  const openEdit = (code: QrPayCode) => {
    setEditingId(code.id);
    setDraft({
      provider_name: code.provider_name,
      mode: code.qr_image_url ? 'image' : 'payload',
      qr_image_url: code.qr_image_url ?? '',
      qr_payload: code.qr_payload ?? '',
      display_order: String(code.display_order),
      is_active: code.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  // ── Save (create or update) ────────────────────────────────────────────
  const handleSave = async () => {
    const name = draft.provider_name.trim();
    if (!name) {
      showToast('Provider name is required', 'error');
      return;
    }

    const orderNum = Number(draft.display_order);
    const finalOrder = Number.isFinite(orderNum) ? orderNum : 0;

    const body: Record<string, unknown> = {
      provider_name: name,
      display_order: finalOrder,
      is_active: draft.is_active,
      qr_image_url: draft.mode === 'image' ? draft.qr_image_url.trim() || null : null,
      qr_payload: draft.mode === 'payload' ? draft.qr_payload.trim() || null : null,
    };

    if (editingId) body.id = editingId;

    setSaving(true);
    try {
      const res = await fetch('/api/qr-pay-codes', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      showToast(editingId ? 'Payment method updated' : 'Payment method added', 'success');
      closeModal();
      await fetchCodes();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active (inline) ─────────────────────────────────────────────
  const handleToggleActive = async (code: QrPayCode) => {
    setBusyId(code.id);
    const next = !code.is_active;
    // Optimistic
    setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, is_active: next } : c)));
    try {
      const res = await fetch('/api/qr-pay-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, is_active: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      showToast(next ? 'Method activated — visible to instructors' : 'Method hidden from instructors', 'success');
    } catch (err) {
      // Revert
      setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, is_active: code.is_active } : c)));
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (code: QrPayCode) => {
    if (!window.confirm(`Delete "${code.provider_name}"? This cannot be undone.`)) return;
    setBusyId(code.id);
    try {
      const res = await fetch(`/api/qr-pay-codes?id=${encodeURIComponent(code.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setCodes((prev) => prev.filter((c) => c.id !== code.id));
      showToast('Payment method deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const activeCount = codes.filter((c) => c.is_active).length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Smartphone size={18} className="text-[var(--color-brand-pink-dark)]" />
            Payment Methods
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            QR codes instructors show clients for in-person payments
            {' · '}
            <span className="font-semibold text-emerald-600">{activeCount} active</span>
            {' / '}
            <span>{codes.length} total</span>
          </p>
        </div>
        <button onClick={openAdd} className="btn-pink inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold">
          <Plus size={16} /> Add Method
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[var(--color-brand-pink-dark)]" />
        </div>
      ) : codes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Smartphone size={40} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="font-semibold text-[var(--color-text-secondary)]">No payment methods yet</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4">
            Add Revolut, Bizum, bank-transfer, or Stripe QR codes for instructors to present.
          </p>
          <button onClick={openAdd} className="btn-pink inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold">
            <Plus size={16} /> Add your first method
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((code) => {
            const isBusy = busyId === code.id;
            return (
              <div
                key={code.id}
                className={`glass-card p-4 flex flex-col transition-all ${
                  code.is_active ? '' : 'opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[var(--color-text-primary)] truncate">
                      {code.provider_name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
                      {code.qr_image_url ? (
                        <><ImageIcon size={10} /> Image</>
                      ) : (
                        <><Type size={10} /> Generated</>
                      )}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                    code.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {code.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                {/* QR preview */}
                <div className="flex justify-center mb-3">
                  <div className="bg-white p-2 rounded-xl border border-[var(--color-border-light)]">
                    {code.qr_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={code.qr_image_url}
                        alt={code.provider_name}
                        className="w-32 h-32 object-contain"
                      />
                    ) : (
                      <QRCodeSVG value={code.qr_payload || code.provider_name} size={128} level="M" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-auto">
                  <button
                    onClick={() => handleToggleActive(code)}
                    disabled={isBusy}
                    title={code.is_active ? 'Hide from instructors' : 'Show to instructors'}
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                      code.is_active
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isBusy ? <Loader2 size={12} className="animate-spin" /> : code.is_active ? <Power size={12} /> : <PowerOff size={12} />}
                    {code.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => openEdit(code)}
                    disabled={isBusy}
                    title="Edit"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(code)}
                    disabled={isBusy}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="glass-card w-full max-w-md p-6 shadow-2xl my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  {editingId ? <Pencil size={18} className="text-white" /> : <Plus size={18} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
                  </h2>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Revolut, Bizum, bank transfer, Stripe QR…
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <label className="label-upper">Provider Name *</label>
                <input
                  type="text"
                  value={draft.provider_name}
                  onChange={(e) => setDraft({ ...draft, provider_name: e.target.value })}
                  className="input-glass w-full"
                  placeholder="e.g. Revolut, Bizum, Bank Transfer"
                  disabled={saving}
                />
              </div>

              {/* Source mode toggle */}
              <div>
                <label className="label-upper">QR Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, mode: 'image' })}
                    disabled={saving}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                      draft.mode === 'image'
                        ? 'border-[var(--color-brand-pink)] bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)]'
                        : 'border-[var(--color-border-light)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-pink-muted)]'
                    }`}
                  >
                    <ImageIcon size={14} /> Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, mode: 'payload' })}
                    disabled={saving}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                      draft.mode === 'payload'
                        ? 'border-[var(--color-brand-pink)] bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)]'
                        : 'border-[var(--color-border-light)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-pink-muted)]'
                    }`}
                  >
                    <Type size={14} /> Text / Link
                  </button>
                </div>
              </div>

              {draft.mode === 'image' ? (
                <div>
                  {draft.qr_image_url && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-[var(--color-border-light)] shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={draft.qr_image_url} alt="preview" className="w-full h-full object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, qr_image_url: '' })}
                        disabled={saving}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {!draft.qr_image_url && (
                    <ImageUrlUpload
                      onUpload={(publicUrl) => setDraft((d) => ({ ...d, qr_image_url: publicUrl }))}
                      bucket="site-images"
                      pathPrefix="qr-pay"
                      label="Add QR image by URL"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label className="label-upper">Text / URL to encode</label>
                  <textarea
                    value={draft.qr_payload}
                    onChange={(e) => setDraft({ ...draft, qr_payload: e.target.value })}
                    className="input-glass w-full resize-none"
                    rows={3}
                    placeholder="e.g. an IBAN, a payment link, a Bizum phone number…"
                    disabled={saving}
                  />
                  {draft.qr_payload.trim() && (
                    <div className="mt-2 flex justify-center">
                      <div className="bg-white p-2 rounded-xl border border-[var(--color-border-light)]">
                        <QRCodeSVG value={draft.qr_payload} size={120} level="M" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-upper">Display Order</label>
                  <input
                    type="number"
                    value={draft.display_order}
                    onChange={(e) => setDraft({ ...draft, display_order: e.target.value })}
                    className="input-glass w-full"
                    placeholder="0"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="label-upper">Visibility</label>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, is_active: !draft.is_active })}
                    disabled={saving}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                      draft.is_active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    {draft.is_active ? <Star size={14} /> : <StarOff size={14} />}
                    {draft.is_active ? 'Active' : 'Hidden'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-pink w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving…</>
                ) : editingId ? (
                  <><Pencil size={16} /> Update Method</>
                ) : (
                  <><Plus size={16} /> Add Method</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QrPayMethodsManager;
