import { cleanPhoneNumber } from './validation';

describe('cleanPhoneNumber', () => {
  it('should return the same string if it only contains digits', () => {
    expect(cleanPhoneNumber('1234567890')).toBe('1234567890');
    expect(cleanPhoneNumber('0871234567')).toBe('0871234567');
  });

  it('should remove spaces, dashes, and parentheses', () => {
    expect(cleanPhoneNumber('(087) 123-4567')).toBe('0871234567');
    expect(cleanPhoneNumber('087 123 4567')).toBe('0871234567');
    expect(cleanPhoneNumber('087-123-4567')).toBe('0871234567');
  });

  it('should remove the + prefix', () => {
    expect(cleanPhoneNumber('+353871234567')).toBe('353871234567');
    expect(cleanPhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
  });

  it('should remove letters and special characters', () => {
    expect(cleanPhoneNumber('Phone: 087-123-4567!')).toBe('0871234567');
    expect(cleanPhoneNumber('ext 123')).toBe('123');
    expect(cleanPhoneNumber('abc123def')).toBe('123');
    expect(cleanPhoneNumber('!@#$%^&*()123')).toBe('123');
  });

  it('should handle empty strings', () => {
    expect(cleanPhoneNumber('')).toBe('');
    expect(cleanPhoneNumber('   ')).toBe('');
  });
});
