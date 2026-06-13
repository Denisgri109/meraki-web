'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useModal } from '@/contexts/ModalContext';
import {
  Save, Loader2, Plus, Pencil, Trash2, Pause, Play,
  Wallet, Clock, UserX, Heart, FileText, Eye, X,
  Megaphone,
} from 'lucide-react';
import type { Json } from '@/types/database';

export interface BusinessSettingsPanelRef {
  save: () => Promise<void>;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface BusinessSettings {
  confirmation_timing_hours: number;
  confirmation_response_timeout_hours: number;
  auto_charge_after_grace_period: boolean;
  deposit_type: string;
  deposit_amount: number;
  deposit_percentage: number;
  terms_and_conditions: string | null;
  require_tc_acceptance: boolean;
  accepts_new_clients: boolean;
  is_visible_globally: boolean;
}


// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: BusinessSettings = {
  confirmation_timing_hours: 24,
  confirmation_response_timeout_hours: 24,
  auto_charge_after_grace_period: true,
  deposit_type: 'percentage',
  deposit_amount: 0,
  deposit_percentage: 100,
  terms_and_conditions: null,
  require_tc_acceptance: true,
  accepts_new_clients: true,
  is_visible_globally: true,
};


const CONFIRMATION_TIMING_OPTIONS = [
  { value: 12, label: '12 hours before' },
  { value: 24, label: '24 hours before' },
  { value: 48, label: '48 hours before' },
  { value: 72, label: '72 hours before' },
];

const RESPONSE_TIMEOUT_OPTIONS = [
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
];


const DEPOSIT_PERCENT_OPTIONS = [10, 20, 30, 50, 100];

// ─── Helpers ────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function SectionCard({ icon: Icon, title, description, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} className="text-[var(--color-primary)]" />
        <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">{description}</p>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)] border border-[var(--color-border-light)] cursor-pointer">
      <span>
        <span className="block font-medium text-sm text-[var(--color-text-primary)]">{label}</span>
        {description && <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--color-primary)] cursor-pointer"
      />
    </label>
  );
}

