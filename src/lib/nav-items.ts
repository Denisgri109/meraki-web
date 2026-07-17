import {
  Home, Calendar, ShoppingBag, GraduationCap, Gift,
  Scissors, Clock, Package, Boxes, DollarSign, Wallet,
  CalendarCheck, ClipboardList, Smartphone, Ticket,
  Mail, Search, HelpCircle, Settings, BarChart3, Users,
} from 'lucide-react';

type LucideIcon = typeof Home;

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Absolute (non-section-prefixed) link. When present, used instead of buildPath(path). */
  href?: string;
}

export const clientPrimaryNav: NavItem[] = [
  { path: 'dashboard', label: 'Home', icon: Home },
  { path: 'booking', label: 'Book', icon: Calendar },
  { path: 'shop', label: 'Shop', icon: ShoppingBag },
  { path: 'loyalty', label: 'Rewards', icon: Gift },
  { path: 'contact', label: 'Contact', icon: Mail, href: '/contact' },
];

export const clientSecondaryNav: NavItem[] = [
  { path: 'appointments', label: 'Appointments', icon: CalendarCheck },
  { path: 'orders', label: 'Orders', icon: Package },
  { path: 'academy', label: 'Academy', icon: GraduationCap },
  { path: 'passes', label: 'Passes', icon: Ticket },
  { path: 'consultations', label: 'Consults', icon: ClipboardList },
  { path: 'discover', label: 'Discover', icon: Search },
  { path: 'support', label: 'Support', icon: HelpCircle },
  { path: 'settings', label: 'Settings', icon: Settings },
];

export const ownerPrimaryNav: NavItem[] = [
  { path: 'dashboard', label: 'Home', icon: Home },
  { path: 'appointments', label: 'Bookings', icon: CalendarCheck },
  { path: 'finance', label: 'Finance', icon: DollarSign },
  { path: 'services', label: 'Services', icon: Scissors },
  { path: 'availability', label: 'Schedule', icon: Clock },
];

export const ownerSecondaryNav: NavItem[] = [
  { path: 'orders', label: 'Orders', icon: ShoppingBag },
  { path: 'qr-payments', label: 'QR Pay', icon: Smartphone },
  { path: 'vouchers', label: 'Vouchers', icon: Ticket },
  { path: 'class-packages', label: 'Passes', icon: Ticket },
  { path: 'inventory', label: 'Inventory', icon: Package },
  { path: 'supplies', label: 'Supplies', icon: Boxes },
  { path: 'academy', label: 'Academy', icon: GraduationCap },
  { path: 'loyalty', label: 'Rewards', icon: Gift },
  { path: 'consultations', label: 'Consults', icon: ClipboardList },
  { path: 'masters', label: 'Staff', icon: Users },
  { path: 'analytics', label: 'Analytics', icon: BarChart3 },
  { path: 'support', label: 'Support', icon: HelpCircle },
  { path: 'settings', label: 'Settings', icon: Settings },
];

export const masterPrimaryNav: NavItem[] = [
  { path: 'dashboard', label: 'Home', icon: Home },
  { path: 'appointments', label: 'Bookings', icon: CalendarCheck },
  { path: 'earnings', label: 'Earnings', icon: Wallet },
  { path: 'availability', label: 'Schedule', icon: Clock },
];

export const masterSecondaryNav: NavItem[] = [
  { path: 'services', label: 'Services', icon: Scissors },
  { path: 'supplies', label: 'Supplies', icon: Boxes },
  { path: 'loyalty', label: 'Rewards', icon: Gift },
  { path: 'consultations', label: 'Consults', icon: ClipboardList },
  { path: 'support', label: 'Support', icon: HelpCircle },
  { path: 'settings', label: 'Settings', icon: Settings },
];

export const qrPayNavItem: NavItem = { path: 'qr-payments', label: 'QR Pay', icon: Smartphone };
