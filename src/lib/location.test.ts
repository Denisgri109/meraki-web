import { haversineDistanceKm } from './location';

describe('haversineDistanceKm', () => {
  it('should return 0 when the two points are identical', () => {
    const lat = 40.7128;
    const lon = -74.0060;
    expect(haversineDistanceKm(lat, lon, lat, lon)).toBe(0);
  });

  it('should calculate the distance between New York and Los Angeles correctly', () => {
    // NY: 40.7128° N, 74.0060° W
    const nyLat = 40.7128;
    const nyLon = -74.0060;
    // LA: 34.0522° N, 118.2437° W
    const laLat = 34.0522;
    const laLon = -118.2437;

    const distance = haversineDistanceKm(nyLat, nyLon, laLat, laLon);

    // Distance should be around 3935 km. Allow a small margin of error (e.g., 20km)
    // due to Earth's shape approximation.
    expect(distance).toBeGreaterThan(3915);
    expect(distance).toBeLessThan(3955);
  });

  it('should be commutative (distance from A to B is distance from B to A)', () => {
    const p1Lat = 51.5074; // London
    const p1Lon = -0.1278;
    const p2Lat = 48.8566; // Paris
    const p2Lon = 2.3522;

    const distAB = haversineDistanceKm(p1Lat, p1Lon, p2Lat, p2Lon);
    const distBA = haversineDistanceKm(p2Lat, p2Lon, p1Lat, p1Lon);

    expect(distAB).toBeCloseTo(distBA, 5);
  });

  it('should calculate distance correctly across the equator and prime meridian', () => {
    const p1Lat = 10.0;
    const p1Lon = 10.0;
    const p2Lat = -10.0;
    const p2Lon = -10.0;

    const distance = haversineDistanceKm(p1Lat, p1Lon, p2Lat, p2Lon);
    // Calculated manually or via online calculator: ~3144 km
    expect(distance).toBeGreaterThan(3100);
    expect(distance).toBeLessThan(3200);
  });

  it('should calculate distance for North Pole to South Pole as approx Earth half circumference', () => {
    const npLat = 90.0;
    const npLon = 0.0;
    const spLat = -90.0;
    const spLon = 0.0;

    const distance = haversineDistanceKm(npLat, npLon, spLat, spLon);
    // Approx Earth half circumference = PI * R = ~20015 km
    expect(distance).toBeGreaterThan(19900);
    expect(distance).toBeLessThan(20100);
  });
});
