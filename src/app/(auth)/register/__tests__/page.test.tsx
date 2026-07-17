import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegisterPage from '../page';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getAllCountries, getStatesOfCountry } from '@/lib/locationApi';
import type { Country, State } from '@/lib/locationApi';

// ─── Test data ──────────────────────────────────────────────────────────────

const mockCountries: Country[] = [
  { id: 1, name: 'Ireland', iso2: 'IE', iso3: 'IRL', phonecode: '353', capital: 'Dublin', currency: 'EUR', currency_symbol: '€', timezones: [] },
  { id: 2, name: 'United Kingdom', iso2: 'GB', iso3: 'GBR', phonecode: '44', capital: 'London', currency: 'GBP', currency_symbol: '£', timezones: [] },
];

const mockStates: State[] = [
  { id: 1, name: 'Dublin', iso2: 'D', country_code: 'IE', country_id: 1, latitude: '53.3', longitude: '-6.2' },
  { id: 2, name: 'Cork', iso2: 'C', country_code: 'IE', country_id: 1, latitude: '51.9', longitude: '-8.5' },
];

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockSignUp = jest.fn();
const mockSearchParamsGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/locationApi', () => ({
  getAllCountries: jest.fn(),
  getStatesOfCountry: jest.fn(),
}));

jest.mock('@/components/CountryCodeDropdown', () => ({
  __esModule: true,
  default: ({ selectedCountryCode }: { selectedCountryCode: string }) => (
    <div data-testid="country-code-dropdown" data-country-code={selectedCountryCode} />
  ),
}));

// ─── Supabase mock ──────────────────────────────────────────────────────────

function makeMockSupabase() {
  const mockEq = jest.fn().mockResolvedValue({});
  const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      resend: jest.fn().mockResolvedValue({}),
    },
    from: mockFrom,
    _mockUpdate: mockUpdate,
    _mockEq: mockEq,
  };
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  mockSearchParamsGet.mockReturnValue(null);

  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSearchParams as jest.Mock).mockReturnValue({ get: mockSearchParamsGet });
  (useAuth as jest.Mock).mockReturnValue({ signUp: mockSignUp });

  const mockSupabase = makeMockSupabase();
  (createClient as jest.Mock).mockReturnValue(mockSupabase);

  (getAllCountries as jest.Mock).mockResolvedValue(mockCountries);
  (getStatesOfCountry as jest.Mock).mockResolvedValue(mockStates);
});

// ─── Helper ─────────────────────────────────────────────────────────────────

/** Renders RegisterPage and waits for countries to load. */
async function renderRegister() {
  await act(async () => {
    render(<RegisterPage />);
  });
  await waitFor(() => {
    expect(getAllCountries).toHaveBeenCalled();
  });
  await waitFor(() => {
    expect(screen.getByPlaceholderText('Select your country')).toBeInTheDocument();
  });
}

