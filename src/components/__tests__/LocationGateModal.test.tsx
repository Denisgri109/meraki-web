import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationGateModal from '../LocationGateModal';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCountries, getStatesOfCountry } from '@/lib/locationApi';

const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn();

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args)
  }),
}));

jest.mock('@/lib/locationApi', () => ({
  getAllCountries: jest.fn(),
  getStatesOfCountry: jest.fn(),
}));

// Suppress act warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/not wrapped in act/.test(args[0])) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

describe('LocationGateModal', () => {
  const mockOnSaved = jest.fn();
  const mockRefreshProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    (useAuth as jest.Mock).mockReturnValue({
      profile: { id: 'user-123' },
      refreshProfile: mockRefreshProfile,
    });

    (getAllCountries as jest.Mock).mockResolvedValue([
      { id: 1, name: 'United States', iso2: 'US' },
      { id: 2, name: 'Canada', iso2: 'CA' },
    ]);

    (getStatesOfCountry as jest.Mock).mockResolvedValue([
      { id: 1, name: 'California', iso2: 'CA', latitude: '36.77', longitude: '-119.41' },
      { id: 2, name: 'New York', iso2: 'NY', latitude: '40.71', longitude: '-74.00' },
    ]);
  });

  it('renders correctly and loads countries', async () => {
    render(<LocationGateModal onSaved={mockOnSaved} />);

    expect(screen.getByText('Set your location')).toBeInTheDocument();
    expect(screen.getByText('Loading countries…')).toBeInTheDocument();

    // Wait for countries to load
    await waitFor(() => {
      expect(screen.getByText('Select your country')).toBeInTheDocument();
    });

    // Continue button should be disabled initially
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('pre-fills country from user profile', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      profile: { id: 'user-123', country: 'United States', country_code: 'US' },
      refreshProfile: mockRefreshProfile,
    });

    render(<LocationGateModal onSaved={mockOnSaved} />);

    // The country should be pre-filled
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
    });

    // States should begin loading
    await waitFor(() => {
      expect(getStatesOfCountry).toHaveBeenCalledWith('US');
    });
  });

  it('allows selecting country and state and saving successfully', async () => {
    render(<LocationGateModal onSaved={mockOnSaved} />);

    // Wait for countries
    await waitFor(() => {
      expect(screen.getByText('Select your country')).toBeInTheDocument();
    });

    // Open country picker
    fireEvent.click(screen.getByText('Select your country'));

    // Select US
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('United States'));

    // State picker should now be available
    await waitFor(() => {
      expect(getStatesOfCountry).toHaveBeenCalledWith('US');
      expect(screen.getByText('Select your state / region')).toBeInTheDocument();
    });

    // Open state picker
    fireEvent.click(screen.getByText('Select your state / region'));

    // Select California
    await waitFor(() => {
      expect(screen.getByText('California')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('California'));

    // Type city
    const cityInput = screen.getByPlaceholderText(/Type your city name/i);
    await userEvent.type(cityInput, 'Los Angeles');

    // Click continue
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();

    fireEvent.click(continueButton);

    // Verify Supabase update call
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        country: 'United States',
        country_code: 'US',
        state: 'California',
        state_code: 'CA',
        city: 'Los Angeles',
        latitude: 36.77,
        longitude: -119.41,
        location_setup_completed: true,
      }));
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    // Check callbacks
    expect(mockRefreshProfile).toHaveBeenCalled();
    expect(mockOnSaved).toHaveBeenCalled();
  });

  it('displays error if Supabase save fails', async () => {
    mockEq.mockResolvedValueOnce({ error: new Error('Database connection failed') });

    render(<LocationGateModal onSaved={mockOnSaved} />);

    // Wait for countries
    await waitFor(() => {
      expect(screen.getByText('Select your country')).toBeInTheDocument();
    });

    // Open country picker and select Canada (assume no states for this test to simplify, or just mock it)
    (getStatesOfCountry as jest.Mock).mockResolvedValueOnce([]); // No states for Canada

    fireEvent.click(screen.getByText('Select your country'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Canada'));
    });

    // Wait for states to load (empty)
    await waitFor(() => {
      expect(getStatesOfCountry).toHaveBeenCalledWith('CA');
    });

    // Continue should be enabled if no states
    const continueButton = await screen.findByRole('button', { name: /continue/i });

    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });

    fireEvent.click(continueButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    expect(mockOnSaved).not.toHaveBeenCalled();
  });

  it('allows searching within the picker', async () => {
    render(<LocationGateModal onSaved={mockOnSaved} />);

    // Wait for countries
    await waitFor(() => {
      expect(screen.getByText('Select your country')).toBeInTheDocument();
    });

    // Open country picker
    fireEvent.click(screen.getByText('Select your country'));

    // Wait for picker to open
    const searchInput = await screen.findByPlaceholderText('Search…');

    // Search for Canada
    await userEvent.type(searchInput, 'cana');

    // US should disappear, Canada should remain
    expect(screen.queryByText('United States')).not.toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
  });
});
