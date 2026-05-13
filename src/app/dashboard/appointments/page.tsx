'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, User, ChevronRight, Filter, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type TabValue = 'upcoming' | 'past' | 'cancelled';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  service_name: string | null;
  service_category: string | null;
  service?: { name: string; base_price?: number } | null;
  master?: { full_name: string; specialties: string[] | null } | null;
  client?: { full_name: string } | null;
}

const tabs: { label: string; value: TabValue; color: string }[] = [
  { label: 'Upcoming', value: 'upcoming', color: 'from-emerald-400 to-teal-400' },
  { label: 'Past', value: 'past', color: 'from-blue-400 to-indigo-400' },
  { label: 'Cancelled', value: 'cancelled', color: 'from-red-400 to-rose-400' },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'completed': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'cancelled': return 'bg-red-50 text-red-500 border-red-200';
    default: return 'bg-gray-50 text-gray-500 border-gray-200';
  }
}

export default function AppointmentsPage() {
  const { user, role } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabValue>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('appointments')
          .select(`
            id, start_time, end_time, status, notes, service_name, service_category,
            service:services(name, base_price),
            master:profiles!appointments_master_id_fkey(full_name, specialties),
            client:profiles!appointments_client_id_fkey(full_name)
          `);

        // Owners see every appointment in the salon (matches the owner home dashboard).
        // Masters see appointments where they are the professional.
        // Clients see appointments where they are the booked customer.
        if (role === 'master') {
          query = query.eq('master_id', user.id);
        } else if (role !== 'owner') {
          query = query.eq('client_id', user.id);
        }

        const { data, error } = await query
          .order('start_time', { ascending: false })
          .limit(50);

        if (error) console.error('[Appointments] fetch error:', error);
        setAppointments((data as unknown as Appointment[]) || []);
      } catch (err) {
        console.error('[Appointments] unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  const nowISO = new Date().toISOString();
  const filtered = appointments.filter((a) => {
    if (activeTab === 'upcoming') return a.start_time >= nowISO && a.status !== 'cancelled';
    if (activeTab === 'past') return a.start_time < nowISO || a.status === 'completed';
    return a.status === 'cancelled';
  });

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Hero Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '200px' }}>
        <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&auto=format&fit=crop" alt="Appointments" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Your Appointments</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '8px' }}>Manage your bookings and schedule</p>
        </div>
      </div>

      {/* Tabs — Colorful pills */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-[var(--color-surface-light)] mb-8 w-fit mx-auto border border-[var(--color-border-light)]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === tab.value
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl shimmer" />
                <div className="flex-1">
                  <div className="h-4 shimmer rounded w-1/3 mb-2" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-bl-full" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-200 to-teal-200 flex items-center justify-center mx-auto mb-4 animate-float">
            <Calendar size={32} className="text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">
            {activeTab === 'upcoming' ? 'No upcoming appointments' : activeTab === 'past' ? 'No past appointments' : 'No cancelled appointments'}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 mb-6">
            {activeTab === 'upcoming' ? 'Book a service to get started!' : 'Your history will appear here'}
          </p>
          {activeTab === 'upcoming' && (
            <Link href="/dashboard/booking" className="btn-pink px-8 py-3 text-sm inline-flex items-center gap-2">
              Book Now <ArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt, idx) => {
            const dateObj = new Date(apt.start_time);
            return (
              <div
                key={apt.id}
                className={`glass-card p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-slide-up stagger-${Math.min(idx + 1, 6)}`}
                style={{ animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-4">
                  {/* Date Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 border border-pink-100 flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-[10px] font-bold text-pink-400 uppercase">
                      {dateObj.toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-[var(--color-primary)]">
                      {dateObj.getDate()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-bold text-[var(--color-text-primary)]">{apt.service?.name || apt.service_name || 'Appointment'}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-violet-400" />
                        {dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-pink-400" />
                        {role === 'master' ? apt.client?.full_name || 'Client' : apt.master?.full_name || 'Professional'}
                      </span>
                    </div>
                  </div>

                  {/* Price + Arrow */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg text-gradient-pink">£{apt.service?.base_price?.toFixed(2) || '0.00'}</p>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-all ml-auto mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
