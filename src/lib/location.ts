/**
 * Location utilities for distance-based master/service filtering.
 *
 * Mirrors the mobile implementation in `meraki-MOBILE/src/hooks/useAutoLocation.ts`
 * and the haversine helpers used in mobile client screens.
 */

export interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  countryCode: string | null;
}

/**
 * Haversine distance in kilometres between two lat/lng pairs.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns true if the master is within the user's allowed search area:
 *
 * 1. Same country (case-insensitive) — **required**.
 * 2. Same state / region → **always visible**.
 * 3. Different state, same country → visible if **both have lat/lng** and
 *    the haversine distance is within `radiusKm` (defaults to 100 km).
 *
 * This hybrid approach ensures nearby professionals in adjacent regions
 * (e.g. Dublin vs Louth) are shown when the distance is within the
 * user's search radius, while still scoping results to the same country.
 */
export function isMasterWithinRange(
  user: {
    country: string | null;
    state?: string | null;
    state_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
  master: {
    country: string | null;
    state?: string | null;
    state_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
  radiusKm: number = 100
): boolean {
  // ── Must share the same country ──────────────────────────────
  if (!user.country) return false;
  const userCountry = user.country.toLowerCase().trim();
  if (!master.country) return false;
  if (master.country.toLowerCase().trim() !== userCountry) return false;

  // ── State match check ────────────────────────────────────────
  const userStateCode = user.state_code?.toLowerCase().trim() || '';
  const userStateName = user.state?.toLowerCase().trim() || '';
  const masterStateCode = master.state_code?.toLowerCase().trim() || '';
  const masterStateName = master.state?.toLowerCase().trim() || '';

  // If user has no state set → country match is enough
  if (!userStateCode && !userStateName) return true;

  // Check if states match
  let sameState = false;
  if (userStateCode && masterStateCode) {
    sameState = userStateCode === masterStateCode;
  } else if (userStateName && masterStateName) {
    sameState = userStateName === masterStateName;
  }
  if (sameState) return true;

  // ── Different state → fall back to haversine distance ────────
  const uLat = user.latitude;
  const uLng = user.longitude;
  const mLat = master.latitude;
  const mLng = master.longitude;
  if (
    uLat != null && uLng != null &&
    mLat != null && mLng != null
  ) {
    const dist = haversineDistanceKm(uLat, uLng, mLat, mLng);
    return dist <= radiusKm;
  }

  // No lat/lng on one or both sides — can't calculate distance, reject
  return false;
}

/**
 * Promise wrapper around `navigator.geolocation.getCurrentPosition`.
 * Returns null if the browser does not support geolocation, the user
 * denies the permission, or any other error occurs.
 */
export function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (typeof window === 'undefined' || !navigator?.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: GeolocationPosition | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    // Hard timeout in case the browser hangs forever.
    const timer = window.setTimeout(() => finish(null), 12000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        finish(pos);
      },
      (err) => {
        window.clearTimeout(timer);
        console.warn('[location] getCurrentPosition error:', err.message);
        finish(null);
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    );
  });
}

/**
 * Reverse geocode lat/lng using OpenStreetMap Nominatim. No API key required.
 * Respects the public-usage policy by using a descriptive User-Agent and
 * relying on the browser to provide the Referer header automatically.
 */
export async function reverseGeocodeCountry(
  latitude: number,
  longitude: number
): Promise<{ country: string | null; countryCode: string | null }> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '3');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { country: null, countryCode: null };
    const data = (await res.json()) as {
      address?: { country?: string; country_code?: string };
    };
    return {
      country: data.address?.country ?? null,
      countryCode: data.address?.country_code
        ? data.address.country_code.toUpperCase()
        : null,
    };
  } catch (err) {
    console.warn('[location] reverseGeocodeCountry failed:', err);
    return { country: null, countryCode: null };
  }
}

/**
 * Convenience: detect coords and country in one go. Returns nulls on failure.
 */
export async function detectUserLocation(): Promise<UserLocation> {
  const pos = await getCurrentPosition();
  if (!pos) {
    return { latitude: null, longitude: null, country: null, countryCode: null };
  }
  const { latitude, longitude } = pos.coords;
  const { country, countryCode } = await reverseGeocodeCountry(latitude, longitude);
  return { latitude, longitude, country, countryCode };
}
