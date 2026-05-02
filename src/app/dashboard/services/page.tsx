'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { Scissors, Plus, Clock, Edit3, ToggleLeft, ToggleRight, Sparkles, X, Loader2, Save } from 'lucide-react';
import type { Tables, TablesInsert } from '@/types/database';
import { PilatesTimetableManager } from '@/components/PilatesTimetableManager';

type Service = Tables<'services'>;
type ServiceInsert = TablesInsert<'services'>;

const CATEGORIES = ['Nails', 'Lashes', 'Brows', 'Hair', 'Makeup', 'Skincare', 'Pilates', 'Other'];

export default function ServicesPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwner = profile?.role === 'owner';
  const categories = isOwner ? CATEGORIES : CATEGORIES.filter((category) => category !== 'Pilates');

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', description: '', base_price: '', duration_minutes: '60', category: 'Nails', requires_consultation: false });
  const [saving, setSaving] = useState(false);
  const [managingPilatesService, setManagingPilatesService] = useState<Service | null>(null);

  const refreshServices = async () => {
    if (!user) return;
    const { data } = await supabase.from('services').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadServices = async () => {
      const { data } = await supabase.from('services').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      if (isMounted) {
        setServices(data || []);
        setLoading(false);
      }
    };
    loadServices();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleService = async (id: string, current: boolean) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
    await supabase.from('services').update({ is_active: !current }).eq('id', id);
    showToast(!current ? 'Service activated' : 'Service deactivated', 'info');
  };

  const openCreate = () => {
    setEditingService(null);
    setForm({ name: '', description: '', base_price: '', duration_minutes: '60', category: categories[0] || 'Nails', requires_consultation: false });
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description || '',
      base_price: service.base_price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      category: service.category || 'Nails',
      requires_consultation: service.requires_consultation || false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Please enter a service name', 'error'); return; }
    if (!form.base_price || isNaN(Number(form.base_price)) || Number(form.base_price) <= 0) { showToast('Please enter a valid price', 'error'); return; }
    if (!form.duration_minutes || isNaN(Number(form.duration_minutes)) || Number(form.duration_minutes) <= 0) { showToast('Please enter a valid duration', 'error'); return; }
    if (form.category === 'Pilates' && !isOwner) { showToast('Only owners can create Pilates services', 'error'); return; }

    setSaving(true);
    try {
      const payload: Omit<ServiceInsert, 'created_by' | 'is_active'> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        base_price: Number(form.base_price),
        duration_minutes: Number(form.duration_minutes),
        requires_consultation: form.requires_consultation,
      };

      if (editingService) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingService.id);
        if (error) throw error;
        showToast('Service updated!', 'success');
      } else {
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .insert({ ...payload, created_by: user!.id, is_active: true })
          .select()
          .single();
        if (serviceError) throw serviceError;

        // Link to master_services
        await supabase.from('master_services').insert({
          master_id: user!.id,
          service_id: serviceData.id,
          is_available: true,
          custom_price: null,
          custom_duration: null,
        });
        showToast('Service created!', 'success');
      }
      setShowModal(false);
      refreshServices();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save service', 'error');
    } finally {
      setSaving(false);
    }
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
        <button onClick={openCreate} className="btn-pink shadow-lg hover:shadow-xl flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer">
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
          <button onClick={openCreate} className="btn-primary mt-4 px-6 py-2.5 text-sm inline-flex items-center gap-2 cursor-pointer">
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
                    {service.requires_consultation && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                        Consultation
                      </span>
                    )}
                    {service.category === 'Pilates' && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Timetable
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
                  <button
                    onClick={() => openEdit(service)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-[var(--color-text-secondary)] hover:text-cyan-600 cursor-pointer"
                    title="Edit service"
                  >
                    <Edit3 size={18} />
                  </button>
                  {service.category === 'Pilates' && isOwner && (
                    <button
                      onClick={() => setManagingPilatesService(service)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      title="Manage Pilates timetable"
                    >
                      <Clock size={18} />
                    </button>
                  )}
                  <div className="w-[1px] h-6 bg-[var(--color-border)] opacity-60"></div>
                  <button
                    onClick={() => toggleService(service.id, !!service.is_active)}
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

      {/* Create/Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-scale-in" style={{ background: 'white' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{editingService ? 'Edit Service' : 'Create Service'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-upper">Service Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-glass" placeholder="e.g., Gel Manicure" />
              </div>
              <div>
                <label className="label-upper">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-glass resize-none" rows={3} placeholder="What this service includes..." />
              </div>
              <div>
                <label className="label-upper">Category</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        form.category === cat
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-upper">Price (£) *</label>
                  <input type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="input-glass" placeholder="50" />
                </div>
                <div>
                  <label className="label-upper">Duration (min) *</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="input-glass" placeholder="60" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border-light)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Require Consultation</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Clients must answer questions before booking</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, requires_consultation: !form.requires_consultation })}
                  className="cursor-pointer"
                >
                  {form.requires_consultation ? (
                    <ToggleRight size={28} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={28} className="text-[var(--color-text-muted)]" />
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Preview</p>
                <p className="text-xs font-bold text-pink-600 uppercase tracking-wider">{form.category}</p>
                <p className="font-bold text-[var(--color-text-primary)]">{form.name || 'Service Name'}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="font-bold text-emerald-600">£{form.base_price || '0'}</span>
                  <span className="text-[var(--color-text-muted)]">{form.duration_minutes || '0'} min</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {editingService ? 'Save Changes' : 'Create Service'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {managingPilatesService && (
        <PilatesTimetableManager
          service={managingPilatesService}
          onClose={() => {
            setManagingPilatesService(null);
            refreshServices();
          }}
        />
      )}
    </div>
  );
}
