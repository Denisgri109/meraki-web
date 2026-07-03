import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockSignIn = jest.fn();

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
    });
  });

  describe('Rendering', () => {
    it('renders the brand header', () => {
      render(<LoginPage />);
      expect(screen.getByText('Merakí')).toBeInTheDocument();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to continue your journey')).toBeInTheDocument();
    });

    it('renders form inputs and buttons', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');

      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');

      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  describe('Form Interaction & Validation', () => {
    it('shows error when fields are empty', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('toggles password visibility', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: 'Show password' });
      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('updates email and password state on change', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');

      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Auth Interaction', () => {
    it('calls signIn and redirects on success', async () => {
      mockSignIn.mockResolvedValueOnce({ error: null });
      render(<LoginPage />);

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('shows error message if signIn fails', async () => {
      mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } });
      render(<LoginPage />);

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpassword' } });

      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('disables submit button and shows loading spinner during signIn', async () => {
      // Create a promise that we can resolve manually to control the loading state
      let resolveSignIn: (value: any) => void;
      mockSignIn.mockImplementation(() => new Promise(resolve => {
        resolveSignIn = resolve;
      }));

      render(<LoginPage />);

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);

      // Button should be disabled immediately after click
      expect(submitButton).toBeDisabled();

      // Resolve the sign in promise
      // @ts-ignore
      resolveSignIn({ error: null });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
