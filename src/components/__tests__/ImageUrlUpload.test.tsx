import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUrlUpload } from '../ImageUrlUpload';

describe('ImageUrlUpload', () => {
  const mockOnUpload = jest.fn();
  let originalConsoleError: typeof console.error;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = (...args) => {
      if (/not wrapped in act/.test(args[0])) {
        return;
      }
      originalConsoleError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clear pending timers to avoid state updates after test completes
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders normal mode with correct labels and placeholders', () => {
      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      expect(screen.getByText('Add image by URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com/image.jpg')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    });

    it('renders normal mode with custom label', () => {
      render(<ImageUrlUpload onUpload={mockOnUpload} label="Custom Label" />);

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('renders compact mode with correct placeholder and button', () => {
      render(<ImageUrlUpload onUpload={mockOnUpload} compact />);

      expect(screen.getByPlaceholderText('Paste image URL...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
      expect(screen.queryByText('Add image by URL')).not.toBeInTheDocument();
    });
  });

  describe('Input and Validation', () => {
    it('updates input value when typing', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      const input = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(input, 'https://example.com/test.png');

      expect(input).toHaveValue('https://example.com/test.png');
    });

    it('disables the upload button when URL is empty', () => {
      render(<ImageUrlUpload onUpload={mockOnUpload} />);
      const button = screen.getByRole('button', { name: 'Upload' });
      expect(button).toBeDisabled();
    });

    it('disables the upload button when URL is only whitespace', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      const input = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(input, '   ');

      const button = screen.getByRole('button', { name: 'Upload' });
      expect(button).toBeDisabled();
    });

    it('shows error and does not call fetch when pressing Enter on empty URL', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      const input = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(input, '{enter}');

      expect(screen.getByText('Please paste an image URL')).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Upload Scenarios', () => {
    it('handles successful upload', async () => {
      const user = userEvent.setup({ delay: null });
      const publicUrl = 'http://example.com/image-public.jpg';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publicUrl }),
      });

      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      const input = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(input, 'http://example.com/image.jpg');

      const button = screen.getByRole('button', { name: 'Upload' });
      await user.click(button);

      expect(global.fetch).toHaveBeenCalledWith('/api/upload-image-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'http://example.com/image.jpg',
          bucket: 'site-images',
          pathPrefix: 'uploads',
        }),
      });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(publicUrl);
        expect(screen.getByText('Added!')).toBeInTheDocument();
        expect(input).toHaveValue(''); // input cleared on success
      });

      // Verify the success text goes away after the timeout
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      await waitFor(() => {
        expect(screen.queryByText('Added!')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
      });
    });

    it('handles successful upload in compact mode', async () => {
      const user = userEvent.setup({ delay: null });
      const publicUrl = 'http://example.com/image-public.jpg';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publicUrl }),
      });

      render(<ImageUrlUpload onUpload={mockOnUpload} compact />);

      const input = screen.getByPlaceholderText('Paste image URL...');
      await user.type(input, 'http://example.com/image.jpg');

      const button = screen.getByRole('button', { name: 'Add' });
      await user.click(button);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(publicUrl);
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });

    it('handles failed upload with API error message', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid URL format' }),
      });

      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      const input = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(input, 'invalid-url');

      const button = screen.getByRole('button', { name: 'Upload' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });
      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('handles failed upload with generic error message', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}), // Missing error property
      });

      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      const input = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(input, 'http://example.com/image.jpg');

      const button = screen.getByRole('button', { name: 'Upload' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('handles network error', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      render(<ImageUrlUpload onUpload={mockOnUpload} />);

      const input = screen.getByPlaceholderText('https://example.com/image.jpg');
      await user.type(input, 'http://example.com/image.jpg');

      const button = screen.getByRole('button', { name: 'Upload' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
      });
      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });
});
