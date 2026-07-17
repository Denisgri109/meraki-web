import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PilatesWaiverFormSheet from '@/components/PilatesWaiverFormSheet';

jest.mock('@/hooks/usePilatesWaiver', () => ({
  usePilatesWaiver: jest.fn(() => ({
    submitWaiver: jest.fn(() => Promise.resolve()),
    submitting: false,
  })),
}));

jest.mock('@/components/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

import { usePilatesWaiver } from '@/hooks/usePilatesWaiver';
import { useToast } from '@/components/Toast';

describe('PilatesWaiverFormSheet', () => {
  let mockSubmitWaiver: jest.Mock;
  let mockShowToast: jest.Mock;
  let mockOnSigned: jest.Mock;
  let mockOnDismiss: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitWaiver = jest.fn(() => Promise.resolve());
    mockShowToast = jest.fn();
    mockOnSigned = jest.fn();
    mockOnDismiss = jest.fn();
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      submitWaiver: mockSubmitWaiver,
      submitting: false,
    });
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
  });

  it('returns null when closed', () => {
    const { container } = render(
      <PilatesWaiverFormSheet open={false} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when open', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders Health Screening & Waiver heading', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(screen.getByText('Health Screening & Waiver')).toBeInTheDocument();
  });

  it('renders all 10 health screening question labels', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(screen.getByText(/Do you have any injuries or joint problems/i)).toBeInTheDocument();
    expect(screen.getByText(/What is your Pilates experience/i)).toBeInTheDocument();
    expect(screen.getByText(/Have you had any illnesses or disabilities/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you pregnant/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you on any medication/i)).toBeInTheDocument();
    expect(screen.getByText(/exercise history/i)).toBeInTheDocument();
    expect(screen.getByText(/recommended to do Pilates/i)).toBeInTheDocument();
    expect(screen.getByText(/hoping to achieve/i)).toBeInTheDocument();
    expect(screen.getByText(/Osteoporosis or Osteopenia/i)).toBeInTheDocument();
  });

  it('renders Pilates experience placeholder', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(
      screen.getByPlaceholderText(/Some Mat Pilates.*Some Reformer/i),
    ).toBeInTheDocument();
  });

  it('shows illness details textarea when Yes is selected for Q3', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    const yesButtons = screen.getAllByText('Yes');
    fireEvent.click(yesButtons[0]);
    expect(
      screen.getByPlaceholderText(/Provide details about your illness/i),
    ).toBeInTheDocument();
  });

  it('does not show illness details when No is selected for Q3', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    const noButtons = screen.getAllByText('No');
    fireEvent.click(noButtons[0]);
    expect(
      screen.queryByPlaceholderText(/Provide details about your illness/i),
    ).not.toBeInTheDocument();
  });

  it('renders consent checkboxes', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(screen.getByLabelText(/General Terms of Use/i)).toBeInTheDocument();
  });

  it('renders waiver text block', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(
      screen.getByText(/feel free to mention anything else/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/answered honestly the pre-exercise health screening/i),
    ).toBeInTheDocument();
  });

  it('renders agreement checkbox', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(screen.getByLabelText(/I understand and agree to the above terms/i)).toBeInTheDocument();
  });

  it('renders Sign & Continue button', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    expect(screen.getByText('Sign & Continue')).toBeInTheDocument();
  });

  it('shows validation errors on submit with empty fields', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    fireEvent.click(screen.getByText('Sign & Continue'));
    expect(screen.getByText(/Please describe any injuries/i)).toBeInTheDocument();
    expect(screen.getByText(/Please describe your Pilates experience/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Please select Yes or No/i)).toHaveLength(3);
    expect(screen.getByText(/Please select an option/i)).toBeInTheDocument();
    expect(screen.getByText(/You must agree to the Terms of Use/i)).toBeInTheDocument();
    expect(screen.getByText(/You must agree to the liability waiver/i)).toBeInTheDocument();
    expect(screen.getByText(/Please enter a contact name/i)).toBeInTheDocument();
    expect(screen.getByText(/Please enter the relationship/i)).toBeInTheDocument();
    expect(screen.getByText(/Please enter a valid phone number/i)).toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  const fillAllRequired = () => {
    fireEvent.change(screen.getByPlaceholderText(/Describe any injuries/i), {
      target: { value: 'None' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Some Mat Pilates/i), {
      target: { value: 'Beginner' },
    });
    screen.getAllByText('No').forEach((btn) => fireEvent.click(btn));
    fireEvent.change(screen.getByPlaceholderText(/List any medication/i), {
      target: { value: 'None' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Running 3x/i), {
      target: { value: 'Walking daily' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Improve core strength/i), {
      target: { value: 'Better posture' },
    });
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Spouse, Parent/i), {
      target: { value: 'Spouse' },
    });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), {
      target: { value: '+353861234567' },
    });
    fireEvent.click(screen.getByLabelText(/General Terms of Use/i));
    fireEvent.click(screen.getByLabelText(/I understand and agree to the above terms/i));
  };

  it('calls onSigned after successful submission', async () => {
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    fillAllRequired();
    fireEvent.click(screen.getByText('Sign & Continue'));
    await waitFor(() => expect(mockOnSigned).toHaveBeenCalled());
    expect(mockShowToast).toHaveBeenCalledWith(
      'Waiver signed successfully!',
      'success',
    );
  });

  it('shows error text on submission failure', async () => {
    mockSubmitWaiver.mockRejectedValueOnce(new Error('Network error'));
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    fillAllRequired();
    fireEvent.click(screen.getByText('Sign & Continue'));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('does not call onSigned on submission failure', async () => {
    mockSubmitWaiver.mockRejectedValueOnce(new Error('Network error'));
    render(
      <PilatesWaiverFormSheet open={true} onSigned={mockOnSigned} onDismiss={mockOnDismiss} />,
    );
    fillAllRequired();
    fireEvent.click(screen.getByText('Sign & Continue'));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    expect(mockOnSigned).not.toHaveBeenCalled();
  });
});
