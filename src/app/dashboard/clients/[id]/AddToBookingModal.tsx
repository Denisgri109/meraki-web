'use client';

// T06 + T07 — Owner add-to-booking modal (pilates session tab + beauty appointment tab).
// Creates confirmed, unpaid (pay-at-venue) bookings via the owner_book_for_client RPC (T01),
// then notifies the client in-app (conversation message) + by push (send-push-notification,
// pattern mirrored from dashboard/appointments/page.tsx:835 and :486-503).

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { X, Loader2 } from 'lucide-react';

interface ClientInfo {
  id: string;
  full_name: string | null;
  push_token: string | null;
}

interface SessionOption {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked: number;
  service_name: string;
  base_price: number | null;
}

interface ServiceOption { id: string; name: string; duration_minutes: number | null; base_price: number | null; }
interface MasterOption { id: string; full_name: string | null; }
interface SlotOption { slot_start: string; slot_end: string; }

type Tab = 'pilates' | 'beauty';

export default function AddToBookingModal({
  client,
  onClose,
  onBooked,
}: {
  client: ClientInfo;
  onClose: () => void;
  onBooked: () => void;
}) {
  const supabase = createClient();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('pilates');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pilates tab state
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Beauty tab state
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [masters, setMasters] = useState<MasterOption[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [masterId, setMasterId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slot, setSlot] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Load upcoming scheduled pilates sessions + their booked counts
  const loadSessions = useCallback(async () => {
    const { data: raw } = await supabase
      .from('pilates_class_sessions')
      .select('id, starts_at, ends_at, capacity, service:services(name, base_price)')
      .eq('status', 'scheduled')
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(40);
    const rows = (raw || []) as unknown as Array<{
      id: string; starts_at: string; ends_at: string; capacity: number;
      service: { name: string; base_price: number | null } | null;
    }>;
    if (rows.length === 0) { setSessions([]); return; }
    const ids = rows.map(r => r.id);
    const { data: bookings } = await supabase
      .from('pilates_session_bookings')
      .select('session_id')
      .in('session_id', ids)
      .eq('status', 'booked');
    const counts = new Map<string, number>();
    for (const b of (bookings || []) as Array<{ session_id: string }>) {
      counts.set(b.session_id, (counts.get(b.session_id) || 0) + 1);
    }
    setSessions(rows.map(r => ({
      id: r.id,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      capacity: r.capacity,
      booked: counts.get(r.id) || 0,
      service_name: r.service?.name || 'Pilates class',
      base_price: r.service?.base_price ?? null,
    })));
  }, [supabase]);

  const loadBeauty = useCallback(async () => {
    const { data: svc } = await supabase.from('services').select('id, name, duration_minutes, base_price').eq('is_active', true).neq('category', 'Pilates').order('name');
    setServices((svc as ServiceOption[]) || []);
  }, [supabase]);

  // Professionals for the chosen service come from master_services (owners who
  // offer services included) — same source the client booking flow uses.
  useEffect(() => {
    setMasters([]);
    setMasterId('');
    if (!serviceId) return;
    const loadPros = async () => {
      const { data, error } = await supabase
        .from('master_services')
        .select('master_id, profiles:master_id(id, full_name)')
        .eq('service_id', serviceId);
      if (error) return;
      const pros = ((data || []) as Array<{ master_id: string; profiles: { id: string; full_name: string | null } | null }>)
        .map(r => ({ id: r.master_id, full_name: r.profiles?.full_name ?? null }));
      setMasters(pros);
      if (pros.length === 1) setMasterId(pros[0].id);
    };
    void loadPros();
  }, [serviceId, supabase]);

  useEffect(() => { void loadSessions(); void loadBeauty(); }, [loadSessions, loadBeauty]);

  // Slots for beauty tab
  useEffect(() => {
    setSlot('');
    setSlots([]);
    if (!masterId || !serviceId || !date) return;
    const svc = services.find(s => s.id === serviceId);
    const loadSlots = async () => {
      setSlotsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_available_slots', {
          p_date: date,
          p_master_id: masterId,
          p_service_duration: svc?.duration_minutes ?? undefined,
        });
        if (error) throw error;
        setSlots((data as SlotOption[]) || []);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load slots', 'error');
      } finally {
        setSlotsLoading(false);
      }
    };
    void loadSlots();
  }, [masterId, serviceId, date, services, supabase, showToast]);

  // Client notification: conversation message (+ waiver sentence for pilates when unsigned) + push.
  const notifyClient = async (serviceLabel: string, whenIso: string, isPilates: boolean) => {
    if (!user) return;
    try {
      // Waiver status (pilates only)
      let waiverSentence = '';
      if (isPilates) {
        const { data: w } = await supabase
          .from('pilates_waivers')
          .select('terms_version')
          .eq('user_id', client.id)
          .order('signed_at', { ascending: false })
          .limit(1);
        if (!w || w.length === 0 || w[0].terms_version !== '3.0') {
          waiverSentence = ' Please sign your pilates waiver in the app before class.';
        }
      }
      const when = new Date(whenIso).toLocaleString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const text = `You've been booked for ${serviceLabel} on ${when}. Pay at the venue.${waiverSentence}`;

      // Find-or-create conversation (unique index on (client_id, master_id) — safe).
      let { data: convo } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', client.id)
        .eq('master_id', user.id)
        .maybeSingle();
      if (!convo) {
        const { data: created } = await supabase
          .from('conversations')
          .insert({ client_id: client.id, master_id: user.id })
          .select('id')
          .single();
        convo = created;
      }
      if (convo) {
        await supabase.from('messages').insert({
          conversation_id: convo.id,
          sender_id: user.id,
          content: text,
        });
      }

      // Push (non-blocking failure)
      if (client.push_token) {
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              to: client.push_token,
              sound: 'default',
              title: 'New booking from Merakí',
              body: text,
              data: { clientId: client.id },
            },
          });
        } catch (e) {
          console.error('push failed (non-fatal):', e);
        }
      }
    } catch (e) {
      console.error('notify failed (non-fatal):', e);
    }
  };

  const handleConfirm = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      if (tab === 'pilates') {
        if (!selectedSession) { showToast('Pick a session', 'error'); return; }
        const s = sessions.find(x => x.id === selectedSession)!;
        const { error } = await supabase.rpc('owner_book_for_client', {
          p_client_id: client.id,
          p_session_id: selectedSession,
          p_notes: notes.trim() || null,
        });
        if (error) throw new Error(error.message);
        await notifyClient(s.service_name, s.starts_at, true);
        showToast(`${client.full_name || 'Client'} added to ${s.service_name} (pay at venue).`, 'success');
      } else {
        if (!serviceId || !masterId || !slot) { showToast('Pick service, master and time', 'error'); return; }
        const svc = services.find(s => s.id === serviceId);
        const { error } = await supabase.rpc('owner_book_for_client', {
          p_client_id: client.id,
          p_master_id: masterId,
          p_service_id: serviceId,
          p_start_time: new Date(slot).toISOString(),
          p_notes: notes.trim() || null,
        });
        if (error) throw new Error(error.message);
        await notifyClient(svc?.name || 'appointment', slot, false);
        showToast(`${client.full_name || 'Client'} booked for ${svc?.name || 'service'} (pay at venue).`, 'success');
      }
      onBooked();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !submitting && onClose()}>
      <div className="glass-card w-full max-w-lg p-6 bg-white max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Add {client.full_name || 'client'} to a booking</h3>
          <button onClick={() => !submitting && onClose()} className="p-1 rounded-lg hover:bg-black/5"><X size={18} /></button>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">The booking is created <strong>confirmed &amp; unpaid</strong> — the client pays at the venue.</p>

        <div className="flex gap-2 mb-5">
          {(['pilates', 'beauty'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${tab === t ? 'bg-black text-white' : 'bg-white/70 text-[var(--color-text-secondary)]'}`}>
              {t === 'pilates' ? 'Pilates Class' : 'Beauty Appointment'}
            </button>
          ))}
        </div>

        {tab === 'pilates' ? (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">No upcoming scheduled pilates sessions.</p>
            ) : (
              sessions.map(s => {
                const spotsLeft = s.capacity - s.booked;
                const full = spotsLeft <= 0;
                return (
                  <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedSession === s.id ? 'border-[#C47A90] bg-[#FCEFF2]' : 'border-white bg-white/60 hover:bg-white'} ${full ? 'opacity-40 pointer-events-none' : ''}`}>
                    <input type="radio" name="pilates-session" checked={selectedSession === s.id} onChange={() => setSelectedSession(s.id)} className="accent-[#C47A90]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{s.service_name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {new Date(s.starts_at).toLocaleString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {s.base_price != null && ` · €${s.base_price.toFixed(2)}`}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${full ? 'bg-red-100 text-red-600' : 'bg-[#10B981]/10 text-[#047857]'}`}>
                      {full ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'}`}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <select value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-input)] border border-white text-sm text-[var(--color-text-primary)] outline-none">
              <option value="">Select service…</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}{s.base_price != null ? ` — €${s.base_price.toFixed(2)}` : ''}</option>)}
            </select>
            <select value={masterId} onChange={e => setMasterId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-input)] border border-white text-sm text-[var(--color-text-primary)] outline-none">
              <option value="">{serviceId && masters.length === 0 ? 'No professional offers this service' : 'Select master…'}</option>
              {masters.map(m => <option key={m.id} value={m.id}>{m.full_name || 'Staff'}</option>)}
            </select>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-input)] border border-white text-sm text-[var(--color-text-primary)] outline-none" />
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                {slotsLoading ? 'Finding slots…' : slots.length > 0 ? 'Available times' : (serviceId && masterId && date ? 'No free slots this day' : 'Pick service, master & date')}
              </p>
              <div className="flex flex-wrap gap-2">
                {slots.map(s => (
                  <button key={s.slot_start} onClick={() => setSlot(s.slot_start)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${slot === s.slot_start ? 'bg-black text-white' : 'bg-white/70 text-[var(--color-text-secondary)] hover:bg-white'}`}>
                    {new Date(s.slot_start).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
          className="w-full mt-4 px-3 py-2.5 rounded-xl bg-[var(--color-surface-input)] border border-white text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none resize-none" />

        <div className="flex gap-3 mt-5">
          <button onClick={() => !submitting && onClose()} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-white/70 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-white transition">Cancel</button>
          <button onClick={handleConfirm} disabled={submitting || (tab === 'pilates' ? !selectedSession : (!serviceId || !masterId || !slot))}
            className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Booking…' : 'Add to booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
