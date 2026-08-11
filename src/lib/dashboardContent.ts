/**
 * Owner-editable copy inside the signed-in dashboard.
 *
 * The landing pages already had `landing.*` / `about.*` / `contact.*` keys via
 * CustomizeDrawer; this registry extends the same system to the app itself, so
 * the header copy a client reads on Shop, Booking, Academy, Rewards,
 * Appointments and Cart can be rebranded without a deploy.
 *
 * The `/beauty/*` and `/pilates/*` routes re-render the `/dashboard/*` pages
 * through SectionPageWrapper, so wiring a key once covers all three sections.
 */

export interface DashboardTextField {
  key: string;
  label: string;
  fallback: string;
  multiline?: boolean;
}

export interface DashboardTextGroup {
  id: string;
  title: string;
  description: string;
  fields: DashboardTextField[];
}

export const DASHBOARD_TEXT_GROUPS: DashboardTextGroup[] = [
  {
    id: 'dashboard-shop',
    title: 'Shop Header',
    description: 'Banner copy at the top of the Shop page.',
    fields: [
      { key: 'dashboard.shop.eyebrow', label: 'Shop Eyebrow', fallback: 'Shop' },
      { key: 'dashboard.shop.title', label: 'Shop Title', fallback: 'Curated Beauty Products' },
      {
        key: 'dashboard.shop.subtitle',
        label: 'Shop Subtitle',
        fallback: 'Premium beauty essentials handpicked for you',
        multiline: true,
      },
    ],
  },
  {
    id: 'dashboard-booking',
    title: 'Booking Header',
    description: 'Banner copy at the top of the booking flow.',
    fields: [
      { key: 'dashboard.booking.eyebrow', label: 'Booking Eyebrow', fallback: 'Book Now' },
      { key: 'dashboard.booking.title', label: 'Booking Title', fallback: 'Find Your Perfect Service' },
    ],
  },
  {
    id: 'dashboard-academy',
    title: 'Academy Header',
    description: 'Banner copy at the top of the Academy page.',
    fields: [
      { key: 'dashboard.academy.eyebrow', label: 'Academy Eyebrow', fallback: 'Academy' },
      { key: 'dashboard.academy.title', label: 'Academy Title', fallback: 'Master Your Craft' },
      {
        key: 'dashboard.academy.subtitle',
        label: 'Academy Subtitle',
        fallback: 'Learn from industry experts and elevate your skills',
        multiline: true,
      },
    ],
  },
  {
    id: 'dashboard-loyalty',
    title: 'Rewards Header',
    description: 'Banner copy on the Rewards page. Clients and staff see different wording.',
    fields: [
      { key: 'dashboard.loyalty.eyebrow', label: 'Rewards Eyebrow', fallback: 'Rewards' },
      { key: 'dashboard.loyalty.title_client', label: 'Rewards Title (client)', fallback: 'Earn & Redeem' },
      {
        key: 'dashboard.loyalty.subtitle_client',
        label: 'Rewards Subtitle (client)',
        fallback: 'Collect stamps with every visit and unlock exclusive rewards',
        multiline: true,
      },
      { key: 'dashboard.loyalty.title_staff', label: 'Rewards Title (staff)', fallback: 'Reward Your Clients' },
      {
        key: 'dashboard.loyalty.subtitle_staff',
        label: 'Rewards Subtitle (staff)',
        fallback: 'Show your QR for clients to collect stamps and manage your stamp cards',
        multiline: true,
      },
    ],
  },
  {
    id: 'dashboard-appointments',
    title: 'Appointments Header',
    description: 'Banner copy on the Appointments page. Clients and staff see different wording.',
    fields: [
      {
        key: 'dashboard.appointments.title_client',
        label: 'Appointments Title (client)',
        fallback: 'Your Appointments',
      },
      {
        key: 'dashboard.appointments.subtitle_client',
        label: 'Appointments Subtitle (client)',
        fallback: 'Track upcoming sessions, confirm attendance, or request reschedules',
        multiline: true,
      },
      {
        key: 'dashboard.appointments.title_staff',
        label: 'Appointments Title (staff)',
        fallback: 'Professional Bookings',
      },
      {
        key: 'dashboard.appointments.subtitle_staff',
        label: 'Appointments Subtitle (staff)',
        fallback: 'Manage client attendance, reschedule proposals, and track late arrivals',
        multiline: true,
      },
    ],
  },
  {
    id: 'dashboard-cart',
    title: 'Cart',
    description: 'Cart heading and the empty-bag message.',
    fields: [
      { key: 'dashboard.cart.title', label: 'Cart Title', fallback: 'Cart' },
      { key: 'dashboard.cart.empty_title', label: 'Empty Cart Message', fallback: 'Your bag is empty' },
    ],
  },
];

export const DASHBOARD_TEXT_FIELDS: DashboardTextField[] = DASHBOARD_TEXT_GROUPS.flatMap(
  (g) => g.fields
);

/** Flat lookup of every dashboard key → factory default. */
export const DASHBOARD_TEXT_FALLBACKS: Record<string, string> = DASHBOARD_TEXT_FIELDS.reduce(
  (acc, field) => {
    acc[field.key] = field.fallback;
    return acc;
  },
  {} as Record<string, string>
);
