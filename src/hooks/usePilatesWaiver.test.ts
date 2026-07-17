import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePilatesWaiver } from '@/hooks/usePilatesWaiver';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => {
  const mockMaybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
  const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));
  const mockFrom = jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        maybeSingle: mockMaybeSingle,
      })),
    })),
    upsert: mockUpsert,
  }));
  return {
    createClient: jest.fn(() => ({ from: mockFrom })),
    _mocks: { mockMaybeSingle, mockUpsert, mockFrom },
  };
});

import * as supabaseClientModule from '@/lib/supabase/client';
const mocks = (supabaseClientModule as any)._mocks;

describe('usePilatesWaiver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });
    mocks.mockMaybeSingle.mockReset();
    mocks.mockUpsert.mockReset();
    mocks.mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.mockUpsert.mockResolvedValue({ error: null });
  });

  describe('initial state', () => {
    it('hasWaiver starts as false', () => {
      const { result } = renderHook(() => usePilatesWaiver());
      expect(result.current.hasWaiver).toBe(false);
    });

    it('submitting starts as false', () => {
      const { result } = renderHook(() => usePilatesWaiver());
      expect(result.current.submitting).toBe(false);
    });

    it('loading becomes false after initial check resolves', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });

  describe('checkWaiver', () => {
    it('sets hasWaiver to true when waiver exists', async () => {
      mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: { id: 'w1', signed_at: '2026-01-01' },
        error: null,
      });
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => {
        expect(result.current.hasWaiver).toBe(true);
        expect(result.current.loading).toBe(false);
      });
    });

    it('sets hasWaiver to false when no waiver', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => {
        expect(result.current.hasWaiver).toBe(false);
        expect(result.current.loading).toBe(false);
      });
    });

    it('sets error when supabase returns error', async () => {
      mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('DB error'),
      });
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => {
        expect(result.current.hasWaiver).toBe(false);
        expect(result.current.error).toBe('DB error');
        expect(result.current.loading).toBe(false);
      });
    });

    it('sets hasWaiver false and loading false when user is null', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => {
        expect(result.current.hasWaiver).toBe(false);
        expect(result.current.loading).toBe(false);
      });
    });

    it('returns true when waiver exists', async () => {
      mocks.mockMaybeSingle.mockResolvedValue({
        data: { id: 'w1', signed_at: '2026-01-01' },
        error: null,
      });
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      const exists = await result.current.checkWaiver();
      expect(exists).toBe(true);
    });

    it('returns false when no waiver', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      const exists = await result.current.checkWaiver();
      expect(exists).toBe(false);
    });

    it('returns false when user is null', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      const exists = await result.current.checkWaiver();
      expect(exists).toBe(false);
    });
  });

  describe('submitWaiver', () => {
    const validData = {
      injuriesJointProblems: 'Lower back pain',
      pilatesExperience: 'Some Mat Pilates',
      hasIllnesses: false,
      illnessDetails: '',
      pregnancyStatus: 'no' as const,
      medicationDetails: 'None',
      exerciseHistory: 'Running 3x per week',
      practitionerRecommended: false,
      goalsExpectations: 'Improve core strength',
      hasBoneCondition: false,
      agreedTermsOfUse: true,
      agreedLiabilityWaiver: true,
    };

    it('throws when user is not signed in', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await expect(result.current.submitWaiver(validData)).rejects.toThrow(
        'You must be signed in to submit a waiver.',
      );
    });

    it('sets hasWaiver to true on successful submit', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver(validData);
      });
      expect(result.current.hasWaiver).toBe(true);
      expect(result.current.submitting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets error and rethrows when upsert fails', async () => {
      mocks.mockUpsert.mockResolvedValueOnce({ error: new Error('Upsert failed') });
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      let thrown: unknown;
      await act(async () => {
        try {
          await result.current.submitWaiver(validData);
        } catch (e) {
          thrown = e;
        }
      });
      expect((thrown as Error).message).toBe('Upsert failed');
      expect(result.current.error).toBe('Upsert failed');
      expect(result.current.submitting).toBe(false);
    });

    it('trims text fields', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver({
          ...validData,
          injuriesJointProblems: '  knee pain  ',
          goalsExpectations: '  better posture  ',
        });
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.injuries_joint_problems).toBe('knee pain');
      expect(upsertCall.goals_expectations).toBe('better posture');
    });

    it('sets illness_details to null when hasIllnesses is false', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver({
          ...validData,
          hasIllnesses: false,
          illnessDetails: 'this should be ignored',
        });
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.illness_details).toBeNull();
    });

    it('sets illness_details when hasIllnesses is true', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver({
          ...validData,
          hasIllnesses: true,
          illnessDetails: '  asthma  ',
        });
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.has_illnesses).toBe(true);
      expect(upsertCall.illness_details).toBe('asthma');
    });

    it('uses terms_version 3.0', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver(validData);
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.terms_version).toBe('3.0');
    });

    it('passes user_id in payload', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver(validData);
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.user_id).toBe('user-1');
    });

    it('passes pregnancy_status to upsert', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver({
          ...validData,
          pregnancyStatus: 'not_applicable',
        });
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.pregnancy_status).toBe('not_applicable');
    });

    it('sets legacy has_injuries derived from injuries text', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver({
          ...validData,
          injuriesJointProblems: '  shoulder impingement  ',
        });
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.has_injuries).toBe(true);
      expect(upsertCall.injury_details).toBe('shoulder impingement');
      expect(upsertCall.injuries_joint_problems).toBe('shoulder impingement');
    });

    it('sets legacy has_injuries false and emergency fields null for v3.0', async () => {
      const { result } = renderHook(() => usePilatesWaiver());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.submitWaiver({
          ...validData,
          injuriesJointProblems: '',
        });
      });
      const upsertCall = mocks.mockUpsert.mock.calls[0][0];
      expect(upsertCall.has_injuries).toBe(false);
      expect(upsertCall.injury_details).toBeNull();
      expect(upsertCall.emergency_contact_name).toBeNull();
      expect(upsertCall.emergency_contact_phone).toBeNull();
      expect(upsertCall.signature_name).toBeNull();
    });
  });
});
