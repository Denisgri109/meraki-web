import { validateIrishPhone } from './validation';

describe('validateIrishPhone', () => {
  it('should return error for empty or whitespace strings', () => {
    expect(validateIrishPhone('')).toEqual({ valid: false, error: 'Phone number is required' });
    expect(validateIrishPhone('   ')).toEqual({ valid: false, error: 'Phone number is required' });
  });

  describe('valid mobile numbers', () => {
    const validMobiles = [
      '0831234567',
      '+353831234567',
      '00353831234567',
      '831234567', // without leading 0 or prefix
      '0851234567',
      '0861234567',
      '0871234567',
      '0881234567',
      '0891234567',
    ];

    it.each(validMobiles)('validates %s', (phone) => {
      expect(validateIrishPhone(phone)).toEqual({ valid: true });
    });
  });

  describe('valid landline numbers', () => {
    const validLandlines = [
      '01234567', // prefix 1 (Dublin)
      '+3531234567',
      '02123456', // prefix 21 (Cork)
      '04021234', // prefix 402
    ];

    it.each(validLandlines)('validates %s', (phone) => {
      expect(validateIrishPhone(phone)).toEqual({ valid: true });
    });
  });

  describe('invalid mobile numbers', () => {
    const invalidMobiles = [
      '083123456', // too short (8 digits after prefix instead of 9)
      '08312345678', // too long (10 digits after prefix instead of 9)
    ];

    it.each(invalidMobiles)('rejects %s with correct error', (phone) => {
      expect(validateIrishPhone(phone)).toEqual({
        valid: false,
        error: 'Irish mobile numbers must have 9 digits after the prefix',
      });
    });
  });

  describe('invalid landline numbers', () => {
    const invalidLandlines = [
      '012345', // too short (length of cleaned string is 6, which is < 7)
      '012345678901', // too long (length of cleaned string is 11, which is > 10)
    ];

    it.each(invalidLandlines)('rejects %s with correct error', (phone) => {
      expect(validateIrishPhone(phone)).toEqual({
        valid: false,
        error: 'Invalid landline number length',
      });
    });
  });

  describe('entirely invalid numbers', () => {
    const completelyInvalid = [
      '000000000', // prefix 0 is invalid
      '050123456', // prefix 50 is invalid
    ];

    it.each(completelyInvalid)('rejects %s with correct error', (phone) => {
      expect(validateIrishPhone(phone)).toEqual({
        valid: false,
        error: 'Please enter a valid Irish phone number starting with +353',
      });
    });
  });
});
