// Mock the dependencies
const mockCreateBrowserClient = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

describe('Supabase Browser Client', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the module to clear the singleton `client` variable
    jest.resetModules();

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };

    global.fetch = jest.fn().mockResolvedValue({} as Response);
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('should initialize the browser client with correct credentials', async () => {
    const { createClient } = await import('./client');

    mockCreateBrowserClient.mockReturnValue({ test: 'client' });

    const client = createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        global: {
          fetch: expect.any(Function),
        },
      })
    );
    expect(client).toEqual({ test: 'client' });

    // Test the fetch function
    const fetchFunc = mockCreateBrowserClient.mock.calls[0][2].global.fetch;
    await fetchFunc('https://api.example.com', { method: 'GET' });

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com', {
      method: 'GET',
      cache: 'no-store',
    });
  });

  it('should return the same client instance on subsequent calls', async () => {
    const { createClient } = await import('./client');
    const mockClient = { name: 'mock-client' };
    mockCreateBrowserClient.mockReturnValueOnce(mockClient);

    const client1 = createClient();
    const client2 = createClient();

    expect(client1).toBe(mockClient);
    expect(client2).toBe(mockClient);
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { createClient } = await import('./client');

    expect(() => createClient()).toThrow('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  });

  it('should throw an error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createClient } = await import('./client');

    expect(() => createClient()).toThrow('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });
});
