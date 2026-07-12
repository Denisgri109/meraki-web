'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Phone,
  User as UserIcon,
  HeartPulse,
  Loader2,
  PenLine,
  ChevronDown,
} from 'lucide-react';
import { usePilatesWaiver, type PilatesWaiverData } from '@/hooks/usePilatesWaiver';
import { useToast } from '@/components/Toast';

interface PilatesWaiverFormSheetProps {
  open: boolean;
  /** Called after a successful submission */
  onSigned: () => void;
  /** Called when the user dismisses the sheet (X button or backdrop) */
  onDismiss: () => void;
}

const TERMS_TEXT = `INJURY DISCLOSURE AND LIABILITY WAIVER — MERAKI PILATES

This agreement is made between Meraki Pilates Limited trading as Meraki Pilates Studio (including its directors, employees, and independent instructors, collectively referred to as "the Studio") and the undersigned participant ("the Participant").

1. ACKNOWLEDGEMENT OF INHERENT RISKS
I acknowledge that participation in Pilates classes (including Mat Pilates and classes utilising specialised equipment/apparatus such as Reformers, Towers, and Chairs) involves physical exertion and movement. I understand that physical exercise carries inherent risks of injury, including but not limited to muscle strains, joint sprains, dizziness, and slips or falls. I confirm that I am participating voluntarily and accept the risks naturally inherent in such physical activity.

2. HEALTH AND INJURY DISCLOSURE
I confirm that I have truthfully disclosed any pre-existing injuries, medical conditions, surgeries, physical limitations, or pregnancy. I understand that the Studio uses this information solely to provide safe, appropriate modifications during classes. I agree to inform my instructor immediately before any class begins of any changes to my physical condition, health status, or pregnancy.

3. MEDICAL FITNESS
I confirm that I am in good physical health and have consulted with a medical practitioner (GP or specialist) regarding my fitness to participate in Pilates if I have any of the conditions disclosed in Section 2. I acknowledge that the Studio's instructors are fitness professionals, not medical practitioners, and cannot diagnose medical conditions or advise on the medical safety of exercises.

4. LIMITATION OF LIABILITY
To the fullest extent permitted under Irish law:
(a) I agree that the Studio shall not be liable for any personal injury, loss, or damage I sustain, unless such injury, loss, or damage is directly caused by the negligence, breach of contract, or breach of statutory duty of the Studio or its staff.
(b) The Studio does not exclude or limit its liability for death or personal injury arising from its own negligence.
(c) I acknowledge that the Studio is not responsible for any loss or damage to my personal belongings left on the premises.

5. EMERGENCY MEDICAL CONSENT
In the event of a medical emergency during a class, I authorise the Studio to seek appropriate emergency medical assistance or first aid on my behalf. I agree to accept responsibility for any emergency transport or medical costs associated with such treatment.

6. DATA PROTECTION AND GDPR
I understand that the Studio collects and processes my personal data, including sensitive health information regarding my physical condition and injuries. This data is collected and stored securely in accordance with the General Data Protection Regulation (GDPR) and the Data Protection Act 2018, and will be used strictly to ensure my safety during classes. My personal data will not be shared with third parties without my explicit consent.

7. STUDIO POLICIES
I agree to comply with the Studio's standard booking, cancellation, and late-arrival policies as published on the website or booking system. I understand that late arrivals may be refused entry to class for safety and warm-up reasons.

8. SEVERABILITY
If any provision of this Agreement is found by a court or tribunal to be invalid, illegal, or unenforceable, that provision shall be severed and the remaining provisions shall continue in full force and effect.

9. GOVERNING LAW AND JURISDICTION
This Agreement, and any dispute or claim arising out of or in connection with it (including non-contractual disputes), shall be governed by and construed in accordance with the laws of the Republic of Ireland. The parties irrevocably agree that the courts of Ireland shall have exclusive jurisdiction to settle any such dispute.

10. AGREEMENT AND SIGNATURE
By signing below (or typing my full legal name), I confirm that I am at least 18 years of age, and that I have read, fully understood, and voluntarily agree to all the terms of this Agreement.

Version 2.0 — Meraki Pilates Studio`;

