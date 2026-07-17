import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUrlUpload } from '@/components/ImageUrlUpload';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('ImageUrlUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders URL input and upload button', () => {
    render(<ImageUrlUpload onUpload={jest.fn()} />);
    expect(screen.getByPlaceholderText('https://example.com/image.jpg')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<ImageUrlUpload onUpload={jest.fn()} label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('upload button is disabled when URL is empty', () => {
    render(<ImageUrlUpload onUpload={jest.fn()} />);
    expect(screen.getByText('Upload').closest('button')).toBeDisabled();
  });

  it('upload button is enabled when URL has text', () => {
    render(<ImageUrlUpload onUpload={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/image.jpg'), {
      target: { value: 'https://example.com/img.png' },
    });
    expect(screen.getByText('Upload').closest('button')).not.toBeDisabled();
  });

  it('calls onUpload with publicUrl on successful upload', async () => {
    const onUpload = jest.fn();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: 'https://cdn.example.com/img.png' }),
    });
    render(<ImageUrlUpload onUpload={onUpload} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/image.jpg'), {
      target: { value: 'https://example.com/img.png' },
    });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith('https://cdn.example.com/img.png'));
  });

  it('shows error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid URL format' }),
    });
    render(<ImageUrlUpload onUpload={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/image.jpg'), {
      target: { value: 'bad-url' },
    });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(screen.getByText('Invalid URL format')).toBeInTheDocument());
  });

  it('does not show error for empty URL (button is disabled)', () => {
    render(<ImageUrlUpload onUpload={jest.fn()} />);
    const input = screen.getByPlaceholderText('https://example.com/image.jpg') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    const btn = screen.getByText('Upload').closest('button');
    expect(btn).toBeDisabled();
  });

  it('shows loading state during upload', async () => {
    let resolveFetch: (v: any) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<ImageUrlUpload onUpload={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/image.jpg'), {
      target: { value: 'https://example.com/img.png' },
    });
    fireEvent.click(screen.getByText('Upload'));
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    resolveFetch!({ ok: true, json: async () => ({ publicUrl: 'url' }) });
    await waitFor(() => expect(screen.queryByText('Uploading...')).not.toBeInTheDocument());
  });

  it('clears URL after successful upload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: 'https://cdn.example.com/img.png' }),
    });
    render(<ImageUrlUpload onUpload={jest.fn()} />);
    const input = screen.getByPlaceholderText('https://example.com/image.jpg') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://example.com/img.png' } });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('Enter key triggers upload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: 'url' }),
    });
    const onUpload = jest.fn();
    render(<ImageUrlUpload onUpload={onUpload} />);
    const input = screen.getByPlaceholderText('https://example.com/image.jpg');
    fireEvent.change(input, { target: { value: 'https://example.com/img.png' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(onUpload).toHaveBeenCalled());
  });

  it('renders compact mode with different placeholder', () => {
    render(<ImageUrlUpload onUpload={jest.fn()} compact={true} />);
    expect(screen.getByPlaceholderText('Paste image URL...')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('sends correct body to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicUrl: 'url' }),
    });
    render(<ImageUrlUpload onUpload={jest.fn()} bucket="custom-bucket" pathPrefix="custom-prefix" />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/image.jpg'), {
      target: { value: 'https://example.com/img.png' },
    });
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => {
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.url).toBe('https://example.com/img.png');
      expect(body.bucket).toBe('custom-bucket');
      expect(body.pathPrefix).toBe('custom-prefix');
    });
  });
});
