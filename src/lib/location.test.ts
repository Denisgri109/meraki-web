import {
  haversineDistanceKm,
  isMasterWithinRange,
  getCurrentPosition,
  reverseGeocodeCountry,
  detectUserLocation
} from './location';

describe('Location Utilities', () => {
  describe('haversineDistanceKm', () => {
    it('should return 0 when the coordinates are identical', () => {
      const dist = haversineDistanceKm(51.5074, -0.1278, 51.5074, -0.1278);
      expect(dist).toBe(0);
    });

    it('should calculate the distance correctly between two known points', () => {
      // London: 51.5074, -0.1278
      // Paris: 48.8566, 2.3522
      // Expected distance is approximately 343 km
      const dist = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
      expect(Math.round(dist)).toBe(344);
    });

    it('should be commutative (same distance in both directions)', () => {
      const dist1 = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
      const dist2 = haversineDistanceKm(48.8566, 2.3522, 51.5074, -0.1278);
      expect(dist1).toEqual(dist2);
    });
  });

  describe('isMasterWithinRange', () => {
    it('should return false if either user or master country is missing', () => {
      const userNoCountry = { country: null };
      const masterNoCountry = { country: null };
      const validUser = { country: 'Ireland' };
      const validMaster = { country: 'Ireland' };

      expect(isMasterWithinRange(userNoCountry, validMaster)).toBe(false);
      expect(isMasterWithinRange(validUser, masterNoCountry)).toBe(false);
    });

    it('should return false if user and master are in different countries', () => {
      const user = { country: 'Ireland' };
      const master = { country: 'UK' };
      expect(isMasterWithinRange(user, master)).toBe(false);
    });

    it('should be case-insensitive and ignore surrounding whitespace for country', () => {
      const user = { country: ' ireland ' };
      const master = { country: 'IRELAND' };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('should return true if both are in the same country and no state is specified for user', () => {
      const user = { country: 'Ireland' };
      const master = { country: 'Ireland', state: 'Dublin' };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('should return true if states match (case-insensitive and trimmed)', () => {
      const user = { country: 'Ireland', state: ' dublin ' };
      const master = { country: 'Ireland', state: 'DUBLIN' };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('should return true if state codes match', () => {
      const user = { country: 'USA', state_code: 'CA' };
      const master = { country: 'USA', state_code: 'ca ' };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('should return false if same country, different states, and coordinates are missing', () => {
      const user = { country: 'Ireland', state: 'Cork' };
      const master = { country: 'Ireland', state: 'Dublin' };
      expect(isMasterWithinRange(user, master)).toBe(false);
    });

    it('should return true if same country, different states, but within radius', () => {
      // Cork to Dublin is ~219 km. Let's use a 300km radius.
      const user = { country: 'Ireland', state: 'Cork', latitude: 51.8985, longitude: -8.4756 };
      const master = { country: 'Ireland', state: 'Dublin', latitude: 53.3498, longitude: -6.2603 };

      expect(isMasterWithinRange(user, master, 100)).toBe(false);
      expect(isMasterWithinRange(user, master, 300)).toBe(true);
    });
  });
  describe('getCurrentPosition', () => {
    let originalNavigator: unknown;

    beforeEach(() => {
      originalNavigator = global.navigator;
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it('should return null if navigator.geolocation is undefined', async () => {
      Object.defineProperty(global, 'navigator', {
        value: { geolocation: undefined },
        configurable: true,
      });
      const result = await getCurrentPosition();
      expect(result).toBeNull();
    });

    it('should resolve with coordinates when getCurrentPosition succeeds', async () => {
      const mockPosition = { coords: { latitude: 51.5, longitude: -0.1 } };
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((...args: unknown[]) => {
          const success = args[0] as (p: unknown) => void; success(mockPosition);
        }),
      };
      Object.defineProperty(global, 'navigator', {
        value: { geolocation: mockGeolocation },
        configurable: true,
      });

      const result = await getCurrentPosition();
      expect(result).toEqual(mockPosition);
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('should resolve with null and log a warning if getCurrentPosition fails', async () => {
      const mockError = { message: 'User denied Geolocation' };
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((...args: unknown[]) => {
          const error = args[1] as (e: unknown) => void; error(mockError);
        }),
      };
      Object.defineProperty(global, 'navigator', {
        value: { geolocation: mockGeolocation },
        configurable: true,
      });

      const result = await getCurrentPosition();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[location] getCurrentPosition error:', mockError.message);

      consoleWarnSpy.mockRestore();
    });

    it('should timeout and return null if getCurrentPosition hangs', async () => {
      jest.useFakeTimers();

      const mockGeolocation = {
        // Mock that neither succeeds nor fails
        getCurrentPosition: jest.fn().mockImplementation(() => {}),
      };
      Object.defineProperty(global, 'navigator', {
        value: { geolocation: mockGeolocation },
        configurable: true,
      });

      const promise = getCurrentPosition();

      // Fast-forward past the 12000ms hard timeout
      jest.advanceTimersByTime(12500);

      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('reverseGeocodeCountry', () => {
    let originalFetch: unknown;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch as typeof global.fetch;
      jest.clearAllMocks();
    });

    it('should return country and countryCode on successful fetch', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ address: { country: 'Ireland', country_code: 'ie' } }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await reverseGeocodeCountry(53.3498, -6.2603);
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual({ country: 'Ireland', countryCode: 'IE' });
    });

    it('should return nulls if fetch response is not ok', async () => {
      const mockResponse = { ok: false };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await reverseGeocodeCountry(53.3498, -6.2603);
      expect(result).toEqual({ country: null, countryCode: null });
    });

    it('should return nulls and log a warning if fetch throws an error', async () => {
      const mockError = new Error('Network error');
      global.fetch = jest.fn().mockRejectedValue(mockError);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await reverseGeocodeCountry(53.3498, -6.2603);
      expect(result).toEqual({ country: null, countryCode: null });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[location] reverseGeocodeCountry failed:', mockError);

      consoleWarnSpy.mockRestore();
    });

    it('should return nulls if response does not have address info', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await reverseGeocodeCountry(53.3498, -6.2603);
      expect(result).toEqual({ country: null, countryCode: null });
    });
  });

  describe('detectUserLocation', () => {
    let originalNavigator: unknown;
    let originalFetch: unknown;

    beforeEach(() => {
      originalNavigator = global.navigator;
      originalFetch = global.fetch;
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
      global.fetch = originalFetch as typeof global.fetch;
      jest.clearAllMocks();
    });

    it('should return nulls if getCurrentPosition fails', async () => {
      // Mock navigator without geolocation
      Object.defineProperty(global, 'navigator', {
        value: { geolocation: undefined },
        configurable: true,
      });

      const result = await detectUserLocation();
      expect(result).toEqual({ latitude: null, longitude: null, country: null, countryCode: null });
    });

    it('should return full UserLocation object on success', async () => {
      // Mock successful geolocation
      const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation((...args: unknown[]) => {
          const success = args[0] as (p: unknown) => void; success({ coords: { latitude: 53.3498, longitude: -6.2603 } });
        }),
      };
      Object.defineProperty(global, 'navigator', {
        value: { geolocation: mockGeolocation },
        configurable: true,
      });

      // Mock successful reverse geocode
      const mockResponse = {
        ok: true,
        json: async () => ({ address: { country: 'Ireland', country_code: 'ie' } }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await detectUserLocation();
      expect(result).toEqual({
        latitude: 53.3498,
        longitude: -6.2603,
        country: 'Ireland',
        countryCode: 'IE',
      });
    });
  });
});
