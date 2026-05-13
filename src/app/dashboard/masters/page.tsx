'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, MapPin, Mail, Phone, MoreVertical, Eye } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

interface Master {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  specialties: string[] | null;
  city: string | null;
  is_master: boolean;
  commission_rate: number | null;
}

export default function MastersPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const router = useRouter();
  const [masters, setMasters] = useState<Master[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMasters = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, specialties, city, is_master, commission_rate')
        .eq('is_master', true)
        .order('full_name');
      setMasters((data as unknown as Master[]) || []);
      setLoading(false);
    };
    fetchMasters();
  }, [supabase]);

  const filtered = masters.filter((m) =>
    !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || (m.specialties || []).some((s) => s?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRemoveMaster = async (id: string, name: string | null) => {
    if (!window.confirm(`Are you sure you want to remove ${name || 'this master'}?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_master: false })
        .eq('id', id);
        
      if (error) throw error;
      
      setMasters(prev => prev.filter(m => m.id !== id));
      showToast('Master removed successfully', 'success');
    } catch (err) {
      console.error('Error removing master:', err);
      if (err instanceof Error) {
        showToast(err.message || 'Failed to remove master', 'error');
      } else {
        showToast('Failed to remove master', 'error');
      }
    } finally {
      setOpenDropdown(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={22} className="text-[var(--color-secondary)]" />
            <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">Masters</h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">Manage your beauty professionals</p>
        </div>
        <div className="glass-card px-4 py-2">
          <span className="text-sm font-medium text-[var(--color-text-muted)]">Total: </span>
          <span className="font-bold text-[var(--color-text-primary)]">{masters.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search by name or specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-glass pl-11"
        />
      </div>

      {/* Masters Table-like list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-light)]" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--color-surface-light)] rounded w-1/4 mb-2" />
                <div className="h-3 bg-[var(--color-surface-light)] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Users size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">No masters found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((master) => (
            <div key={master.id} className="glass-card p-5 hover:shadow-lg transition-all duration-200 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-secondary)] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {master.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-[var(--color-text-primary)]">{master.full_name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span>{(master.specialties && master.specialties.length > 0) ? master.specialties.join(', ') : 'No specialty'}</span>
                    {master.city && (
                      <span className="flex items-center gap-0.5"><MapPin size={10} />{master.city}</span>
                    )}
                    {master.commission_rate != null && (
                      <span className="font-medium text-[var(--color-text-secondary)]">{master.commission_rate}% commission</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {master.email && (
                    <a href={`mailto:${master.email}`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)]">
                      <Mail size={16} />
                    </a>
                  )}
                  {master.phone && (
                    <a href={`tel:${master.phone}`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)]">
                      <Phone size={16} />
                    </a>
                  )}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === master.id ? null : master.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)] cursor-pointer"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openDropdown === master.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-[var(--color-border-light)] py-1 z-50 animate-fade-in">
                        <button
                          onClick={() => { router.push('/dashboard/discover'); setOpenDropdown(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] flex items-center gap-2 cursor-pointer"
                        >
                          <Eye size={14} /> View Profile
                        </button>
                        {master.email && (
                          <a href={`mailto:${master.email}`} onClick={() => setOpenDropdown(null)} className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] flex items-center gap-2">
                            <Mail size={14} /> Send Email
                          </a>
                        )}
                        <button
                          onClick={() => handleRemoveMaster(master.id, master.full_name)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
