import {
  validateIrishPhone,
  cleanPhoneNumber,
  formatIrishPhone,
  normalizeIrishPhone,
  validateEmail,
  validatePassword,
  validateFullName
} from './validation';

describe('cleanPhoneNumber', () => {
  it('should remove all non-numeric characters', () => {
    expect(cleanPhoneNumber('+353 (87) 123-4567')).toBe('353871234567');
    expect(cleanPhoneNumber('087 123 4567')).toBe('0871234567');
    expect(cleanPhoneNumber('abcd123')).toBe('123');
    expect(cleanPhoneNumber('!@#$%^&*()')).toBe('');
  });
});

describe('validateIrishPhone', () => {
  it('should reject empty or whitespace strings', () => {
    expect(validateIrishPhone('')).toEqual({ valid: false, error: 'Phone number is required' });
    expect(validateIrishPhone('   ')).toEqual({ valid: false, error: 'Phone number is required' });
  });

  describe('Mobile Numbers', () => {
    it('should validate 9-digit mobile numbers starting with standard prefixes (after removing 0/353)', () => {
      // 083 + 7 digits = 10 digits total. Without 0 = 83 + 7 digits = 9 digits.
      expect(validateIrishPhone('0831234567')).toEqual({ valid: true });
      expect(validateIrishPhone('0851234567')).toEqual({ valid: true });
      expect(validateIrishPhone('0861234567')).toEqual({ valid: true });
      expect(validateIrishPhone('0871234567')).toEqual({ valid: true });
      expect(validateIrishPhone('0881234567')).toEqual({ valid: true });
      expect(validateIrishPhone('0891234567')).toEqual({ valid: true });
    });

    it('should validate mobile numbers with country code +353', () => {
      expect(validateIrishPhone('+353871234567')).toEqual({ valid: true });
      expect(validateIrishPhone('353871234567')).toEqual({ valid: true });
      expect(validateIrishPhone('00353871234567')).toEqual({ valid: true });
    });

    it('should reject mobile numbers with incorrect length', () => {
      // 087 + 6 digits
      expect(validateIrishPhone('087123456')).toEqual({ valid: false, error: 'Irish mobile numbers must have 9 digits after the prefix' });
      // 087 + 8 digits
      expect(validateIrishPhone('08712345678')).toEqual({ valid: false, error: 'Irish mobile numbers must have 9 digits after the prefix' });
    });
  });

  describe('Landline Numbers', () => {
    it('should validate landline numbers with valid prefixes', () => {
      // 01 is a Dublin landline prefix, length should be between 7 and 10 after stripping leading 0
      // 1 + 6 digits = 7 digits (valid)
      expect(validateIrishPhone('01234567')).toEqual({ valid: true });
      // 1 + 9 digits = 10 digits (valid)
      expect(validateIrishPhone('01234567890')).toEqual({ valid: true });

      // Cork landline prefix (21)
      expect(validateIrishPhone('021234567')).toEqual({ valid: true });
    });

    it('should validate landline numbers with country code +353', () => {
      expect(validateIrishPhone('+3531234567')).toEqual({ valid: true });
    });

    it('should reject landline numbers with incorrect length', () => {
      // 1 + 5 digits = 6 digits (too short)
      expect(validateIrishPhone('0123456')).toEqual({ valid: false, error: 'Invalid landline number length' });
      // 1 + 10 digits = 11 digits (too long)
      expect(validateIrishPhone('012345678901')).toEqual({ valid: false, error: 'Invalid landline number length' });
    });
  });

  describe('Invalid Prefixes', () => {
    it('should reject numbers that do not match mobile or landline prefixes', () => {
      // 03 is not a valid prefix
      expect(validateIrishPhone('031234567')).toEqual({ valid: false, error: 'Please enter a valid Irish phone number starting with +353' });
    });
  });
});

describe('formatIrishPhone', () => {
  it('should return empty string for empty input', () => {
    expect(formatIrishPhone('')).toBe('');
    expect(formatIrishPhone('  ')).toBe('');
  });

  it('should format 9-digit mobile numbers with spaces', () => {
    expect(formatIrishPhone('0871234567')).toBe('+353 87 123 4567');
    expect(formatIrishPhone('+353871234567')).toBe('+353 87 123 4567');
  });

  it('should format landlines or non-mobile numbers without spaces (basic prepend)', () => {
    expect(formatIrishPhone('01234567')).toBe('+353 1234567');
  });

  it('should return original phone number if cleaned length is < 7', () => {
    expect(formatIrishPhone('1234')).toBe('1234');
  });
});

describe('normalizeIrishPhone', () => {
  it('should normalize valid mobile numbers to +353 format', () => {
    expect(normalizeIrishPhone('0871234567')).toBe('+353871234567');
    expect(normalizeIrishPhone('+353 87 123 4567')).toBe('+353871234567');
  });

  it('should return empty string for invalid numbers', () => {
    expect(normalizeIrishPhone('031234567')).toBe(''); // invalid prefix
    expect(normalizeIrishPhone('08712')).toBe(''); // too short
  });
});

describe('validateEmail', () => {
  it('should reject empty or whitespace strings', () => {
    expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
    expect(validateEmail('  ')).toEqual({ valid: false, error: 'Email is required' });
  });

  it('should validate correct emails', () => {
    expect(validateEmail('test@example.com')).toEqual({ valid: true });
    expect(validateEmail('a.b@c.co.uk')).toEqual({ valid: true });
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('test')).toEqual({ valid: false, error: 'Please enter a valid email address' });
    expect(validateEmail('test@')).toEqual({ valid: false, error: 'Please enter a valid email address' });
    expect(validateEmail('test@example')).toEqual({ valid: false, error: 'Please enter a valid email address' });
    expect(validateEmail('test example.com')).toEqual({ valid: false, error: 'Please enter a valid email address' });
  });
});

describe('validatePassword', () => {
  it('should reject empty strings', () => {
    expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
  });

  it('should reject passwords shorter than 6 characters', () => {
    expect(validatePassword('12345')).toEqual({ valid: false, error: 'Password must be at least 6 characters' });
  });

  it('should validate passwords of 6 or more characters', () => {
    expect(validatePassword('123456')).toEqual({ valid: true });
    expect(validatePassword('password123')).toEqual({ valid: true });
  });
});

describe('validateFullName', () => {
  it('should reject empty or whitespace strings', () => {
    expect(validateFullName('')).toEqual({ valid: false, error: 'Full name is required' });
    expect(validateFullName('  ')).toEqual({ valid: false, error: 'Full name is required' });
  });

  it('should reject names shorter than 2 characters (after trim)', () => {
    expect(validateFullName('A')).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
    expect(validateFullName(' A ')).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
  });

  it('should validate names of 2 or more characters', () => {
    expect(validateFullName('Ab')).toEqual({ valid: true });
    expect(validateFullName('John Doe')).toEqual({ valid: true });
  });
});
