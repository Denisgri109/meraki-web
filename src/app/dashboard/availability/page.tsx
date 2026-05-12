'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, CalendarDays, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

const defaultSchedule: Record<string, DaySchedule> = Object.fromEntries(
  daysOfWeek.map((day) => [
    day,
    {
      enabled: !['Saturday', 'Sunday'].includes(day),
      slots: [{ start: '09:00', end: '17:00' }],
    },
  ])
);

export default function AvailabilityPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAvailability() {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from('master_availability')
        .select('*')
        .eq('master_id', profile.id);
        
      if (error) {
        console.error('Error fetching availability:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const newSchedule = { ...defaultSchedule };
        // Reset all days to disabled first
        Object.keys(newSchedule).forEach(day => {
          newSchedule[day] = { enabled: false, slots: [] };
        });

        data.forEach(row => {
          const dayName = daysOfWeek[row.day_of_week];
          if (!dayName) return;
          
          if (!newSchedule[dayName].enabled) {
            newSchedule[dayName].enabled = true;
            newSchedule[dayName].slots = [];
          }
          newSchedule[dayName].slots.push({
            start: row.start_time.slice(0, 5),
            end: row.end_time.slice(0, 5)
          });
        });

        setSchedule(newSchedule);
      }
      setLoading(false);
    }
    loadAvailability();
  }, [profile]);

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
      },
    }));
  };

  const addSlot = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: '12:00', end: '17:00' }],
      },
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      // 1. Delete existing
      await supabase.from('master_availability').delete().eq('master_id', profile.id);

      // 2. Insert new ones
      const inserts = [];
      for (const [day, dayData] of Object.entries(schedule)) {
        if (dayData.enabled && dayData.slots.length > 0) {
          const dayIndex = daysOfWeek.indexOf(day);
          for (const slot of dayData.slots) {
            inserts.push({
              master_id: profile.id,
              day_of_week: dayIndex,
              start_time: `${slot.start}:00`,
              end_time: `${slot.end}:00`,
              is_available: true
            });
          }
        }
      }

      if (inserts.length > 0) {
        const { error } = await supabase.from('master_availability').insert(inserts);
        if (error) throw error;
      }

      showToast('Availability saved successfully', 'success');
    } catch (err) {
      console.error('Error saving:', err);
      showToast(err instanceof Error ? err.message : 'Failed to save availability', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center p-20">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      {/* Hero Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '220px' }}>
        <img src="https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1600&q=80&auto=format&fit=crop" alt="Schedule & Calendar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CalendarDays size={18} style={{ color: '#67E8F9' }} />
            <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#67E8F9', fontWeight: 700 }}>Schedule</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Availability</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '8px', maxWidth: '400px' }}>Define your working hours so clients know when they can book you.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Weekly Hours</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Set your standard recurring availability.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', whiteSpace: 'nowrap' }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Schedule Builder */}
      <div className="space-y-4">
        {daysOfWeek.map((day) => {
          const daySchedule = schedule[day];
          return (
            <div 
              key={day} 
              className={`glass-card overflow-hidden transition-all duration-300 ${!daySchedule.enabled ? 'opacity-60 grayscale-[0.2]' : 'hover:shadow-lg hover:border-[var(--color-brand-cyan)]/30'}`}
            >
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                
                {/* Day Toggle & Name */}
                <div className="flex items-center justify-between sm:justify-start sm:w-48 shrink-0">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleDay(day)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-inner border border-black/10 ${daySchedule.enabled ? 'bg-cyan-500' : 'bg-slate-300'}`}
                    >
                      <span
                        className="absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm border border-black/5"
                        style={{ transform: daySchedule.enabled ? 'translateX(24px)' : 'translateX(0)' }}
                      />
                    </button>
                    <span className="font-semibold text-lg text-[var(--color-text-primary)]">{day}</span>
                  </div>
                  
                  {/* Mobile Add Slot Button */}
                  {daySchedule.enabled && (
                    <button
                      onClick={() => addSlot(day)}
                      className="sm:hidden text-xs font-medium px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <Plus size={14} /> Add Slot
                    </button>
                  )}
                </div>

                {/* Time Slots Area */}
                <div className="flex-1 flex flex-col gap-3">
                  {daySchedule.enabled ? (
                    <>
                      {daySchedule.slots.map((slot, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-3 bg-[var(--color-surface-light)] rounded-xl p-2 sm:p-3 border border-[var(--color-border-light)] transform transition-all duration-300 animate-fade-in">
                          <div className="flex-1 flex items-center gap-2 sm:gap-4 justify-between sm:justify-start">
                            
                            <div className="relative group">
                              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none group-hover:text-cyan-500 transition-colors" />
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateSlot(day, idx, 'start', e.target.value)}
                                className="w-[100px] sm:w-[120px] bg-white border border-[var(--color-border)] rounded-lg py-2 pl-9 pr-2 text-sm font-medium text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all cursor-pointer"
                              />
                            </div>
                            
                            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">to</span>
                            
                            <div className="relative group">
                              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none group-hover:text-cyan-500 transition-colors" />
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateSlot(day, idx, 'end', e.target.value)}
                                className="w-[100px] sm:w-[120px] bg-white border border-[var(--color-border)] rounded-lg py-2 pl-9 pr-2 text-sm font-medium text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all cursor-pointer"
                              />
                            </div>
                          </div>
                          
                          {/* Remove Slot Target */}
                          <div className="flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
                            {daySchedule.slots.length > 1 && (
                              <button
                                onClick={() => removeSlot(day, idx)}
                                className="p-2 rounded-full hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                                title="Remove time slot"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Desktop Add Slot Button */}
                      <div className="hidden sm:flex mt-1">
                        <button
                          onClick={() => addSlot(day)}
                          className="text-sm font-medium text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Plus size={16} /> Add another block
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center bg-[var(--color-surface-light)]/50 rounded-xl px-4 py-4 sm:py-0 border border-transparent">
                      <p className="text-sm font-medium text-[var(--color-text-muted)]">Not available on {day}s</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
