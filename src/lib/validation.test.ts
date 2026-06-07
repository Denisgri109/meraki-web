import {
  cleanPhoneNumber,
  validateIrishPhone,
  formatIrishPhone,
  normalizeIrishPhone,
  validateEmail,
  validatePassword,
  validateFullName,
} from './validation';

describe('validation utilities', () => {
  describe('cleanPhoneNumber', () => {
    it('removes spaces and non-numeric characters', () => {
      expect(cleanPhoneNumber('087 123 4567')).toBe('0871234567');
      expect(cleanPhoneNumber('+353 87 123 4567')).toBe('353871234567');
      expect(cleanPhoneNumber('abc 123 def')).toBe('123');
    });

    it('returns an empty string if only non-numeric characters are present', () => {
      expect(cleanPhoneNumber('abcd')).toBe('');
    });
  });

  describe('validateIrishPhone', () => {
    it('returns an error if phone is empty or only whitespace', () => {
      expect(validateIrishPhone('')).toEqual({ valid: false, error: 'Phone number is required' });
      expect(validateIrishPhone('   ')).toEqual({ valid: false, error: 'Phone number is required' });
    });

    it('validates correct Irish mobile numbers', () => {
      expect(validateIrishPhone('0871234567')).toEqual({ valid: true });
      expect(validateIrishPhone('+353871234567')).toEqual({ valid: true });
      expect(validateIrishPhone('00353871234567')).toEqual({ valid: true });
    });

    it('returns an error for Irish mobile numbers with incorrect length', () => {
      expect(validateIrishPhone('087123456')).toEqual({ valid: false, error: 'Irish mobile numbers must have 9 digits after the prefix' });
      expect(validateIrishPhone('08712345678')).toEqual({ valid: false, error: 'Irish mobile numbers must have 9 digits after the prefix' });
    });

    it('validates correct Irish landline numbers', () => {
      expect(validateIrishPhone('01234567')).toEqual({ valid: true });
      expect(validateIrishPhone('+3531234567')).toEqual({ valid: true });
    });

    it('returns an error for Irish landline numbers with incorrect length', () => {
      expect(validateIrishPhone('012345')).toEqual({ valid: false, error: 'Invalid landline number length' });
      expect(validateIrishPhone('012345678901')).toEqual({ valid: false, error: 'Invalid landline number length' });
    });

    it('returns an error for numbers that are neither Irish mobile nor landline', () => {
      expect(validateIrishPhone('0001234567')).toEqual({ valid: false, error: 'Please enter a valid Irish phone number starting with +353' });
    });
  });

  describe('formatIrishPhone', () => {
    it('returns empty string for empty input', () => {
      expect(formatIrishPhone('')).toBe('');
      expect(formatIrishPhone('   ')).toBe('');
    });

    it('formats a valid 9-digit mobile number', () => {
      expect(formatIrishPhone('0871234567')).toBe('+353 87 123 4567');
      expect(formatIrishPhone('+353871234567')).toBe('+353 87 123 4567');
      expect(formatIrishPhone('00353871234567')).toBe('+353 87 123 4567');
    });

    it('returns formatted string without spacing if mobile number length is incorrect', () => {
      expect(formatIrishPhone('087123456')).toBe('+353 87123456');
    });

    it('returns formatted string without spacing for landlines', () => {
      expect(formatIrishPhone('01234567')).toBe('+353 1234567');
    });

    it('returns original string if cleaned length is less than 7', () => {
      expect(formatIrishPhone('123456')).toBe('123456');
    });
  });

  describe('normalizeIrishPhone', () => {
    it('returns normalized number starting with +353 for valid input', () => {
      expect(normalizeIrishPhone('0871234567')).toBe('+353871234567');
      expect(normalizeIrishPhone('+353871234567')).toBe('+353871234567');
      expect(normalizeIrishPhone('00353871234567')).toBe('+353871234567');
      expect(normalizeIrishPhone('01234567')).toBe('+3531234567');
    });

    it('returns empty string if validation fails', () => {
      expect(normalizeIrishPhone('0001234567')).toBe('');
      expect(normalizeIrishPhone('087123456')).toBe(''); // wrong length mobile
    });
  });

  describe('validateEmail', () => {
    it('returns an error if email is empty or only whitespace', () => {
      expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
      expect(validateEmail('   ')).toEqual({ valid: false, error: 'Email is required' });
    });

    it('returns an error for invalid email formats', () => {
      expect(validateEmail('invalid-email')).toEqual({ valid: false, error: 'Please enter a valid email address' });
      expect(validateEmail('invalid@domain')).toEqual({ valid: false, error: 'Please enter a valid email address' });
      expect(validateEmail('invalid@domain.')).toEqual({ valid: false, error: 'Please enter a valid email address' });
      expect(validateEmail('@domain.com')).toEqual({ valid: false, error: 'Please enter a valid email address' });
    });

    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toEqual({ valid: true });
      expect(validateEmail('test.name+alias@example.co.uk')).toEqual({ valid: true });
    });
  });

  describe('validatePassword', () => {
    it('returns an error if password is empty', () => {
      expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
    });

    it('returns an error if password is less than 6 characters', () => {
      expect(validatePassword('12345')).toEqual({ valid: false, error: 'Password must be at least 6 characters' });
    });

    it('validates correct passwords', () => {
      expect(validatePassword('123456')).toEqual({ valid: true });
      expect(validatePassword('strongpassword')).toEqual({ valid: true });
    });
  });

  describe('validateFullName', () => {
    it('returns an error if full name is empty or only whitespace', () => {
      expect(validateFullName('')).toEqual({ valid: false, error: 'Full name is required' });
      expect(validateFullName('   ')).toEqual({ valid: false, error: 'Full name is required' });
    });

    it('returns an error if full name is less than 2 characters (excluding whitespace)', () => {
      expect(validateFullName('A')).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
      expect(validateFullName(' A ')).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
    });

    it('validates correct full names', () => {
      expect(validateFullName('John Doe')).toEqual({ valid: true });
      expect(validateFullName('Jo')).toEqual({ valid: true });
    });
  });
});
