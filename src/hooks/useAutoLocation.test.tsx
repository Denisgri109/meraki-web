import { renderHook, waitFor } from '@testing-library/react';
import { useAutoLocation } from './useAutoLocation';
import { useAuth } from '@/contexts/AuthContext';
import { detectUserLocation } from '@/lib/location';

jest.mock('@/lib/supabase/client', () => {
  const mockEq = jest.fn();
  const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });
  return {
    createClient: () => ({
      from: mockFrom,
    }),
    _mockEq: mockEq,
  };
});

jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/location');

describe('useAutoLocation error paths', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let mockEq: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { _mockEq } = require('@/lib/supabase/client');
    mockEq = _mockEq;
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('handles supabase update error', async () => {
    const mockProfile = { id: 'test-user-id' };
    (useAuth as jest.Mock).mockReturnValue({
      profile: mockProfile,
      refreshProfile: jest.fn(),
    });

    (detectUserLocation as jest.Mock).mockResolvedValue({
      latitude: 10,
      longitude: 20,
      country: 'TestLand',
      countryCode: 'TL',
    });

    mockEq.mockResolvedValueOnce({ error: { message: 'Database error' } });

    renderHook(() => useAutoLocation());

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useAutoLocation] profile update failed:',
        'Database error'
      );
    });
  });

  it('handles refreshProfile error', async () => {
    const mockProfile = { id: 'test-user-id' };
    const refreshProfileMock = jest.fn().mockRejectedValue(new Error('Refresh failed'));

    (useAuth as jest.Mock).mockReturnValue({
      profile: mockProfile,
      refreshProfile: refreshProfileMock,
    });

    (detectUserLocation as jest.Mock).mockResolvedValue({
      latitude: 10,
      longitude: 20,
      country: 'TestLand',
      countryCode: 'TL',
    });

    mockEq.mockResolvedValueOnce({ error: null });

    renderHook(() => useAutoLocation());

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useAutoLocation] refreshProfile failed:',
        expect.any(Error)
      );
    });
  });

  it('handles geolocation API throwing an error gracefully', async () => {
    const mockProfile = { id: 'test-user-id' };
    (useAuth as jest.Mock).mockReturnValue({
      profile: mockProfile,
      refreshProfile: jest.fn(),
    });

    // Mock an error being thrown inside detectUserLocation or before returning
    (detectUserLocation as jest.Mock).mockRejectedValue(new Error('Geolocation failed'));

    renderHook(() => useAutoLocation());

    // We expect the catch block to be called.
    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useAutoLocation] auto-detect failed:',
        expect.any(Error)
      );
    });
  });
});
