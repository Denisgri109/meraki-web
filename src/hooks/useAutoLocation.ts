'use client';

/**
 * useAutoLocation
 *
 * Web counterpart of `meraki-MOBILE/src/hooks/useAutoLocation.ts`.
 * Once per signed-in profile, asks the browser for a single GPS reading,
 * reverse-geocodes the country with Nominatim, and persists
 * `latitude` / `longitude` / `country` / `country_code` on the user's profile
 * so the radius-based master / service filter on booking, discover, etc.
 * has stable values across reloads.
 *
 * The hook does nothing if:
 *   - the user is not signed in,
 *   - the profile already has both `latitude` and `longitude`,
 *   - the browser blocks geolocation (no toast — we silently fall back to
 *     whatever country/coords are already on the profile).
 *
 * Returns `isLocationMissing` when the profile has no country set
 * (after auto-detect attempt), so the dashboard can gate the user.
 */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { detectUserLocation } from '@/lib/location';

const supabase = createClient();

export function useAutoLocation() {
  const { profile, refreshProfile } = useAuth();
  const ranForId = useRef<string | null>(null);
  const [isLocationMissing, setIsLocationMissing] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    // Run at most once per profile id per page lifetime.
    if (ranForId.current === profile.id) return;
    ranForId.current = profile.id;

    const lat = (profile as Record<string, unknown>).latitude as number | null | undefined;
    const lng = (profile as Record<string, unknown>).longitude as number | null | undefined;
    const country = (profile as Record<string, unknown>).country as string | null | undefined;
    const city = (profile as Record<string, unknown>).city as string | null | undefined;

    // Nothing to do if the profile is already fully located.
    if (lat != null && lng != null && country) {
      setIsLocationMissing(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const detected = await detectUserLocation();
      if (cancelled) return;

      const updates: Record<string, unknown> = {};
      if (detected.latitude != null && detected.longitude != null) {
        if (lat == null) updates.latitude = detected.latitude;
        if (lng == null) updates.longitude = detected.longitude;
      }
      if (!country && detected.country) {
        updates.country = detected.country;
      }
      if (detected.countryCode) {
        const existingCode = (profile as Record<string, unknown>).country_code as
          | string
          | null
          | undefined;
        if (!existingCode) updates.country_code = detected.countryCode;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', profile.id);

        if (error) {
          console.warn('[useAutoLocation] profile update failed:', error.message);
        } else {
          try {
            await refreshProfile?.();
          } catch (e) {
            console.warn('[useAutoLocation] refreshProfile failed:', e);
          }
        }
      }

      // After auto-detect, gate the dashboard until the user has fully set up
      // their location (country must be present AND they've been through the
      // modal once, so state/region is captured for radius filtering).
      const finalCountry = country || (updates.country as string | undefined);
      const setupDone =
        ((profile as Record<string, unknown>).location_setup_completed as boolean | null | undefined) === true;
      if (!finalCountry || !setupDone) {
        setIsLocationMissing(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, refreshProfile]);

  const onLocationSaved = () => {
    setIsLocationMissing(false);
  };

  return { isLocationMissing, onLocationSaved };
}