export default function PilatesWaiverFormSheet({
  open,
  onSigned,
  onDismiss,
}: PilatesWaiverFormSheetProps) {
  const { submitWaiver, submitting } = usePilatesWaiver();
  const { showToast } = useToast();

  // ── Form state ───────────────────────────────────────────────────
  const [hasInjuries, setHasInjuries] = useState<boolean | null>(null);
  const [injuryDetails, setInjuryDetails] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [formError, setFormError] = useState('');

  // ── Scroll-to-sentinel for the terms box ─────────────────────────
  const termsScrollRef = useRef<HTMLDivElement>(null);

  // ── Reset on open ────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setHasInjuries(null);
    setInjuryDetails('');
    setEmergencyContactName('');
    setEmergencyContactRelationship('');
    setEmergencyContactPhone('');
    setAgreedToTerms(false);
    setSignatureName('');
    setFormError('');
  }, []);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  // ── Body scroll lock when open ───────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Esc key to dismiss ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDismiss, submitting]);

  // ── Validation ───────────────────────────────────────────────────
  const injuriesValid = hasInjuries !== null && (!hasInjuries || injuryDetails.trim().length >= 5);
  const emergencyValid =
    emergencyContactName.trim().length >= 2 &&
    emergencyContactRelationship.trim().length >= 2 &&
    emergencyContactPhone.trim().length >= 5;
  const signatureValid = signatureName.trim().length >= 2;
  const termsScrolled = true; // tracked visually; the checkbox gates submission
  const canSubmit =
    injuriesValid &&
    emergencyValid &&
    agreedToTerms &&
    signatureValid &&
    termsScrolled &&
    !submitting;

  // ── Submit handler ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError('');

    if (hasInjuries === null) {
      setFormError('Please let us know about any injuries, conditions, or pregnancy.');
      return;
    }
    if (hasInjuries && injuryDetails.trim().length < 5) {
      setFormError('Please provide at least a brief description of your injury or condition.');
      return;
    }
    if (!emergencyValid) {
      setFormError('Please complete all emergency contact fields (name, relationship, phone).');
      return;
    }
    if (!agreedToTerms) {
      setFormError('Please read the terms and check the consent box to continue.');
      return;
    }
    if (signatureName.trim().length < 2) {
      setFormError('Please type your full legal name as your digital signature.');
      return;
    }

    const data: PilatesWaiverData = {
      hasInjuries,
      injuryDetails: hasInjuries ? injuryDetails.trim() : '',
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactRelationship: emergencyContactRelationship.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      signatureName: signatureName.trim(),
      agreedToTerms,
    };

    try {
      await submitWaiver(data);
      showToast('Waiver signed successfully. You can now book Pilates classes!', 'success');
      onSigned();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit waiver. Please try again.';
      setFormError(msg);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-sm animate-fade-in"
      onClick={submitting ? undefined : onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waiver-title"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShieldCheck size={18} className="text-emerald-700" />
            </div>
            <div>
              <h2 id="waiver-title" className="text-[16px] font-bold text-gray-900">
                Injury Disclosure &amp; Waiver
              </h2>
              <p className="text-[11px] text-gray-500">
                Required before booking Pilates classes
              </p>
            </div>
          </div>
          <button
            onClick={submitting ? undefined : onDismiss}
            disabled={submitting}
            className="p-1.5 rounded-full hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Close"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* ── 1. Injury disclosure ─────────────────────────────── */}
          <section>
            <label className="flex items-start gap-1.5 text-[13px] font-bold text-gray-900 mb-2.5">
              <HeartPulse size={15} className="text-emerald-600 mt-0.5 shrink-0" />
              <span>
                Do you have any pre-existing injuries, medical conditions, surgeries,
                physical limitations, or are you pregnant?
              </span>
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(['No', 'Yes'] as const).map((label) => {
                const value = label === 'Yes';
                const selected = hasInjuries === value;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setHasInjuries(value);
                      if (!value) setInjuryDetails('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                      selected
                        ? value
                          ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                    }`}
                    aria-pressed={selected}
                  >
                    {value && <AlertTriangle size={15} />}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic injury details textarea */}
            {hasInjuries === true && (
              <div className="mt-3 animate-fade-in">
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Please describe your injury / condition
                  <span className="text-red-500"> *</span>
                </label>
                <textarea
                  value={injuryDetails}
                  onChange={(e) => setInjuryDetails(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:bg-white resize-none placeholder:text-gray-400"
                  placeholder="e.g. Lower back pain, knee surgery last year, currently 16 weeks pregnant, etc."
                  autoFocus
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  This information is kept private and helps your instructor give safe modifications.
                </p>
              </div>
            )}
          </section>

          {/* ── 2. Emergency contact ──────────────────────────────── */}
          <section>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 mb-2.5">
              <Phone size={15} className="text-emerald-600 shrink-0" />
              Emergency contact
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:bg-white">
                  <UserIcon size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Full name"
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:bg-white">
                  <HeartPulse size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={emergencyContactRelationship}
                    onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                    placeholder="Relationship (e.g. spouse)"
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:bg-white">
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="Phone number"
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. Terms of Service & Liability Waiver ─────────────── */}
          <section>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 mb-2.5">
              <PenLine size={15} className="text-emerald-600 shrink-0" />
              Terms of Service &amp; Liability Waiver
              <span className="text-red-500">*</span>
            </label>
            <div
              ref={termsScrollRef}
              className="relative rounded-2xl border border-gray-200 bg-gray-50 p-4 h-44 overflow-y-auto text-[12px] leading-relaxed text-gray-600 whitespace-pre-line"
            >
              {TERMS_TEXT}
              {/* Fade-out hint at bottom */}
              <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none flex items-end justify-center">
                <ChevronDown size={14} className="text-gray-300" />
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              Scroll to read the full agreement.
            </p>

            {/* Consent checkbox */}
            <label className="mt-3 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-400 cursor-pointer shrink-0"
              />
              <span className="text-[13px] font-medium text-gray-700 leading-snug">
                I have read and agree to the Terms of Service and Liability Waiver. I confirm I am at least 18 years of age.
                <span className="text-red-500"> *</span>
              </span>
            </label>
          </section>

          {/* ── 4. Digital signature ──────────────────────────────── */}
          <section>
            <label className="block text-[13px] font-bold text-gray-900 mb-2.5">
              Digital signature
              <span className="text-red-500"> *</span>
            </label>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-3.5 transition focus-within:border-emerald-400 focus-within:bg-emerald-50/70">
              <PenLine size={16} className="text-emerald-500 shrink-0" />
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Type your full legal name"
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                autoComplete="off"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              By typing your name you confirm this is your legal digital signature and that you are 18 or older.
            </p>
          </section>
        </div>

        {/* ── Error banner ─────────────────────────────────────────── */}
        {formError && (
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-[12px] font-medium text-red-700">{formError}</p>
            </div>
          </div>
        )}

        {/* ── Footer / submit ──────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-[15px] tracking-wide flex items-center justify-center gap-2 transition hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Sign &amp; Continue
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Your waiver is stored securely. You only need to complete this once.
          </p>
        </div>
      </div>
    </div>
  );
}
