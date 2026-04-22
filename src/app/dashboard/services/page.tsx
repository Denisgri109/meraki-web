'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Scissors, Plus, Clock, DollarSign, Edit3, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  duration_minutes: number;
  category: string | null;
  is_active: boolean;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchServices = async () => {
      const { data } = await supabase.from('services').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      setServices((data as unknown as Service[]) || []);
      setLoading(false);
    };
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleService = async (id: string, current: boolean) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
    await supabase.from('services').update({ is_active: !current }).eq('id', id);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Hero Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '220px' }}>
        <img src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=1600&q=80&auto=format&fit=crop" alt="My Services" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Scissors size={18} style={{ color: '#F9A8D4' }} />
            <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#F9A8D4', fontWeight: 700 }}>Management</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>My Services</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '8px', maxWidth: '400px' }}>Manage the services you offer to clients</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Service List</h2>
        <button className="btn-pink shadow-lg hover:shadow-xl flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={16} />
          Add Service
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{services.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Total Services</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{services.filter((s) => s.is_active).length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Active</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-muted)]">{services.filter((s) => !s.is_active).length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Inactive</p>
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-5 bg-[var(--color-surface-light)] rounded w-1/3 mb-3" />
              <div className="h-3 bg-[var(--color-surface-light)] rounded w-full mb-2" />
              <div className="h-3 bg-[var(--color-surface-light)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Sparkles size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">No services yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Add your first service to start receiving bookings</p>
          <button className="btn-primary mt-4 px-6 py-2.5 text-sm inline-flex items-center gap-2">
            <Plus size={16} />
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className={`glass-card p-5 sm:p-6 transition-all duration-300 hover:shadow-lg ${!service.is_active ? 'opacity-60 grayscale-[0.3]' : 'hover:border-[var(--color-brand-pink)]/30'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{service.name}</h3>
                    {service.category && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 border border-pink-100">
                        {service.category}
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2 max-w-2xl">{service.description}</p>
                  )}
                  <div className="flex items-center gap-5 text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-light)] px-2.5 py-1 rounded-md">
                      <Clock size={14} className="text-[var(--color-info)]" />{service.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[var(--color-text-primary)] bg-emerald-50 px-2.5 py-1 rounded-md text-emerald-700">
                      £{service.base_price?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center bg-[var(--color-surface-light)] p-2 rounded-xl border border-[var(--color-border-light)]">
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-[var(--color-text-secondary)] hover:text-cyan-600">
                    <Edit3 size={18} />
                  </button>
                  <div className="w-[1px] h-6 bg-[var(--color-border)] opacity-60"></div>
                  <button
                    onClick={() => toggleService(service.id, service.is_active)}
                    className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all group"
                    title={service.is_active ? "Deactivate service" : "Activate service"}
                  >
                    {service.is_active ? (
                      <ToggleRight size={24} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                    ) : (
                      <ToggleLeft size={24} className="text-[var(--color-text-muted)] group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
