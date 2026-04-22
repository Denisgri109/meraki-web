'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, Calendar, Search, ShoppingBag, GraduationCap, Gift,
  MessageSquare, Settings, LogOut, Menu, X, ChevronDown,
  Scissors, Clock, LayoutDashboard, Users, Package, BarChart3,
  Bell, User,
} from 'lucide-react';

// ─── Navigation items ─────────────────────────────────────────────
const mainNav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/booking', label: 'Book', icon: Calendar },
  { href: '/dashboard/discover', label: 'Discover', icon: Search },
  { href: '/dashboard/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/dashboard/academy', label: 'Academy', icon: GraduationCap },
  { href: '/dashboard/loyalty', label: 'Rewards', icon: Gift },
];

const masterExtra = [
  { href: '/dashboard/services', label: 'Services', icon: Scissors },
  { href: '/dashboard/availability', label: 'Schedule', icon: Clock },
];

const ownerExtra = [
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/masters', label: 'Team', icon: Users },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, role, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allNav = [
    ...mainNav,
    ...(role === 'master' ? masterExtra : []),
    ...(role === 'owner' ? [...masterExtra, ...ownerExtra] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)] mb-2">Merakí</h1>
          <div className="w-8 h-8 border-2 border-[var(--color-brand-pink)] border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Decorative background blobs */}
      <div className="blob-pink -top-20 -right-20 opacity-40" />
      <div className="blob-purple -bottom-32 -left-20 opacity-30" />
      {/* ── Top Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[var(--color-border-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                <span className="text-2xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)]">Merakí</span>
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden lg:flex items-center gap-1">
                {allNav.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-white shadow-sm'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)]'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions + Profile */}
            <div className="flex items-center gap-3">
              {/* Chat icon */}
              <Link
                href="/dashboard/chat"
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <MessageSquare size={18} />
              </Link>

              {/* Notifications */}
              <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-brand-pink)] rounded-full" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-[var(--color-surface-light)] transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-brand-pink-dark)] flex items-center justify-center text-white text-sm font-semibold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-[var(--color-text-primary)] max-w-[100px] truncate">
                    {profile?.full_name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-[var(--radius-xl)] shadow-lg border border-[var(--color-border-light)] py-2 animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{profile?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)]">
                        {role || 'client'}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link href="/dashboard/appointments" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-text-primary)] transition-colors">
                        <Calendar size={16} /> My Appointments
                      </Link>
                      <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-text-primary)] transition-colors">
                        <Settings size={16} /> Settings
                      </Link>
                    </div>
                    <div className="border-t border-[var(--color-border-light)] pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-error)] hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-secondary)]"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Nav Dropdown ────────────────────────────────────── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[var(--color-border-light)] bg-white animate-fade-in">
            <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 gap-2">
              {allNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-[var(--radius-lg)] text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)]'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* ── Page Content ───────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
