/**
 * Location API utilities for the web — port of
 * `meraki-MOBILE/src/utils/locationApi.ts`.
 *
 * Uses the CountryStateCity API (https://countrystatecity.in/docs/)
 * with the same API key as the mobile app.
 *
 * Results are cached in sessionStorage to avoid burning through the
 * 100 req/day free-tier limit.
 */

const API_BASE_URL = 'https://api.countrystatecity.in/v1';
const API_KEY = process.env.NEXT_PUBLIC_COUNTRY_STATE_CITY_API_KEY || '';

if (typeof window !== 'undefined' && !API_KEY) {
  console.warn(
    'NEXT_PUBLIC_COUNTRY_STATE_CITY_API_KEY is not set. Country/City dropdowns may not work. ' +
      'Get a free key from https://countrystatecity.in/'
  );
}

/* ─── Types (same as mobile) ─────────────────────────────────── */

export interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phonecode: string;
  capital: string;
  currency: string;
  currency_symbol: string;
  timezones: Array<{
    zoneName: string;
    gmtOffset: number;
    gmtOffsetName: string;
    abbreviation: string;
    tzName: string;
  }>;
}

export interface State {
  id: number;
  name: string;
  iso2: string;
  country_code: string;
  country_id: number;
  latitude: string | null;
  longitude: string | null;
}

export interface LocationApiError {
  status: string;
  message: string;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  state_name: string;
  country_id: number;
  country_code: string;
  country_name: string;
  latitude: string;
  longitude: string;
}

/* ─── Cache helpers (sessionStorage, 24h TTL) ────────────────── */

interface ApiErrorResponse {
  status: 'error';
  message: string;
}

const isApiError = (data: unknown): data is ApiErrorResponse => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'status' in data &&
    (data as Record<string, unknown>).status === 'error' &&
    'message' in data &&
    typeof (data as Record<string, unknown>).message === 'string'
  );
};

const CACHE_PREFIX = 'meraki:csc:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cacheGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // sessionStorage full — ignore
  }
}

const headers: HeadersInit = { 'X-CSCAPI-KEY': API_KEY };

/* ─── API Functions ──────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Helper to fetch location data and handle common errors safely.
 * Returns null on error, and T[] on success (which can be empty).
 */
async function fetchLocationData<T>(url: string, errorContext: string): Promise<T[] | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`[locationApi] Failed to fetch ${errorContext}: status ${res.status}`);
      return null;
    }
    const data: unknown = await res.json();

    // Check for API-level errors
    if (isApiError(data)) {
      console.warn(`[locationApi] API error fetching ${errorContext}: ${data.message}`);
      return null;
    }

    return data as T[];
  } catch (err) {
    console.error(`[locationApi] ${errorContext} error:`, err);
    return null;
  }
}

/** Get all countries (cached). */
export async function getAllCountries(): Promise<Country[]> {
  const cacheKey = 'countries';
  const cached = cacheGet<Country[]>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const promise = fetchLocationData<Country>(`${API_BASE_URL}/countries`, 'countries').then(data => {
    if (data !== null) {
      cacheSet(cacheKey, data);
      return data;
    }
    return [];
  }).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

/** Get all cities in a country (cached per countryCode). */
export async function getCitiesOfCountry(countryCode: string): Promise<City[]> {
  const cacheKey = `cities:${countryCode}`;
  const cached = cacheGet<City[]>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const promise = fetchLocationData<City>(`${API_BASE_URL}/countries/${countryCode}/cities`, `cities for ${countryCode}`).then(data => {
    if (data !== null) {
      cacheSet(cacheKey, data);
      return data;
    }
    return [];
  }).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

/** Get all states in a country (cached). */
export async function getStatesOfCountry(countryCode: string): Promise<State[]> {
  const cacheKey = `states:${countryCode}`;
  const cached = cacheGet<State[]>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const promise = fetchLocationData<State>(`${API_BASE_URL}/countries/${countryCode}/states`, `states for ${countryCode}`).then(data => {
    if (data !== null) {
      cacheSet(cacheKey, data);
      return data;
    }
    return [];
  }).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

/** Get all cities in a state (cached). */
export async function getCitiesOfState(countryCode: string, stateCode: string): Promise<City[]> {
  const cacheKey = `cities:${countryCode}:${stateCode}`;
  const cached = cacheGet<City[]>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const promise = fetchLocationData<City>(`${API_BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`, `cities for state ${stateCode}`).then(data => {
    if (data !== null) {
      cacheSet(cacheKey, data);
      return data;
    }
    return [];
  }).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

/* ─── Client-side search helpers ─────────────────────────────── */

export function filterCountries(countries: Country[], query: string): Country[] {
  const q = query.toLowerCase().trim();
  if (!q) return countries;
  return countries.filter(
    (c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase() === q
  );
}

export function filterCities(cities: City[], query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return cities.slice(0, 50);
  return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 50);
}