function SelectField({ value, onChange, options, className }: {
  value: number | string;
  onChange: (v: string) => void;
  options: { value: number | string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input-glass text-sm cursor-pointer ${className || ''}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const BusinessSettingsPanel = forwardRef<BusinessSettingsPanelRef>(function BusinessSettingsPanel(_props, ref) {
  const { profile } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();
  const { showConfirm } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  const [tcModalOpen, setTcModalOpen] = useState(false);
  const [tcDraft, setTcDraft] = useState('');

  // Deposit derived state
  const depositEnabled = settings.deposit_percentage > 0;

  // ─── Load Settings ────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Load master_settings
      const { data: ms, error: msErr } = await supabase
        .from('master_settings')
        .select('*')
        .eq('master_id', profile.id)
        .maybeSingle();

      if (msErr && (msErr as { code?: string }).code !== 'PGRST116') {
        console.error('Error loading master_settings:', msErr);
      }

      if (ms) {
        setSettings({
          confirmation_timing_hours: ms.confirmation_timing_hours ?? 24,
          confirmation_response_timeout_hours: ms.confirmation_response_timeout_hours ?? 24,
          auto_charge_after_grace_period: ms.auto_charge_after_grace_period ?? true,
          deposit_type: ms.deposit_type || 'percentage',
          deposit_amount: Number(ms.deposit_amount ?? 0),
          deposit_percentage: ms.deposit_percentage ?? 100,
          terms_and_conditions: ms.terms_and_conditions ?? null,
          require_tc_acceptance: ms.require_tc_acceptance ?? true,
          accepts_new_clients: ms.accepts_new_clients ?? true,
          is_visible_globally: ms.is_visible_globally ?? true,
        });
        setTcDraft(ms.terms_and_conditions || '');
      } else {
        // Upsert default row if none exists
        await supabase
          .from('master_settings')
          .upsert({ master_id: profile.id }, { onConflict: 'master_id' });
      }

    } catch (err) {
      console.error('Error loading business settings:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, supabase]);

  useEffect(() => {
    loadAll(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch on mount
  }, [loadAll]);

  // ─── Save Settings ────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      // Save master_settings
      const { error: msErr } = await supabase
        .from('master_settings')
        .upsert(
          {
            master_id: profile.id,
            confirmation_timing_hours: settings.confirmation_timing_hours,
            confirmation_response_timeout_hours: settings.confirmation_response_timeout_hours,
            late_cancellation_window_hours: 24,
            cancellation_charge_percent: 50,
            no_show_charge_percent: 100,
            late_arrival_minutes: 15,
            grace_period_multiplier: 0.5,
            auto_charge_after_grace_period: settings.auto_charge_after_grace_period,
            deposit_type: 'percentage',
            deposit_amount: 0,
            deposit_percentage: settings.deposit_percentage,
            terms_and_conditions: settings.terms_and_conditions,
            require_tc_acceptance: settings.require_tc_acceptance,
            accepts_new_clients: settings.accepts_new_clients,
            is_visible_globally: settings.is_visible_globally,
            terms_updated_at: settings.terms_and_conditions ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'master_id' }
        );

      if (msErr) throw msErr;


      showToast('Business settings saved!', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save settings'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Expose save method to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSaveSettings,
  }));

  // ─── Deposit Toggle ───────────────────────────────────────────────────────

  const toggleDeposit = (enabled: boolean) => {
    if (enabled) {
      setSettings((s) => ({
        ...s,
        deposit_type: 'percentage',
        deposit_percentage: 20,
        deposit_amount: 0,
      }));
    } else {
      setSettings((s) => ({
        ...s,
        deposit_percentage: 0,
        deposit_amount: 0,
      }));
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Loader2 size={16} className="animate-spin" />
        Loading business settings...
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ═══ Deposit Configuration ═══ */}
      <SectionCard icon={Wallet} title="Deposit Configuration" description="Require clients to pay a deposit when booking your services.">
        <Toggle
          checked={depositEnabled}
          onChange={toggleDeposit}
          label="Require Deposit"
          description="Clients must pay a deposit to secure their booking"
        />

        {depositEnabled && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div>
              <label className="label-upper">Deposit Percentage</label>
              <div className="flex gap-2 flex-wrap">
                {DEPOSIT_PERCENT_OPTIONS.map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSettings((s) => ({ ...s, deposit_percentage: pct }))}
                    className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold border transition-all cursor-pointer ${
                      settings.deposit_percentage === pct
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] border-[var(--color-border-light)]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-[var(--radius-md)] bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <strong>Per-Service Deposit Override:</strong> You can override deposit settings for individual services from the{' '}
              <a href="/dashboard/services" className="underline font-semibold hover:text-amber-900">Service Management</a> page (Phase 4).
            </div>
          </div>
        )}
      </SectionCard>

      {/* ═══ Confirmation Settings ═══ */}
      <SectionCard icon={Clock} title="Appointment Confirmations" description="When should clients receive confirmation reminders and how long they have to respond.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-upper">Confirmation Timing</label>
            <SelectField
              value={settings.confirmation_timing_hours}
              onChange={(v) => setSettings((s) => ({ ...s, confirmation_timing_hours: Number(v) }))}
              options={CONFIRMATION_TIMING_OPTIONS}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">When clients receive a &quot;confirm your appointment&quot; reminder</p>
          </div>
          <div>
            <label className="label-upper">Response Timeout</label>
            <SelectField
              value={settings.confirmation_response_timeout_hours}
              onChange={(v) => setSettings((s) => ({ ...s, confirmation_response_timeout_hours: Number(v) }))}
              options={RESPONSE_TIMEOUT_OPTIONS}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">How long clients have to respond before auto-cancel</p>
          </div>
        </div>
        <div className="mt-4">
          <Toggle
            checked={settings.auto_charge_after_grace_period}
            onChange={(v) => setSettings((s) => ({ ...s, auto_charge_after_grace_period: v }))}
            label="Auto-Cancel Unconfirmed"
            description="Automatically cancel appointments if client doesn't confirm within the timeout"
          />
        </div>
      </SectionCard>

      {/* ═══ Cancellation & No-Show Policy (Fixed) ═══ */}
      <SectionCard icon={UserX} title="Cancellation & No-Show Policy" description="Platform-wide policy applied to all bookings.">
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)] border border-[var(--color-border-light)] text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Cancel for free up to <span className="font-bold text-[var(--color-text-primary)]">24 hours</span> before your session.
          Cancellations within this window are subject to a <span className="font-bold text-[var(--color-text-primary)]">50% fee</span>.
          No-Shows are billed at <span className="font-bold text-[var(--color-text-primary)]">100%</span>.
        </div>
      </SectionCard>

      {/* ═══ Terms & Conditions ═══ */}
      <SectionCard icon={FileText} title="Terms & Conditions" description="Set your booking terms. Clients must accept these before booking.">
        <button
          onClick={() => { setTcDraft(settings.terms_and_conditions || ''); setTcModalOpen(true); }}
          className="w-full p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)] border border-[var(--color-border-light)] hover:border-[var(--color-primary)] transition-colors text-sm font-medium text-[var(--color-primary)] cursor-pointer flex items-center justify-center gap-2"
        >
          {settings.terms_and_conditions ? <><Pencil size={14} /> Edit Terms</> : <><Plus size={14} /> Add Terms</>}
        </button>

        {settings.terms_and_conditions && (
          <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-light)] text-xs text-[var(--color-text-secondary)] italic line-clamp-3">
            {settings.terms_and_conditions}
          </div>
        )}

        <div className="mt-3">
          <Toggle
            checked={settings.require_tc_acceptance}
            onChange={(v) => setSettings((s) => ({ ...s, require_tc_acceptance: v }))}
            label="Require Acceptance"
            description="Clients must accept T&C before booking"
          />
        </div>
      </SectionCard>

      {/* ═══ Visibility ═══ */}
      <SectionCard icon={Eye} title="Visibility" description="Control how clients find and book with you.">
        <div className="space-y-3">
          <Toggle
            checked={settings.accepts_new_clients}
            onChange={(v) => setSettings((s) => ({ ...s, accepts_new_clients: v }))}
            label="Accept New Clients"
            description="Allow new clients to book with you"
          />
          <Toggle
            checked={settings.is_visible_globally}
            onChange={(v) => setSettings((s) => ({ ...s, is_visible_globally: v }))}
            label="Show in Global Discovery"
            description="Appear in search results for clients in your area"
          />
        </div>
      </SectionCard>


      {/* ═══ Save Settings Button ═══ */}
      <button
        onClick={handleSaveSettings}
        disabled={saving}
        className="btn-primary flex items-center gap-2 px-6 py-3 text-sm cursor-pointer mb-6"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving...' : 'Save Business Settings'}
      </button>

      {/* ═══ T&C Modal ═══ */}
      {tcModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setTcModalOpen(false)}
        >
          <div
            className="glass-card max-w-2xl w-full p-6 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Terms & Conditions</h3>
              <button onClick={() => setTcModalOpen(false)} className="p-1.5 rounded-full hover:bg-black/5 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={tcDraft}
              onChange={(e) => setTcDraft(e.target.value)}
              className="input-glass resize-none w-full"
              rows={12}
              placeholder={"Enter your Terms & Conditions here...\n\nExample:\n- Cancellation Policy: Appointments cancelled within 24 hours will be charged 50%.\n- Late Arrivals: If you are more than 15 minutes late, the appointment may be cancelled.\n- Payment: Full payment is due at the time of service."}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setTcModalOpen(false)}
                className="px-5 py-2.5 text-sm rounded-[var(--radius-lg)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSettings((s) => ({ ...s, terms_and_conditions: tcDraft.trim() || null }));
                  setTcModalOpen(false);
                }}
                className="btn-primary px-5 py-2.5 text-sm cursor-pointer"
              >
                Save Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default BusinessSettingsPanel;
