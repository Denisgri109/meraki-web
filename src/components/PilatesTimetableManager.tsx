'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Loader2, Plus, Save, Users, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import type { Tables, TablesInsert } from '@/types/database';

type Service = Tables<'services'>;
type PilatesSettings = Tables<'pilates_settings'>;
type PilatesHost = Tables<'pilates_hosts'>;
type PilatesTemplate = Tables<'pilates_schedule_templates'>;
type PilatesSessionRow = Tables<'pilates_class_sessions'>;
type PilatesBooking = Pick<Tables<'pilates_session_bookings'>, 'id' | 'status'>;
type PilatesSession = PilatesSessionRow & {
  host: PilatesHost | null;
  pilates_session_bookings: PilatesBooking[] | null;
};
type HostProfile = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'role' | 'avatar_url'>;

interface PilatesTimetableManagerProps {
  service: Service;
  onClose: () => void;
}

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All levels'];
const todayDate = () => new Date().toISOString().slice(0, 10);
const endDate = () => new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const isoPlusDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const defaultSettings = {
  default_capacity: 6,
  default_session_duration_minutes: 50,
  buffer_minutes: 10,
  equipment_provided: true,
  require_health_declaration: true,
  default_level: 'All levels',
  equipment_notes: '',
  location_notes: '',
};

