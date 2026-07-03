import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CountryCodeDropdown from '../CountryCodeDropdown';
import { SUPPORTED_COUNTRIES } from '@/lib/validation';

describe('CountryCodeDropdown', () => {
  const mockOnSelectCountryCode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the selected country correctly', () => {
    const selectedCountry = SUPPORTED_COUNTRIES[0]; // IE
    render(
      <CountryCodeDropdown
        selectedCountryCode={selectedCountry.code}
        onSelectCountryCode={mockOnSelectCountryCode}
      />
    );

    // Verify flag and calling code are rendered
    expect(screen.getByText(selectedCountry.flag)).toBeInTheDocument();
    expect(screen.getByText(selectedCountry.callingCode)).toBeInTheDocument();
  });

  it('opens the dropdown when clicked', async () => {
    const user = userEvent.setup();
    const selectedCountry = SUPPORTED_COUNTRIES[0];

    render(
      <CountryCodeDropdown
        selectedCountryCode={selectedCountry.code}
        onSelectCountryCode={mockOnSelectCountryCode}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // The dropdown should now be visible with all countries
    for (const country of SUPPORTED_COUNTRIES) {
      expect(screen.getByText(country.name)).toBeInTheDocument();
    }
  });

  it('calls onSelectCountryCode and closes when a country is selected', async () => {
    const user = userEvent.setup();
    const selectedCountry = SUPPORTED_COUNTRIES[0]; // IE
    const countryToSelect = SUPPORTED_COUNTRIES[1]; // GB

    render(
      <CountryCodeDropdown
        selectedCountryCode={selectedCountry.code}
        onSelectCountryCode={mockOnSelectCountryCode}
      />
    );

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click on another country
    const option = screen.getByText(countryToSelect.name);
    await user.click(option);

    expect(mockOnSelectCountryCode).toHaveBeenCalledWith(countryToSelect.code);
    expect(mockOnSelectCountryCode).toHaveBeenCalledTimes(1);

    // The dropdown should be closed, so the name shouldn't be in the document
    expect(screen.queryByText(countryToSelect.name)).not.toBeInTheDocument();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    const selectedCountry = SUPPORTED_COUNTRIES[0];

    render(
      <CountryCodeDropdown
        selectedCountryCode={selectedCountry.code}
        onSelectCountryCode={mockOnSelectCountryCode}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    await user.click(button);

    // Dropdown should not be open
    expect(screen.queryByText(SUPPORTED_COUNTRIES[1].name)).not.toBeInTheDocument();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    const selectedCountry = SUPPORTED_COUNTRIES[0];

    render(
      <div>
        <div data-testid="outside">Outside Element</div>
        <CountryCodeDropdown
          selectedCountryCode={selectedCountry.code}
          onSelectCountryCode={mockOnSelectCountryCode}
        />
      </div>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Dropdown is open
    expect(screen.getByText(SUPPORTED_COUNTRIES[1].name)).toBeInTheDocument();

    // Click outside
    await user.click(screen.getByTestId('outside'));

    // Dropdown is closed
    expect(screen.queryByText(SUPPORTED_COUNTRIES[1].name)).not.toBeInTheDocument();
  });
});
