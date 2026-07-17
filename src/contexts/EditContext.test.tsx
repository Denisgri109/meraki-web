import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { EditProvider, useEditMode } from '@/contexts/EditContext';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => {
  const mockSelect = jest.fn(() => Promise.resolve({ data: [], error: null }));
  const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));
  const mockDeleteFilter = jest.fn(() => Promise.resolve({ error: null }));
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    upsert: mockUpsert,
    delete: jest.fn(() => ({ filter: mockDeleteFilter })),
  }));
  return {
    createClient: jest.fn(() => ({ from: mockFrom })),
    _mocks: { mockSelect, mockUpsert, mockDeleteFilter },
  };
});

import * as supabaseClientModule from '@/lib/supabase/client';
const supabaseMocks = (supabaseClientModule as any)._mocks;

function renderWithProvider(initialContent?: Record<string, string>) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditProvider initialContent={initialContent}>{children}</EditProvider>
  );
  return renderHook(() => useEditMode(), { wrapper });
}

describe('EditContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
      profile: { role: 'owner' },
    });
  });

  describe('initial state', () => {
    it('isEditMode defaults to false', () => {
      const { result } = renderWithProvider({ 'k': 'v' });
      expect(result.current.isEditMode).toBe(false);
    });

    it('canEdit is true when role is owner', () => {
      const { result } = renderWithProvider({ 'k': 'v' });
      expect(result.current.canEdit).toBe(true);
    });

    it('canEdit is false when role is not owner', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: { role: 'client' },
      });
      const { result } = renderWithProvider({ 'k': 'v' });
      expect(result.current.canEdit).toBe(false);
    });

    it('canEdit is false when profile is null', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: null,
      });
      const { result } = renderWithProvider({ 'k': 'v' });
      expect(result.current.canEdit).toBe(false);
    });

    it('content initializes with initialContent when provided', () => {
      const initial = { 'hero.title': 'Welcome', 'hero.subtitle': 'Book' };
      const { result } = renderWithProvider(initial);
      expect(result.current.content).toEqual(initial);
    });
  });

  describe('getContent', () => {
    it('returns stored value when key exists', () => {
      const { result } = renderWithProvider({ 'hero.title': 'Welcome' });
      expect(result.current.getContent('hero.title', 'Default')).toBe('Welcome');
    });

    it('returns fallback when key does not exist', () => {
      const { result } = renderWithProvider({ 'k': 'v' });
      expect(result.current.getContent('missing.key', 'Fallback')).toBe('Fallback');
    });
  });

  describe('toggleEditMode', () => {
    it('toggles isEditMode from false to true when canEdit', () => {
      const { result } = renderWithProvider({ 'k': 'v' });
      expect(result.current.isEditMode).toBe(false);
      act(() => result.current.toggleEditMode());
      expect(result.current.isEditMode).toBe(true);
    });

    it('toggles isEditMode back to false on second call', () => {
      const { result } = renderWithProvider({ 'k': 'v' });
      act(() => result.current.toggleEditMode());
      act(() => result.current.toggleEditMode());
      expect(result.current.isEditMode).toBe(false);
    });

    it('does NOT toggle when canEdit is false', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: { role: 'client' },
      });
      const { result } = renderWithProvider({ 'k': 'v' });
      act(() => result.current.toggleEditMode());
      expect(result.current.isEditMode).toBe(false);
    });
  });

  describe('updateContent', () => {
    it('returns error when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, profile: null });
      const { result } = renderWithProvider({ 'k': 'v' });
      const response = await result.current.updateContent('k', 'v');
      expect(response).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when user is not owner', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: { role: 'client' },
      });
      const { result } = renderWithProvider({ 'k': 'v' });
      const response = await result.current.updateContent('k', 'v');
      expect(response).toEqual({ error: 'Only owners can edit content' });
    });

    it('optimistically updates content and returns null error on success', async () => {
      supabaseMocks.mockUpsert.mockResolvedValueOnce({ error: null });
      const { result } = renderWithProvider({ 'k': 'v' });
      const response = await act(() => result.current.updateContent('k', 'new-value'));
      expect(response).toEqual({ error: null });
      expect(result.current.content['k']).toBe('new-value');
    });

    it('reverts content on upsert error', async () => {
      supabaseMocks.mockUpsert.mockResolvedValueOnce({ error: { message: 'DB error' } });
      const { result } = renderWithProvider({ 'k': 'original' });
      const response = await act(() => result.current.updateContent('k', 'changed'));
      expect(response).toEqual({ error: 'DB error' });
      expect(result.current.content['k']).toBeUndefined();
    });
  });

  describe('resetContent', () => {
    it('returns error when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, profile: null });
      const { result } = renderWithProvider({ 'landing.title': 'x' });
      const response = await result.current.resetContent();
      expect(response).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when not owner', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: { role: 'client' },
      });
      const { result } = renderWithProvider({ 'landing.title': 'x' });
      const response = await result.current.resetContent();
      expect(response).toEqual({ error: 'Only owners can reset content' });
    });

    it('returns null error when no keys match prefix', async () => {
      const { result } = renderWithProvider({ 'other.key': 'x' });
      const response = await result.current.resetContent('landing.');
      expect(response).toEqual({ error: null });
    });
  });

  describe('useEditMode outside provider', () => {
    it('throws when used without EditProvider', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useEditMode())).toThrow(
        'useEditMode must be used within an EditProvider',
      );
      spy.mockRestore();
    });
  });

  describe('auto-disable edit mode', () => {
    it('disables edit mode when canEdit becomes false', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: { role: 'owner' },
      });
      const { result, rerender } = renderWithProvider({ 'k': 'v' });
      act(() => result.current.toggleEditMode());
      expect(result.current.isEditMode).toBe(true);

      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: { role: 'client' },
      });
      rerender();
      expect(result.current.isEditMode).toBe(false);
    });
  });

  describe('renders children', () => {
    it('renders child components', () => {
      render(
        <EditProvider initialContent={{ k: 'v' }}>
          <div data-testid="child">Edit Content</div>
        </EditProvider>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });
});
