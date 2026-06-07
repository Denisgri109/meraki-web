import { validatePassword } from './validation';

describe('validatePassword', () => {
  it('should return valid: false with error when password is empty', () => {
    expect(validatePassword('')).toEqual({
      valid: false,
      error: 'Password is required'
    });
  });

  it('should return valid: false with error when password is less than 6 characters', () => {
    expect(validatePassword('12345')).toEqual({
      valid: false,
      error: 'Password must be at least 6 characters'
    });

    expect(validatePassword('1')).toEqual({
      valid: false,
      error: 'Password must be at least 6 characters'
    });
  });

  it('should return valid: true when password is exactly 6 characters', () => {
    expect(validatePassword('123456')).toEqual({
      valid: true
    });
  });

  it('should return valid: true when password is more than 6 characters', () => {
    expect(validatePassword('1234567')).toEqual({
      valid: true
    });

    expect(validatePassword('longpassword123')).toEqual({
      valid: true
    });
  });
});
