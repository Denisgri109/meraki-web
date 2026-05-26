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

/** Get all countries (cached). */
export async function getAllCountries(): Promise<Country[]> {
  const cached = cacheGet<Country[]>('countries');
  if (cached) return cached;
  try {
    const res = await fetch(`${API_BASE_URL}/countries`, { headers });
    if (!res.ok) {
      console.warn(`[locationApi] Failed to fetch countries: status ${res.status}`);
      return [];
    }
    const data: Country[] = await res.json();
    if (data && 'status' in data && (data as any).status === 'error') {
      console.warn(`[locationApi] API error fetching countries: ${(data as any).message}`);
      return [];
    }
    cacheSet('countries', data);
    return data;
  } catch (err) {
    console.error('[locationApi] getAllCountries error:', err);
    return [];
  }
}

/** Get all cities in a country (cached per countryCode). */
export async function getCitiesOfCountry(countryCode: string): Promise<City[]> {
  const cacheKey = `cities:${countryCode}`;
  const cached = cacheGet<City[]>(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch(`${API_BASE_URL}/countries/${countryCode}/cities`, { headers });
    if (!res.ok) {
      console.warn(`[locationApi] Failed to fetch cities for ${countryCode}: status ${res.status}`);
      return [];
    }
    const data: City[] = await res.json();
    if (data && 'status' in data && (data as any).status === 'error') {
      console.warn(`[locationApi] API error fetching cities: ${(data as any).message}`);
      return [];
    }
    cacheSet(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[locationApi] getCitiesOfCountry error:', err);
    return [];
  }
}

/** Get all states in a country (cached). */
export async function getStatesOfCountry(countryCode: string): Promise<State[]> {
  const cacheKey = `states:${countryCode}`;
  const cached = cacheGet<State[]>(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch(`${API_BASE_URL}/countries/${countryCode}/states`, { headers });
    if (!res.ok) {
      console.warn(`[locationApi] Failed to fetch states for ${countryCode}: status ${res.status}`);
      return [];
    }
    const data: State[] = await res.json();
    if (data && 'status' in data && (data as any).status === 'error') {
      console.warn(`[locationApi] API error fetching states: ${(data as any).message}`);
      return [];
    }
    cacheSet(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[locationApi] getStatesOfCountry error:', err);
    return [];
  }
}

/** Get all cities in a state (cached). */
export async function getCitiesOfState(countryCode: string, stateCode: string): Promise<City[]> {
  const cacheKey = `cities:${countryCode}:${stateCode}`;
  const cached = cacheGet<City[]>(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch(`${API_BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`, { headers });
    if (!res.ok) {
      console.warn(`[locationApi] Failed to fetch cities for state ${stateCode}: status ${res.status}`);
      return [];
    }
    const data: City[] = await res.json();
    if (data && 'status' in data && (data as any).status === 'error') {
      console.warn(`[locationApi] API error fetching cities of state: ${(data as any).message}`);
      return [];
    }
    cacheSet(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[locationApi] getCitiesOfState error:', err);
    return [];
  }
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
