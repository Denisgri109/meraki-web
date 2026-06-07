import { validateFullName } from './validation';

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
