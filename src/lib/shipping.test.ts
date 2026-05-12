import { getCountryName } from './shipping';

describe('getCountryName', () => {
  it('returns the correct country name for a valid European country code', () => {
    expect(getCountryName('FR')).toBe('France');
    expect(getCountryName('GB')).toBe('United Kingdom');
    expect(getCountryName('DE')).toBe('Germany');
  });

  it('returns the country code if it is not found in the list', () => {
    expect(getCountryName('US')).toBe('US');
    expect(getCountryName('XYZ')).toBe('XYZ');
  });

  it('returns the original input if given an empty string', () => {
    expect(getCountryName('')).toBe('');
  });

  it('is case-sensitive and returns the input code if it is lowercase', () => {
    expect(getCountryName('fr')).toBe('fr');
    expect(getCountryName('gb')).toBe('gb');
  });
});
