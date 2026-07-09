import Link from 'next/link';
import { Star, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { useSection } from '@/contexts/SectionContext';
import { DashboardAppointment } from '../page';

interface StatsCardsProps {
  loading: boolean;
  loyaltyPoints: number;
  stats: {
    bookings: number;
    services: number;
    appointments: DashboardAppointment[];
  };
}

export function StatsCards({ loading, loyaltyPoints, stats }: StatsCardsProps) {
  const { buildPath } = useSection();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      {/* Stats Cards */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-pink p-6 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-300 flex items-center justify-center shadow-md animate-float">
            <Star size={20} className="text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{loading ? '—' : loyaltyPoints}</p>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">Loyalty Points</p>
          </div>
        </div>
        <div className="glass-card-purple p-6 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-300 flex items-center justify-center shadow-md animate-float" style={{ animationDelay: '0.5s' }}>
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{loading ? '—' : stats.bookings}</p>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">Completed</p>
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(34,197,94,0.04))' }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center shadow-md animate-float" style={{ animationDelay: '1s' }}>
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{loading ? '—' : stats.services}</p>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">Services</p>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Upcoming</h2>
          <Link href={buildPath('appointments')} className="text-sm font-semibold text-[var(--color-brand-pink-dark)] hover:opacity-80 transition-opacity">
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="shimmer h-16 rounded-xl" />
            ))}
          </div>
        ) : stats.appointments.length > 0 ? (
          <div className="space-y-3">
            {stats.appointments.map((apt) => {
              const dateObj = new Date(apt.start_time);
              return (
                <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100/50 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-white border border-pink-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold text-pink-400 uppercase">
                      {dateObj.toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-[var(--color-primary)]">
                      {dateObj.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {apt.service?.name || apt.service_name || 'Appointment'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-pink-300" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-4 animate-float">
              <Calendar size={28} className="text-pink-300" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">No upcoming appointments</p>
            <Link href={buildPath('booking')} className="btn-pink px-6 py-2.5 text-xs">
              Book Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
