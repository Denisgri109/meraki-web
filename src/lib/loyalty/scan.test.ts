import { parseScanCode, isUuid, shouldDebounceScan } from './scan';

describe('scan utils', () => {
  describe('isUuid', () => {
    it('returns true for valid UUIDs', () => {
      expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('returns false for invalid UUIDs', () => {
      expect(isUuid('invalid-uuid')).toBe(false);
      expect(isUuid('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isUuid('')).toBe(false);
    });
  });

  describe('parseScanCode', () => {
    it('parses valid stamp code', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = parseScanCode(`stamp: ${uuid}`);
      expect(result).toEqual({ type: 'stamp', value: uuid });
    });

    it('returns invalid for stamp code with invalid UUID', () => {
      const result = parseScanCode('stamp: not-a-uuid');
      expect(result).toEqual({ type: 'invalid', value: '' });
    });

    it('returns invalid for points qr code since its unsupported', () => {
      const result = parseScanCode('qr: some-code-123');
      expect(result).toEqual({ type: 'invalid', value: '' });
    });

    it('returns invalid for plain text', () => {
      const result = parseScanCode('plain-text-code');
      expect(result).toEqual({ type: 'invalid', value: '' });
    });

    it('returns invalid for empty text', () => {
      expect(parseScanCode('')).toEqual({ type: 'invalid', value: '' });
      expect(parseScanCode('   ')).toEqual({ type: 'invalid', value: '' });
    });
  });

  describe('shouldDebounceScan', () => {
    const text = 'test-code';

    it('debounces if text matches and within time limit', () => {
      const now = 5000;
      const lastDecoded = { text, at: 3000 }; // 2000ms ago
      expect(shouldDebounceScan(text, now, lastDecoded)).toBe(true);
    });

    it('does not debounce if text matches but past time limit', () => {
      const now = 7000;
      const lastDecoded = { text, at: 3000 }; // 4000ms ago
      expect(shouldDebounceScan(text, now, lastDecoded)).toBe(false);
    });

    it('does not debounce if text is different', () => {
      const now = 5000;
      const lastDecoded = { text: 'different-code', at: 4000 }; // 1000ms ago
      expect(shouldDebounceScan(text, now, lastDecoded)).toBe(false);
    });

    it('does not debounce if lastDecoded is null', () => {
      const now = 5000;
      expect(shouldDebounceScan(text, now, null)).toBe(false);
    });
  });
});
