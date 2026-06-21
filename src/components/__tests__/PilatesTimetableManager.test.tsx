import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PilatesTimetableManager } from '../PilatesTimetableManager';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

const mockShowConfirm = jest.fn();

jest.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({
    showConfirm: mockShowConfirm,
  }),
}));

jest.mock('@/components/Toast', () => ({
  useToast: jest.fn(),
}));

describe('PilatesTimetableManager error handling', () => {
  const mockService = {
    id: 'service-123',
    name: 'Test Pilates',
    owner_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: 'Test description',
    is_active: true,
  };

  let mockShowToast: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });

    // Default implementation handles all chains simply returning an empty array to allow component to render without throwing unhandled promises.
    mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      from: jest.fn().mockImplementation(() => {
         const mockChain = {
             select: jest.fn().mockReturnThis(),
             eq: jest.fn().mockReturnThis(),
             order: jest.fn().mockReturnThis(),
             in: jest.fn().mockReturnThis(),
             gte: jest.fn().mockReturnThis(),
             lt: jest.fn().mockReturnThis(),
             maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
             upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
             insert: jest.fn().mockResolvedValue({ data: null, error: null }),
             update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
             then: jest.fn((resolve) => resolve({ data: [], error: null })),
         };
         return mockChain;
      }),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setupSuccessLoadData = (overrides: Record<string, any> = {}) => {
    mockSupabase.from.mockImplementation((table: string) => {
        const mockChain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
            then: jest.fn((resolve) => resolve({ data: [], error: null })),
        };

        const override = overrides[table];
        if (!override) {
            return mockChain;
        }

        if (typeof override === 'function') {
             return override(mockChain);
        }

        return { ...mockChain, ...override };
    });
  };

  it('shows error toast when loadData fails', async () => {
    mockSupabase.rpc.mockRejectedValue(new Error('Failed to load Pilates timetable'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to load Pilates timetable', 'error');
    });
  });

  it('shows error toast when loadData fails with non-Error', async () => {
    mockSupabase.rpc.mockRejectedValue('String error');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to load Pilates timetable', 'error');
    });
  });

  it('shows error toast when saveSettings fails', async () => {
    setupSuccessLoadData({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pilates_settings: (chain: any) => ({
             ...chain,
             upsert: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to save Pilates details') })
        })
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    // Switch to Settings tab
    fireEvent.click(screen.getByText('Settings'));

    const saveButton = screen.getByText('Save default settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to save Pilates details', 'error');
    });
  });

  it('shows error toast when createHost fails', async () => {
    setupSuccessLoadData({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pilates_hosts: (chain: any) => ({
             ...chain,
             insert: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to add host') })
        })
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    // Switch to Instructors tab
    fireEvent.click(screen.getByRole('button', { name: /instructors/i }));

    const nameInput = screen.getByPlaceholderText('e.g. Sarah Thompson');
    fireEvent.change(nameInput, { target: { value: 'New Host' } });

    const addButton = screen.getByText('Add instructor');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to add host', 'error');
    });
  });

  it('shows error toast when createTemplate fails', async () => {
    setupSuccessLoadData({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pilates_hosts: (chain: any) => ({
             ...chain,
             order: jest.fn().mockReturnThis(),
             then: jest.fn((resolve) => resolve({ data: [{ id: 'host-1', display_name: 'Test Host' }], error: null })),
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pilates_schedule_templates: (chain: any) => ({
             ...chain,
             order: jest.fn().mockReturnThis(),
             then: jest.fn((resolve) => resolve({ data: [], error: null })),
             insert: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to add class slot') })
        })
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    const selects = screen.getAllByRole('combobox');
    const templateHostSelect = selects.find(select => {
        const firstOpt = select.querySelector('option[value=""]');
        return firstOpt && (firstOpt.textContent?.includes('Choose host') || firstOpt.textContent?.includes('Choose instructor'));
    });

    if (templateHostSelect) {
        fireEvent.change(templateHostSelect, { target: { value: 'host-1' } });
    }

    const addToTimetableButton = screen.getByText('Add to weekly timetable');
    fireEvent.click(addToTimetableButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to add class slot', 'error');
    });
  });

  it('shows error toast when toggleTemplate fails', async () => {
    setupSuccessLoadData({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pilates_schedule_templates: (chain: any) => {
             return {
                 ...chain,
                 order: jest.fn().mockReturnThis(),
                 then: jest.fn((resolve) => resolve({
                     data: [{ id: 'template-1', day_of_week: 1, start_time: '10:00:00', host_id: 'host-1', is_active: true, capacity: 5, duration_minutes: 60, level: 'All levels' }],
                     error: null
                 })),
                 update: jest.fn().mockReturnValue({
                     eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to update class slot') })
                 })
             };
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    const activeButton = await screen.findByText('Active');
    fireEvent.click(activeButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to update class slot', 'error');
    });
  });

  it('shows error toast when saveSession fails', async () => {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1);
    testDate.setHours(10, 0, 0, 0);

    setupSuccessLoadData({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pilates_class_sessions: (chain: any) => {
             const mockSessionChain = {
                 select: jest.fn().mockReturnThis(),
                 eq: jest.fn().mockReturnThis(),
                 gte: jest.fn().mockReturnThis(),
                 lt: jest.fn().mockReturnThis(),
                 order: jest.fn().mockReturnThis(),
                 then: jest.fn((resolve) => resolve({
                    data: [{
                        id: 'session-1',
                        starts_at: testDate.toISOString(),
                        capacity: 10,
                        level: 'All levels',
                        status: 'scheduled',
                        host: { display_name: 'Test Host' },
                        pilates_session_bookings: []
                    }],
                    error: null
                 }))
             };

             return {
                 ...chain,
                 select: jest.fn().mockReturnValue(mockSessionChain),
                 update: jest.fn().mockReturnValue({
                     eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to update class') })
                 })
             };
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    // Switch to Sessions tab
    fireEvent.click(screen.getByText('Sessions'));

    const timeOrHostElements = await screen.findAllByText('Test Host');

    // Find the button containing the host
    const sessionButton = timeOrHostElements[0].closest('button');
    if (sessionButton) {
        fireEvent.click(sessionButton);
    }

    const saveClassButton = await screen.findByText('Save changes');
    fireEvent.click(saveClassButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to update class', 'error');
    });
  });

  it('shows error toast when deleteTemplate fails', async () => {
    mockShowConfirm.mockResolvedValue(true);
    setupSuccessLoadData({
      pilates_schedule_templates: (chain: any) => ({
        ...chain,
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({
          data: [{ id: 'template-1', day_of_week: 1, start_time: '10:00:00', host_id: 'host-1', is_active: true, capacity: 5, duration_minutes: 60, level: 'All levels' }],
          error: null
        })),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to delete class slot') })
        })
      })
    });

    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    const deleteButton = await screen.findByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Failed to delete class slot', 'error');
    });
  });

  it('shows error toast when saveTemplate fails', async () => {
    setupSuccessLoadData({
      pilates_schedule_templates: (chain: any) => ({
        ...chain,
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({
          data: [{ id: 'template-1', day_of_week: 1, start_time: '10:00:00', host_id: 'host-1', is_active: true, capacity: 5, duration_minutes: 60, level: 'All levels' }],
          error: null
        })),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to update class slot') })
        })
      }),
      pilates_hosts: (chain: any) => ({
        ...chain,
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [{ id: 'host-1', display_name: 'Test Host' }], error: null })),
      })
    });

    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    const editButton = await screen.findByText('Edit');
    fireEvent.click(editButton);

    const saveChangesButton = await screen.findByText('Save changes');
    fireEvent.click(saveChangesButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to update class slot', 'error');
    });
  });

  it('shows error toast when deleteHost fails', async () => {
    mockShowConfirm.mockResolvedValue(true);
    setupSuccessLoadData({
      pilates_hosts: (chain: any) => ({
        ...chain,
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({
          data: [{ id: 'host-1', display_name: 'Test Host', is_active: true }],
          error: null
        })),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to delete instructor') })
        })
      })
    });

    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    // Switch to Instructors tab
    fireEvent.click(screen.getByRole('button', { name: /instructors/i }));

    const deleteButton = await screen.findByLabelText('Delete instructor');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Failed to delete instructor', 'error');
    });
  });

  it('shows error toast when saveHost fails', async () => {
    setupSuccessLoadData({
      pilates_hosts: (chain: any) => ({
        ...chain,
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({
          data: [{ id: 'host-1', display_name: 'Test Host', is_active: true }],
          error: null
        })),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Failed to update instructor') })
        })
      })
    });

    render(<PilatesTimetableManager service={mockService as any} onServiceUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    // Switch to Instructors tab
    fireEvent.click(screen.getByRole('button', { name: /instructors/i }));

    const editButton = await screen.findByLabelText('Edit instructor');
    fireEvent.click(editButton);

    const saveChangesButton = await screen.findByText('Save changes');
    fireEvent.click(saveChangesButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to update instructor', 'error');
    });
  });
});
