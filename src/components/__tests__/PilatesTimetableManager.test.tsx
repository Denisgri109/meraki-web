import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PilatesTimetableManager from '../PilatesTimetableManager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

// Mock the external modules
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/Toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  rpc: jest.fn().mockResolvedValue({ error: null }),
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  upsert: jest.fn(),
};

describe('PilatesTimetableManager', () => {
  const mockService = {
    id: 'service-1',
    name: 'Test Pilates Class',
  };

  const mockUser = { id: 'user-1' };
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    const { createClient } = require('@/lib/supabase/client');
    createClient.mockReturnValue(mockSupabase);

    // Default successful mocks for loading data
    mockSupabase.from.mockImplementation((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [], error: null }),
        upsert: mockSupabase.upsert,
      };

      // Customize resolve based on table if needed, simple mock for now
      if (table === 'pilates_hosts') builder.order.mockResolvedValue({ data: [], error: null });
      if (table === 'profiles') builder.order.mockResolvedValue({ data: [], error: null });
      if (table === 'pilates_schedule_templates') builder.order.mockResolvedValue({ data: [], error: null });

      return builder;
    });
  });

  it('displays error toast when saving Pilates details fails', async () => {
    // Setup the upsert to fail with a specific error
    const errorMessage = 'Supabase upsert failed due to unique constraint violation';
    mockSupabase.upsert.mockResolvedValue({
      data: null,
      error: new Error(errorMessage)
    });

    render(
      <PilatesTimetableManager
        service={mockService as any}
        onClose={jest.fn()}
      />
    );

    // Wait for initial load to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading timetable...')).not.toBeInTheDocument();
    });

    // Find the "Save details" button and click it
    const saveButton = screen.getByRole('button', { name: /save details/i });

    // Using fireEvent since userEvent.click might have issues with pending state updates in some setups
    // fireEvent.click(saveButton);
    await userEvent.click(saveButton);

    // Assert that showToast was called with the correct error message
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(errorMessage, 'error');
    });
  });
});
