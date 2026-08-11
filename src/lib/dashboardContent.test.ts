/**
 * Registry integrity for owner-editable dashboard copy.
 *
 * These keys are referenced by string from the dashboard pages and rendered
 * again by CustomizeDrawer, so a typo or a duplicate silently produces a field
 * that edits nothing. Cheap structural checks catch that.
 */
import {
  DASHBOARD_TEXT_GROUPS,
  DASHBOARD_TEXT_FIELDS,
  DASHBOARD_TEXT_FALLBACKS,
} from '@/lib/dashboardContent';

describe('dashboard content registry', () => {
  it('namespaces every key under dashboard. so the reset prefix covers them', () => {
    const stray = DASHBOARD_TEXT_FIELDS.filter((f) => !f.key.startsWith('dashboard.'));
    expect(stray.map((f) => f.key)).toEqual([]);
  });

  it('has no duplicate keys', () => {
    const keys = DASHBOARD_TEXT_FIELDS.map((f) => f.key);
    expect(keys).toHaveLength(new Set(keys).size);
  });

  it('has no duplicate group ids', () => {
    const ids = DASHBOARD_TEXT_GROUPS.map((g) => g.id);
    expect(ids).toHaveLength(new Set(ids).size);
  });

  it('gives every field a non-empty label and fallback', () => {
    for (const field of DASHBOARD_TEXT_FIELDS) {
      expect([field.key, field.label.trim().length > 0]).toEqual([field.key, true]);
      expect([field.key, field.fallback.trim().length > 0]).toEqual([field.key, true]);
    }
  });

  it('exposes a flat fallback lookup covering every field', () => {
    expect(Object.keys(DASHBOARD_TEXT_FALLBACKS)).toHaveLength(DASHBOARD_TEXT_FIELDS.length);
    for (const field of DASHBOARD_TEXT_FIELDS) {
      expect(DASHBOARD_TEXT_FALLBACKS[field.key]).toBe(field.fallback);
    }
  });

  it('covers the role-split headers with both client and staff variants', () => {
    const keys = new Set(DASHBOARD_TEXT_FIELDS.map((f) => f.key));
    for (const base of ['dashboard.loyalty.title', 'dashboard.loyalty.subtitle',
      'dashboard.appointments.title', 'dashboard.appointments.subtitle']) {
      expect([base, keys.has(`${base}_client`)]).toEqual([base, true]);
      expect([base, keys.has(`${base}_staff`)]).toEqual([base, true]);
    }
  });
});
