import { filterCountries, Country } from './locationApi';

describe('filterCountries', () => {
  const mockCountries: Country[] = [
    {
      id: 1,
      name: 'United States',
      iso2: 'US',
      iso3: 'USA',
      phonecode: '1',
      capital: 'Washington, D.C.',
      currency: 'USD',
      currency_symbol: '$',
      timezones: []
    },
    {
      id: 2,
      name: 'Canada',
      iso2: 'CA',
      iso3: 'CAN',
      phonecode: '1',
      capital: 'Ottawa',
      currency: 'CAD',
      currency_symbol: '$',
      timezones: []
    },
    {
      id: 3,
      name: 'United Kingdom',
      iso2: 'GB',
      iso3: 'GBR',
      phonecode: '44',
      capital: 'London',
      currency: 'GBP',
      currency_symbol: '£',
      timezones: []
    },
    {
      id: 4,
      name: 'Germany',
      iso2: 'DE',
      iso3: 'DEU',
      phonecode: '49',
      capital: 'Berlin',
      currency: 'EUR',
      currency_symbol: '€',
      timezones: []
    }
  ];

  it('should return all countries when query is empty', () => {
    const result = filterCountries(mockCountries, '');
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockCountries);
  });

  it('should return all countries when query is only whitespace', () => {
    const result = filterCountries(mockCountries, '   ');
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockCountries);
  });

  it('should filter countries by exact name match (case-insensitive)', () => {
    const result = filterCountries(mockCountries, 'cAnAdA');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Canada');
  });

  it('should filter countries by partial name match', () => {
    const result = filterCountries(mockCountries, 'united');
    expect(result).toHaveLength(2);
    expect(result.map(c => c.name)).toEqual(['United States', 'United Kingdom']);
  });

  it('should filter countries by exact ISO2 code (case-insensitive)', () => {
    const result = filterCountries(mockCountries, 'gb');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('United Kingdom');
  });

  it('should not match partial ISO2 codes', () => {
    // A query of "U" shouldn't match "US" by iso2, but it might match "United Kingdom" and "United States" by name


    // Let's test a specific query that doesn't match a name but matches a part of ISO2
    // mockCountries has US, CA, GB, DE
    // Query 'U' matches 'United States' and 'United Kingdom' by name.
    // It should not match just by partial ISO2.
    // Query 'S' matches 'United States' by name.

    // Instead of that, let's create a query that matches no names, but is a partial iso2.
    // ISO2 'CA', name 'Canada'.
    // Query 'c' matches 'Canada' by name.

    // Let's add a fake country for this specific test
    const fakeCountries: Country[] = [
      { ...mockCountries[0], name: 'Zeta', iso2: 'XY' }
    ];
    // query 'x' shouldn't match 'XY' iso2 because it's only exact match for iso2
    const result2 = filterCountries(fakeCountries, 'x');
    expect(result2).toHaveLength(0);
  });

  it('should return empty array if no matches found', () => {
    const result = filterCountries(mockCountries, 'France');
    expect(result).toHaveLength(0);
  });

  it('should trim whitespace from query before filtering', () => {
    const result = filterCountries(mockCountries, '  germany  ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Germany');
  });
});
