import { getShippingCost } from './shipping';

describe('getShippingCost', () => {
  it('should return the correct shipping cost for a valid country code', () => {
    expect(getShippingCost('GB')).toBe(4.99);
    expect(getShippingCost('DE')).toBe(6.49);
    expect(getShippingCost('FR')).toBe(6.99);
  });

  it('should return 0 for an invalid country code', () => {
    expect(getShippingCost('US')).toBe(0);
    expect(getShippingCost('CA')).toBe(0);
    expect(getShippingCost('XYZ')).toBe(0);
  });

  it('should return 0 for an empty string', () => {
    expect(getShippingCost('')).toBe(0);
  });

  it('should return 0 for undefined/null if bypassed', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getShippingCost(undefined as any)).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getShippingCost(null as any)).toBe(0);
  });
});
