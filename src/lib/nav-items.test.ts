import {
  clientPrimaryNav,
  clientSecondaryNav,
  ownerPrimaryNav,
  ownerSecondaryNav,
  masterPrimaryNav,
  masterSecondaryNav,
  qrPayNavItem,
  type NavItem,
} from '@/lib/nav-items';

// ─── Helper to validate NavItem shape ──────────────────────────────────────

function validateNavArray(arr: NavItem[], label: string) {
  describe(label, () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(0);
    });

    it('every item has path, label, and icon', () => {
      for (const item of arr) {
        expect(typeof item.path).toBe('string');
        expect(item.path.length).toBeGreaterThan(0);
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe('object');
      }
    });

    it('paths are unique within the array', () => {
      const paths = arr.map((i) => i.path);
      expect(new Set(paths).size).toBe(paths.length);
    });

    it('labels are unique within the array', () => {
      const labels = arr.map((i) => i.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('href is either undefined or a string starting with /', () => {
      for (const item of arr) {
        if (item.href !== undefined) {
          expect(typeof item.href).toBe('string');
          expect(item.href.startsWith('/')).toBe(true);
        }
      }
    });
  });
}

// ─── Validate each export ──────────────────────────────────────────────────

validateNavArray(clientPrimaryNav, 'clientPrimaryNav');
validateNavArray(clientSecondaryNav, 'clientSecondaryNav');
validateNavArray(ownerPrimaryNav, 'ownerPrimaryNav');
validateNavArray(ownerSecondaryNav, 'ownerSecondaryNav');
validateNavArray(masterPrimaryNav, 'masterPrimaryNav');
validateNavArray(masterSecondaryNav, 'masterSecondaryNav');

// ─── Specific content checks ───────────────────────────────────────────────

describe('clientPrimaryNav', () => {
  it('has exactly 5 items', () => {
    expect(clientPrimaryNav).toHaveLength(5);
  });

  it('includes Home, Book, Shop, Rewards, Contact', () => {
    const labels = clientPrimaryNav.map((i) => i.label);
    expect(labels).toEqual(['Home', 'Book', 'Shop', 'Rewards', 'Contact']);
  });

  it('Contact item has absolute href /contact', () => {
    const contact = clientPrimaryNav.find((i) => i.label === 'Contact');
    expect(contact?.href).toBe('/contact');
  });

  it('non-Contact items do not have href', () => {
    for (const item of clientPrimaryNav) {
      if (item.label !== 'Contact') {
        expect(item.href).toBeUndefined();
      }
    }
  });
});

describe('clientSecondaryNav', () => {
  it('has exactly 8 items', () => {
    expect(clientSecondaryNav).toHaveLength(8);
  });

  it('includes Appointments, Orders, Academy, Passes, Consults, Discover, Support, Settings', () => {
    const labels = clientSecondaryNav.map((i) => i.label);
    expect(labels).toContain('Appointments');
    expect(labels).toContain('Orders');
    expect(labels).toContain('Academy');
    expect(labels).toContain('Passes');
    expect(labels).toContain('Consults');
    expect(labels).toContain('Discover');
    expect(labels).toContain('Support');
    expect(labels).toContain('Settings');
  });
});

describe('ownerPrimaryNav', () => {
  it('has exactly 4 items', () => {
    expect(ownerPrimaryNav).toHaveLength(4);
  });

  it('includes Home, Bookings, Finance, Services', () => {
    const labels = ownerPrimaryNav.map((i) => i.label);
    expect(labels).toEqual(['Home', 'Bookings', 'Finance', 'Services']);
  });

  it('does NOT include Inventory (moved to secondary)', () => {
    const labels = ownerPrimaryNav.map((i) => i.label);
    expect(labels).not.toContain('Inventory');
  });
});

describe('ownerSecondaryNav', () => {
  it('has exactly 14 items', () => {
    expect(ownerSecondaryNav).toHaveLength(14);
  });

  it('includes Inventory, Supplies, Bulk Finance, Staff, Analytics', () => {
    const labels = ownerSecondaryNav.map((i) => i.label);
    expect(labels).toContain('Inventory');
    expect(labels).toContain('Supplies');
    expect(labels).toContain('Bulk Finance');
    expect(labels).toContain('Staff');
    expect(labels).toContain('Analytics');
  });
});

describe('masterPrimaryNav', () => {
  it('has exactly 4 items', () => {
    expect(masterPrimaryNav).toHaveLength(4);
  });

  it('includes Home, Bookings, Earnings, Schedule', () => {
    const labels = masterPrimaryNav.map((i) => i.label);
    expect(labels).toEqual(['Home', 'Bookings', 'Earnings', 'Schedule']);
  });
});

describe('masterSecondaryNav', () => {
  it('has exactly 6 items', () => {
    expect(masterSecondaryNav).toHaveLength(6);
  });

  it('includes Services, Supplies, Rewards, Consults, Support, Settings', () => {
    const labels = masterSecondaryNav.map((i) => i.label);
    expect(labels).toEqual(['Services', 'Supplies', 'Rewards', 'Consults', 'Support', 'Settings']);
  });
});

describe('qrPayNavItem', () => {
  it('has path qr-payments', () => {
    expect(qrPayNavItem.path).toBe('qr-payments');
  });

  it('has label QR Pay', () => {
    expect(qrPayNavItem.label).toBe('QR Pay');
  });

  it('has an icon', () => {
    expect(qrPayNavItem.icon).toBeDefined();
  });

  it('does not have href', () => {
    expect(qrPayNavItem.href).toBeUndefined();
  });
});

// ─── Cross-array consistency ───────────────────────────────────────────────

describe('cross-array consistency', () => {
  it('primary and secondary navs do not overlap for client', () => {
    const primaryPaths = new Set(clientPrimaryNav.map((i) => i.path));
    for (const item of clientSecondaryNav) {
      expect(primaryPaths.has(item.path)).toBe(false);
    }
  });

  it('primary and secondary navs do not overlap for owner', () => {
    const primaryPaths = new Set(ownerPrimaryNav.map((i) => i.path));
    for (const item of ownerSecondaryNav) {
      expect(primaryPaths.has(item.path)).toBe(false);
    }
  });

  it('primary and secondary navs do not overlap for master', () => {
    const primaryPaths = new Set(masterPrimaryNav.map((i) => i.path));
    for (const item of masterSecondaryNav) {
      expect(primaryPaths.has(item.path)).toBe(false);
    }
  });

  it('all arrays have Home as first item (except secondary arrays)', () => {
    expect(clientPrimaryNav[0].label).toBe('Home');
    expect(ownerPrimaryNav[0].label).toBe('Home');
    expect(masterPrimaryNav[0].label).toBe('Home');
  });
});
