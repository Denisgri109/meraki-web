import { isMasterWithinRange } from './location';

describe('isMasterWithinRange', () => {
  describe('Country and State Matches', () => {
    it('returns true when user and master are in the same country and state name', () => {
      const user = { country: 'IE', state: 'Dublin' };
      const master = { country: 'ie', state: 'dublin' };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('returns true when user and master are in the same country and state code', () => {
      const user = { country: 'US', state_code: 'CA' };
      const master = { country: 'us', state_code: 'ca' };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('returns true when user has no state info (only country matters)', () => {
      const user = { country: 'IE' };
      const master = { country: 'IE', state: 'Cork' };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('returns false when user and master are in different countries', () => {
      const user = { country: 'IE', state: 'Dublin' };
      const master = { country: 'UK', state: 'London' };
      expect(isMasterWithinRange(user, master)).toBe(false);
    });

    it('returns false when country is missing', () => {
      const user1 = { country: null, state: 'Dublin' };
      const master1 = { country: 'IE', state: 'Dublin' };
      expect(isMasterWithinRange(user1, master1)).toBe(false);

      const user2 = { country: 'IE', state: 'Dublin' };
      const master2 = { country: null, state: 'Dublin' };
      expect(isMasterWithinRange(user2, master2)).toBe(false);
    });
  });

  describe('Haversine Distance Fallback', () => {
    // Dublin: ~53.3498, -6.2603
    // Kildare: ~53.1583, -6.9095
    // Distance is roughly 48km

    const dublinCoords = { latitude: 53.3498, longitude: -6.2603 };
    const kildareCoords = { latitude: 53.1583, longitude: -6.9095 };
    // Galway: ~53.2707, -9.0568
    // Distance from Dublin is roughly 185km
    const galwayCoords = { latitude: 53.2707, longitude: -9.0568 };

    it('returns true when different states, same country, within default 100km radius', () => {
      const user = { country: 'IE', state: 'Dublin', ...dublinCoords };
      const master = { country: 'IE', state: 'Kildare', ...kildareCoords };
      expect(isMasterWithinRange(user, master)).toBe(true);
    });

    it('returns false when different states, same country, outside default 100km radius', () => {
      const user = { country: 'IE', state: 'Dublin', ...dublinCoords };
      const master = { country: 'IE', state: 'Galway', ...galwayCoords };
      expect(isMasterWithinRange(user, master)).toBe(false);
    });

    it('returns true when different states, same country, within custom radius', () => {
      const user = { country: 'IE', state: 'Dublin', ...dublinCoords };
      const master = { country: 'IE', state: 'Galway', ...galwayCoords };
      // 200km radius should cover Dublin to Galway
      expect(isMasterWithinRange(user, master, 200)).toBe(true);
    });

    it('returns false when different states, same country, missing coordinates', () => {
      const user = { country: 'IE', state: 'Dublin', ...dublinCoords };
      const master = { country: 'IE', state: 'Kildare' }; // missing coords
      expect(isMasterWithinRange(user, master)).toBe(false);
    });
  });
});
