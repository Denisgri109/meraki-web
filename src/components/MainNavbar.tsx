'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useSection } from '@/contexts/SectionContext';
import { useNotifications, type NotificationItem } from '@/contexts/NotificationsContext';
import { SectionSwitcher, type SectionId } from '@/components/SectionSwitcher';
import {
  clientNav, ownerPrimaryNav, masterPrimaryNav, qrPayNavItem,
  type NavItem,
} from '@/lib/nav-items';
import {
  Calendar, MessageSquare, Settings, LogOut, Menu, X, ChevronDown,
  Bell, ShoppingCart, Inbox, HelpCircle, Smartphone, Eye
} from 'lucide-react';

interface MainNavbarProps {
  transparent?: boolean;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!t) return '';
  const diff = Date.now() - t;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MainNavbar({ transparent = false }: MainNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClientPreview = searchParams?.get('preview') === 'client';
  const { user, profile, role, signOut, loading } = useAuth();
  const { getItemCount } = useCart();
  const { section, buildPath } = useSection();
  const { unreadMessages, notifications, unreadNotifications, markNotificationsSeen } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const cartItemCount = getItemCount();
  const displayName = profile?.full_name || (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) || user?.email || 'User';
  const displayEmail = profile?.email || user?.email || '';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url || (typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null) || null;

  const notificationHref = (n: NotificationItem): string => {
    if (n.appointment_id) return buildPath('appointments');
    if (n.type === 'message') return buildPath('chat');
    return buildPath('appointments');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allNav = useMemo((): NavItem[] => {
    if (isClientPreview) return clientNav;
    if (role === 'owner') return ownerPrimaryNav;
    if (role === 'master') {
      return profile?.can_view_qr_pay === true
        ? [...masterPrimaryNav, qrPayNavItem]
        : masterPrimaryNav;
    }
    return clientNav;
  }, [role, isClientPreview, profile?.can_view_qr_pay]);

  const withPreview = (href: string) =>
    isClientPreview ? `${href}?preview=client` : href;

  const isItemActive = (itemPath: string): boolean => {
    const fullHref = buildPath(itemPath);
    if (itemPath === 'dashboard') return pathname === fullHref;
    return pathname === fullHref || pathname.startsWith(fullHref);
  };

  const handleNotificationsToggle = () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next) markNotificationsSeen();
    setProfileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSectionSwitch = useCallback(
    (next: SectionId) => {
      if (next === section) return;
      const currentPrefix = `/${section}`;
      const nextPrefix = `/${next}`;
      const query = isClientPreview ? '?preview=client' : '';
      if (pathname?.startsWith(currentPrefix)) {
        const rest = pathname.slice(currentPrefix.length) || '/dashboard';
        router.push(`${nextPrefix}${rest}${query}`);
      } else {
        router.push(`${nextPrefix}/dashboard${query}`);
      }
    },
    [section, pathname, router, isClientPreview]
  );

  if (loading) {
    return <header className={`h-16 ${transparent ? 'absolute top-0 left-0 right-0 z-50' : 'sticky top-0 z-50 border-b border-gray-100 bg-white/80'}`} />;
  }

  if (!user) {
    return (
      <>
        <header className={`${transparent ? 'absolute top-0 left-0 right-0 z-50' : 'sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100'}`}>
          <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
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
          </div>
        </header>

        <div className="w-full flex justify-start px-2 lg:px-4 pt-3 pb-2">
          <Link
            href="/get-app"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm border ${
              transparent
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                : 'bg-[var(--color-brand-pink-light)] hover:bg-[var(--color-brand-pink)] hover:text-white border-[var(--color-brand-pink)]/20 text-[var(--color-brand-pink-dark)]'
            }`}
          >
            <Smartphone size={18} />
            <span>Get Mobile App</span>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
    <header className={`${transparent ? 'relative' : 'sticky'} top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-[var(--color-brand-pink)]/20 shadow-[0_2px_10px_rgba(232,160,180,0.05)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0 flex-1">
            <Link href={pathname === '/' ? '/' : withPreview(buildPath('dashboard'))} className="flex items-center gap-2 shrink-0">
              <span className="text-2xl font-[family-name:var(--font-playfair)] italic text-[var(--color-primary)]">Merakí</span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0 flex-1">
              {allNav.map((item) => {
                const itemHref = withPreview(buildPath(item.path));
                const isActive = isItemActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={itemHref}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
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
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            {isClientPreview && (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700">
                <Eye size={14} />
                Client Preview
              </span>
            )}

            {role !== 'owner' && (
              <Link
                href={buildPath('cart')}
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
            )}

            <Link
              href={buildPath('chat')}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-brand-pink-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)]"
              title="Messages"
            >
              <MessageSquare size={18} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--color-brand-pink-dark)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>

            {/* Notifications dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={handleNotificationsToggle}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-brand-pink-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)] cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-white">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[92vw] bg-white rounded-[var(--radius-xl)] shadow-lg border border-[var(--color-border-light)] py-2 animate-fade-in z-50">
                  <div className="px-4 py-2 border-b border-[var(--color-border-light)] flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</p>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      {notifications.length ? `${notifications.length} recent` : 'all clear'}
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-brand-pink-light)] flex items-center justify-center mb-2">
                          <Inbox size={18} className="text-[var(--color-brand-pink-dark)]" />
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">You&apos;re all caught up</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={notificationHref(n)}
                          onClick={() => setNotificationsOpen(false)}
                          className="flex gap-3 px-4 py-3 hover:bg-[var(--color-surface-light)] transition-colors border-b last:border-b-0 border-[var(--color-border-light)]/60"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-brand-pink-dark)] flex items-center justify-center shrink-0">
                            {n.type === 'message' ? (
                              <MessageSquare size={14} className="text-white" />
                            ) : (
                              <Calendar size={14} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{n.title}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{formatRelative(n.created_at)}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2 sm:pl-2 sm:pr-3 py-1.5 rounded-full hover:bg-[var(--color-brand-pink-light)] transition-all cursor-pointer"
                aria-label="Toggle profile menu"
                aria-expanded={profileOpen}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-brand-pink-dark)] flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayInitial
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[var(--color-text-primary)] max-w-[100px] truncate">
                  {displayName.split(' ')[0] || 'User'}
                </span>
                <ChevronDown size={14} className={`hidden sm:block text-[var(--color-text-muted)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

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
                    <Link href={buildPath('appointments')} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-text-primary)] transition-colors">
                      <Calendar size={16} /> My Appointments
                    </Link>
                    <Link href={buildPath('settings')} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-text-primary)] transition-colors">
                      <Settings size={16} /> Settings
                    </Link>
                    <Link href={buildPath('support')} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-text-primary)] transition-colors">
                      <HelpCircle size={16} /> Support
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

            <div className="hidden lg:block ml-1">
              <SectionSwitcher activeSection={section} onSwitch={handleSectionSwitch} />
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-brand-pink-light)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink-dark)]"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Nav Dropdown ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--color-border-light)] bg-white animate-fade-in absolute w-full left-0 z-40 shadow-md max-h-[80vh] overflow-y-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex justify-center pb-3 mb-2 border-b border-[var(--color-border-light)]">
              <SectionSwitcher activeSection={section} onSwitch={handleSectionSwitch} />
            </div>
            <nav className="grid grid-cols-3 gap-2">
              {allNav.map((item) => {
                const isActive = isItemActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={withPreview(buildPath(item.path))}
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
        </div>
      )}
    </header>

    <div className="w-full flex justify-start px-2 lg:px-4 pt-3 pb-2">
      <Link
        href="/get-app"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[var(--color-brand-pink-dark)] bg-[var(--color-brand-pink-light)] hover:bg-[var(--color-brand-pink)] hover:text-white transition-all shadow-sm border border-[var(--color-brand-pink)]/20"
      >
        <Smartphone size={18} />
        <span>Get Mobile App</span>
      </Link>
    </div>
    </>
  );
}
