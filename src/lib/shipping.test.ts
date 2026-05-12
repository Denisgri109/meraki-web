import { EUROPEAN_COUNTRIES_SORTED, getShippingCost, getCountryName } from './shipping';

describe('shipping utilities', () => {
  describe('EUROPEAN_COUNTRIES_SORTED', () => {
    it('should be sorted by country name alphabetically', () => {
      const names = EUROPEAN_COUNTRIES_SORTED.map(country => country.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });

    it('should contain some known countries', () => {
      expect(EUROPEAN_COUNTRIES_SORTED).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'FR', name: 'France' }),
          expect.objectContaining({ code: 'DE', name: 'Germany' })
        ])
      );
    });
  });

  describe('getShippingCost', () => {
    it('should return the correct cost for a valid country code', () => {
      expect(getShippingCost('FR')).toBe(6.99);
      expect(getShippingCost('DE')).toBe(6.49);
      expect(getShippingCost('GB')).toBe(4.99);
    });

    it('should return 0 for an invalid or unknown country code', () => {
      expect(getShippingCost('XX')).toBe(0);
      expect(getShippingCost('')).toBe(0);
    });
  });

  describe('getCountryName', () => {
    it('should return the country name for a valid country code', () => {
      expect(getCountryName('FR')).toBe('France');
      expect(getCountryName('DE')).toBe('Germany');
    });

    it('should return the country code itself for an invalid or unknown country code', () => {
      expect(getCountryName('XX')).toBe('XX');
      expect(getCountryName('')).toBe('');
    });
  });
});
