'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { validateEmail, validateFullName } from '@/lib/validation';
import {
  ShieldCheck,
  ShieldOff,
  Users,
  Mail,
  Search,
  UserPlus,
  Loader2,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';

interface InstructorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  specialties: string[] | null;
  is_master: boolean | null;
  is_authorized_instructor: boolean | null;
  master_status: string | null;
}

export default function InstructorsPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const { user, profile, role, loading: authLoading } = useAuth();

  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  const isOwner = role === 'owner';

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email, phone, avatar_url, city, specialties, is_master, is_authorized_instructor, master_status',
        )
        .eq('is_master', true)
        .order('full_name');

      if (error) throw error;
      setInstructors((data as unknown as InstructorProfile[]) || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load instructors';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    if (authLoading) return;
    fetchInstructors();
  }, [authLoading, fetchInstructors]);

  const handleToggleAuthorization = async (
    instructorId: string,
    currentAuth: boolean,
  ) => {
    setTogglingId(instructorId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_authorized_instructor: !currentAuth })
        .eq('id', instructorId);

      if (error) throw error;

      setInstructors((prev) =>
        prev.map((i) =>
          i.id === instructorId
            ? { ...i, is_authorized_instructor: !currentAuth }
            : i,
        ),
      );

      showToast(
        !currentAuth
          ? 'Instructor authorized — can now view client waivers'
          : 'Instructor deauthorized — waiver access revoked',
        'success',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update authorization';
      showToast(msg, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = validateFullName(inviteName);
    if (!nameVal.valid) {
      showToast(nameVal.error || 'Invalid name', 'error');
      return;
    }
    const emailVal = validateEmail(inviteEmail);
    if (!emailVal.valid) {
      showToast(emailVal.error || 'Invalid email', 'error');
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-master', {
        body: { email: inviteEmail, full_name: inviteName },
      });
      const errorMessage =
        error?.message || data?.error || (typeof data === 'string' ? data : null);
      if (errorMessage) throw new Error(errorMessage);
      if (!data?.success) throw new Error('Unexpected response from server');

      if (data?.email_sent) {
        showToast('Invitation email sent to instructor!', 'success');
      } else {
        showToast('Invitation recorded (email delivery pending)', 'info');
      }

      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      // Refresh list to show the new invited master
      fetchInstructors();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists')) {
        showToast('An application with this email already exists', 'error');
      } else {
        showToast(msg || 'Failed to invite instructor', 'error');
      }
    } finally {
      setInviting(false);
    }
  };

  // ── Auth gate: only the Owner can access this page ─────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Owner Access Required
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Only the Studio Owner can manage instructor authorizations.
        </p>
      </div>
    );
  }

  const filteredInstructors = instructors.filter(
    (i) =>
      !search ||
      i.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const authorizedCount = instructors.filter(
    (i) => i.is_authorized_instructor === true,
  ).length;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={22} className="text-emerald-600" />
            <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
              Instructors
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Authorize instructors to view signed client waivers
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-pink flex items-center gap-2"
        >
          <UserPlus size={18} /> Invite Instructor
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            <Users size={14} /> Total Masters
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
            {instructors.length}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            <ShieldCheck size={14} /> Authorized
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {authorizedCount}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Can view client waivers
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="glass-card p-4 mb-6 border-l-4 border-emerald-400 bg-emerald-50/60 flex items-start gap-3">
        <AlertCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            How authorization works
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Toggle <strong>Authorize</strong> to grant an instructor access to view
            signed Injury Disclosure &amp; Liability forms. Only the Owner can
            change this setting. Deauthorized instructors lose waiver access
            immediately — they still keep their dashboard and booking access.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-glass pl-11 w-full"
        />
      </div>

      {/* Instructor list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-light)]" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--color-surface-light)] rounded w-1/4 mb-2" />
                <div className="h-3 bg-[var(--color-surface-light)] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Users size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">
            No instructors found
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Invite a master account to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInstructors.map((instructor) => {
            const isAuthorized = instructor.is_authorized_instructor === true;
            const isToggling = togglingId === instructor.id;
            return (
              <div
                key={instructor.id}
                className="glass-card p-5 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-300 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                    {instructor.avatar_url ? (
                      <img
                        src={instructor.avatar_url}
                        alt={instructor.full_name || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      instructor.full_name?.charAt(0) || '?'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {instructor.full_name || 'Unnamed'}
                      </p>
                      {isAuthorized ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <ShieldCheck size={10} /> Authorized
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Not Authorized
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      {instructor.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={10} /> {instructor.email}
                        </span>
                      )}
                      {instructor.city && <span>· {instructor.city}</span>}
                      {instructor.specialties &&
                        instructor.specialties.length > 0 && (
                          <span>· {instructor.specialties.join(', ')}</span>
                        )}
                    </div>
                  </div>

                  {/* Toggle authorization */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isToggling ? (
                      <Loader2 size={20} className="animate-spin text-emerald-500" />
                    ) : (
                      <button
                        onClick={() =>
                          handleToggleAuthorization(instructor.id, isAuthorized)
                        }
                        className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          isAuthorized
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isAuthorized ? (
                          <>
                            <ShieldCheck size={16} /> Authorized
                          </>
                        ) : (
                          <>
                            <ShieldOff size={16} /> Authorize
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                Invite Instructor
              </h3>
              <button
                onClick={() => !inviting && setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="input-glass w-full"
                    placeholder="Jane Doe"
                    disabled={inviting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-glass w-full"
                    placeholder="jane@example.com"
                    disabled={inviting}
                  />
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-2">
                  <p className="text-xs text-emerald-700 flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    After the instructor signs up, return to this page and toggle
                    <strong> Authorize</strong> to grant them waiver access.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !inviting && setShowInviteModal(false)}
                  className="btn-secondary"
                  disabled={inviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-pink flex items-center gap-2"
                  disabled={inviting}
                >
                  {inviting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
