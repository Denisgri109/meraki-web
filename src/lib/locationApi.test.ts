import { filterCities, filterCountries, City, Country } from './locationApi';

describe('locationApi Client-side search helpers', () => {
  describe('filterCountries', () => {
    const mockCountries: Country[] = [
      { id: 1, name: 'United States', iso2: 'US', iso3: 'USA', phonecode: '1', capital: 'Washington', currency: 'USD', currency_symbol: '$', timezones: [] },
      { id: 2, name: 'United Kingdom', iso2: 'GB', iso3: 'GBR', phonecode: '44', capital: 'London', currency: 'GBP', currency_symbol: '£', timezones: [] },
      { id: 3, name: 'Canada', iso2: 'CA', iso3: 'CAN', phonecode: '1', capital: 'Ottawa', currency: 'CAD', currency_symbol: '$', timezones: [] },
      { id: 4, name: 'Australia', iso2: 'AU', iso3: 'AUS', phonecode: '61', capital: 'Canberra', currency: 'AUD', currency_symbol: '$', timezones: [] },
    ];

    it('returns all countries when query is empty', () => {
      expect(filterCountries(mockCountries, '')).toHaveLength(4);
    });

    it('returns all countries when query is whitespace only', () => {
      expect(filterCountries(mockCountries, '   ')).toHaveLength(4);
    });

    it('filters countries by partial name match (case-insensitive)', () => {
      const result = filterCountries(mockCountries, 'united');
      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(['United States', 'United Kingdom']);
    });

    it('filters countries by exact iso2 match (case-insensitive)', () => {
      const result = filterCountries(mockCountries, 'gb');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('United Kingdom');
    });

    it('does not match partial iso2', () => {
      expect(filterCountries(mockCountries, 'x')).toHaveLength(0);
    });

    it('returns empty array when no matches found', () => {
      expect(filterCountries(mockCountries, 'Germany')).toHaveLength(0);
    });
  });

  describe('filterCities', () => {
    // Generate 60 cities for testing the 50-item limit
    const mockCities: City[] = Array.from({ length: 60 }, (_, i) => ({
      id: i + 1,
      name: `City ${i + 1}`,
      state_id: 1,
      state_code: 'ST',
      state_name: 'State',
      country_id: 1,
      country_code: 'US',
      country_name: 'United States',
      latitude: '0',
      longitude: '0',
    }));

    // Add some specific cities for search testing
    mockCities[0].name = 'New York';
    mockCities[1].name = 'Los Angeles';
    mockCities[2].name = 'Chicago';
    mockCities[3].name = 'Houston';
    mockCities[4].name = 'Phoenix';
    mockCities[5].name = 'Newark';

    it('returns up to 50 cities when query is empty', () => {
      const result = filterCities(mockCities, '');
      expect(result).toHaveLength(50);
    });

    it('returns up to 50 cities when query is whitespace only', () => {
      const result = filterCities(mockCities, '   ');
      expect(result).toHaveLength(50);
    });

    it('filters cities by partial name match (case-insensitive)', () => {
      const result = filterCities(mockCities, 'new');
      expect(result).toHaveLength(2); // New York, Newark
      expect(result.map(c => c.name)).toEqual(['New York', 'Newark']);
    });

    it('returns empty array when no matches found', () => {
      const result = filterCities(mockCities, 'Seattle');
      expect(result).toHaveLength(0);
    });

    it('limits search results to 50 items', () => {
      // Modify all cities to include 'test'
      const manyTestCities: City[] = Array.from({ length: 60 }, (_, i) => ({
        ...mockCities[i],
        name: `Test City ${i + 1}`,
      }));
      const result = filterCities(manyTestCities, 'test');
      expect(result).toHaveLength(50);
    });
  });
});
