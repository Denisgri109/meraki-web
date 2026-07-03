import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationPicker from '../LocationPicker';
import {
  getAllCountries,
  getStatesOfCountry,
  getCitiesOfState,
} from '@/lib/locationApi';

// Suppress specific act() warnings
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

jest.mock('@/lib/locationApi', () => ({
  getAllCountries: jest.fn(),
  getStatesOfCountry: jest.fn(),
  getCitiesOfState: jest.fn(),
}));

const mockCountries = [
  { id: 'c1', name: 'United States', iso2: 'US' },
  { id: 'c2', name: 'Canada', iso2: 'CA' },
  { id: 'c3', name: 'Monaco', iso2: 'MC' }, // Country with no states
];

const mockStatesUS = [
  { id: 's1', name: 'California', iso2: 'CA', latitude: '36.77', longitude: '-119.41' },
  { id: 's2', name: 'New York', iso2: 'NY', latitude: '40.71', longitude: '-74.00' },
];

const mockCitiesCA = [
  { id: 'ci1', name: 'Los Angeles', latitude: '34.05', longitude: '-118.24' },
  { id: 'ci2', name: 'San Francisco', latitude: '37.77', longitude: '-122.41' },
];

describe('LocationPicker', () => {
  const defaultProps = {
    country: '',
    state: '',
    city: '',
    onCountryChange: jest.fn(),
    onStateChange: jest.fn(),
    onCityChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAllCountries as jest.Mock).mockResolvedValue(mockCountries);
    (getStatesOfCountry as jest.Mock).mockResolvedValue([]);
    (getCitiesOfState as jest.Mock).mockResolvedValue([]);
  });

  it('renders initial state and loads countries', async () => {
    render(<LocationPicker {...defaultProps} />);

    // Initially it will show Loading...
    expect(screen.getByText(/Loading…/)).toBeInTheDocument();

    await waitFor(() => {
      expect(getAllCountries).toHaveBeenCalledTimes(1);
    });

    // After loading, it shows the placeholder
    await waitFor(() => {
      expect(screen.getByText('Select your country')).toBeInTheDocument();
    });
  });

  it('allows selecting a country and loads states', async () => {
    (getStatesOfCountry as jest.Mock).mockImplementation((iso2) => {
      if (iso2 === 'US') return Promise.resolve(mockStatesUS);
      return Promise.resolve([]);
    });

    render(<LocationPicker {...defaultProps} />);

    await waitFor(() => {
      expect(getAllCountries).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('Select your country'));

    const usOption = await screen.findByText('United States');
    fireEvent.click(usOption);

    expect(defaultProps.onCountryChange).toHaveBeenCalledWith('United States', 'US');
    expect(defaultProps.onStateChange).toHaveBeenCalledWith('', '', null, null);
    expect(defaultProps.onCityChange).toHaveBeenCalledWith('', null, null);
  });

  it('loads states based on provided country prop and allows state selection', async () => {
    (getStatesOfCountry as jest.Mock).mockResolvedValue(mockStatesUS);

    render(<LocationPicker {...defaultProps} country="United States" />);

    await waitFor(() => {
      expect(getStatesOfCountry).toHaveBeenCalledWith('US');
    });

    // The dropdown might say "Select your state" or it might display the selected state
    // In this test `state` prop is empty, so it should be "Select your state"
    fireEvent.click(screen.getByText('Select your state'));

    const caOption = await screen.findByText('California');
    fireEvent.click(caOption);

    expect(defaultProps.onStateChange).toHaveBeenCalledWith('California', 'CA', '36.77', '-119.41');
  });

  it('loads cities based on country and state props and allows city selection', async () => {
    (getStatesOfCountry as jest.Mock).mockResolvedValue(mockStatesUS);
    (getCitiesOfState as jest.Mock).mockResolvedValue(mockCitiesCA);

    render(<LocationPicker {...defaultProps} country="United States" state="California" />);

    await waitFor(() => {
      expect(getCitiesOfState).toHaveBeenCalledWith('US', 'CA');
    });

    fireEvent.click(screen.getByText('Select your city'));

    const laOption = await screen.findByText('Los Angeles');
    fireEvent.click(laOption);

    expect(defaultProps.onCityChange).toHaveBeenCalledWith('Los Angeles', '34.05', '-118.24');
  });

  it('falls back to text input for city when no states available', async () => {
    (getStatesOfCountry as jest.Mock).mockResolvedValue([]);

    render(<LocationPicker {...defaultProps} country="Monaco" />);

    await waitFor(() => {
      expect(getStatesOfCountry).toHaveBeenCalledWith('MC');
    });

    expect(screen.queryByText('Select your state')).not.toBeInTheDocument();

    const cityInput = await screen.findByPlaceholderText('Enter your city name');
    expect(cityInput).toBeInTheDocument();

    fireEvent.change(cityInput, { target: { value: 'Monte Carlo' } });
    expect(defaultProps.onCityChange).toHaveBeenCalledWith('Monte Carlo', null, null);
  });

  it('filters options when searching in the dropdown', async () => {
    render(<LocationPicker {...defaultProps} />);

    await waitFor(() => {
      expect(getAllCountries).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('Select your country'));

    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search countries…');
    fireEvent.change(searchInput, { target: { value: 'can' } });

    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.queryByText('United States')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('United States')).toBeInTheDocument();
  });
});
