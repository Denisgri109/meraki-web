import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetJSON,
  safeSetJSON,
  safeSessionGetItem,
  safeSessionSetItem,
  safeSessionRemoveItem,
  safeSessionGetJSON,
  safeSessionSetJSON,
} from '@/lib/safeStorage';

// ─── localStorage helpers ─────────────────────────────────────────────────

describe('safeGetItem', () => {
  beforeEach(() => localStorage.clear());

  it('returns the stored value when key exists', () => {
    localStorage.setItem('test-key', 'test-value');
    expect(safeGetItem('test-key')).toBe('test-value');
  });

  it('returns null when key does not exist', () => {
    expect(safeGetItem('nonexistent')).toBeNull();
  });

  it('returns null when localStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(safeGetItem('any-key')).toBeNull();
    spy.mockRestore();
  });
});

describe('safeSetItem', () => {
  beforeEach(() => localStorage.clear());

  it('writes a value and returns true on success', () => {
    const result = safeSetItem('key', 'value');
    expect(result).toBe(true);
    expect(localStorage.getItem('key')).toBe('value');
  });

  it('returns false when localStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(safeSetItem('key', 'value')).toBe(false);
    spy.mockRestore();
  });
});

describe('safeRemoveItem', () => {
  beforeEach(() => localStorage.clear());

  it('removes an existing key without throwing', () => {
    localStorage.setItem('key', 'value');
    safeRemoveItem('key');
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('does not throw when key does not exist', () => {
    expect(() => safeRemoveItem('nonexistent')).not.toThrow();
  });

  it('does not throw when localStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => safeRemoveItem('key')).not.toThrow();
    spy.mockRestore();
  });
});

describe('safeGetJSON', () => {
  beforeEach(() => localStorage.clear());

  it('parses and returns the stored JSON value', () => {
    localStorage.setItem('key', JSON.stringify({ a: 1 }));
    expect(safeGetJSON('key', null)).toEqual({ a: 1 });
  });

  it('returns fallback when key is missing', () => {
    expect(safeGetJSON('nonexistent', { default: true })).toEqual({ default: true });
  });

  it('returns fallback when value is null', () => {
    expect(safeGetJSON('nullKey', 'fallback')).toBe('fallback');
  });

  it('returns fallback when JSON.parse fails', () => {
    localStorage.setItem('bad-json', '{invalid');
    expect(safeGetJSON('bad-json', 'fallback')).toBe('fallback');
  });

  it('returns fallback when localStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(safeGetJSON('key', 'fallback')).toBe('fallback');
    spy.mockRestore();
  });

  it('works with array fallback', () => {
    expect(safeGetJSON('nope', [])).toEqual([]);
  });

  it('works with number fallback', () => {
    expect(safeGetJSON('nope', 0)).toBe(0);
  });
});

describe('safeSetJSON', () => {
  beforeEach(() => localStorage.clear());

  it('stringifies and writes a value, returns true on success', () => {
    const result = safeSetJSON('key', { a: 1 });
    expect(result).toBe(true);
    expect(JSON.parse(localStorage.getItem('key')!)).toEqual({ a: 1 });
  });

  it('works with arrays', () => {
    safeSetJSON('key', [1, 2, 3]);
    expect(JSON.parse(localStorage.getItem('key')!)).toEqual([1, 2, 3]);
  });

  it('works with primitives', () => {
    safeSetJSON('key', 42);
    expect(JSON.parse(localStorage.getItem('key')!)).toBe(42);
  });

  it('returns false when localStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(safeSetJSON('key', { a: 1 })).toBe(false);
    spy.mockRestore();
  });
});

// ─── sessionStorage helpers ────────────────────────────────────────────────

describe('safeSessionGetItem', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns the stored value when key exists', () => {
    sessionStorage.setItem('s-key', 's-value');
    expect(safeSessionGetItem('s-key')).toBe('s-value');
  });

  it('returns null when key does not exist', () => {
    expect(safeSessionGetItem('nonexistent')).toBeNull();
  });

  it('returns null when sessionStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(safeSessionGetItem('any')).toBeNull();
    spy.mockRestore();
  });
});

describe('safeSessionSetItem', () => {
  beforeEach(() => sessionStorage.clear());

  it('writes a value and returns true on success', () => {
    expect(safeSessionSetItem('s-key', 's-value')).toBe(true);
    expect(sessionStorage.getItem('s-key')).toBe('s-value');
  });

  it('returns false when sessionStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(safeSessionSetItem('k', 'v')).toBe(false);
    spy.mockRestore();
  });
});

describe('safeSessionRemoveItem', () => {
  beforeEach(() => sessionStorage.clear());

  it('removes a key without throwing', () => {
    sessionStorage.setItem('k', 'v');
    safeSessionRemoveItem('k');
    expect(sessionStorage.getItem('k')).toBeNull();
  });

  it('does not throw when key missing', () => {
    expect(() => safeSessionRemoveItem('nope')).not.toThrow();
  });

  it('does not throw when sessionStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => safeSessionRemoveItem('k')).not.toThrow();
    spy.mockRestore();
  });
});

describe('safeSessionGetJSON', () => {
  beforeEach(() => sessionStorage.clear());

  it('parses and returns stored JSON', () => {
    sessionStorage.setItem('k', JSON.stringify({ x: 1 }));
    expect(safeSessionGetJSON('k', null)).toEqual({ x: 1 });
  });

  it('returns fallback when key missing', () => {
    expect(safeSessionGetJSON('nope', { d: true })).toEqual({ d: true });
  });

  it('returns fallback when JSON is invalid', () => {
    sessionStorage.setItem('bad', '{broken');
    expect(safeSessionGetJSON('bad', 'fb')).toBe('fb');
  });

  it('returns fallback when sessionStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(safeSessionGetJSON('k', 'fb')).toBe('fb');
    spy.mockRestore();
  });
});

describe('safeSessionSetJSON', () => {
  beforeEach(() => sessionStorage.clear());

  it('stringifies and writes a value, returns true', () => {
    expect(safeSessionSetJSON('k', { a: 1 })).toBe(true);
    expect(JSON.parse(sessionStorage.getItem('k')!)).toEqual({ a: 1 });
  });

  it('returns false when sessionStorage throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(safeSessionSetJSON('k', {})).toBe(false);
    spy.mockRestore();
  });
});
