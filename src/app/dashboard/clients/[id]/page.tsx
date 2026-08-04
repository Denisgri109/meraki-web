'use client';

// T05 — Owner client detail. Contact card + upcoming bookings + class passes +
// pilates waiver status (terms_version '3.0' = signed; anything else/none = pending)
// + Message (conversation find-or-create, pattern from dashboard/appointments/page.tsx)
// + Add to Booking (T06/T07 AddToBookingModal).

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSection } from '@/contexts/SectionContext';
import { useToast } from '@/components/Toast';
import { User, Mail, Phone, MapPin, CalendarDays, Ticket, ShieldCheck, MessageSquare, CalendarPlus } from 'lucide-react';
import AddToBookingModal from './AddToBookingModal';

const CURRENT_TERMS_VERSION = '3.0';

interface DetailProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  role: string;
  created_at: string | null;
  push_token: string | null;
}

interface UpcomingAppointment {
  id: string;
  service_name: string | null;
  service_category: string | null;
  start_time: string;
  status: string;
  price: number | null;
}

interface PassSummary {
  name: string;
  remaining_credits: number;
  initial_credits: number;
  expires_at: string | null;
}

export default function ClientDetailPage() {
  const supabase = createClient();
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const { user, profile } = useAuth();
  const { buildPath } = useSection();
  const { showToast } = useToast();

  const isOwner = profile?.role === 'owner';

  const [client, setClient] = useState<DetailProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);
  const [passes, setPasses] = useState<PassSummary[]>([]);
  const [waiver, setWaiver] = useState<{ terms_version: string; signed_at: string | null } | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const load = useCallback(async () => {
    if (!user || !clientId) return;
    setLoading(true);
    try {
      const [{ data: p, error: pErr }, { data: appts }, { data: passRows }, { data: waivers }] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, email, phone, avatar_url, city, state, country, role, created_at, push_token')
          .eq('id', clientId).maybeSingle(),
        supabase.from('appointments')
          .select('id, service_name, service_category, start_time, status, price')
          .eq('client_id', clientId)
          .gte('start_time', new Date().toISOString())
          .in('status', ['confirmed', 'pending'])
          .order('start_time', { ascending: true })
          .limit(10),
        supabase.rpc('get_active_pass_summary', { p_user_id: clientId }),
        supabase.from('pilates_waivers')
          .select('terms_version, signed_at')
          .eq('user_id', clientId)
          .order('signed_at', { ascending: false })
          .limit(1),
      ]);
      if (pErr) throw pErr;
      if (!p) { setNotFound(true); return; }
      setClient(p as DetailProfile);
      setUpcoming((appts as UpcomingAppointment[]) || []);
      setPasses((passRows as PassSummary[]) || []);
      setWaiver(waivers && waivers.length > 0 ? (waivers[0] as { terms_version: string; signed_at: string | null }) : null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load client', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, clientId, supabase, showToast]);

  useEffect(() => { void load(); }, [load]);

  // Message: find-or-create conversation (client_id/master_id pair) then hand off
  // to the chat page via the same localStorage bridge used by appointments page.
  const handleMessage = async () => {
    if (!user || !client) return;
    setMessaging(true);
    try {
      const otherUserId = client.id;
      let { data: convo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},master_id.eq.${otherUserId}),and(client_id.eq.${otherUserId},master_id.eq.${user.id})`)
        .maybeSingle();
      if (!convo) {
        const { data: newConvo, error } = await supabase
          .from('conversations')
          .insert({ client_id: otherUserId, master_id: user.id })
          .select('id')
          .single();
        if (error) throw error;
        convo = newConvo;
      }
      localStorage.setItem('meraki_active_chat_convo_id', convo.id);
      window.location.href = buildPath('chat');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to open chat', 'error');
      setMessaging(false);
    }
  };

  if (profile && !isOwner) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <User size={44} className="mx-auto text-[var(--color-text-muted)] mb-4" />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Access Restricted</h2>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <User size={44} className="mx-auto text-[var(--color-text-muted)] mb-4" />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Client not found</h2>
      </div>
    );
  }

  const waiverSigned = waiver?.terms_version === CURRENT_TERMS_VERSION;
  const location = [client?.city, client?.state, client?.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {loading && !client ? (
        <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : client && (
        <>
          {/* Contact card */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E8A0B4] to-[#C47A90] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {client.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={client.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  (client.full_name || client.email || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{client.full_name || 'Unnamed'}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-[#10B981]/10 text-[#047857]">{client.role}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {client.email && <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2"><Mail size={14} className="text-[var(--color-text-muted)]" /> {client.email}</p>}
                  {client.phone && <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2"><Phone size={14} className="text-[var(--color-text-muted)]" /> {client.phone}</p>}
                  {location && <p className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2"><MapPin size={14} className="text-[var(--color-text-muted)]" /> {location}</p>}
                  {client.created_at && <p className="text-xs text-[var(--color-text-muted)]">Member since {new Date(client.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleMessage} disabled={messaging}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
                <MessageSquare size={16} /> {messaging ? 'Opening…' : 'Message'}
              </button>
              <button onClick={() => setShowBookingModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C47A90] text-white text-sm font-semibold hover:opacity-90 transition">
                <CalendarPlus size={16} /> Add to Booking
              </button>
            </div>
          </div>

          {/* Waiver */}
          <div className="glass-card p-5 mb-6 flex items-center gap-3">
            <ShieldCheck size={20} className={waiverSigned ? 'text-[#047857]' : 'text-amber-500'} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Pilates Waiver</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {waiverSigned
                  ? `Signed (v${waiver!.terms_version})${waiver!.signed_at ? ` on ${new Date(waiver!.signed_at).toLocaleDateString('en-IE')}` : ''}`
                  : 'Waiver pending — client must sign v3.0 in the app before class'}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${waiverSigned ? 'bg-[#10B981]/10 text-[#047857]' : 'bg-amber-100 text-amber-700'}`}>
              {waiverSigned ? 'Signed' : 'Pending'}
            </span>
          </div>

          {/* Upcoming bookings */}
          <div className="glass-card p-5 mb-6">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2"><CalendarDays size={16} /> Upcoming bookings</h2>
            {upcoming.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No upcoming bookings.</p>
            ) : (
              <ul className="divide-y divide-white/60">
                {upcoming.map(a => (
                  <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{a.service_name || 'Appointment'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {new Date(a.start_time).toLocaleString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">€{(a.price ?? 0).toFixed(2)}</p>
                      <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">{a.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Class passes */}
          <div className="glass-card p-5 mb-6">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2"><Ticket size={16} /> Class passes</h2>
            {passes.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No active passes.</p>
            ) : (
              <ul className="divide-y divide-white/60">
                {passes.map((ps, i) => (
                  <li key={i} className="py-2.5 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{ps.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {ps.remaining_credits}/{ps.initial_credits} credits left
                      {ps.expires_at ? ` · expires ${new Date(ps.expires_at).toLocaleDateString('en-IE')}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showBookingModal && (
            <AddToBookingModal
              client={{ id: client.id, full_name: client.full_name, push_token: client.push_token }}
              onClose={() => setShowBookingModal(false)}
              onBooked={() => { setShowBookingModal(false); void load(); }}
            />
          )}
        </>
      )}
    </div>
  );
}
