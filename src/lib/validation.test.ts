import {
  validateFullName,
  validateIrishPhone,
  validatePhone,
  normalizePhone,
  formatPhone,
  parsePhoneNumber
} from './validation';

describe('validateFullName', () => {
  it('should return valid true for a valid full name', () => {
    expect(validateFullName('John Doe')).toEqual({ valid: true });
    expect(validateFullName('A B')).toEqual({ valid: true });
    expect(validateFullName('AB')).toEqual({ valid: true });
  });

  it('should return error when name is empty', () => {
    expect(validateFullName('')).toEqual({
      valid: false,
      error: 'Full name is required',
    });
  });

  it('should return error when name contains only whitespace', () => {
    expect(validateFullName('   ')).toEqual({
      valid: false,
      error: 'Full name is required',
    });
  });

  it('should return error when name is shorter than 2 characters after trimming', () => {
    expect(validateFullName('A')).toEqual({
      valid: false,
      error: 'Name must be at least 2 characters',
    });

    expect(validateFullName(' A ')).toEqual({
      valid: false,
      error: 'Name must be at least 2 characters',
    });
  });
});

describe('parsePhoneNumber', () => {

  it('should reject invalid characters', () => {
    expect(parsePhoneNumber('<script>alert(1)</script>123')).toEqual({
      countryCode: 'IE',
      localNumber: '',
    });
    expect(parsePhoneNumber('invalid_phone')).toEqual({
      countryCode: 'IE',
      localNumber: '',
    });
  });

  it('should reject strings that are too long', () => {
    const longString = '1'.repeat(51);
    expect(parsePhoneNumber(longString)).toEqual({
      countryCode: 'IE',
      localNumber: '',
    });
  });
  it('should parse country calling codes correctly', () => {
    expect(parsePhoneNumber('+353871234567')).toEqual({
      countryCode: 'IE',
      localNumber: '871234567',
    });
    expect(parsePhoneNumber('+447700900000')).toEqual({
      countryCode: 'GB',
      localNumber: '7700900000',
    });
    expect(parsePhoneNumber('0012015550123')).toEqual({
      countryCode: 'US',
      localNumber: '2015550123',
    });
  });

  it('should fallback to IE if no country calling code is matched', () => {
    expect(parsePhoneNumber('0871234567')).toEqual({
      countryCode: 'IE',
      localNumber: '871234567',
    });
  });
});

describe('validatePhone', () => {

  it('should reject numbers with invalid characters', () => {
    expect(validatePhone('<script>alert(1)</script>123', 'IE')).toEqual({
      valid: false,
      error: 'Phone number contains invalid characters or is too long',
    });
    expect(validatePhone('abc1234567', 'IE')).toEqual({
      valid: false,
      error: 'Phone number contains invalid characters or is too long',
    });
  });

  it('should reject strings that are too long', () => {
    const longString = '1'.repeat(51);
    expect(validatePhone(longString, 'IE')).toEqual({
      valid: false,
      error: 'Phone number contains invalid characters or is too long',
    });
  });
  it('should validate Irish phone numbers correctly', () => {
    expect(validatePhone('871234567', 'IE')).toEqual({ valid: true });
    expect(validatePhone('0871234567', 'IE')).toEqual({ valid: true });
    expect(validatePhone('123456', 'IE').valid).toBe(false);
  });

  it('should validate US phone numbers correctly', () => {
    expect(validatePhone('2015550123', 'US')).toEqual({ valid: true });
    expect(validatePhone('12015550123', 'US')).toEqual({ valid: true });
    expect(validatePhone('12345', 'US').valid).toBe(false);
  });

  it('should validate UK phone numbers correctly', () => {
    expect(validatePhone('7700900000', 'GB')).toEqual({ valid: true });
    expect(validatePhone('2079460192', 'GB')).toEqual({ valid: true });
    expect(validatePhone('07700900000', 'GB')).toEqual({ valid: true });
    expect(validatePhone('12345', 'GB').valid).toBe(false);
  });

  it('should validate numbers with international prefix', () => {
    expect(validatePhone('+353899589076', 'IE')).toEqual({ valid: true });
    expect(validatePhone('+447700900000', 'GB')).toEqual({ valid: true });
    expect(validatePhone('+12015550123', 'US')).toEqual({ valid: true });
  });
});

describe('normalizePhone', () => {
  it('should normalize valid numbers with calling code prefix', () => {
    expect(normalizePhone('871234567', 'IE')).toBe('+353871234567');
    expect(normalizePhone('2015550123', 'US')).toBe('+12015550123');
    expect(normalizePhone('7700900000', 'GB')).toBe('+447700900000');
  });

  it('should return empty string for invalid numbers', () => {
    expect(normalizePhone('12345', 'IE')).toBe('');
  });
});

describe('formatPhone', () => {
  it('should format local numbers based on country rules', () => {
    expect(formatPhone('871234567', 'IE')).toBe('87 123 4567');
    expect(formatPhone('2015550123', 'US')).toBe('(201) 555-0123');
    expect(formatPhone('7700900000', 'GB')).toBe('7700 900000');
  });
});

describe('validateIrishPhone', () => {
  it('should return error when phone is empty', () => {
    expect(validateIrishPhone('')).toEqual({ valid: false, error: 'Phone number is required' });
    expect(validateIrishPhone('   ')).toEqual({ valid: false, error: 'Phone number is required' });
  });

  it('should return error for non-Irish numbers', () => {
    expect(validateIrishPhone('+447700900000')).toEqual({
      valid: false,
      error: 'Please enter a valid Irish phone number starting with +353',
    });
    expect(validateIrishPhone('+12015550123')).toEqual({
      valid: false,
      error: 'Please enter a valid Irish phone number starting with +353',
    });
  });

  it('should return valid for valid local Irish numbers', () => {
    expect(validateIrishPhone('0871234567')).toEqual({ valid: true });
    expect(validateIrishPhone('871234567')).toEqual({ valid: true });
    expect(validateIrishPhone('01234567')).toEqual({ valid: true }); // Landline
  });

  it('should return valid for valid international Irish numbers', () => {
    expect(validateIrishPhone('+353871234567')).toEqual({ valid: true });
    expect(validateIrishPhone('00353871234567')).toEqual({ valid: true });
  });

  it('should return error for invalid length Irish numbers', () => {
    expect(validateIrishPhone('08712').valid).toBe(false);
    expect(validateIrishPhone('+3538712').valid).toBe(false);
    expect(validateIrishPhone('087123456789').valid).toBe(false);
  });
});
