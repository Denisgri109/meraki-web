import { formatIrishPhone } from './validation';

describe('Validation utilities', () => {
  describe('formatIrishPhone', () => {
    it('returns empty string for empty input', () => {
      expect(formatIrishPhone('')).toBe('');
      expect(formatIrishPhone('   ')).toBe('');
      // @ts-expect-error testing invalid input
      expect(formatIrishPhone(null)).toBe('');
      // @ts-expect-error testing invalid input
      expect(formatIrishPhone(undefined)).toBe('');
    });

    it('returns original input if cleaned length is less than 7', () => {
      expect(formatIrishPhone('123456')).toBe('123456');
      expect(formatIrishPhone('083123')).toBe('083123'); // 83123 is len 5 < 7
    });

    it('formats mobile number starting with 08', () => {
      expect(formatIrishPhone('0831234567')).toBe('+353 83 123 4567');
      expect(formatIrishPhone('0851234567')).toBe('+353 85 123 4567');
      expect(formatIrishPhone('0861234567')).toBe('+353 86 123 4567');
      expect(formatIrishPhone('0871234567')).toBe('+353 87 123 4567');
      expect(formatIrishPhone('0881234567')).toBe('+353 88 123 4567');
      expect(formatIrishPhone('0891234567')).toBe('+353 89 123 4567');
    });

    it('formats mobile number starting with 353', () => {
      expect(formatIrishPhone('353831234567')).toBe('+353 83 123 4567');
    });

    it('formats mobile number starting with 00353', () => {
      expect(formatIrishPhone('00353831234567')).toBe('+353 83 123 4567');
    });

    it('formats mobile number starting with +353', () => {
      expect(formatIrishPhone('+353831234567')).toBe('+353 83 123 4567');
    });

    it('formats landline number', () => {
      expect(formatIrishPhone('01234567')).toBe('+353 1234567');
      expect(formatIrishPhone('0212345678')).toBe('+353 212345678');
    });

    it('formats landline number starting with 353', () => {
      expect(formatIrishPhone('3531234567')).toBe('+353 1234567');
    });

    it('handles non-numeric characters in mobile numbers', () => {
      expect(formatIrishPhone('083-123-4567')).toBe('+353 83 123 4567');
      expect(formatIrishPhone('(083) 123 4567')).toBe('+353 83 123 4567');
      expect(formatIrishPhone('083 123 4567')).toBe('+353 83 123 4567');
    });

    it('handles mobile prefix but wrong length', () => {
      // 8 digits after prefix instead of 9 total (2+7)
      expect(formatIrishPhone('08312345678')).toBe('+353 8312345678');
      expect(formatIrishPhone('08312345')).toBe('+353 8312345');
    });
  });
});
