'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { createClient } from '@/lib/supabase/client';
import { Calendar, ShoppingBag, GraduationCap, Gift, Search, Heart, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { HeroBanner } from './components/HeroBanner';
import { QuickActions } from './components/QuickActions';
import { StatsCards } from './components/StatsCards';

import StaffDashboard from './StaffDashboard';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants/images';

const quickActions = [
  { href: '/dashboard/booking', label: 'Book Now', icon: Calendar, gradient: 'from-pink-400 to-rose-300', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80&auto=format&fit=crop' },
  { href: '/dashboard/discover', label: 'Discover', icon: Search, gradient: 'from-violet-400 to-purple-300', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80&auto=format&fit=crop' },
  { href: '/dashboard/shop', label: 'Shop', icon: ShoppingBag, gradient: 'from-amber-400 to-orange-300', img: DEFAULT_PRODUCT_IMAGE },
  { href: '/dashboard/academy', label: 'Academy', icon: GraduationCap, gradient: 'from-blue-400 to-cyan-300', img: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&q=80&auto=format&fit=crop' },
  { href: '/dashboard/loyalty', label: 'Rewards', icon: Gift, gradient: 'from-emerald-400 to-teal-300', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80&auto=format&fit=crop' },
];

export interface DashboardAppointment {
  id: string;
  start_time: string;
  service_name: string | null;
  service: { name: string | null } | null;
  services?: { name: string | null } | null;
  master_profiles?: { full_name: string | null } | null;
}

export default function DashboardPage() {
  const { role } = useAuth();

  // Owners and masters see a real operations dashboard (matches mobile)
  if (role === 'owner' || role === 'master') {
    return <StaffDashboard />;
  }

  return <ClientHome />;
}

function ClientHome() {
  const { profile, role, user } = useAuth();
  const { unreadMessages } = useNotifications();
  const supabase = createClient();
  const [stats, setStats] = useState({ bookings: 0, services: 0, appointments: [] as DashboardAppointment[] });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchDashboardInfo = useCallback(async () => {
    try {
      setLoading(true);
      let nextDbError: string | null = null;

      const { count: servicesCount, error: sErr } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (sErr) {
        console.error('[Dashboard] services error:', sErr);
        nextDbError = sErr.message;
      }

      let bookingsCount = 0;
      let upcomingApts: DashboardAppointment[] = [];

      if (user) {
        const col = role === 'master' ? 'master_id' : 'client_id';

        const { count, error: bErr } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq(col, user.id)
          .eq('status', 'completed');

        if (bErr) console.error('[Dashboard] bookings error:', bErr);
        if (bErr) nextDbError = bErr.message;
        bookingsCount = count || 0;

        const { data: apts, error: aErr } = await supabase
          .from('appointments')
          .select(`id, start_time, service_name, service:services(name)`)
          .eq(col, user.id)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(3);

        if (aErr) console.error('[Dashboard] appointments error:', aErr);
        if (aErr) nextDbError = aErr.message;
        upcomingApts = (apts as DashboardAppointment[]) || [];
      }

      setStats({
        bookings: bookingsCount,
        services: servicesCount || 0,
        appointments: upcomingApts,
      });
      setDbError(nextDbError);
    } catch (err: unknown) {
      console.error('[Dashboard] fetch error:', err);
      setDbError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, role, supabase]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      await fetchDashboardInfo();
    };
    init();
  }, [fetchDashboardInfo]);

  // Re-fetch when tab becomes visible (session may have just refreshed)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardInfo();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchDashboardInfo]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="animate-fade-in">
      <HeroBanner firstName={firstName} role={role} />

      {/* DB Error banner (debug) */}
      {dbError && (
        <div className="glass-card p-4 mb-6 border-l-4 border-red-400 bg-red-50/50">
          <p className="text-sm text-red-600 font-medium">⚠️ Database error: {dbError}</p>
        </div>
      )}

      {/* Alerts */}
      {unreadMessages > 0 && (
        <div className="mb-8">
          <Link
            href="/dashboard/chat"
            className="glass-card p-4 flex items-center justify-between border border-pink-100 hover:shadow-md transition-all bg-gradient-to-r from-pink-50/80 to-rose-50/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-300 flex items-center justify-center">
                <MessageSquare size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {unreadMessages} Unread Message{unreadMessages !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Tap to open inbox</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
          </Link>
        </div>
      )}

      <QuickActions actions={quickActions} />

      <StatsCards
        loading={loading}
        loyaltyPoints={(profile as Record<string, unknown>)?.loyalty_points as number || 0}
        stats={stats}
      />

      {/* ── Featured Section ─────────────────────────────── */}
      <div className="glass-card gradient-border-glow p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-200/30 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-tr-full" />
        <div className="blob-mint -top-16 left-1/3 opacity-40" style={{ width: '150px', height: '150px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-lg animate-float shrink-0">
            <Heart size={32} className="text-white" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Discover Your Perfect Look</h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              Browse our curated collection of beauty services, shop premium products, and learn from expert courses.
            </p>
          </div>
          <Link href="/dashboard/discover" className="btn-primary px-6 py-3 text-sm whitespace-nowrap shrink-0">
            Explore Now
          </Link>
        </div>
      </div>
    </div>
  );
}
