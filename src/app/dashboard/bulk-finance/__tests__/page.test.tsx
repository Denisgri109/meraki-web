import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockShowConfirm = jest.fn();
const mockShowToast = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ role: 'owner', loading: false })),
}));

jest.mock('@/components/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: mockShowToast })),
}));

jest.mock('@/contexts/ModalContext', () => ({
  useModal: jest.fn(() => ({ showConfirm: mockShowConfirm })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof global.fetch;

import BulkFinancePage from '../page';
import { useAuth } from '@/contexts/AuthContext';

function renderPage() {
  return render(<BulkFinancePage />);
}

const bulkResult = { totalUsers: 5, successCount: 5, failureCount: 0, failures: [] as Array<{ userId: string; error: string }> };

describe('BulkFinancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowConfirm.mockResolvedValue(true);
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('profile-count')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ count: 5 }) });
      }
      if (url.includes('bulk-finance')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(bulkResult) });
      }
      if (url.startsWith('/api/vouchers')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ vouchers: [{ id: 'v1', code: 'SUMMER50', is_active: true }] }) });
      }
      if (url.includes('class-packages')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ packages: [{ id: 'p1', name: '10-Pack', total_credits: 10, price_cents: 10000 }] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('shows Owner Only message for non-owner', () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'client', loading: false });
    renderPage();
    expect(screen.getByText('Owner Only')).toBeInTheDocument();
    expect(screen.queryByText('Bulk Finance Operations')).not.toBeInTheDocument();
  });

  it('shows 4 operation cards for owner', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    renderPage();
    await waitFor(() => { expect(screen.getByText('Bulk Finance Operations')).toBeInTheDocument(); });
    expect(screen.getByText('Issue Vouchers')).toBeInTheDocument();
    expect(screen.getByText('Grant Credits')).toBeInTheDocument();
    expect(screen.getByText('Grant Passes')).toBeInTheDocument();
    expect(screen.getByText('Pay Vouchers')).toBeInTheDocument();
  });

  it('issue vouchers form has voucher dropdown', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    renderPage();
    await waitFor(() => { expect(screen.getByText('Select a voucher code...')).toBeInTheDocument(); });
  });

  it('grant credits form has amount input', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument(); });
  });

  it('grant passes form has package dropdown', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    renderPage();
    await waitFor(() => { expect(screen.getByText('Select a package...')).toBeInTheDocument(); });
  });

  it('pay vouchers form has EUR amount input', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText('Amount in EUR (e.g. 15.00)')).toBeInTheDocument(); });
  });

  it('confirm modal appears when issuing vouchers', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    renderPage();
    await waitFor(() => { expect(screen.getByText('Select a voucher code...')).toBeInTheDocument(); });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'SUMMER50' } });
    const issueBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Issue to'));
    expect(issueBtn).toBeDefined();
    fireEvent.click(issueBtn!);
    await waitFor(() => { expect(mockShowConfirm).toHaveBeenCalled(); });
  });

  it('cancel confirm prevents API call', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    mockShowConfirm.mockResolvedValue(false);
    renderPage();
    await waitFor(() => { expect(screen.getByText('Select a voucher code...')).toBeInTheDocument(); });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'SUMMER50' } });
    const issueBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Issue to'));
    fireEvent.click(issueBtn!);
    await waitFor(() => { expect(mockShowConfirm).toHaveBeenCalled(); });
    const issueCalls = mockFetch.mock.calls.filter((c: unknown[]) => String(c[0]).includes('issue-vouchers'));
    expect(issueCalls.length).toBe(0);
  });

  it('success shows summary toast', async () => {
    (useAuth as jest.Mock).mockReturnValue({ role: 'owner', loading: false });
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument(); });
    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '10' } });
    const grantBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Grant to'));
    expect(grantBtn).toBeDefined();
    fireEvent.click(grantBtn!);
    await waitFor(() => { expect(mockShowToast).toHaveBeenCalledWith('Granted to 5/5 accounts', 'success'); });
  });
});
