'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Loader2, ShieldCheck, AlertTriangle, HeartPulse, FileText } from 'lucide-react';
import { usePilatesWaiver, type PilatesWaiverData } from '@/hooks/usePilatesWaiver';
import { useToast } from '@/components/Toast';

interface PilatesWaiverFormSheetProps {
  open: boolean;
  onSigned: () => void;
  onDismiss: () => void;
}

const WAIVER_TEXT = `Please feel free to mention anything else that we may need to know to keep your session safe both now and as the training progresses. Whilst every effort is made to keep the session both safe and effective, there is a risk of injury as with any programme of activity. You are responsible for your own body. Should you feel any discomfort in areas of concern (neck, lower back, shoulders), please inform me immediately and we can modify the move.

I hereby state that I have read, understood, and answered honestly the pre-exercise health screening questionnaire. Any questions I had were answered to my full satisfaction. Whilst every effort is made to keep the class safe and enjoyable, I am participating of my own free will and, as with any exercise programme, there is a risk of injury. Do you understand and agree to these terms?`;

export default function PilatesWaiverFormSheet({
  open,
  onSigned,
  onDismiss,
}: PilatesWaiverFormSheetProps) {
  const { submitWaiver, submitting } = usePilatesWaiver();
  const { showToast } = useToast();

  const [injuriesJointProblems, setInjuriesJointProblems] = useState('');
  const [pilatesExperience, setPilatesExperience] = useState('');
  const [hasIllnesses, setHasIllnesses] = useState<string | null>(null);
  const [illnessDetails, setIllnessDetails] = useState('');
  const [pregnancyStatus, setPregnancyStatus] = useState<string | null>(null);
  const [medicationDetails, setMedicationDetails] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState('');
  const [practitionerRecommended, setPractitionerRecommended] = useState<string | null>(null);
  const [goalsExpectations, setGoalsExpectations] = useState('');
  const [hasBoneCondition, setHasBoneCondition] = useState<string | null>(null);
  const [agreedTermsOfUse, setAgreedTermsOfUse] = useState(false);
  const [agreedLiabilityWaiver, setAgreedLiabilityWaiver] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = useCallback(() => {
    setInjuriesJointProblems('');
    setPilatesExperience('');
    setHasIllnesses(null);
    setIllnessDetails('');
    setPregnancyStatus(null);
    setMedicationDetails('');
    setExerciseHistory('');
    setPractitionerRecommended(null);
    setGoalsExpectations('');
    setHasBoneCondition(null);
    setAgreedTermsOfUse(false);
    setAgreedLiabilityWaiver(false);
    setSubmitAttempted(false);
    setFormError('');
  }, []);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDismiss, submitting]);

  const errors = {
    injuriesJointProblems: !injuriesJointProblems.trim(),
    pilatesExperience: !pilatesExperience.trim(),
    hasIllnesses: hasIllnesses === null,
    illnessDetails: hasIllnesses === 'yes' && !illnessDetails.trim(),
    pregnancyStatus: pregnancyStatus === null,
    medicationDetails: !medicationDetails.trim(),
    exerciseHistory: !exerciseHistory.trim(),
    practitionerRecommended: practitionerRecommended === null,
    goalsExpectations: !goalsExpectations.trim(),
    hasBoneCondition: hasBoneCondition === null,
    agreedTermsOfUse: !agreedTermsOfUse,
    agreedLiabilityWaiver: !agreedLiabilityWaiver,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setFormError('');
    if (hasErrors) return;

    const data: PilatesWaiverData = {
      injuriesJointProblems: injuriesJointProblems.trim(),
      pilatesExperience: pilatesExperience.trim(),
      hasIllnesses: hasIllnesses === 'yes',
      illnessDetails: hasIllnesses === 'yes' ? illnessDetails.trim() : '',
      pregnancyStatus: pregnancyStatus as 'yes' | 'no' | 'not_applicable',
      medicationDetails: medicationDetails.trim(),
      exerciseHistory: exerciseHistory.trim(),
      practitionerRecommended: practitionerRecommended === 'yes',
      goalsExpectations: goalsExpectations.trim(),
      hasBoneCondition: hasBoneCondition === 'yes',
      agreedTermsOfUse,
      agreedLiabilityWaiver,
    };

    try {
      await submitWaiver(data);
      showToast('Waiver signed successfully!', 'success');
      onSigned();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit waiver. Please try again.';
      setFormError(msg);
    }
  };

  if (!open) return null;

  const textareaClass = (hasError: boolean) =>
    `w-full rounded-2xl border px-4 py-3 text-sm text-gray-900 outline-none transition resize-none placeholder:text-gray-400 focus:ring-2 ${
      submitAttempted && hasError
        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200'
        : 'border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white focus:ring-emerald-200'
    }`;

  const radioBtnClass = (selected: boolean, isWarning: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
      selected
        ? isWarning
          ? 'border-amber-300 bg-amber-50 text-amber-900'
          : 'border-emerald-300 bg-emerald-50 text-emerald-900'
        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
    }`;

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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <HeartPulse size={18} className="text-emerald-700" />
            </div>
            <div>
              <h2 id="waiver-title" className="text-[16px] font-bold text-gray-900">
                Health Screening & Waiver
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* ── Health Screening ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HeartPulse size={16} className="text-emerald-600" />
              <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
                Health Screening
              </h3>
            </div>

            {/* Q1 */}
            <div>
              <label htmlFor="q1-injuries" className="block text-[13px] font-bold text-gray-900 mb-2">
                Do you have any injuries or joint problems?
                <span className="text-red-500"> *</span>
              </label>
              <textarea
                id="q1-injuries"
                value={injuriesJointProblems}
                onChange={(e) => setInjuriesJointProblems(e.target.value)}
                rows={3}
                className={textareaClass(errors.injuriesJointProblems)}
                placeholder="Describe any injuries or joint problems..."
                aria-describedby={submitAttempted && errors.injuriesJointProblems ? 'q1-error' : undefined}
              />
              {submitAttempted && errors.injuriesJointProblems && (
                <p id="q1-error" className="mt-1 text-xs text-red-600">
                  Please describe any injuries or joint problems.
                </p>
              )}
            </div>

            {/* Q2 */}
            <div>
              <label htmlFor="q2-experience" className="block text-[13px] font-bold text-gray-900 mb-2">
                What is your Pilates experience?
                <span className="text-red-500"> *</span>
              </label>
              <textarea
                id="q2-experience"
                value={pilatesExperience}
                onChange={(e) => setPilatesExperience(e.target.value)}
                rows={2}
                className={textareaClass(errors.pilatesExperience)}
                placeholder="e.g., Some Mat Pilates, Some Reformer, Experienced, etc."
                aria-describedby={submitAttempted && errors.pilatesExperience ? 'q2-error' : undefined}
              />
              {submitAttempted && errors.pilatesExperience && (
                <p id="q2-error" className="mt-1 text-xs text-red-600">
                  Please describe your Pilates experience.
                </p>
              )}
            </div>

            {/* Q3 */}
            <div>
              <span id="q3-label" className="block text-[13px] font-bold text-gray-900 mb-2">
                Have you had any illnesses or disabilities?
                <span className="text-red-500"> *</span>
              </span>
              <div role="radiogroup" aria-labelledby="q3-label" className="flex gap-2">
                {(['no', 'yes'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={hasIllnesses === value}
                    onClick={() => {
                      setHasIllnesses(value);
                      if (value === 'no') setIllnessDetails('');
                    }}
                    className={radioBtnClass(hasIllnesses === value, value === 'yes')}
                  >
                    {value === 'yes' && <AlertTriangle size={15} />}
                    {value === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
              {submitAttempted && errors.hasIllnesses && (
                <p className="mt-1 text-xs text-red-600">Please select Yes or No.</p>
              )}
            </div>

            {/* Q4 (conditional) */}
            {hasIllnesses === 'yes' && (
              <div className="animate-fade-in">
                <label htmlFor="q4-illness" className="block text-[13px] font-bold text-gray-900 mb-2">
                  If yes, please provide details:
                  <span className="text-red-500"> *</span>
                </label>
                <textarea
                  id="q4-illness"
                  value={illnessDetails}
                  onChange={(e) => setIllnessDetails(e.target.value)}
                  rows={3}
                  className={textareaClass(errors.illnessDetails)}
                  placeholder="Provide details about your illness or disability..."
                  autoFocus
                />
                {submitAttempted && errors.illnessDetails && (
                  <p className="mt-1 text-xs text-red-600">
                    Please provide details about your illness or disability.
                  </p>
                )}
              </div>
            )}

            {/* Q5 */}
            <div>
              <span id="q5-label" className="block text-[13px] font-bold text-gray-900 mb-2">
                Are you pregnant, or have you been pregnant in the last 6 months?
                <span className="text-red-500"> *</span>
              </span>
              <div role="radiogroup" aria-labelledby="q5-label" className="flex gap-2">
                {(['no', 'yes', 'not_applicable'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={pregnancyStatus === value}
                    onClick={() => setPregnancyStatus(value)}
                    className={radioBtnClass(pregnancyStatus === value, value === 'yes')}
                  >
                    {value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'N/A'}
                  </button>
                ))}
              </div>
              {submitAttempted && errors.pregnancyStatus && (
                <p className="mt-1 text-xs text-red-600">Please select an option.</p>
              )}
            </div>

            {/* Q6 */}
            <div>
              <label htmlFor="q6-medication" className="block text-[13px] font-bold text-gray-900 mb-2">
                Are you on any medication that may affect you during the session? If yes, please
                provide details:
                <span className="text-red-500"> *</span>
              </label>
              <textarea
                id="q6-medication"
                value={medicationDetails}
                onChange={(e) => setMedicationDetails(e.target.value)}
                rows={3}
                className={textareaClass(errors.medicationDetails)}
                placeholder="List any medication that may affect your session..."
                aria-describedby={submitAttempted && errors.medicationDetails ? 'q6-error' : undefined}
              />
              {submitAttempted && errors.medicationDetails && (
                <p id="q6-error" className="mt-1 text-xs text-red-600">
                  Please provide medication details.
                </p>
              )}
            </div>

            {/* Q7 */}
            <div>
              <label htmlFor="q7-exercise" className="block text-[13px] font-bold text-gray-900 mb-2">
                In brief, please state your exercise history, when you last exercised, and what
                activity it was:
                <span className="text-red-500"> *</span>
              </label>
              <textarea
                id="q7-exercise"
                value={exerciseHistory}
                onChange={(e) => setExerciseHistory(e.target.value)}
                rows={3}
                className={textareaClass(errors.exerciseHistory)}
                placeholder="e.g., Running 3x per week, last exercised yesterday..."
                aria-describedby={submitAttempted && errors.exerciseHistory ? 'q7-error' : undefined}
              />
              {submitAttempted && errors.exerciseHistory && (
                <p id="q7-error" className="mt-1 text-xs text-red-600">
                  Please describe your exercise history.
                </p>
              )}
            </div>

            {/* Q8 */}
            <div>
              <span id="q8-label" className="block text-[13px] font-bold text-gray-900 mb-2">
                Have you been recommended to do Pilates by a health/medical practitioner?
                <span className="text-red-500"> *</span>
              </span>
              <div role="radiogroup" aria-labelledby="q8-label" className="flex gap-2">
                {(['no', 'yes'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={practitionerRecommended === value}
                    onClick={() => setPractitionerRecommended(value)}
                    className={radioBtnClass(practitionerRecommended === value, false)}
                  >
                    {value === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                e.g., Physiotherapist, Osteopath, Chiropractor, etc.
              </p>
              {submitAttempted && errors.practitionerRecommended && (
                <p className="mt-1 text-xs text-red-600">Please select Yes or No.</p>
              )}
            </div>

            {/* Q9 */}
            <div>
              <label htmlFor="q9-goals" className="block text-[13px] font-bold text-gray-900 mb-2">
                What are you hoping to achieve from your classes?
                <span className="text-red-500"> *</span>
              </label>
              <textarea
                id="q9-goals"
                value={goalsExpectations}
                onChange={(e) => setGoalsExpectations(e.target.value)}
                rows={2}
                className={textareaClass(errors.goalsExpectations)}
                placeholder="e.g., Improve core strength, better posture, rehabilitation..."
                aria-describedby={submitAttempted && errors.goalsExpectations ? 'q9-error' : undefined}
              />
              {submitAttempted && errors.goalsExpectations && (
                <p id="q9-error" className="mt-1 text-xs text-red-600">
                  Please describe your goals.
                </p>
              )}
            </div>

            {/* Q10 */}
            <div>
              <span id="q10-label" className="block text-[13px] font-bold text-gray-900 mb-2">
                Have you ever been diagnosed with Osteoporosis or Osteopenia?
                <span className="text-red-500"> *</span>
              </span>
              <div role="radiogroup" aria-labelledby="q10-label" className="flex gap-2">
                {(['no', 'yes'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={hasBoneCondition === value}
                    onClick={() => setHasBoneCondition(value)}
                    className={radioBtnClass(hasBoneCondition === value, value === 'yes')}
                  >
                    {value === 'yes' && <AlertTriangle size={15} />}
                    {value === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
              {submitAttempted && errors.hasBoneCondition && (
                <p className="mt-1 text-xs text-red-600">Please select Yes or No.</p>
              )}
            </div>
          </div>

          {/* ── Consent ── */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 pt-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
                Consent
              </h3>
            </div>

            {/* Q11 */}
            <div>
              <label htmlFor="q11-terms" className="flex items-start gap-2.5 cursor-pointer">
                <input
                  id="q11-terms"
                  type="checkbox"
                  checked={agreedTermsOfUse}
                  onChange={(e) => setAgreedTermsOfUse(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-400 cursor-pointer shrink-0"
                />
                <span className="text-[13px] font-medium text-gray-700 leading-snug">
                  I agree to the{' '}
                  <Link
                    href="/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold underline hover:text-emerald-800"
                  >
                    General Terms of Use
                  </Link>
                  .
                  <span className="text-red-500"> *</span>
                </span>
              </label>
              {submitAttempted && errors.agreedTermsOfUse && (
                <p className="mt-1 ml-7 text-xs text-red-600">
                  You must agree to the Terms of Use to continue.
                </p>
              )}
            </div>
          </div>

          {/* ── Liability Waiver ── */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 pt-2">
              <FileText size={16} className="text-emerald-600" />
              <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
                Liability Waiver
              </h3>
            </div>

            {/* Q14: Waiver Text */}
            <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-4 max-h-44 overflow-y-auto text-[12px] leading-relaxed text-gray-600 whitespace-pre-line">
              {WAIVER_TEXT}
            </div>

            {/* Q15 */}
            <div>
              <label htmlFor="q15-agree" className="flex items-start gap-2.5 cursor-pointer">
                <input
                  id="q15-agree"
                  type="checkbox"
                  checked={agreedLiabilityWaiver}
                  onChange={(e) => setAgreedLiabilityWaiver(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-400 cursor-pointer shrink-0"
                />
                <span className="text-[13px] font-medium text-gray-700 leading-snug">
                  I understand and agree to the above terms.
                  <span className="text-red-500"> *</span>
                </span>
              </label>
              {submitAttempted && errors.agreedLiabilityWaiver && (
                <p className="mt-1 ml-7 text-xs text-red-600">
                  You must agree to the liability waiver to continue.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {formError && (
          <div className="px-5 pb-2 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-[12px] font-medium text-red-700">{formError}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-[15px] tracking-wide flex items-center justify-center gap-2 transition hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Sign & Continue
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Your health screening is stored securely. You only need to complete this once.
          </p>
        </div>
      </div>
    </div>
  );
}
