'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSection } from '@/contexts/SectionContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import {
  ownerSecondaryNav, masterSecondaryNav, clientSecondaryNav, qrPayNavItem,
  type NavItem,
} from '@/lib/nav-items';
import {
  Calendar, ShoppingBag, Gift, Search,
  MessageSquare, ChevronRight, Activity, Sparkles,
  FileText, ShieldCheck,
} from 'lucide-react';

interface DashboardAppointment {
  id: string;
  start_time: string;
  service_name: string;
}

export function SectionDashboardHome() {
  const { section, buildPath, isPilates } = useSection();
  const { user, profile, role } = useAuth();
  const { unreadMessages } = useNotifications();
  const supabase = createClient();

  const [upcoming, setUpcoming] = useState<DashboardAppointment[]>([]);
  const [serviceCount, setServiceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isStaff = role === 'owner' || role === 'master';
  const isPilatesStaff = isPilates && isStaff;
  const canViewWaivers = role === 'owner' || profile?.is_authorized_instructor === true;

  const fetchDashboardInfo = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const col = role === 'master' ? 'master_id' : 'client_id';

      // ── Section-filtered queries ────────────────────────────────
      // Services are filtered by section so each dashboard only sees
      // its own services. The filter uses `category` to distinguish
      // pilates services from beauty services.
      const serviceQuery = supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (isPilates) {
        serviceQuery.ilike('category', '%pilates%');
      } else {
        serviceQuery.not('category', 'ilike', '%pilates%');
      }

      const [servicesRes, appointmentsRes] = await Promise.all([
        serviceQuery,
        supabase
          .from('appointments')
          .select('id, start_time, service_name, service:services(name, category)')
          .eq(col, user.id)
          .gte('start_time', new Date().toISOString())
          .order('start_time')
          .limit(5),
      ]);

      setServiceCount(servicesRes.count ?? 0);

      const allAppts = (appointmentsRes.data ?? []) as Array<{
        id: string;
        start_time: string;
        service_name: string;
        service: { name: string; category: string } | null;
      }>;

      // Filter appointments client-side by section (until DB has a section column)
      const sectionAppts = allAppts.filter((a) => {
        const cat = a.service?.category ?? '';
        return isPilates ? cat.toLowerCase().includes('pilates') : !cat.toLowerCase().includes('pilates');
      });

      setUpcoming(sectionAppts.slice(0, 3).map((a) => ({ id: a.id, start_time: a.start_time, service_name: a.service_name })));
    } catch {
      // ignore — dashboard is non-critical
    } finally {
      setLoading(false);
    }
  }, [user, role, supabase, isPilates]);

  useEffect(() => {
    queueMicrotask(() => fetchDashboardInfo());

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDashboardInfo();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchDashboardInfo]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const accentTextClass = isPilates ? 'text-emerald-600' : 'text-[var(--color-brand-pink-dark)]';
  const accentBgClass = isPilates ? 'from-emerald-500 to-teal-600' : 'from-[#E8A0B4] to-[#C47A90]';
  const secondaryGradient = isPilates
    ? 'from-emerald-400 to-teal-500'
    : 'from-[#E8A0B4] to-[#C47A90]';

  const secondaryNav: NavItem[] = role === 'owner'
    ? ownerSecondaryNav
    : role === 'master'
      ? profile?.can_view_qr_pay === true
        ? [...masterSecondaryNav, qrPayNavItem]
        : masterSecondaryNav
      : role === 'client'
        ? clientSecondaryNav
        : [];

  // Section-specific quick actions
  const quickActions = isPilates
    ? [
        { label: 'Book a Class', desc: 'Reserve your spot', href: buildPath('booking'), icon: Calendar, gradient: 'from-emerald-400 to-teal-500' },
        { label: 'Schedule', desc: 'View weekly timetable', href: buildPath('booking'), icon: Activity, gradient: 'from-teal-400 to-cyan-500' },
        { label: 'Shop', desc: 'Mats, grip socks & more', href: buildPath('shop'), icon: ShoppingBag, gradient: 'from-cyan-400 to-blue-500' },
        { label: 'Rewards', desc: 'Earn with every class', href: buildPath('loyalty'), icon: Gift, gradient: 'from-amber-400 to-orange-500' },
      ]
    : [
        { label: 'Book Now', desc: 'Find your service', href: buildPath('booking'), icon: Calendar, gradient: 'from-pink-400 to-rose-500' },
        { label: 'Discover', desc: 'Explore professionals', href: buildPath('discover'), icon: Search, gradient: 'from-purple-400 to-violet-500' },
        { label: 'Shop', desc: 'Curated products', href: buildPath('shop'), icon: ShoppingBag, gradient: 'from-amber-400 to-yellow-500' },
        { label: 'Rewards', desc: 'Loyalty points', href: buildPath('loyalty'), icon: Gift, gradient: 'from-emerald-400 to-green-500' },
      ];

  // Staff vs client view
  if (isStaff) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className={`rounded-3xl bg-gradient-to-br ${accentBgClass} p-8 text-white shadow-lg`}>
          <h1 className="text-3xl font-bold mb-1">
            {isPilates ? 'Pilates Studio' : 'Beauty Salon'} Dashboard
          </h1>
          <p className="text-white/80">Welcome back, {firstName}. Here&apos;s your {section} overview.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Sparkles size={14} /> Active Services
            </div>
            <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">{serviceCount}</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              <Calendar size={14} /> Upcoming
            </div>
            <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">{upcoming.length}</p>
          </div>
          <div className="glass-card p-5">
            <Link href={buildPath('services')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              <ChevronRight size={14} /> Manage
            </Link>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Services & settings</p>
          </div>
          <div className="glass-card p-5">
            <Link href={buildPath('settings')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              <ChevronRight size={14} /> Settings
            </Link>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Profile & business</p>
          </div>
        </div>

        {/* ── Quick Access (secondary nav items moved from navbar) ────── */}
        {secondaryNav.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={buildPath(item.path)}
                    className="group glass-card p-5 hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${secondaryGradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">{item.label}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pilates staff: Waivers & Instructors ─────────────────────── */}
        {isPilatesStaff && canViewWaivers && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canViewWaivers && (
              <Link
                href={buildPath('waivers')}
                className="glass-card p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                  <FileText size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">Signed Waivers</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    View client Injury Disclosure &amp; Liability forms
                  </p>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] ml-auto shrink-0" />
              </Link>
            )}
            {role === 'owner' && (
              <Link
                href={buildPath('instructors')}
                className="glass-card p-5 flex items-center gap-4 hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">Instructors</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Authorize masters to view client waivers
                  </p>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] ml-auto shrink-0" />
              </Link>
            )}
          </div>
        )}

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Upcoming appointments</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No upcoming {section} appointments.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-3 last:border-0">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{apt.service_name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{new Date(apt.start_time).toLocaleString()}</p>
                  </div>
                  <Link href={buildPath('appointments')} className={`text-sm font-semibold ${accentTextClass} hover:underline`}>
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Client view
  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero banner */}
      <div className={`rounded-3xl bg-gradient-to-br ${accentBgClass} p-8 text-white shadow-lg`}>
        <p className="text-sm text-white/80 mb-1">Welcome back</p>
        <h1 className="text-3xl font-bold mb-3">Hi {firstName}!</h1>
        <p className="text-white/90 max-w-md">
          {isPilates
            ? 'Ready to move? Book your next Pilates class and keep building strength.'
            : 'Time to glow? Book your next beauty appointment or shop curated products.'}
        </p>
      </div>

      {/* Unread messages alert */}
      {unreadMessages > 0 && (
        <Link
          href={buildPath('chat')}
          className="flex items-center gap-3 rounded-2xl bg-violet-50 border border-violet-200 p-4 hover:bg-violet-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white">
            <MessageSquare size={18} />
          </div>
          <div>
            <p className="font-semibold text-violet-900">{unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}</p>
            <p className="text-xs text-violet-700">Tap to view</p>
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group glass-card p-5 hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" />
              </div>
              <p className="font-bold text-[var(--color-text-primary)]">{action.label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{action.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            <Calendar size={14} /> Upcoming
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">{loading ? '—' : upcoming.length}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{section} appointments</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            <Sparkles size={14} /> Services
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">{loading ? '—' : serviceCount}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Available to book</p>
        </div>
      </div>

      {/* ── Quick Access (secondary nav items moved from navbar) ────── */}
      {secondaryNav.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={buildPath(item.path)}
                  className="group glass-card p-5 hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${secondaryGradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <p className="font-bold text-[var(--color-text-primary)]">{item.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming appointments */}
      {upcoming.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Your next {section} appointments</h2>
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between border-b border-[var(--color-border-light)] pb-3 last:border-0">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{apt.service_name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{new Date(apt.start_time).toLocaleString()}</p>
                </div>
                <Link href={buildPath('appointments')} className={`text-sm font-semibold ${accentTextClass} hover:underline`}>
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
