import React, { useRef } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BusinessSettingsPanel, { BusinessSettingsPanelRef } from '../BusinessSettingsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useModal } from '@/contexts/ModalContext';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/components/Toast');
jest.mock('@/contexts/ModalContext');
jest.mock('@/lib/supabase/client');

const mockShowToast = jest.fn();
const mockShowConfirm = jest.fn();
const mockUpsert = jest.fn();
const mockMaybeSingle = jest.fn();

beforeAll(() => {
  const originalError = console.error;
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (typeof args[0] === 'string' && /not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

const setupSupabaseMock = () => {
  const mockFrom = jest.fn((table: string) => {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      upsert: mockUpsert,
    };
  });

  (createClient as jest.Mock).mockReturnValue({
    from: mockFrom,
  });
};

describe('BusinessSettingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();

    (useAuth as jest.Mock).mockReturnValue({
      profile: { id: 'master123' }
    });

    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast
    });

    (useModal as jest.Mock).mockReturnValue({
      showConfirm: mockShowConfirm
    });
  });

  it('renders loading state initially', () => {
    mockMaybeSingle.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<BusinessSettingsPanel />);
    expect(screen.getByText('Loading business settings...')).toBeInTheDocument();
  });

  describe('Data Fetching', () => {
    it('loads existing settings and populates the form', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          master_id: 'master123',
          confirmation_timing_hours: 48,
          confirmation_response_timeout_hours: 12,
          auto_charge_after_grace_period: false,
          deposit_type: 'percentage',
          deposit_amount: 0,
          deposit_percentage: 50,
          terms_and_conditions: 'My custom terms',
          require_tc_acceptance: true,
          accepts_new_clients: false,
          is_visible_globally: false,
        },
        error: null,
      });

      render(<BusinessSettingsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading business settings...')).not.toBeInTheDocument();
      });

      // Verify specific loaded settings
      expect(screen.getByText('Deposit Configuration')).toBeInTheDocument();
      expect(screen.getByText('Require Deposit')).toBeInTheDocument();

      // The toggle label wrapper is the label itself but might not connect correctly to input without htmlFor
      const depositText = screen.getByText('Require Deposit');
      const depositLabel = depositText.closest('label');
      const depositCheckbox = depositLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(depositCheckbox).toBeChecked();

      const acceptNewClientsText = screen.getByText('Accept New Clients');
      const acceptNewClientsLabel = acceptNewClientsText.closest('label');
      const acceptNewClientsCheckbox = acceptNewClientsLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(acceptNewClientsCheckbox).not.toBeChecked();
    });

    it('upserts a default row if no settings exist', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      mockUpsert.mockResolvedValue({ data: null, error: null });

      render(<BusinessSettingsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading business settings...')).not.toBeInTheDocument();
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        { master_id: 'master123' },
        { onConflict: 'master_id' }
      );
    });
  });

  describe('Interactivity', () => {
    beforeEach(() => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          master_id: 'master123',
          deposit_percentage: 0,
        },
        error: null,
      });
    });

    it('toggles deposit and updates percentage', async () => {
      render(<BusinessSettingsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading business settings...')).not.toBeInTheDocument();
      });

      const depositText = screen.getByText('Require Deposit');
      const depositLabel = depositText.closest('label');
      const depositCheckbox = depositLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(depositCheckbox).not.toBeChecked();

      // Check deposit
      fireEvent.click(depositCheckbox);

      expect(depositCheckbox).toBeChecked();

      // Look for the 50% button
      const fiftyPercentBtn = screen.getByText('50%');
      fireEvent.click(fiftyPercentBtn);

      // Verify state conceptually by ensuring the button is selected (it will have the primary color classes)
      expect(fiftyPercentBtn).toHaveClass('bg-[var(--color-primary)]');
    });

    it('opens terms modal, enters text, and saves it', async () => {
      render(<BusinessSettingsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading business settings...')).not.toBeInTheDocument();
      });

      const addTermsBtn = screen.getByText('Add Terms');
      fireEvent.click(addTermsBtn);

      const textarea = screen.getByPlaceholderText(/Enter your Terms & Conditions here/);
      fireEvent.change(textarea, { target: { value: 'New terms here' } });

      const saveTermsBtn = screen.getByText('Save Terms');
      fireEvent.click(saveTermsBtn);

      // The modal should close and the terms should be visible
      expect(screen.queryByPlaceholderText(/Enter your Terms & Conditions here/)).not.toBeInTheDocument();
      expect(screen.getByText('New terms here')).toBeInTheDocument();
    });
  });

  describe('Saving', () => {
    beforeEach(() => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          master_id: 'master123',
          deposit_percentage: 50,
          confirmation_timing_hours: 24,
        },
        error: null,
      });
    });

    it('calls upsert with the correct data when clicking save and shows a success toast', async () => {
      mockUpsert.mockResolvedValue({ error: null });

      render(<BusinessSettingsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading business settings...')).not.toBeInTheDocument();
      });

      const saveBtn = screen.getByRole('button', { name: /Save Business Settings/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Business settings saved!', 'success');
      });

      // Ensure the upsert includes some data correctly mapped
      const upsertArg = mockUpsert.mock.calls[0][0];
      expect(upsertArg.master_id).toBe('master123');
      expect(upsertArg.deposit_percentage).toBe(50);
    });

    it('shows an error toast if save fails', async () => {
      mockUpsert.mockResolvedValue({ error: new Error('Save error') });

      render(<BusinessSettingsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading business settings...')).not.toBeInTheDocument();
      });

      const saveBtn = screen.getByRole('button', { name: /Save Business Settings/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Save error', 'error');
      });
    });
  });

  describe('Ref Exposing', () => {
    it('exposes a save method via forwardRef that triggers a save', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockUpsert.mockResolvedValue({ error: null }); // clear initial load error

      const Wrapper = () => {
        const ref = useRef<BusinessSettingsPanelRef>(null);
        return (
          <div>
            <button onClick={() => ref.current?.save()}>External Save</button>
            <BusinessSettingsPanel ref={ref} />
          </div>
        );
      };

      render(<Wrapper />);

      await waitFor(() => {
        expect(screen.queryByText('Loading business settings...')).not.toBeInTheDocument();
      });

      // Clear initial mockUpsert from loadAll
      mockUpsert.mockClear();

      const externalSaveBtn = screen.getByText('External Save');
      fireEvent.click(externalSaveBtn);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Business settings saved!', 'success');
      });
    });
  });
});