async function selectLocation(countryName: string, stateName: string) {
  fireEvent.focus(screen.getByPlaceholderText('Select your country'));
  fireEvent.click(screen.getByText(countryName));

  await waitFor(() => screen.getByPlaceholderText('Select your state'));
  fireEvent.focus(screen.getByPlaceholderText('Select your state'));
  fireEvent.click(screen.getByText(stateName));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {

  // ── Rendering ───────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the brand header', async () => {
      await renderRegister();
      expect(screen.getByText('Merakí')).toBeInTheDocument();
      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByText('Join the Merakí community')).toBeInTheDocument();
    });

    it('renders all form inputs and labels', async () => {
      await renderRegister();

      expect(screen.getByPlaceholderText('Julianne Moore')).toBeInTheDocument(); // Full name
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument(); // Email
      expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument(); // Password
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument(); // Confirm password
      expect(screen.getByPlaceholderText('Select your country')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('defaults to client role', async () => {
      await renderRegister();

      const clientButton = screen.getByText('Client').closest('button')!;
      expect(clientButton).toHaveStyle({ border: '2px solid var(--color-primary)' });
    });

    it('renders the sign-in link', async () => {
      await renderRegister();
      const signInLink = screen.getByText('Sign In').closest('a');
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('renders the terms of service and privacy policy links', async () => {
      await renderRegister();
      expect(screen.getByText('Terms of Service').closest('a')).toHaveAttribute('href', '/terms-of-service');
      expect(screen.getByText('Privacy Policy').closest('a')).toHaveAttribute('href', '/privacy-policy');
    });

    it('shows the invite banner when invited=true', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'invited') return 'true';
        if (key === 'role') return 'master';
        if (key === 'email') return 'invited@example.com';
        return null;
      });

      await renderRegister();

      expect(screen.getByText(/You've been invited!/i)).toBeInTheDocument();
    });

    it('does not show the invite banner when invited is not true', async () => {
      await renderRegister();
      expect(screen.queryByText(/You've been invited!/i)).not.toBeInTheDocument();
    });

    it('shows loading placeholder for country while loading', async () => {
      // Never resolve getAllCountries so loading persists
      (getAllCountries as jest.Mock).mockReturnValue(new Promise(() => {}));

      await act(async () => {
        render(<RegisterPage />);
      });

      expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
    });

    it('renders the CountryCodeDropdown component', async () => {
      await renderRegister();
      expect(screen.getByTestId('country-code-dropdown')).toBeInTheDocument();
    });
  });

  // ── Role Selection ──────────────────────────────────────────────────────

  describe('Role Selection', () => {
    it('switches to professional role on click', async () => {
      await renderRegister();

      const professionalButton = screen.getByText('Professional').closest('button')!;
      fireEvent.click(professionalButton);

      expect(professionalButton).toHaveStyle({ border: '2px solid var(--color-primary)' });

      const clientButton = screen.getByText('Client').closest('button')!;
      expect(clientButton).not.toHaveStyle({ border: '2px solid var(--color-primary)' });
    });

    it('switches back to client role on click', async () => {
      await renderRegister();

      const professionalButton = screen.getByText('Professional').closest('button')!;
      fireEvent.click(professionalButton);

      const clientButton = screen.getByText('Client').closest('button')!;
      fireEvent.click(clientButton);

      expect(clientButton).toHaveStyle({ border: '2px solid var(--color-primary)' });
      expect(professionalButton).not.toHaveStyle({ border: '2px solid var(--color-primary)' });
    });

    it('pre-selects master role when invited as master', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'invited') return 'true';
        if (key === 'role') return 'master';
        if (key === 'email') return 'invited@example.com';
        return null;
      });

      await renderRegister();

      const professionalButton = screen.getByText('Professional').closest('button')!;
      expect(professionalButton).toHaveStyle({ border: '2px solid var(--color-primary)' });
    });

    it('pre-selects client role when invited role is not master', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'invited') return 'true';
        if (key === 'role') return 'client';
        return null;
      });

      await renderRegister();

      const clientButton = screen.getByText('Client').closest('button')!;
      expect(clientButton).toHaveStyle({ border: '2px solid var(--color-primary)' });
    });

    it('locks role selection when invited', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'invited') return 'true';
        if (key === 'role') return 'master';
        if (key === 'email') return 'invited@example.com';
        return null;
      });

      await renderRegister();

      const clientButton = screen.getByText('Client').closest('button')!;
      fireEvent.click(clientButton);

      // Should still be on master
      const professionalButton = screen.getByText('Professional').closest('button')!;
      expect(professionalButton).toHaveStyle({ border: '2px solid var(--color-primary)' });
      expect(clientButton).not.toHaveStyle({ border: '2px solid var(--color-primary)' });
    });
  });

  // ── Form Validation ─────────────────────────────────────────────────────

  describe('Form Validation', () => {
    it('shows error for empty full name on submit', async () => {
      await renderRegister();

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Full name is required')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for short full name (less than 2 chars)', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'A' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for invalid email', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'not-an-email' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for empty email', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Email is required')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for short password (less than 6 chars)', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for empty password', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Password is required')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for mismatched passwords', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'different123' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for missing country', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Please select your country')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error for invalid phone when provided', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      // Enter a phone that's too short for IE (less than 7 digits)
      fireEvent.change(screen.getByPlaceholderText('87 123 4567'), { target: { value: '12' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Irish phone numbers must be 7-10 digits')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('does not require phone (optional field)', async () => {
      await renderRegister();

      // Fill everything except phone
      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

      await selectLocation('Ireland', 'Dublin');

      // Accept TOS
      fireEvent.click(screen.getByRole('checkbox'));

      mockSignUp.mockResolvedValueOnce({ error: null });
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });
    });

    it('clears field error when user starts typing', async () => {
      await renderRegister();

      const nameInput = screen.getByPlaceholderText('Julianne Moore');
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      expect(await screen.findByText('Full name is required')).toBeInTheDocument();

      fireEvent.change(nameInput, { target: { value: 'J' } });
      expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
    });

    it('shows multiple errors simultaneously', async () => {
      await renderRegister();

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please select your country')).toBeInTheDocument();
    });
  });

  // ── Password Strength ───────────────────────────────────────────────────

  describe('Password Strength', () => {
    it('shows strength meter when password is entered', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'abc' } });

      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('does not show strength meter when password is empty', async () => {
      await renderRegister();

      expect(screen.queryByText('Weak')).not.toBeInTheDocument();
      expect(screen.queryByText('Medium')).not.toBeInTheDocument();
      expect(screen.queryByText('Strong')).not.toBeInTheDocument();
    });

    it('shows Weak for short password with digit', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'abc123' } });

      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('shows Medium for 8-char password with uppercase but no digit', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'Abcdefgh' } });

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('shows Strong for 8-char password with uppercase and digit', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'Abcdef12' } });

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('shows Strong for password with uppercase, digit, and special char', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'Abcdef1!' } });

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  // ── Password Visibility Toggle ──────────────────────────────────────────

  describe('Password Visibility', () => {
    it('toggles password visibility on click', async () => {
      await renderRegister();

      const passwordInput = screen.getByPlaceholderText('Min. 6 characters');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: 'Show password' });
      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // ── TOS Acceptance ──────────────────────────────────────────────────────

  describe('TOS Acceptance', () => {
    it('shows error when TOS not accepted on valid form', async () => {
      await renderRegister();

      // Fill valid form
      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

      await selectLocation('Ireland', 'Dublin');

      // Don't accept TOS
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Please accept the Terms of Service to continue.')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('accepts TOS on click', async () => {
      await renderRegister();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(checkbox);
      expect(checkbox).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(checkbox);
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    it('accepts TOS on Space key', async () => {
      await renderRegister();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      fireEvent.keyDown(checkbox, { key: ' ' });
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('accepts TOS on Enter key', async () => {
      await renderRegister();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      fireEvent.keyDown(checkbox, { key: 'Enter' });
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('does not toggle on other keys', async () => {
      await renderRegister();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.keyDown(checkbox, { key: 'Tab' });
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  });

  // ── Registration Flow ───────────────────────────────────────────────────

  describe('Registration Flow', () => {
    function mockSupabaseFromCreate() {
      const supabase = (createClient as jest.Mock).mock.results[0]?.value;
      return supabase;
    }

    async function fillValidForm() {
      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'Test@Example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

      await selectLocation('Ireland', 'Dublin');

      fireEvent.click(screen.getByRole('checkbox'));
    }

    it('calls signUp with client role and correct params on valid form', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'John Doe',
          'client',
          true,
          '1.0'
        );
      });
    });

    it('calls signUp with master role when professional is selected', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      fireEvent.click(screen.getByText('Professional').closest('button')!);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'John Doe',
          'master',
          true,
          '1.0'
        );
      });
    });

    it('normalizes email to lowercase and trims whitespace', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.any(Boolean),
          expect.any(String)
        );
      });
    });

    it('trims full name before passing to signUp', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: '  John Doe  ' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

      await selectLocation('Ireland', 'Dublin');
      fireEvent.click(screen.getByRole('checkbox'));

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          'John Doe',
          expect.any(String),
          expect.any(Boolean),
          expect.any(String)
        );
      });
    });

    it('updates profile with location data after successful signUp', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        const supabase = mockSupabaseFromCreate();
        expect(supabase.from).toHaveBeenCalledWith('profiles');
      });
    });

    it('resends signup OTP after successful registration', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        const supabase = mockSupabaseFromCreate();
        expect(supabase.auth.resend).toHaveBeenCalledWith({
          type: 'signup',
          email: 'test@example.com',
        });
      });
    });

    it('redirects to verify page with encoded email on success', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify?email=test%40example.com');
      });
    });

    it('shows database error message when signUp fails with database error', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: { message: 'Database error creating account' } });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Database error creating account. Please try again or contact support.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows already registered message when email exists', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: { message: 'User already registered' } });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('This email is already registered. Please sign in instead.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows already registered message when email already exists (alternate wording)', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: { message: 'Email already exists in the system' } });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('This email is already registered. Please sign in instead.')).toBeInTheDocument();
    });

    it('shows weak password message when signUp fails with password error', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: { message: 'Password should be at least 6 characters' } });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Password is too weak. Please use at least 6 characters.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows generic error message for unknown signUp errors', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: { message: 'Something went wrong' } });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('disables submit button and shows loading state during registration', async () => {
      await renderRegister();

      let resolveSignUp!: (value: any) => void;
      mockSignUp.mockImplementation(() => new Promise(resolve => { resolveSignUp = resolve; }));

      await fillValidForm();
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      (resolveSignUp as any)({ error: null });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });

    it('re-enables submit button after signUp failure', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: { message: 'Some error' } });

      await fillValidForm();
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('does not call signUp when TOS is not accepted', async () => {
      await renderRegister();

      fireEvent.change(screen.getByPlaceholderText('Julianne Moore'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
      await selectLocation('Ireland', 'Dublin');

      // Don't accept TOS
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      expect(await screen.findByText('Please accept the Terms of Service to continue.')).toBeInTheDocument();
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('passes tosAccepted=true and tosVersion=1.0 to signUp', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.any(String),
          true,
          '1.0'
        );
      });
    });

    it('passes phone as null when phone is empty', async () => {
      await renderRegister();
      mockSignUp.mockResolvedValueOnce({ error: null });

      await fillValidForm();
      // Phone field is left empty
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        const supabase = mockSupabaseFromCreate();
        expect(supabase.from).toHaveBeenCalledWith('profiles');
      });
    });
  });

});
