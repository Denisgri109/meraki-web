import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockShowConfirm = jest.fn();
const mockShowToast = jest.fn();
const mockDeleteEq = jest.fn();
const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));
const mockFrom = jest.fn(() => ({ delete: mockDelete }));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ role: 'owner' })),
}));

jest.mock('@/contexts/ModalContext', () => ({
  useModal: jest.fn(() => ({ showConfirm: mockShowConfirm })),
}));

jest.mock('@/components/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: mockShowToast })),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })),
}));

import { DeleteButton } from '../DeleteButton';
import { useAuth } from '@/contexts/AuthContext';

function renderButton(props?: Partial<React.ComponentProps<typeof DeleteButton>>) {
  return render(
    <DeleteButton
      table="products"
      id="test-123"
      entityName="product"
      {...props}
    />
  );
}

describe('DeleteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowConfirm.mockResolvedValue(true);
    mockDeleteEq.mockResolvedValue({ error: null });
  });

  it('renders nothing when role is not owner', () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'client' });
    const { container } = renderButton();
    expect(container.firstChild).toBeNull();
  });

  it('renders trash button when role is owner', () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    renderButton();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  it('click opens confirmation modal with danger type', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    renderButton();
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this product?',
        'Delete product',
        'Delete',
        'Cancel',
        'danger'
      );
    });
  });

  it('confirm triggers Supabase delete', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    renderButton();
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'test-123');
    });
  });

  it('cancel does NOT trigger delete', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    mockShowConfirm.mockResolvedValue(false);
    renderButton();
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalled();
    });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('success shows toast and calls onDeleted', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    const onDeleted = jest.fn();
    renderButton({ onDeleted });
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Deleted', 'success');
      expect(onDeleted).toHaveBeenCalled();
    });
  });

  it('error shows error toast', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    mockDeleteEq.mockResolvedValue({ error: { message: 'FK constraint violated' } });
    renderButton();
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('FK constraint violated', 'error');
    });
  });

  it('disabled prop prevents click', () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    renderButton({ disabled: true });
    const button = screen.getByTitle('Delete');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockShowConfirm).not.toHaveBeenCalled();
  });

  it('custom entityLabel appears in confirm message', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner' });
    renderButton({ entityLabel: 'Nail Polish Remover' });
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this product (Nail Polish Remover)?',
        'Delete product',
        'Delete',
        'Cancel',
        'danger'
      );
    });
  });
});
