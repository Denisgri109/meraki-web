import { validateEmail } from './validation';

describe('validateEmail', () => {
  it('should return valid for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toEqual({ valid: true });
    expect(validateEmail('user.name+tag+sorting@example.com')).toEqual({ valid: true });
    expect(validateEmail('x@example.com')).toEqual({ valid: true });
    expect(validateEmail('example-indeed@strange-example.com')).toEqual({ valid: true });
    expect(validateEmail('example@s.example')).toEqual({ valid: true });
  });

  it('should return error if email is empty, null, or undefined', () => {
    expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
    expect(validateEmail('   ')).toEqual({ valid: false, error: 'Email is required' });
    // @ts-expect-error - testing runtime behaviour with invalid types
    expect(validateEmail(null)).toEqual({ valid: false, error: 'Email is required' });
    // @ts-expect-error - testing runtime behaviour with invalid types
    expect(validateEmail(undefined)).toEqual({ valid: false, error: 'Email is required' });
  });

  it('should return error for invalid email addresses', () => {
    const errorMsg = 'Please enter a valid email address';

    // Missing @
    expect(validateEmail('Abc.example.com')).toEqual({ valid: false, error: errorMsg });
    // Missing domain part after @
    expect(validateEmail('A@')).toEqual({ valid: false, error: errorMsg });
    // Missing domain part before .
    expect(validateEmail('A@.com')).toEqual({ valid: false, error: errorMsg });
    // Multiple @
    expect(validateEmail('A@b@c@example.com')).toEqual({ valid: false, error: errorMsg });
    // Spaces inside
    expect(validateEmail('this is not allowed@example.com')).toEqual({ valid: false, error: errorMsg });
    expect(validateEmail('with space @example.com')).toEqual({ valid: false, error: errorMsg });
    expect(validateEmail('with@space .com')).toEqual({ valid: false, error: errorMsg });
    // Missing .
    expect(validateEmail('admin@mailserver1')).toEqual({ valid: false, error: errorMsg });
  });
});
