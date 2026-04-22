'use client';

import { BarChart3, TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const stats = [
  { label: 'Total Revenue', value: '£0.00', change: '+0%', up: true, icon: DollarSign, color: '#22C55E' },
  { label: 'Bookings', value: '0', change: '+0%', up: true, icon: Calendar, color: '#3B82F6' },
  { label: 'Active Masters', value: '0', change: '+0%', up: true, icon: Users, color: '#A78BFA' },
  { label: 'New Clients', value: '0', change: '+0%', up: true, icon: TrendingUp, color: '#E8A0B4' },
];

const recentActivity = [
  { type: 'info', message: 'Welcome to Merakí Analytics', time: 'Just now' },
];

export default function AnalyticsPage() {
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
