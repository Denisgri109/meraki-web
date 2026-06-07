import {
  getAllCountries,
  getCitiesOfCountry,
  getStatesOfCountry,
  getCitiesOfState,
  filterCountries,
  filterCities,
  Country,
  City
} from './locationApi';

// Mock setup
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
});

global.fetch = jest.fn();

if (!global.window) { Object.defineProperty(global, 'window', { value: { sessionStorage: mockSessionStorage }, configurable: true, writable: true }); } else { Object.defineProperty(global.window, 'sessionStorage', { value: mockSessionStorage, configurable: true, writable: true }); }

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockSessionStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('filterCountries', () => {
  const mockCountries = [
    { name: 'United States', iso2: 'US' },
    { name: 'United Kingdom', iso2: 'GB' },
    { name: 'France', iso2: 'FR' },
  ] as Country[];

  it('returns all countries when query is empty', () => {
    expect(filterCountries(mockCountries, '')).toEqual(mockCountries);
    expect(filterCountries(mockCountries, '   ')).toEqual(mockCountries);
  });

  it('matches by name case-insensitively', () => {
    const result = filterCountries(mockCountries, 'united');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.iso2)).toEqual(['US', 'GB']);
  });

  it('matches exactly by iso2 case-insensitively', () => {
    const result = filterCountries(mockCountries, 'fr');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('France');
  });

  it('returns empty array when no matches found', () => {
    expect(filterCountries(mockCountries, 'xyz')).toHaveLength(0);
  });
});

describe('filterCities', () => {
  const mockCities = Array.from({ length: 60 }).map((_, i) => ({
    name: `City ${i}`,
  })) as City[];
  mockCities.push({ name: 'Paris' } as City);
  mockCities.push({ name: 'Parma' } as City);

  it('returns up to 50 cities when query is empty', () => {
    const result = filterCities(mockCities, '');
    expect(result).toHaveLength(50);
  });

  it('matches by name case-insensitively and respects the limit of 50', () => {
    const result = filterCities(mockCities, 'city');
    expect(result).toHaveLength(50); // It matched 60 but sliced to 50
  });

  it('finds specific matches', () => {
    const result = filterCities(mockCities, 'par');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name)).toEqual(['Paris', 'Parma']);
  });

  it('returns empty array when no matches found', () => {
    expect(filterCities(mockCities, 'xyz')).toHaveLength(0);
  });
});

describe('API functions', () => {
  const originalDateNow = Date.now;

  beforeEach(() => {
    // Mock Date.now to return a consistent time for cache tests
    Date.now = jest.fn(() => 1000000);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('getAllCountries', () => {
    it('fetches and caches countries successfully', async () => {
      const mockData = [{ id: 1, name: 'France' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getAllCountries();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.countrystatecity.in/v1/countries',
        expect.any(Object)
      );

      // Verify cache behavior
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('returns cached data if available and not expired', async () => {
      const mockData = [{ id: 1, name: 'France' }];
      mockSessionStorage.getItem.mockReturnValueOnce(
        JSON.stringify({ ts: 1000000, data: mockData })
      );

      const result = await getAllCountries();
      expect(result).toEqual(mockData);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('ignores expired cache and fetches new data', async () => {
      const mockData = [{ id: 1, name: 'France' }];
      const expiredTs = 1000000 - (25 * 60 * 60 * 1000); // 25 hours ago
      mockSessionStorage.getItem.mockReturnValueOnce(
        JSON.stringify({ ts: expiredTs, data: [{ id: 99, name: 'Old' }] })
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getAllCountries();
      expect(result).toEqual(mockData);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('meraki:csc:countries');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('handles fetch failure correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await getAllCountries();
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('status 500'));
    });

    it('handles API error object correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'error', message: 'API key invalid' }),
      });

      const result = await getAllCountries();
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('API key invalid'));
    });

    it('catches and handles exceptions thrown by fetch', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      const result = await getAllCountries();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('countries error'), expect.any(Error));
    });
  });

  describe('getCitiesOfCountry', () => {
    it('fetches and caches cities for a country', async () => {
      const mockData = [{ id: 1, name: 'Paris' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getCitiesOfCountry('FR');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.countrystatecity.in/v1/countries/FR/cities',
        expect.any(Object)
      );
    });

    it('handles fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getCitiesOfCountry('XX');
      expect(result).toEqual([]);
    });
  });

  describe('getStatesOfCountry', () => {
    it('fetches and caches states for a country', async () => {
      const mockData = [{ id: 1, name: 'California' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getStatesOfCountry('US');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.countrystatecity.in/v1/countries/US/states',
        expect.any(Object)
      );
    });

    it('handles fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await getStatesOfCountry('XX');
      expect(result).toEqual([]);
    });
  });

  describe('getCitiesOfState', () => {
    it('fetches and caches cities for a state within a country', async () => {
      const mockData = [{ id: 1, name: 'Los Angeles' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getCitiesOfState('US', 'CA');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.countrystatecity.in/v1/countries/US/states/CA/cities',
        expect.any(Object)
      );
    });

    it('handles fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getCitiesOfState('XX', 'YY');
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
