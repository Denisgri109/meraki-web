import { validatePassword } from './validation';

describe('Validation Utilities', () => {
  describe('validatePassword', () => {
    it('returns invalid for empty password', () => {
      const result = validatePassword('');
      expect(result).toEqual({ valid: false, error: 'Password is required' });
    });

    it('returns invalid for password less than 6 characters', () => {
      const result = validatePassword('12345');
      expect(result).toEqual({ valid: false, error: 'Password must be at least 6 characters' });
    });

    it('returns valid for password with exactly 6 characters', () => {
      const result = validatePassword('123456');
      expect(result).toEqual({ valid: true });
    });

    it('returns valid for password with more than 6 characters', () => {
      const result = validatePassword('password123');
      expect(result).toEqual({ valid: true });
    });
  });
});
