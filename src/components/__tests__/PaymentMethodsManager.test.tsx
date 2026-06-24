
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentMethodsManager from '../PaymentMethodsManager';

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    if (/An update to.*inside a test was not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});


// Mock Lucide icons
jest.mock('lucide-react', () => ({
  CreditCard: () => <div data-testid="icon-credit-card" />,
  Plus: () => <div data-testid="icon-plus" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Star: () => <div data-testid="icon-star" />,
  Loader2: () => <div data-testid="icon-loader" />,
  X: () => <div data-testid="icon-x" />,
  Shield: () => <div data-testid="icon-shield" />,
}));

// Mock Stripe Elements
jest.mock('@stripe/react-stripe-js', () => {
  const actual = jest.requireActual('@stripe/react-stripe-js');
  return {
    ...actual,
    Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
    CardElement: () => <div data-testid="card-element" />,
    useStripe: jest.fn(),
    useElements: jest.fn(),
  };
});

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({})),
}));

// Mock contexts
const mockRefreshProfile = jest.fn();
let currentProfile = { stripe_customer_id: 'cus_123', email: 'test@example.com' };

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: currentProfile,
    refreshProfile: mockRefreshProfile,
  }),
}));

const mockShowToast = jest.fn();
jest.mock('@/components/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockShowConfirm = jest.fn();
jest.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
}));

// Mock Supabase
const mockInvoke = jest.fn();
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    functions: {
      invoke: mockInvoke,
    },
  }),
}));

const mockStripe = {
  confirmCardSetup: jest.fn(),
};

const mockElements = {
  getElement: jest.fn(),
};

describe('PaymentMethodsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    currentProfile = { stripe_customer_id: 'cus_123', email: 'test@example.com' };

    const { useStripe, useElements } = require('@stripe/react-stripe-js') as any; // eslint-disable-line
    useStripe.mockReturnValue(mockStripe);
    useElements.mockReturnValue(mockElements);
    mockElements.getElement.mockReturnValue({ clear: jest.fn() });

    mockInvoke.mockImplementation(async (funcName) => {
      if (funcName === 'list-payment-methods') {
        return { data: { paymentMethods: [] }, error: null };
      }
      return { data: null, error: null };
    });
  });

  it('renders loading state initially', async () => {
    // Delay the mock slightly to catch the loading state
    mockInvoke.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: { paymentMethods: [] }, error: null }), 100)));

    render(<PaymentMethodsManager />);
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
  });

  it('renders empty state when no cards are returned', async () => {
    render(<PaymentMethodsManager />);

    await waitFor(() => {
      expect(screen.getByText('No saved cards')).toBeInTheDocument();
    });
    expect(screen.getByText('Add a payment method to speed up future bookings')).toBeInTheDocument();
  });

  it('renders a list of cards when cards exist', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        paymentMethods: [
          { id: 'pm_1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2024, isDefault: true },
          { id: 'pm_2', brand: 'mastercard', last4: '5555', expMonth: 10, expYear: 2025, isDefault: false },
        ]
      },
      error: null
    });

    render(<PaymentMethodsManager />);

    await waitFor(() => {
      expect(screen.getByText('•••• 4242')).toBeInTheDocument();
    });

    expect(screen.getByText('•••• 5555')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Expires 12/2024')).toBeInTheDocument();
    expect(screen.getByText('Visa')).toBeInTheDocument();
    expect(screen.getByText('Mastercard')).toBeInTheDocument();
  });

  it('handles setting a card as default', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        paymentMethods: [
          { id: 'pm_1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2024, isDefault: false },
        ]
      },
      error: null
    });

    mockInvoke.mockImplementation(async (funcName) => {
      if (funcName === 'set-default-payment-method') {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    render(<PaymentMethodsManager />);

    await waitFor(() => {
      expect(screen.getByText('•••• 4242')).toBeInTheDocument();
    });

    const setAsDefaultButton = screen.getByTitle('Set as default');
    fireEvent.click(setAsDefaultButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set-default-payment-method', {
        body: { payment_method_id: 'pm_1' },
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith('Default card updated', 'success');
  });

  it('handles deleting a card', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        paymentMethods: [
          { id: 'pm_1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2024, isDefault: false },
        ]
      },
      error: null
    });

    mockShowConfirm.mockResolvedValueOnce(true);

    render(<PaymentMethodsManager />);

    await waitFor(() => {
      expect(screen.getByText('•••• 4242')).toBeInTheDocument();
    });

    const removeButton = screen.getByTitle('Remove card');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Remove this card? This cannot be undone.', 'Remove Card', 'Remove', 'Cancel', 'danger'
      );
    });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('delete-payment-method', {
        body: { payment_method_id: 'pm_1' },
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith('Card removed', 'success');
  });

  it('handles showing the add form', async () => {
    render(<PaymentMethodsManager />);

    await waitFor(() => {
      expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Payment Method'));

    expect(screen.getByText('Add New Card')).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('handles adding a new card successfully', async () => {
    render(<PaymentMethodsManager />);

    await waitFor(() => {
      expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Payment Method'));

    mockInvoke.mockImplementation(async (funcName) => {
      if (funcName === 'setup-intent') {
        return { data: { clientSecret: 'secret_123' }, error: null };
      }
      if (funcName === 'list-payment-methods') {
        return { data: { paymentMethods: [] }, error: null };
      }
      return { data: null, error: null };
    });

    mockStripe.confirmCardSetup.mockResolvedValueOnce({
      setupIntent: { payment_method: 'new_pm_123' },
      error: null,
    });

    const saveButton = screen.getByRole('button', { name: /save card/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('setup-intent', {
        body: { customer_id: 'cus_123', user_email: 'test@example.com' },
      });
    });

    expect(mockStripe.confirmCardSetup).toHaveBeenCalledWith('secret_123', {
      payment_method: { card: expect.any(Object) },
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Card added successfully', 'success');
    });
  });

  it('calls refreshProfile if profile has no stripe_customer_id', async () => {
    currentProfile = { stripe_customer_id: '', email: 'test@example.com' };

    render(<PaymentMethodsManager />);

    await waitFor(() => {
      expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Payment Method'));

    mockInvoke.mockImplementation(async (funcName) => {
      if (funcName === 'setup-intent') {
        return { data: { clientSecret: 'secret_123' }, error: null };
      }
      if (funcName === 'list-payment-methods') {
        return { data: { paymentMethods: [] }, error: null };
      }
      return { data: null, error: null };
    });

    mockStripe.confirmCardSetup.mockResolvedValueOnce({
      setupIntent: { payment_method: 'new_pm_123' },
      error: null,
    });

    const saveButton = screen.getByRole('button', { name: /save card/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockRefreshProfile).toHaveBeenCalled();
    });
  });
});
