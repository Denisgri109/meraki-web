import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from './server';

// Create a mock for cookieStore.set that we can inspect
const mockSet = vi.fn();
const mockGetAll = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => mockGetAll(),
    set: (...args: unknown[]) => mockSet(...args)
  })
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key, options) => {
    return options; // Return the options to inspect the cookies object
  })
}));

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets cookies normally when no error occurs', async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, NEXT_PUBLIC_SUPABASE_URL: 'url', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'key' };

    mockSet.mockImplementation(() => {}); // Success path

    const options = await createClient() as unknown as { cookies: { setAll: (c: unknown[]) => void, getAll: () => unknown[] } };

    expect(() => {
      options.cookies.setAll([{ name: 'test', value: 'value', options: { path: '/' } }]);
    }).not.toThrow();

    expect(mockSet).toHaveBeenCalledWith('test', 'value', { path: '/' });

    process.env = originalEnv;
  });

  it('ignores errors when setting cookies (Server Component context)', async () => {
    // Setup env vars so createServerClient does not throw on missing url/key
    const originalEnv = process.env;
    process.env = { ...originalEnv, NEXT_PUBLIC_SUPABASE_URL: 'url', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'key' };

    // Configure the mock to throw an error for this test
    mockSet.mockImplementation(() => {
      throw new Error('Simulated Server Component Error');
    });

    const options = await createClient() as unknown as { cookies: { setAll: (c: unknown[]) => void, getAll: () => unknown[] } };

    // Verify that calling setAll doesn't throw the error
    expect(() => {
      options.cookies.setAll([{ name: 'test', value: 'value', options: {} }]);
    }).not.toThrow();

    // Verify our mock was actually called
    expect(mockSet).toHaveBeenCalledWith('test', 'value', {});

    process.env = originalEnv;
  });

  it('gets all cookies successfully', async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, NEXT_PUBLIC_SUPABASE_URL: 'url', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'key' };

    mockGetAll.mockReturnValue([{ name: 'test', value: 'value' }]);

    const options = await createClient() as unknown as { cookies: { setAll: (c: unknown[]) => void, getAll: () => unknown[] } };

    const cookies = options.cookies.getAll();
    expect(cookies).toEqual([{ name: 'test', value: 'value' }]);
    expect(mockGetAll).toHaveBeenCalled();

    process.env = originalEnv;
  });
});
