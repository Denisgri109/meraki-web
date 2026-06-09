import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase Client
jest.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      refreshSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    update: jest.fn(),
    channel: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    removeChannel: jest.fn(),
  };
  return {
    createClient: jest.fn(() => mockSupabase),
  };
});

const mockedCreateClient = jest.mocked(createClient);

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'true' : 'false'}</div>
      <div data-testid="user">{auth.user ? auth.user.id : 'null'}</div>
      <button
        data-testid="signin-btn"
        onClick={() => auth.signIn('test@example.com', 'password')}
      >
        Sign In
      </button>
      <button data-testid="signout-btn" onClick={() => auth.signOut()}>
        Sign Out
      </button>
      <button
        data-testid="updateprofile-btn"
        onClick={() => auth.updateProfile({ full_name: 'New Name' })}
      >
        Update Profile
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default values and loads initial session', async () => {
    const mockSupabase = mockedCreateClient();
    const mockSession = { user: { id: 'user-123' } };

    // Setup initial session resolution
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    // Setup fetchProfile resolution
    (mockSupabase.from('profiles').select('*').eq('id', 'user-123').maybeSingle as jest.Mock).mockResolvedValue({
      data: { id: 'user-123', full_name: 'Test User' },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial render might show true for loading
    // We wait for it to become false
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('user-123');
    expect(mockSupabase.auth.getSession).toHaveBeenCalled();
  });
  it('handles signIn correctly', async () => {
    const mockSupabase = mockedCreateClient();

    // We don't care about the initial session load here, just return null
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('signin-btn').click();
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });
  it('handles signOut correctly', async () => {
    const mockSupabase = mockedCreateClient();

    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('signout-btn').click();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('handles updateProfile correctly', async () => {
    const mockSupabase = mockedCreateClient();

    // Initial session resolving with a user to allow updateProfile to work
    const mockSession = { user: { id: 'user-123' } };
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    (mockSupabase.from('profiles').select('*').eq('id', 'user-123').maybeSingle as jest.Mock).mockResolvedValue({
      data: { id: 'user-123', full_name: 'Test User' },
      error: null,
    });

    // Mock update response
    (mockSupabase.from('profiles').update as jest.Mock).mockResolvedValue({
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByTestId('updateprofile-btn').click();
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.from('profiles').update).toHaveBeenCalledWith({ full_name: 'New Name' });


  });
});
