import { proxy, config } from './proxy';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: jest.fn((opts) => ({
        type: 'next',
        cookies: { set: jest.fn() },
        ...opts,
      })),
      redirect: jest.fn((url) => ({
        type: 'redirect',
        url: url.pathname,
      })),
    },
  };
});

const mockGetUser = jest.fn();

jest.mock('@supabase/ssr', () => {
  return {
    createServerClient: jest.fn(() => ({
      auth: {
        getUser: mockGetUser,
      },
    })),
  };
});

describe('proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  const createMockRequest = (pathname: string) => {
    return {
      cookies: {
        getAll: jest.fn(() => []),
        set: jest.fn(),
      },
      nextUrl: {
        pathname,
        clone: () => ({ pathname }),
      },
    } as unknown as NextRequest;
  };

  it('redirects unauthenticated users from dashboard to login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = createMockRequest('/dashboard/settings');

    const response = await proxy(req);

    expect(mockGetUser).toHaveBeenCalled();
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(response).toEqual({ type: 'redirect', url: '/login' });
  });

  it('redirects authenticated users from login to dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } });
    const req = createMockRequest('/login');

    const response = await proxy(req);

    expect(mockGetUser).toHaveBeenCalled();
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(response).toEqual({ type: 'redirect', url: '/dashboard' });
  });

  it('allows authenticated users to access dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } });
    const req = createMockRequest('/dashboard/settings');

    const response = await proxy(req);

    expect(mockGetUser).toHaveBeenCalled();
    expect(response).toHaveProperty('type', 'next');
  });

  it('allows unauthenticated users to access other routes', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = createMockRequest('/');

    const response = await proxy(req);

    expect(mockGetUser).toHaveBeenCalled();
    expect(response).toHaveProperty('type', 'next');
  });

  it('creates Supabase client with cookie handlers', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = createMockRequest('/');

    await proxy(req);

    expect(createServerClient).toHaveBeenCalled();

    const clientOptions = jest.mocked(createServerClient).mock.calls[0][2];
    expect(clientOptions).toBeDefined();
    expect(clientOptions?.cookies?.getAll).toBeDefined();
    expect(clientOptions?.cookies?.setAll).toBeDefined();

    // Verify setAll sets httpOnly: true
    const setAll = clientOptions?.cookies?.setAll;
    expect(setAll).toBeDefined();

    const mockCookiesToSet = [
      { name: 'test-cookie', value: 'test-value', options: { path: '/' } }
    ];

    setAll!(mockCookiesToSet);

    // Get the mock next Response cookie set
    const nextResponseMock = jest.mocked(NextResponse.next);

    // The last call to NextResponse.next() was during setAll
    const lastResult = nextResponseMock.mock.results[nextResponseMock.mock.results.length - 1].value;
    const mockSet = lastResult.cookies.set;

    expect(mockSet).toHaveBeenCalledWith('test-cookie', 'test-value', { path: '/', httpOnly: true });
  });
});

describe('proxy exports', () => {
  it('exports proxy as a function', () => {
    expect(typeof proxy).toBe('function');
  });

  it('exports config with a matcher', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });
});

describe('extended route protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  const createMockRequest = (pathname: string) => {
    return {
      cookies: {
        getAll: jest.fn(() => []),
        set: jest.fn(),
      },
      nextUrl: {
        pathname,
        clone: () => ({ pathname }),
      },
    } as unknown as NextRequest;
  };

  it('redirects unauthenticated users from /beauty/dashboard to login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = createMockRequest('/beauty/dashboard');

    const response = await proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(response).toEqual({ type: 'redirect', url: '/login' });
  });

  it('redirects unauthenticated users from /pilates/dashboard to login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = createMockRequest('/pilates/dashboard');

    const response = await proxy(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(response).toEqual({ type: 'redirect', url: '/login' });
  });

  it('allows authenticated users to access /beauty/dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } });
    const req = createMockRequest('/beauty/dashboard');

    const response = await proxy(req);

    expect(response).toHaveProperty('type', 'next');
  });
});
