import {
  haversineDistanceKm,
  isMasterWithinRange,
  getCurrentPosition,
  reverseGeocodeCountry,
  detectUserLocation,
} from './location';

// Mocking global objects for jsdom environment
const originalFetch = global.fetch;
const originalGeolocation = global.navigator?.geolocation;

beforeAll(() => {
  // Mock window.setTimeout and window.clearTimeout
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

afterEach(() => {
  global.fetch = originalFetch;
  if (global.navigator) {
    Object.defineProperty(global.navigator, 'geolocation', { value: originalGeolocation, configurable: true });
  }
  jest.clearAllMocks();
});

describe('haversineDistanceKm', () => {
  it('calculates 0 distance for the same coordinates', () => {
    expect(haversineDistanceKm(0, 0, 0, 0)).toBeCloseTo(0);
    expect(haversineDistanceKm(40.7128, -74.006, 40.7128, -74.006)).toBeCloseTo(0);
  });

  it('calculates approximate distance between NY and LA', () => {
    const ny = { lat: 40.7128, lon: -74.006 };
    const la = { lat: 34.0522, lon: -118.2437 };
    const distance = haversineDistanceKm(ny.lat, ny.lon, la.lat, la.lon);
    // Approximate distance is ~3935 km
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });
});

describe('isMasterWithinRange', () => {
  const user = { country: 'Ireland', state: 'Dublin', state_code: 'DUB', latitude: 53.3498, longitude: -6.2603 };
  const master = { country: 'Ireland', state: 'Dublin', state_code: 'DUB', latitude: 53.3498, longitude: -6.2603 };

  it('returns false if user country is missing', () => {
    expect(isMasterWithinRange({ ...user, country: null }, master)).toBe(false);
  });

  it('returns false if master country is missing', () => {
    expect(isMasterWithinRange(user, { ...master, country: null })).toBe(false);
  });

  it('returns false if countries do not match', () => {
    expect(isMasterWithinRange(user, { ...master, country: 'UK' })).toBe(false);
  });

  it('returns true if country matches and user state is missing', () => {
    expect(isMasterWithinRange({ ...user, state: null, state_code: null }, master)).toBe(true);
  });

  it('returns true if country and state codes match', () => {
    expect(isMasterWithinRange(user, master)).toBe(true);
  });

  it('returns true if country and state names match', () => {
    expect(isMasterWithinRange(
      { ...user, state_code: null },
      { ...master, state_code: null }
    )).toBe(true);
  });

  it('returns true if state differs but distance is within radius', () => {
    // Distance between Dublin and Kildare is ~50km, within 100km radius
    const masterInKildare = { ...master, state: 'Kildare', state_code: 'KIL', latitude: 53.1589, longitude: -6.9096 };
    expect(isMasterWithinRange(user, masterInKildare, 100)).toBe(true);
  });

  it('returns false if state differs and distance exceeds radius', () => {
    // Distance between Dublin and Cork is ~220km, outside 100km radius
    const masterInCork = { ...master, state: 'Cork', state_code: 'COR', latitude: 51.8985, longitude: -8.4756 };
    expect(isMasterWithinRange(user, masterInCork, 100)).toBe(false);
  });

  it('returns false if state differs and coordinates are missing', () => {
    const masterInCorkNoCoords = { ...master, state: 'Cork', state_code: 'COR', latitude: null, longitude: null };
    expect(isMasterWithinRange(user, masterInCorkNoCoords, 100)).toBe(false);
  });
});

describe('getCurrentPosition', () => {
  it('returns null if window is undefined', async () => {
    const origWindow = global.window;
    // @ts-expect-error test
    delete global.window;

    const result = await getCurrentPosition();
    expect(result).toBeNull();

    global.window = origWindow;
  });

  it('returns null if navigator.geolocation is unavailable', async () => {
    if (global.navigator) {
      Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true });
    }
    const result = await getCurrentPosition();
    expect(result).toBeNull();
  });

  it('resolves with position on success', async () => {
    const mockPosition = { coords: { latitude: 10, longitude: 20 } };
    if (!global.navigator) {
       Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    }
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementation((success: (pos: unknown) => void) => {
          success(mockPosition);
        }),
      },
      configurable: true
    });

    const promise = getCurrentPosition();
    const result = await promise;
    expect(result).toEqual(mockPosition);
  });

  it('resolves with null on error', async () => {
    if (!global.navigator) {
       Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    }
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementation((success: unknown, error: (err: unknown) => void) => {
          error(new Error('User denied'));
        }),
      },
      configurable: true
    });

    const promise = getCurrentPosition();
    const result = await promise;
    expect(result).toBeNull();
  });

  it('resolves with null on timeout', async () => {
    if (!global.navigator) {
       Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    }
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn(), // Never calls success or error
      },
      configurable: true
    });

    const promise = getCurrentPosition();

    // Fast-forward timeout
    jest.runAllTimers();

    const result = await promise;
    expect(result).toBeNull();
  });
});

describe('reverseGeocodeCountry', () => {
  it('returns country and countryCode on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        address: { country: 'Ireland', country_code: 'ie' }
      })
    });

    const result = await reverseGeocodeCountry(53.3498, -6.2603);
    expect(result).toEqual({ country: 'Ireland', countryCode: 'IE' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const urlString = (global.fetch as jest.Mock).mock.calls[0][0];
    const url = new URL(urlString);
    expect(url.hostname).toBe('nominatim.openstreetmap.org');
    expect(url.searchParams.get('lat')).toBe('53.3498');
    expect(url.searchParams.get('lon')).toBe('-6.2603');
  });

  it('returns nulls on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false
    });

    const result = await reverseGeocodeCountry(53.3498, -6.2603);
    expect(result).toEqual({ country: null, countryCode: null });
  });

  it('returns nulls on fetch exception', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await reverseGeocodeCountry(53.3498, -6.2603);
    expect(result).toEqual({ country: null, countryCode: null });
  });

  it('returns nulls if address is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({})
    });

    const result = await reverseGeocodeCountry(53.3498, -6.2603);
    expect(result).toEqual({ country: null, countryCode: null });
  });
});

describe('detectUserLocation', () => {
  it('returns all nulls if geolocation fails', async () => {
    if (!global.navigator) {
       Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    }
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementation((success: unknown, error: (err: unknown) => void) => {
          error(new Error('Denied'));
        }),
      },
      configurable: true
    });

    const result = await detectUserLocation();
    expect(result).toEqual({ latitude: null, longitude: null, country: null, countryCode: null });
  });

  it('returns aggregated location on success', async () => {
    if (!global.navigator) {
       Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    }
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementation((success: (pos: unknown) => void) => {
          success({ coords: { latitude: 53.3498, longitude: -6.2603 } });
        }),
      },
      configurable: true
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        address: { country: 'Ireland', country_code: 'ie' }
      })
    });

    const result = await detectUserLocation();
    expect(result).toEqual({ latitude: 53.3498, longitude: -6.2603, country: 'Ireland', countryCode: 'IE' });
  });
});
