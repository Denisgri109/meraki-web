'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import {
  ShieldCheck,
  ShieldOff,
  FileText,
  Search,
  Loader2,
  AlertTriangle,
  HeartPulse,
  Phone,
  User as UserIcon,
  PenLine,
  Calendar,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

interface WaiverRow {
  id: string;
  user_id: string;
  has_injuries: boolean;
  injury_details: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  signature_name: string | null;
  signed_at: string;
  terms_version: string | null;
  created_at: string | null;
  injuries_joint_problems: string | null;
  pilates_experience: string | null;
  has_illnesses: boolean | null;
  illness_details: string | null;
  pregnancy_status: string | null;
  medication_details: string | null;
  exercise_history: string | null;
  practitioner_recommended: boolean | null;
  goals_expectations: string | null;
  has_bone_condition: boolean | null;
  agreed_terms_of_use: boolean | null;
  agreed_liability_waiver: boolean | null;
  // Joined profile data
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export default function WaiversPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const { role, loading: authLoading } = useAuth();

  const [waivers, setWaivers] = useState<WaiverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterInjuries, setFilterInjuries] = useState<'all' | 'with_injuries'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAuthorized =
    role === 'owner' || role === 'master'; // RLS enforces is_authorized_instructor at DB level

  const fetchWaivers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pilates_waivers')
        .select(
          `id, user_id, has_injuries, injury_details,
           emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
           signature_name, signed_at, terms_version, created_at,
           injuries_joint_problems, pilates_experience, has_illnesses, illness_details,
           pregnancy_status, medication_details, exercise_history, practitioner_recommended,
           goals_expectations, has_bone_condition, agreed_terms_of_use, agreed_liability_waiver,
           profile:profiles!pilates_waivers_user_id_fkey(full_name, email, phone)`,
        )
        .order('signed_at', { ascending: false });

      if (error) throw error;
      setWaivers((data as unknown as WaiverRow[]) || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load waivers';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    if (authLoading) return;
    fetchWaivers();
  }, [authLoading, fetchWaivers]);

  // ── Auth gate ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  // If the user is not staff, or if they ARE a master but the DB denies
  // access (is_authorized_instructor = false), Supabase RLS will return
  // an empty array or an error. We check role client-side as a first gate
  // and show an access denied screen for non-staff.
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Access Denied
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Only the Owner and authorized instructors can view client waivers.
        </p>
      </div>
    );
  }

  const filteredWaivers = waivers.filter((w) => {
    const matchesSearch =
      !search ||
      w.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      w.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      w.signature_name?.toLowerCase().includes(search.toLowerCase());

    const matchesInjuryFilter =
      filterInjuries === 'all' || (filterInjuries === 'with_injuries' && w.has_injuries);

    return matchesSearch && matchesInjuryFilter;
  });

  const injuriesCount = waivers.filter((w) => w.has_injuries).length;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={22} className="text-emerald-600" />
            <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
              Signed Waivers
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Injury Disclosure &amp; Liability forms submitted by clients
          </p>
        </div>
        {role === 'owner' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Owner</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            <FileText size={14} /> Total Waivers
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
            {waivers.length}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
            <AlertTriangle size={14} /> With Injuries
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{injuriesCount}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Requires instructor attention
          </p>
        </div>
      </div>

      {/* If no waivers returned but user is a master, they may not be authorized */}
      {role === 'master' && waivers.length === 0 && !loading && (
        <div className="glass-card p-4 mb-6 border-l-4 border-amber-400 bg-amber-50/60 flex items-start gap-3">
          <ShieldOff size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              No waivers visible
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              If you are a Master Account, the Owner must authorize you before
              you can view client waivers. Contact the Studio Owner to request
              access.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by client name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass pl-11 w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterInjuries('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              filterInjuries === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterInjuries('with_injuries')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              filterInjuries === 'with_injuries'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            With Injuries
          </button>
        </div>
      </div>

      {/* Waiver list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-[var(--color-surface-light)] rounded w-1/3 mb-3" />
              <div className="h-3 bg-[var(--color-surface-light)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredWaivers.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">
            No waivers found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWaivers.map((waiver) => {
            const isExpanded = expandedId === waiver.id;
            const clientName = waiver.profile?.full_name || waiver.signature_name || 'Unknown Client';
            const signedDate = new Date(waiver.signed_at);

            return (
              <div
                key={waiver.id}
                className="glass-card overflow-hidden transition-all duration-200"
              >
                {/* Summary row — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : waiver.id)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-[var(--color-surface-light)]/30 transition-colors cursor-pointer text-left"
                >
                  {/* Avatar / icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      waiver.has_injuries
                        ? 'bg-amber-50'
                        : 'bg-emerald-50'
                    }`}
                  >
                    {waiver.has_injuries ? (
                      <AlertTriangle size={20} className="text-amber-600" />
                    ) : (
                      <ShieldCheck size={20} className="text-emerald-600" />
                    )}
                  </div>

                  {/* Client info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[var(--color-text-primary)] truncate">
                        {clientName}
                      </p>
                      {waiver.has_injuries && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                          Injury Disclosed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      {waiver.profile?.email && <span>{waiver.profile.email}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {signedDate.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Expand/collapse */}
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-[var(--color-text-muted)] shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-[var(--color-text-muted)] shrink-0" />
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border-light)] px-5 py-4 space-y-4 bg-[var(--color-surface-light)]/20">
                    {/* v3.0 Health Screening — shown for v3.0 waivers */}
                    {waiver.injuries_joint_problems !== null && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                          <HeartPulse size={14} className="text-emerald-600" />
                          Health Screening
                        </h4>
                        <div className="bg-white border border-[var(--color-border-light)] rounded-xl p-3 space-y-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Injuries & Joint Problems</span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-0.5 whitespace-pre-line">{waiver.injuries_joint_problems || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Pilates Experience</span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-0.5 whitespace-pre-line">{waiver.pilates_experience || '—'}</p>
                          </div>
                          {waiver.has_illnesses !== null && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Has Illnesses/Disabilities</span>
                              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{waiver.has_illnesses ? 'Yes' : 'No'}</p>
                            </div>
                          )}
                          {waiver.has_illnesses && waiver.illness_details && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Illness Details</span>
                              <p className="text-sm text-[var(--color-text-primary)] mt-0.5 whitespace-pre-line">{waiver.illness_details}</p>
                            </div>
                          )}
                          {waiver.pregnancy_status && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Pregnancy Status</span>
                              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{waiver.pregnancy_status === 'not_applicable' ? 'N/A' : waiver.pregnancy_status === 'yes' ? 'Yes' : 'No'}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Medication Details</span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-0.5 whitespace-pre-line">{waiver.medication_details || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Exercise History</span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-0.5 whitespace-pre-line">{waiver.exercise_history || '—'}</p>
                          </div>
                          {waiver.practitioner_recommended !== null && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Practitioner Recommended</span>
                              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{waiver.practitioner_recommended ? 'Yes' : 'No'}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Goals & Expectations</span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-0.5 whitespace-pre-line">{waiver.goals_expectations || '—'}</p>
                          </div>
                          {waiver.has_bone_condition !== null && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Osteoporosis/Osteopenia</span>
                              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{waiver.has_bone_condition ? 'Yes' : 'No'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* v2.0 Injury Disclosure — fallback for older waivers */}
                    {waiver.injuries_joint_problems === null && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                          <HeartPulse size={14} className="text-emerald-600" />
                          Injury Disclosure
                        </h4>
                        {waiver.has_injuries ? (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <p className="text-sm text-amber-900 whitespace-pre-line">
                              {waiver.injury_details || 'No details provided'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            No injuries, medical conditions, or limitations disclosed.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Emergency contact */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                        <Phone size={14} className="text-emerald-600" />
                        Emergency Contact
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white border border-[var(--color-border-light)] rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                            Name
                          </p>
                          <p className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5">
                            <UserIcon size={12} className="text-gray-400" />
                            {waiver.emergency_contact_name || '—'}
                          </p>
                        </div>
                        <div className="bg-white border border-[var(--color-border-light)] rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                            Relationship
                          </p>
                          <p className="text-sm text-[var(--color-text-primary)]">
                            {waiver.emergency_contact_relationship || '—'}
                          </p>
                        </div>
                        <div className="bg-white border border-[var(--color-border-light)] rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                            Phone
                          </p>
                          <p className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" />
                            {waiver.emergency_contact_phone || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Consent — v3.0 */}
                    {(waiver.agreed_terms_of_use !== null || waiver.agreed_liability_waiver !== null) && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          Consent
                        </h4>
                        <div className="bg-white border border-[var(--color-border-light)] rounded-xl p-3 space-y-1.5">
                          {waiver.agreed_terms_of_use !== null && (
                            <p className={`text-sm flex items-center gap-2 ${waiver.agreed_terms_of_use ? 'text-emerald-700' : 'text-red-600'}`}>
                              <span>{waiver.agreed_terms_of_use ? '\u2713' : '\u2717'}</span>
                              Terms of Use {waiver.agreed_terms_of_use ? 'agreed' : 'NOT agreed'}
                            </p>
                          )}
                          {waiver.agreed_liability_waiver !== null && (
                            <p className={`text-sm flex items-center gap-2 ${waiver.agreed_liability_waiver ? 'text-emerald-700' : 'text-red-600'}`}>
                              <span>{waiver.agreed_liability_waiver ? '\u2713' : '\u2717'}</span>
                              Liability Waiver {waiver.agreed_liability_waiver ? 'agreed' : 'NOT agreed'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Signature & Details */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                        <PenLine size={14} className="text-emerald-600" />
                        Signature & Details
                      </h4>
                      <div className="bg-white border border-[var(--color-border-light)] rounded-xl p-3">
                        {waiver.signature_name && (
                          <p
                            className="text-lg font-medium text-[var(--color-text-primary)]"
                            style={{
                              fontFamily: 'Georgia, "Times New Roman", serif',
                            }}
                          >
                            {waiver.signature_name}
                          </p>
                        )}
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Signed on{' '}
                          {signedDate.toLocaleString(undefined, {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          })}
                        </p>
                        {waiver.terms_version && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Terms version: {waiver.terms_version}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
