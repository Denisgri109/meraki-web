import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QrPayMethodsManager } from '@/components/QrPayMethodsManager';

jest.mock('@/components/Toast', () => ({
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

jest.mock('@/components/ImageUrlUpload', () => ({
  ImageUrlUpload: ({ onUpload }: { onUpload: (url: string) => void }) => (
    <div data-testid="url-upload">
      <button onClick={() => onUpload('https://cdn.test/qr.png')}>Mock Upload</button>
    </div>
  ),
}));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-svg">{value}</div>,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

function mockFetchResponse(data: any, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    json: async () => data,
  });
}

describe('QrPayMethodsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<QrPayMethodsManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no codes', async () => {
    mockFetchResponse({ codes: [] });
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(screen.getByText('No payment methods yet')).toBeInTheDocument();
    });
  });

  it('shows Add Method button', async () => {
    mockFetchResponse({ codes: [] });
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(screen.getByText('Add Method')).toBeInTheDocument();
    });
  });

  it('shows Add your first method button in empty state', async () => {
    mockFetchResponse({ codes: [] });
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(screen.getByText('Add your first method')).toBeInTheDocument();
    });
  });

  it('renders codes list when loaded', async () => {
    mockFetchResponse({
      codes: [
        {
          id: 'c1',
          provider_name: 'Revolut',
          qr_image_url: 'https://cdn.test/revolut.png',
          qr_payload: null,
          display_order: 0,
          is_active: true,
        },
        {
          id: 'c2',
          provider_name: 'Bizum',
          qr_image_url: null,
          qr_payload: 'tel:+34600123456',
          display_order: 1,
          is_active: false,
        },
      ],
    });
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(screen.getByText('Revolut')).toBeInTheDocument();
      expect(screen.getByText('Bizum')).toBeInTheDocument();
    });
  });

  it('shows active count in header', async () => {
    mockFetchResponse({
      codes: [
        { id: 'c1', provider_name: 'A', qr_image_url: null, qr_payload: 'p', display_order: 0, is_active: true },
        { id: 'c2', provider_name: 'B', qr_image_url: null, qr_payload: 'p', display_order: 1, is_active: false },
      ],
    });
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(screen.getByText('1 active')).toBeInTheDocument();
      expect(screen.getByText('2 total')).toBeInTheDocument();
    });
  });

  it('shows Active badge for active codes', async () => {
    mockFetchResponse({
      codes: [
        { id: 'c1', provider_name: 'Active', qr_image_url: null, qr_payload: 'p', display_order: 0, is_active: true },
      ],
    });
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    });
  });

  it('shows Hidden badge for inactive codes', async () => {
    mockFetchResponse({
      codes: [
        { id: 'c1', provider_name: 'Hidden', qr_image_url: null, qr_payload: 'p', display_order: 0, is_active: false },
      ],
    });
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(screen.getAllByText('Hidden').length).toBeGreaterThan(0);
    });
  });

  it('opens add modal when Add Method clicked', async () => {
    mockFetchResponse({ codes: [] });
    render(<QrPayMethodsManager />);
    await waitFor(() => expect(screen.getByText('Add Method')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Method'));
    expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Revolut/i)).toBeInTheDocument();
  });

  it('shows error toast on fetch failure', async () => {
    const mockShowToast = jest.fn();
    require('@/components/Toast').useToast.mockReturnValue({ showToast: mockShowToast });
    mockFetchResponse({ error: 'Unauthorized' }, false);
    render(<QrPayMethodsManager />);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Unauthorized', 'error');
    });
  });
});
