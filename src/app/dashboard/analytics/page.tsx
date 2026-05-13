'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ActivityItem = { type: string; message: string; time: string };

function formatRelative(dateStr: string) {
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const currency = (profile?.currency as string | undefined) || 'EUR';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    revenueChangePct: 0,
    bookings: 0,
    bookingsChangePct: 0,
    activeMasters: 0,
    newClients: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Completed revenue this month
        const { data: thisMonthApts } = await supabase
          .from('appointments')
          .select('price, created_at, status')
          .eq('status', 'completed')
          .gte('start_time', monthStart.toISOString());
        const totalRevenue = ((thisMonthApts as { price: number | null }[]) || []).reduce(
          (s, a) => s + (a.price || 0),
          0,
        );

        // Completed revenue previous month
        const { data: prevMonthApts } = await supabase
          .from('appointments')
          .select('price')
          .eq('status', 'completed')
          .gte('start_time', prevMonthStart.toISOString())
          .lt('start_time', monthStart.toISOString());
        const prevRevenue = ((prevMonthApts as { price: number | null }[]) || []).reduce(
          (s, a) => s + (a.price || 0),
          0,
        );
        const revenueChangePct = prevRevenue ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

        // Bookings this month (any status)
        const { count: bookings } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('start_time', monthStart.toISOString());
        const { count: prevBookings } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('start_time', prevMonthStart.toISOString())
          .lt('start_time', monthStart.toISOString());
        const bookingsChangePct = prevBookings
          ? Math.round((((bookings || 0) - prevBookings) / prevBookings) * 100)
          : 0;

        // Active masters
        const { count: activeMasters } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_master', true);

        // New clients (profiles created this month with role=client)
        const { count: newClients } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'client')
          .gte('created_at', monthStart.toISOString());

        // Recent activity: latest appointments + recent profile signups
        const { data: recentApts } = await supabase
          .from('appointments')
          .select('id, status, created_at, service_name, service:services(name), client:profiles!appointments_client_id_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(5);

        const acts: ActivityItem[] = ((recentApts as unknown as Array<{
          id: string;
          status: string;
          created_at: string;
          service_name: string | null;
          service: { name: string | null } | null;
          client: { full_name: string | null } | null;
        }>) || []).map((a) => ({
          type: a.status,
          message: `${a.client?.full_name || 'Client'} · ${a.service?.name || a.service_name || 'Service'} (${a.status})`,
          time: formatRelative(a.created_at),
        }));

        setData({
          totalRevenue,
          revenueChangePct,
          bookings: bookings || 0,
          bookingsChangePct,
          activeMasters: activeMasters || 0,
          newClients: newClients || 0,
        });
        setActivity(acts.length ? acts : [{ type: 'info', message: 'No recent activity yet', time: '' }]);
      } catch (err) {
        console.error('[Analytics] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtMoney = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${currency} ${Math.round(n)}`;
    }
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: loading ? '—' : fmtMoney(data.totalRevenue),
      change: `${data.revenueChangePct >= 0 ? '+' : ''}${data.revenueChangePct}%`,
      up: data.revenueChangePct >= 0,
      icon: DollarSign,
      color: '#22C55E',
    },
    {
      label: 'Bookings',
      value: loading ? '—' : `${data.bookings}`,
      change: `${data.bookingsChangePct >= 0 ? '+' : ''}${data.bookingsChangePct}%`,
      up: data.bookingsChangePct >= 0,
      icon: Calendar,
      color: '#3B82F6',
    },
    {
      label: 'Active Masters',
      value: loading ? '—' : `${data.activeMasters}`,
      change: '',
      up: true,
      icon: Users,
      color: '#A78BFA',
    },
    {
      label: 'New Clients',
      value: loading ? '—' : `${data.newClients}`,
      change: '',
      up: true,
      icon: TrendingUp,
      color: '#E8A0B4',
    },
  ];

  const recentActivity = activity;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={22} className="text-[var(--color-secondary)]" />
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">Analytics</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">Track your platform performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Revenue Overview</h3>
          <div className="h-48 flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
            <div className="text-center">
              <BarChart3 size={40} className="mx-auto text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm text-[var(--color-text-muted)]">Revenue data will appear here</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Bookings Trend</h3>
          <div className="h-48 flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
            <div className="text-center">
              <TrendingUp size={40} className="mx-auto text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm text-[var(--color-text-muted)]">Booking trends will appear here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
              <div className="w-2 h-2 rounded-full bg-[var(--color-info)]" />
              <p className="text-sm text-[var(--color-text-primary)] flex-1">{item.message}</p>
              <span className="text-xs text-[var(--color-text-muted)]">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
