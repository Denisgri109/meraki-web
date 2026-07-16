import {
  Home, Calendar, ShoppingBag, GraduationCap, Gift,
  Scissors, Clock, Package, Boxes, DollarSign, Wallet,
  CalendarCheck, ClipboardList, Smartphone, Ticket,
} from 'lucide-react';

type LucideIcon = typeof Home;

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const clientPrimaryNav: NavItem[] = [
  { path: 'dashboard', label: 'Home', icon: Home },
  { path: 'booking', label: 'Book', icon: Calendar },
  { path: 'shop', label: 'Shop', icon: ShoppingBag },
  { path: 'loyalty', label: 'Rewards', icon: Gift },
];

export const clientSecondaryNav: NavItem[] = [
  { path: 'orders', label: 'Orders', icon: Package },
  { path: 'academy', label: 'Academy', icon: GraduationCap },
  { path: 'passes', label: 'Passes', icon: Ticket },
  { path: 'consultations', label: 'Consults', icon: ClipboardList },
];

export const ownerPrimaryNav: NavItem[] = [
  { path: 'dashboard', label: 'Home', icon: Home },
  { path: 'appointments', label: 'Bookings', icon: CalendarCheck },
  { path: 'finance', label: 'Finance', icon: DollarSign },
  { path: 'services', label: 'Services', icon: Scissors },
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
  { path: 'bulk-finance', label: 'Bulk Finance', icon: Wallet },
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
];

export const qrPayNavItem: NavItem = { path: 'qr-payments', label: 'QR Pay', icon: Smartphone };
