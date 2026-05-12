import { getCountryName } from './shipping';

describe('getCountryName', () => {
  it('returns the correct country name for a valid country code', () => {
    expect(getCountryName('GB')).toBe('United Kingdom');
    expect(getCountryName('DE')).toBe('Germany');
    expect(getCountryName('FR')).toBe('France');
  });

  it('returns the input code when an invalid country code is provided', () => {
    expect(getCountryName('XX')).toBe('XX');
    expect(getCountryName('INVALID')).toBe('INVALID');
  });

  it('returns an empty string when an empty string is provided', () => {
    expect(getCountryName('')).toBe('');
  });
});