export function PilatesTimetableManager({ service, onClose }: PilatesTimetableManagerProps) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hosts, setHosts] = useState<PilatesHost[]>([]);
  const [hostProfiles, setHostProfiles] = useState<HostProfile[]>([]);
  const [templates, setTemplates] = useState<PilatesTemplate[]>([]);
  const [sessions, setSessions] = useState<PilatesSession[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [hostName, setHostName] = useState('');
  const [templateForm, setTemplateForm] = useState({
    day_of_week: 1,
    start_time: '18:00',
    host_id: '',
    capacity: '6',
    duration_minutes: '50',
    level: 'All levels',
    starts_on: todayDate(),
    notes: '',
  });
  const [settingsForm, setSettingsForm] = useState(defaultSettings);
  const [editingSession, setEditingSession] = useState<PilatesSession | null>(null);
  const [sessionForm, setSessionForm] = useState({ host_id: '', capacity: '6', level: 'All levels', status: 'scheduled', notes: '' });

  const groupedSessions = useMemo(() => {
    return sessions.reduce<Record<string, PilatesSession[]>>((acc, session) => {
      const key = new Date(session.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      acc[key] = [...(acc[key] || []), session];
      return acc;
    }, {});
  }, [sessions]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await supabase.rpc('ensure_pilates_sessions', {
        p_service_id: service.id,
        p_start_date: todayDate(),
        p_end_date: endDate(),
      });

      const [hostsRes, profilesRes, templatesRes, settingsRes, sessionsRes] = await Promise.all([
        supabase.from('pilates_hosts').select('*').eq('owner_id', user.id).order('display_name'),
        supabase.from('profiles').select('id, full_name, role, avatar_url').in('role', ['owner', 'master']).order('full_name'),
        supabase.from('pilates_schedule_templates').select('*').eq('service_id', service.id).order('day_of_week').order('start_time'),
        supabase.from('pilates_settings').select('*').eq('service_id', service.id).maybeSingle(),
        supabase
          .from('pilates_class_sessions')
          .select('*, host:pilates_hosts(*), pilates_session_bookings(id, status)')
          .eq('service_id', service.id)
          .gte('starts_at', new Date().toISOString())
          .lt('starts_at', isoPlusDays(35))
          .order('starts_at'),
      ]);

      if (hostsRes.error) throw hostsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (templatesRes.error) throw templatesRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      setHosts(hostsRes.data || []);
      setHostProfiles((profilesRes.data as HostProfile[]) || []);
      setTemplates(templatesRes.data || []);
      setSessions((sessionsRes.data as unknown as PilatesSession[]) || []);

      const settings = settingsRes.data as PilatesSettings | null;
      if (settings) {
        setSettingsForm({
          default_capacity: settings.default_capacity,
          default_session_duration_minutes: settings.default_session_duration_minutes,
          buffer_minutes: settings.buffer_minutes,
          equipment_provided: settings.equipment_provided,
          require_health_declaration: settings.require_health_declaration,
          default_level: settings.default_level,
          equipment_notes: settings.equipment_notes || '',
          location_notes: settings.location_notes || '',
        });
        setTemplateForm((prev) => ({
          ...prev,
          capacity: String(settings.default_capacity),
          duration_minutes: String(settings.default_session_duration_minutes),
          level: settings.default_level,
        }));
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load Pilates timetable', 'error');
    } finally {
      setLoading(false);
    }
  }, [service.id, showToast, supabase, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const saveSettings = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('pilates_settings').upsert(
        {
          owner_id: user.id,
          service_id: service.id,
          default_capacity: Number(settingsForm.default_capacity),
          default_session_duration_minutes: Number(settingsForm.default_session_duration_minutes),
          buffer_minutes: Number(settingsForm.buffer_minutes),
          equipment_provided: settingsForm.equipment_provided,
          require_health_declaration: settingsForm.require_health_declaration,
          default_level: settingsForm.default_level,
          equipment_notes: settingsForm.equipment_notes.trim() || null,
          location_notes: settingsForm.location_notes.trim() || null,
        },
        { onConflict: 'service_id' }
      );
      if (error) throw error;
      showToast('Pilates details saved', 'success');
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save Pilates details', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createHost = async () => {
    if (!user?.id) return;
    const selectedProfile = hostProfiles.find((profile) => profile.id === selectedProfileId);
    const displayName = selectedProfile?.full_name || hostName.trim();
    if (!displayName) {
      showToast('Enter a host name or choose a profile', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('pilates_hosts').insert({
        owner_id: user.id,
        profile_id: selectedProfile?.id || null,
        display_name: displayName,
      });
      if (error) throw error;
      setSelectedProfileId('');
      setHostName('');
      showToast('Host added', 'success');
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to add host', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createTemplate = async () => {
    if (!user?.id) return;
    if (!templateForm.host_id) {
      showToast('Choose a host for this class slot', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: TablesInsert<'pilates_schedule_templates'> = {
        owner_id: user.id,
        service_id: service.id,
        host_id: templateForm.host_id,
        day_of_week: Number(templateForm.day_of_week),
        start_time: templateForm.start_time,
        capacity: Number(templateForm.capacity),
        duration_minutes: Number(templateForm.duration_minutes),
        level: templateForm.level,
        starts_on: templateForm.starts_on || todayDate(),
        notes: templateForm.notes.trim() || null,
        is_active: true,
      };
      const { error } = await supabase.from('pilates_schedule_templates').insert(payload);
      if (error) throw error;
      showToast('Weekly class added', 'success');
      setTemplateForm((prev) => ({ ...prev, notes: '' }));
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to add class slot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = async (template: PilatesTemplate) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pilates_schedule_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update class slot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openSessionEditor = (session: PilatesSession) => {
    setEditingSession(session);
    setSessionForm({
      host_id: session.host_id || '',
      capacity: String(session.capacity),
      level: session.level,
      status: session.status,
      notes: session.notes || '',
    });
  };

  const saveSession = async () => {
    if (!editingSession) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pilates_class_sessions')
        .update({
          host_id: sessionForm.host_id || null,
          capacity: Number(sessionForm.capacity),
          level: sessionForm.level,
          status: sessionForm.status,
          notes: sessionForm.notes.trim() || null,
          is_override: true,
        })
        .eq('id', editingSession.id);
      if (error) throw error;
      setEditingSession(null);
      showToast('Class updated', 'success');
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update class', 'error');
    } finally {
      setSaving(false);
    }
  };

  const bookedCount = (session: PilatesSession) => session.pilates_session_bookings?.filter((booking) => booking.status === 'booked').length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-md">
      <div className="mx-auto my-6 w-full max-w-6xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Pilates timetable</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{service.name}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Create weekly classes, assign hosts, and adjust live session capacity.</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-[var(--color-text-muted)]">
            <Loader2 size={18} className="animate-spin" /> Loading timetable...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-emerald-900"><Save size={16} /> Session details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="1" max="50" value={settingsForm.default_capacity} onChange={(e) => setSettingsForm({ ...settingsForm, default_capacity: Number(e.target.value) })} className="input-glass" placeholder="Capacity" />
                  <input type="number" min="15" max="240" value={settingsForm.default_session_duration_minutes} onChange={(e) => setSettingsForm({ ...settingsForm, default_session_duration_minutes: Number(e.target.value) })} className="input-glass" placeholder="Duration" />
                </div>
                <select value={settingsForm.default_level} onChange={(e) => setSettingsForm({ ...settingsForm, default_level: e.target.value })} className="input-glass mt-3">
                  {LEVELS.map((level) => <option key={level}>{level}</option>)}
                </select>
                <textarea value={settingsForm.equipment_notes} onChange={(e) => setSettingsForm({ ...settingsForm, equipment_notes: e.target.value })} rows={2} className="input-glass mt-3 resize-none" placeholder="Equipment notes" />
                <textarea value={settingsForm.location_notes} onChange={(e) => setSettingsForm({ ...settingsForm, location_notes: e.target.value })} rows={2} className="input-glass mt-3 resize-none" placeholder="Location notes" />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <label className="flex items-center gap-2 rounded-xl bg-white/70 p-3"><input type="checkbox" checked={settingsForm.equipment_provided} onChange={(e) => setSettingsForm({ ...settingsForm, equipment_provided: e.target.checked })} /> Equipment</label>
                  <label className="flex items-center gap-2 rounded-xl bg-white/70 p-3"><input type="checkbox" checked={settingsForm.require_health_declaration} onChange={(e) => setSettingsForm({ ...settingsForm, require_health_declaration: e.target.checked })} /> Health form</label>
                </div>
                <button onClick={saveSettings} disabled={saving} className="btn-primary mt-3 w-full py-2 text-sm">Save details</button>
              </div>

              <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface-light)] p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold"><Users size={16} /> Hosts</h3>
                <select value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)} className="input-glass mb-2">
                  <option value="">Manual host name</option>
                  {hostProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || 'Unnamed'} · {profile.role}</option>)}
                </select>
                {!selectedProfileId && <input value={hostName} onChange={(e) => setHostName(e.target.value)} className="input-glass mb-2" placeholder="External host name" />}
                <button onClick={createHost} disabled={saving} className="btn-outline w-full py-2 text-sm">Add host</button>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hosts.map((host) => <span key={host.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)] shadow-sm">{host.display_name}</span>)}
                </div>
              </div>

              <div className="rounded-2xl border border-pink-100 bg-pink-50/70 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-pink-900"><Plus size={16} /> Weekly class</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select value={templateForm.day_of_week} onChange={(e) => setTemplateForm({ ...templateForm, day_of_week: Number(e.target.value) })} className="input-glass">
                    {DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                  </select>
                  <input type="time" value={templateForm.start_time} onChange={(e) => setTemplateForm({ ...templateForm, start_time: e.target.value })} className="input-glass" />
                </div>
                <select value={templateForm.host_id} onChange={(e) => setTemplateForm({ ...templateForm, host_id: e.target.value })} className="input-glass mt-2">
                  <option value="">Choose host</option>
                  {hosts.map((host) => <option key={host.id} value={host.id}>{host.display_name}</option>)}
                </select>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input type="number" min="1" max="50" value={templateForm.capacity} onChange={(e) => setTemplateForm({ ...templateForm, capacity: e.target.value })} className="input-glass" placeholder="Spaces" />
                  <input type="number" min="15" max="240" value={templateForm.duration_minutes} onChange={(e) => setTemplateForm({ ...templateForm, duration_minutes: e.target.value })} className="input-glass" placeholder="Mins" />
                  <select value={templateForm.level} onChange={(e) => setTemplateForm({ ...templateForm, level: e.target.value })} className="input-glass">
                    {LEVELS.map((level) => <option key={level}>{level}</option>)}
                  </select>
                </div>
                <input type="date" value={templateForm.starts_on} min={todayDate()} onChange={(e) => setTemplateForm({ ...templateForm, starts_on: e.target.value })} className="input-glass mt-2" />
                <textarea value={templateForm.notes} onChange={(e) => setTemplateForm({ ...templateForm, notes: e.target.value })} rows={2} className="input-glass mt-2 resize-none" placeholder="Class notes" />
                <button onClick={createTemplate} disabled={saving} className="btn-primary mt-3 w-full py-2 text-sm">Add to timetable</button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--color-border-light)] bg-white p-4 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><CalendarDays size={18} /> Weekly timetable</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {templates.map((template) => {
                    const host = hosts.find((item) => item.id === template.host_id);
                    return (
                      <div key={template.id} className={`rounded-2xl border p-4 ${template.is_active ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{DAYS.find((day) => day.value === template.day_of_week)?.label} · {template.start_time.slice(0, 5)}</p>
                            <p className="mt-1 font-bold text-[var(--color-text-primary)]">{host?.display_name || 'No host'}</p>
                          </div>
                          <button onClick={() => toggleTemplate(template)} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)] shadow-sm">{template.is_active ? 'Active' : 'Paused'}</button>
                        </div>
                        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{template.level} · {template.capacity} spots · {template.duration_minutes} min</p>
                      </div>
                    );
                  })}
                  {templates.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No weekly classes yet. Add one from the left panel.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border-light)] bg-white p-4 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><Clock size={18} /> Upcoming sessions</h3>
                <div className="space-y-5">
                  {Object.entries(groupedSessions).map(([dateLabel, items]) => (
                    <div key={dateLabel}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{dateLabel}</p>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {items.map((session) => {
                          const count = bookedCount(session);
                          const full = count >= session.capacity;
                          return (
                            <button key={session.id} onClick={() => openSessionEditor(session)} className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-md ${session.status === 'cancelled' ? 'border-red-100 bg-red-50 opacity-60' : full ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-violet-100 bg-violet-50/60'}`}>
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-bold text-[var(--color-text-primary)]">{new Date(session.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{count}/{session.capacity}</span>
                              </div>
                              <p className="mt-1 text-sm font-semibold text-violet-700">{session.host?.display_name || 'No host'}</p>
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{session.level} · {session.status}{full ? ' · full' : ''}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No upcoming sessions generated yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Edit class</p>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{new Date(editingSession.starts_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</h3>
              </div>
              <button onClick={() => setEditingSession(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select value={sessionForm.host_id} onChange={(e) => setSessionForm({ ...sessionForm, host_id: e.target.value })} className="input-glass">
                <option value="">No host</option>
                {hosts.map((host) => <option key={host.id} value={host.id}>{host.display_name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="1" max="50" value={sessionForm.capacity} onChange={(e) => setSessionForm({ ...sessionForm, capacity: e.target.value })} className="input-glass" />
                <select value={sessionForm.level} onChange={(e) => setSessionForm({ ...sessionForm, level: e.target.value })} className="input-glass">
                  {LEVELS.map((level) => <option key={level}>{level}</option>)}
                </select>
              </div>
              <select value={sessionForm.status} onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })} className="input-glass">
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={3} className="input-glass resize-none" placeholder="Override notes" />
              <button onClick={saveSession} disabled={saving} className="btn-primary w-full py-3 text-sm">Save class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PilatesTimetableManager;
