import { normalizeIrishPhone } from './validation';

describe('normalizeIrishPhone', () => {
  it('normalizes valid mobile numbers with various prefixes', () => {
    expect(normalizeIrishPhone('083 123 4567')).toBe('+353831234567');
    expect(normalizeIrishPhone('+353 85 123 4567')).toBe('+353851234567');
    expect(normalizeIrishPhone('353 86 123 4567')).toBe('+353861234567');
    expect(normalizeIrishPhone('00353 87 123 4567')).toBe('+353871234567');
  });

  it('normalizes valid landline numbers', () => {
    expect(normalizeIrishPhone('01 123 4567')).toBe('+35311234567');
    expect(normalizeIrishPhone('+353 21 123 4567')).toBe('+353211234567');
  });

  it('handles formatting with spaces and other non-digit characters', () => {
    expect(normalizeIrishPhone('089-123-4567')).toBe('+353891234567');
    expect(normalizeIrishPhone('(088) 123 4567')).toBe('+353881234567');
    expect(normalizeIrishPhone('+353.83.123.4567')).toBe('+353831234567');
  });

  it('returns an empty string for invalid numbers', () => {
    expect(normalizeIrishPhone('')).toBe(''); // Empty string
    expect(normalizeIrishPhone('083 123')).toBe(''); // Mobile too short
    expect(normalizeIrishPhone('083 123 4567 89')).toBe(''); // Mobile too long
    // Note: 99 is in IRISH_LANDLINE_PREFIXES, so '099 123 4567' (cleaned length 10) is a valid landline
    expect(normalizeIrishPhone('084 123 4567')).toBe(''); // Invalid mobile prefix
    expect(normalizeIrishPhone('01 12')).toBe(''); // Landline too short
    expect(normalizeIrishPhone('01 123 4567 890')).toBe(''); // Landline too long
  });
});
