import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Everything is fine</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;
  let originalEnv: NodeJS.ProcessEnv;
  let fetchMock: jest.Mock;

  beforeAll(() => {
    // Intercept expected console.error logs from ErrorBoundary to prevent noisy output
    console.error = jest.fn(() => {
      // Allow testing library act warnings to be suppressed if needed, or simply log them
    });
  });

  beforeEach(() => {
    (console.error as jest.Mock).mockClear();

    // Setup storage mocks
    Storage.prototype.clear = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();

    originalEnv = process.env;
    process.env = { ...originalEnv };

    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Everything is fine')).toBeInTheDocument();
  });

  it('catches error and renders fallback UI', () => {
    render(
      <ErrorBoundary name="TestBoundary">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We hit an unexpected error/i)).toBeInTheDocument();

    const elements = screen.getAllByText(/Test error/);
    expect(elements.length).toBeGreaterThan(0);

    // console.error is called internally by React when an error is caught in an ErrorBoundary
    // React 18+ logs an additional error, so we verify our specific boundary log
    const consoleCalls = (console.error as jest.Mock).mock.calls;
    const boundaryErrorCall = consoleCalls.find(call => call[0] === '[TestBoundary] render error:');
    const boundaryStackCall = consoleCalls.find(call => call[0] === '[TestBoundary] component stack:');

    expect(boundaryErrorCall).toBeDefined();
    expect(boundaryStackCall).toBeDefined();
  });

  it('reports error remotely if NEXT_PUBLIC_ERROR_REPORT_URL is set', () => {
    process.env.NEXT_PUBLIC_ERROR_REPORT_URL = 'https://example.com/report';

    render(
      <ErrorBoundary name="ReportingBoundary">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/report', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: expect.any(String)
    }));
  });

  it('handles remote reporting failure gracefully', () => {
    process.env.NEXT_PUBLIC_ERROR_REPORT_URL = 'https://example.com/report';
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    expect(() => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );
    }).not.toThrow();
  });

  it('reloads page when reload button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload page');
    try {
        fireEvent.click(reloadButton);
    } catch {
        // Ignored JSDOM reload error
    }

    expect(sessionStorage.setItem).toHaveBeenCalledWith('meraki:errorboundary:reloading', '1');
  });

  it('clears app data and reloads when clear button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const clearButton = screen.getByText('Clear data & reload');
    try {
        fireEvent.click(clearButton);
    } catch {
        // Ignored JSDOM navigation error
    }

    expect(localStorage.clear).toHaveBeenCalledTimes(1);
    expect(sessionStorage.setItem).toHaveBeenCalledWith('meraki:errorboundary:reloading', '1');
  });

  it('clears reload hint from sessionStorage on successful render', () => {
    (sessionStorage.getItem as jest.Mock).mockReturnValue('1');

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Force component update
    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
        <span>Updated</span>
      </ErrorBoundary>
    );

    expect(sessionStorage.getItem).toHaveBeenCalledWith('meraki:errorboundary:reloading');
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('meraki:errorboundary:reloading');
  });

  it('does not show error details in production', () => {
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Test error/)).not.toBeInTheDocument();
  });
});
