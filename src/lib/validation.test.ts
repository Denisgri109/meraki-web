import { validatePassword } from './validation';

describe('validatePassword', () => {
  it('returns invalid when password is empty', () => {
    expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
  });

  it('returns invalid when password length is less than 6', () => {
    expect(validatePassword('12345')).toEqual({ valid: false, error: 'Password must be at least 6 characters' });
  });

  it('returns valid when password length is exactly 6', () => {
    expect(validatePassword('123456')).toEqual({ valid: true });
  });

  it('returns valid when password length is greater than 6', () => {
    expect(validatePassword('1234567')).toEqual({ valid: true });
    expect(validatePassword('a_very_long_and_secure_password_123')).toEqual({ valid: true });
  });
});
