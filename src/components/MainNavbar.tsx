'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import {
  Home, Calendar, Search, ShoppingBag, GraduationCap, Gift,
  MessageSquare, Settings, LogOut, Menu, X, ChevronDown,
  Scissors, Clock, Users, Package, BarChart3,
  Bell, ShoppingCart
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

interface MainNavbarProps {
  transparent?: boolean;
}

export function MainNavbar({ transparent = false }: MainNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, signOut, loading } = useAuth();
  const { getItemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartItemCount = getItemCount();
  const displayName = profile?.full_name || (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) || user?.email || 'User';
  const displayEmail = profile?.email || user?.email || '';
  const displayInitial = displayName.charAt(0).toUpperCase();

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
    return <header className={`h-16 ${transparent ? 'absolute top-0 left-0 right-0 z-50' : 'sticky top-0 z-50 border-b border-gray-100 bg-white/80'}`} />;
  }

  // Not authenticated
  if (!user) {
    return (
      <header className={`${transparent ? 'absolute top-0 left-0 right-0 z-50' : 'sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100'} h-16 flex items-center justify-between px-6 lg:px-12`}>
        <Link href="/" className={`text-2xl font-[family-name:var(--font-playfair)] italic drop-shadow-sm ${transparent ? 'text-white drop-shadow-md' : 'text-[var(--color-primary)]'}`}>
          Merakí
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className={`text-sm font-medium transition-colors px-4 py-2 ${transparent ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-black'}`}>
            Sign In
          </Link>
          <Link href="/register" className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-md ${transparent ? 'bg-white text-[var(--color-primary)] hover:bg-white/90 shadow-lg' : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90'}`}>
            Get Started
          </Link>
        </div>
      </header>
    );
  }

  // Authenticated
  return (
    <header className={`${transparent ? 'relative' : 'sticky'} top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-[var(--color-brand-pink)]/20 shadow-[0_2px_10px_rgba(232,160,180,0.05)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href={pathname === '/' ? '/' : '/dashboard'} className="flex items-center gap-2 shrink-0">
              <span className="text-2xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)]">Merakí</span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {allNav.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'nav-active-gradient'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)] hover:bg-[var(--color-brand-pink-light)]'
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
            <Link
              href="/dashboard/cart"
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-brand-pink-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)]"
              title="Cart"
            >
              <ShoppingCart size={18} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--color-brand-pink-dark)] text-white text-[10px] font-bold flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* Chat icon */}
            <Link
              href="/dashboard/chat"
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-brand-pink-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)]"
            >
              <MessageSquare size={18} />
            </Link>

            {/* Notifications */}
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-brand-pink-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)] cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-[var(--color-brand-pink-light)] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-brand-pink-dark)] flex items-center justify-center text-white text-sm font-semibold">
                  {displayInitial}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[var(--color-text-primary)] max-w-[100px] truncate">
                  {displayName.split(' ')[0] || 'User'}
                </span>
                <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-[var(--radius-xl)] shadow-lg border border-[var(--color-border-light)] py-2 animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{displayName}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{displayEmail}</p>
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
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-brand-pink-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)]"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Nav Dropdown ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--color-border-light)] bg-white animate-fade-in absolute w-full left-0 z-40 shadow-md">
          <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 gap-2">
            {allNav.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-[var(--radius-lg)] text-xs font-medium transition-all ${
                    isActive
                      ? 'nav-active-gradient'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)] hover:bg-[var(--color-brand-pink-light)]'
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
  );
}
