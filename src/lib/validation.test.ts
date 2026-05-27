import { formatIrishPhone } from './validation';

describe('formatIrishPhone', () => {
  it('should return an empty string when given an empty string', () => {
    expect(formatIrishPhone('')).toBe('');
  });

  it('should return an empty string when given a string with only spaces', () => {
    expect(formatIrishPhone('   ')).toBe('');
  });

  it('should return an empty string when given null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatIrishPhone(null as any)).toBe('');
  });

  it('should return an empty string when given undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatIrishPhone(undefined as any)).toBe('');
  });
});
