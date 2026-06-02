import { validateFullName } from './validation';

describe('validateFullName', () => {
  it('returns false when name is empty', () => {
    const result = validateFullName('');
    expect(result).toEqual({ valid: false, error: 'Full name is required' });
  });

  it('returns false when name contains only whitespace', () => {
    const result = validateFullName('   ');
    expect(result).toEqual({ valid: false, error: 'Full name is required' });
  });

  it('returns false when name is less than 2 characters after trimming', () => {
    const result = validateFullName(' A ');
    expect(result).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
  });

  it('returns false when name is exactly 1 character', () => {
    const result = validateFullName('A');
    expect(result).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
  });

  it('returns true when name is exactly 2 characters', () => {
    const result = validateFullName('Bo');
    expect(result).toEqual({ valid: true });
  });

  it('returns true when name is valid', () => {
    const result = validateFullName('John Doe');
    expect(result).toEqual({ valid: true });
  });
});
