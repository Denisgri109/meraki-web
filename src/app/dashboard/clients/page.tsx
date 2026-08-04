'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSection } from '@/contexts/SectionContext';
import { useToast } from '@/components/Toast';
import { Users, Search, ChevronRight, UserPlus, User } from 'lucide-react';
import Link from 'next/link';

interface DirectoryProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string | null;
}

type RoleTab = 'all' | 'clients' | 'masters';

export default function ClientsDirectoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { buildPath } = useSection();
  const { showToast } = useToast();

  const isOwner = profile?.role === 'owner';

  const [people, setPeople] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleTab, setRoleTab] = useState<RoleTab>('clients');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, role, created_at')
        .in('role', ['client', 'master'])
        .order('full_name', { ascending: true, nullsFirst: false })
        .limit(200);
      if (roleTab === 'clients') q = q.eq('role', 'client');
      if (roleTab === 'masters') q = q.eq('role', 'master');
      const trimmed = query.trim();
      if (trimmed) {
        const like = `%${trimmed.replace(/[%,]/g, '')}%`;
        q = q.or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      setPeople((data as DirectoryProfile[]) || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, roleTab, query, supabase, showToast]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Walk-in invite is handled on this page via modal → see state below.
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: { email: inviteEmail.trim(), fullName: inviteName.trim(), phone: invitePhone.trim() || undefined },
      });
      if (error) throw new Error(error.message);
      if (data?.email_sent) {
        showToast('Invite sent — the client can set their password from the email.', 'success');
      } else {
        showToast('Client created, but the invite email could not be sent. Share the reset link manually.', 'error');
      }
      setShowInvite(false);
      setInviteName(''); setInviteEmail(''); setInvitePhone('');
      void load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to invite client';
      showToast(msg, 'error');
    } finally {
      setInviting(false);
    }
  };

  const tabs: { key: RoleTab; label: string }[] = useMemo(() => [
    { key: 'clients', label: 'Clients' },
    { key: 'masters', label: 'Masters' },
    { key: 'all', label: 'All' },
  ], []);

  if (profile && !isOwner) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Users size={44} className="mx-auto text-[var(--color-text-muted)] mb-4" />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Access Restricted</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">Client management is available to the salon owner only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-muted)] mb-1">Directory</p>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Clients</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Search, review, message, and book clients &amp; masters.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition"
        >
          <UserPlus size={16} /> New Walk-in Client
        </button>
      </div>

      {/* Search + tabs */}
      <div className="glass-card p-4 mb-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/70 border border-white text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[#C47A90]/40"
          />
        </div>
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setRoleTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${roleTab === t.key ? 'bg-black text-white' : 'bg-white/70 text-[var(--color-text-secondary)] hover:bg-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="glass-card divide-y divide-white/60">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
        ) : people.length === 0 ? (
          <div className="p-10 text-center">
            <User size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)]">No {roleTab === 'all' ? 'people' : roleTab} match your search.</p>
          </div>
        ) : people.map((p) => {
          const href = p.role === 'master' ? buildPath(`masters/${p.id}`) : buildPath(`clients/${p.id}`);
          return (
            <Link key={p.id} href={href} className="flex items-center gap-4 p-4 hover:bg-white/50 transition">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8A0B4] to-[#C47A90] flex items-center justify-center text-white font-bold shrink-0">
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  (p.full_name || p.email || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{p.full_name || 'Unnamed'}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${p.role === 'master' ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'bg-[#10B981]/10 text-[#047857]'}`}>
                {p.role}
              </span>
              <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Walk-in invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !inviting && setShowInvite(false)}>
          <div className="glass-card w-full max-w-md p-6 bg-white" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">New Walk-in Client</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Creates a client account and emails them a password-set link.</p>
            <div className="space-y-3">
              <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name *"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-input-background,#f5f5f7)] border border-white text-sm outline-none focus:ring-2 focus:ring-[#C47A90]/40" />
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email *" type="email"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-input-background,#f5f5f7)] border border-white text-sm outline-none focus:ring-2 focus:ring-[#C47A90]/40" />
              <input value={invitePhone} onChange={e => setInvitePhone(e.target.value)} placeholder="Phone (optional)"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-input-background,#f5f5f7)] border border-white text-sm outline-none focus:ring-2 focus:ring-[#C47A90]/40" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowInvite(false)} disabled={inviting}
                className="flex-1 py-2.5 rounded-xl bg-white/70 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-white transition">Cancel</button>
              <button onClick={handleInvite} disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40">
                {inviting ? 'Creating…' : 'Create & Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
