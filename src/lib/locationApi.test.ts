import {
  getAllCountries,
  getCitiesOfCountry,
  getStatesOfCountry,
  getCitiesOfState,
  filterCountries,
  filterCities,
  Country,
  State,
  City
} from './locationApi';

// Mock the global fetch API
const originalFetch = global.fetch;

describe('locationApi', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Suppress console.warn/error in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('getAllCountries', () => {
    it('should fetch countries and cache the result', async () => {
      const mockCountries: Country[] = [
        { id: 1, name: 'United States', iso2: 'US', iso3: 'USA', phonecode: '1', capital: 'Washington', currency: 'USD', currency_symbol: '$', timezones: [] }
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCountries,
      });

      const result1 = await getAllCountries();
      expect(result1).toEqual(mockCountries);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Should hit the cache
      const result2 = await getAllCountries();
      expect(result2).toEqual(mockCountries);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const result = await getAllCountries();
      expect(result).toEqual([]);
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });
      const result = await getAllCountries();
      expect(result).toEqual([]);
    });

    it('should handle API error status responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'error', message: 'API rate limit exceeded' })
      });
      const result = await getAllCountries();
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('API error fetching countries: API rate limit exceeded'));
    });
  });

  describe('getCitiesOfCountry', () => {
    it('should fetch cities and cache per country', async () => {
      const mockCities: City[] = [
        { id: 1, name: 'New York', state_id: 1, state_code: 'NY', state_name: 'New York', country_id: 1, country_code: 'US', country_name: 'United States', latitude: '40', longitude: '-74' }
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCities,
      });

      const result = await getCitiesOfCountry('US');
      expect(result).toEqual(mockCities);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const cachedResult = await getCitiesOfCountry('US');
      expect(cachedResult).toEqual(mockCities);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const result = await getCitiesOfCountry('US');
      expect(result).toEqual([]);
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });
      const result = await getCitiesOfCountry('US');
      expect(result).toEqual([]);
    });

    it('should handle API error status responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'error', message: 'Country not found' })
      });
      const result = await getCitiesOfCountry('US');
      expect(result).toEqual([]);
    });
  });

  describe('getStatesOfCountry', () => {
    it('should fetch states and cache per country', async () => {
      const mockStates: State[] = [
        { id: 1, name: 'New York', iso2: 'NY', country_code: 'US', country_id: 1, latitude: '40', longitude: '-74' }
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockStates,
      });

      const result = await getStatesOfCountry('US');
      expect(result).toEqual(mockStates);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const cachedResult = await getStatesOfCountry('US');
      expect(cachedResult).toEqual(mockStates);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const result = await getStatesOfCountry('US');
      expect(result).toEqual([]);
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });
      const result = await getStatesOfCountry('US');
      expect(result).toEqual([]);
    });

    it('should handle API error status responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'error', message: 'Country not found' })
      });
      const result = await getStatesOfCountry('US');
      expect(result).toEqual([]);
    });
  });

  describe('getCitiesOfState', () => {
    it('should fetch cities and cache per country and state', async () => {
      const mockCities: City[] = [
        { id: 1, name: 'New York', state_id: 1, state_code: 'NY', state_name: 'New York', country_id: 1, country_code: 'US', country_name: 'United States', latitude: '40', longitude: '-74' }
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCities,
      });

      const result = await getCitiesOfState('US', 'NY');
      expect(result).toEqual(mockCities);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const cachedResult = await getCitiesOfState('US', 'NY');
      expect(cachedResult).toEqual(mockCities);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const result = await getCitiesOfState('US', 'NY');
      expect(result).toEqual([]);
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });
      const result = await getCitiesOfState('US', 'NY');
      expect(result).toEqual([]);
    });

    it('should handle API error status responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'error', message: 'State not found' })
      });
      const result = await getCitiesOfState('US', 'NY');
      expect(result).toEqual([]);
    });
  });

  describe('filterCountries', () => {
    const countries: Country[] = [
      { id: 1, name: 'United States', iso2: 'US', iso3: 'USA', phonecode: '1', capital: '', currency: '', currency_symbol: '', timezones: [] },
      { id: 2, name: 'United Kingdom', iso2: 'GB', iso3: 'GBR', phonecode: '44', capital: '', currency: '', currency_symbol: '', timezones: [] },
      { id: 3, name: 'Canada', iso2: 'CA', iso3: 'CAN', phonecode: '1', capital: '', currency: '', currency_symbol: '', timezones: [] }
    ];

    it('should return all countries if query is empty', () => {
      expect(filterCountries(countries, '')).toEqual(countries);
      expect(filterCountries(countries, '   ')).toEqual(countries);
    });

    it('should filter by name (case-insensitive)', () => {
      expect(filterCountries(countries, 'united')).toEqual([countries[0], countries[1]]);
      expect(filterCountries(countries, 'CAN')).toEqual([countries[2]]);
    });

    it('should filter by iso2 (exact case-insensitive match)', () => {
      expect(filterCountries(countries, 'us')).toEqual([countries[0]]);
    });
  });

  describe('filterCities', () => {
    const cities: City[] = Array.from({ length: 100 }, (_, i) => ({
      id: i, name: `City ${i}`, state_id: 1, state_code: 'S1', state_name: 'State 1', country_id: 1, country_code: 'C1', country_name: 'Country 1', latitude: '0', longitude: '0'
    }));
    // Add some specific cities
    cities[0].name = 'New York';
    cities[1].name = 'Newark';
    cities[2].name = 'Los Angeles';

    it('should return max 50 cities if query is empty', () => {
      const result = filterCities(cities, '');
      expect(result.length).toBe(50);
      expect(result[0].name).toBe('New York');
    });

    it('should filter by name (case-insensitive) and return max 50', () => {
      const result = filterCities(cities, 'new');
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('New York');
      expect(result[1].name).toBe('Newark');
    });
  });

  describe('Cache expiration', () => {
    it('should ignore expired cache entries', async () => {
      const mockCountries: Country[] = [
        { id: 1, name: 'United States', iso2: 'US', iso3: 'USA', phonecode: '1', capital: 'Washington', currency: 'USD', currency_symbol: '$', timezones: [] }
      ];

      // Setup fake timers to manipulate Date.now()
      jest.useFakeTimers();
      const mockNow = jest.spyOn(Date, 'now');

      // Step 1: Prime the cache
      mockNow.mockReturnValue(1000000000000); // T=0
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCountries,
      });

      await getAllCountries();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Step 2: Fetch within TTL (24h)
      // 12 hours later
      mockNow.mockReturnValue(1000000000000 + 12 * 60 * 60 * 1000);
      await getAllCountries();
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1 (hit cache)

      // Step 3: Fetch after TTL (24h)
      // 25 hours later
      mockNow.mockReturnValue(1000000000000 + 25 * 60 * 60 * 1000);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCountries,
      });

      await getAllCountries();
      expect(global.fetch).toHaveBeenCalledTimes(2); // Fetched again (cache expired)

      // Cleanup
      jest.useRealTimers();
      mockNow.mockRestore();
    });
  });
});
