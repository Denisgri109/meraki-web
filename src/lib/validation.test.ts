import { validateFullName } from './validation';

describe('validateFullName', () => {
  it('should return valid: false for an empty string', () => {
    expect(validateFullName('')).toEqual({ valid: false, error: 'Full name is required' });
  });

  it('should return valid: false for a whitespace string', () => {
    expect(validateFullName('   ')).toEqual({ valid: false, error: 'Full name is required' });
  });

  it('should return valid: false for a string with length less than 2', () => {
    expect(validateFullName('a')).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
  });

  it('should return valid: false for a string with length less than 2 after trimming', () => {
    expect(validateFullName(' a ')).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
  });

  it('should return valid: true for a valid full name', () => {
    expect(validateFullName('John Doe')).toEqual({ valid: true });
  });

  it('should return valid: true for a valid short name', () => {
    expect(validateFullName('Bo')).toEqual({ valid: true });
  });

  it('should return valid: true for a valid name with extra whitespace', () => {
    expect(validateFullName('  John Doe  ')).toEqual({ valid: true });
  });
});
