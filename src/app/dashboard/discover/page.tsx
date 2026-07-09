'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSection } from '@/contexts/SectionContext';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { isMasterWithinRange } from '@/lib/location';
import { Master } from './types';
import { TrendingTags } from './components/TrendingTags';
import { ProfessionalsGrid } from './components/ProfessionalsGrid';

export default function DiscoverPage() {
  const supabase = createClient();
  const { profile, user } = useAuth();
  const { isPilates } = useSection();
  const [search, setSearch] = useState('');
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  // User location from profile — used for country + state match AND haversine fallback.
  const userCountry = ((profile as Record<string, unknown> | null)?.country as string | null | undefined) ?? null;
  const userState = ((profile as Record<string, unknown> | null)?.state as string | null | undefined) ?? null;
  const userStateCode = ((profile as Record<string, unknown> | null)?.state_code as string | null | undefined) ?? null;
  const userLat = ((profile as Record<string, unknown> | null)?.latitude as number | null | undefined) ?? null;
  const userLng = ((profile as Record<string, unknown> | null)?.longitude as number | null | undefined) ?? null;
  const searchRadiusKm = ((profile as Record<string, unknown> | null)?.search_radius_km as number | null | undefined) ?? 100;

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const serviceQuery = supabase
          .from('services')
          .select('id, master_services!inner(master_id)')
          .eq('is_active', true)
          .eq('master_services.is_available', true);

        if (isPilates) {
          serviceQuery.ilike('category', '%pilates%');
        } else {
          serviceQuery.not('category', 'ilike', '%pilates%');
        }

        const { data: serviceData } = await serviceQuery;

        const sectionMasterIds = new Set(
          ((serviceData as unknown as Array<{ master_services: Array<{ master_id: string }> | null }>) || [])
            .flatMap((s) => s.master_services?.map((ms) => ms.master_id) || [])
        );

        if (sectionMasterIds.size === 0) {
          setMasters([]);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, specialties, city, country, state, state_code, latitude, longitude, bio')
          .eq('is_master', true)
          .in('id', Array.from(sectionMasterIds))
          .limit(60);

        if (error) console.error('[Discover] masters error:', error);

        const userLoc = {
          country: userCountry,
          state: userState,
          state_code: userStateCode,
          latitude: userLat,
          longitude: userLng,
        };

        // Filter masters: same state = pass, different state = haversine check.
        const rawMasters = ((data as unknown as Master[]) || [])
          .filter((m) => m.id !== user?.id)
          .filter((m) => {
            if (!userCountry) return false;
            return isMasterWithinRange(userLoc, m, searchRadiusKm);
          });

        setMasters(rawMasters);
      } catch (err) {
        console.error('[Discover] unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCountry, userState, userStateCode, isPilates]);

  const filtered = masters.filter((m) =>
    !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.specialties?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '220px' }}>
        <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=80&auto=format&fit=crop" alt="Discover beauty" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} style={{ color: '#C4B5FD' }} />
            <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#C4B5FD', fontWeight: 700 }}>Discover</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Explore & Connect</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '8px', maxWidth: '400px' }}>{isPilates ? 'Find the perfect Pilates instructor near you' : 'Find the perfect beauty professional near you'}</p>
        </div>
      </div>

      {/* Location badge — mirrors mobile */}
      {userCountry && (
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-100 text-xs font-semibold text-[var(--color-text-secondary)]">
            <MapPin size={12} className="text-pink-400" />
            Showing results in {[userState, userCountry].filter(Boolean).join(' · ')}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '32px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search by name, specialty, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-glass"
          style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      <TrendingTags search={search} setSearch={setSearch} />

      <ProfessionalsGrid
        loading={loading}
        filtered={filtered}
        search={search}
        userCountry={userCountry}
      />
    </div>
  );
}
