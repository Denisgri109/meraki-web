import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ThrowOnRender({ message }: { message: string }): React.ReactNode {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello World</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello World');
  });

  it('renders error fallback when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender message="Test crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows Merakí branding in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender message="Test crash" />
      </ErrorBoundary>,
    );
    expect(screen.getAllByText('Merakí').length).toBeGreaterThan(0);
  });

  it('renders reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender message="Test crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Reload page')).toBeInTheDocument();
  });

  it('renders clear data button', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender message="Test crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Clear data & reload')).toBeInTheDocument();
  });

  it('has role="alert" on error container', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender message="Test crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('logs error to console with boundary name', () => {
    render(
      <ErrorBoundary name="TestBoundary">
        <ThrowOnRender message="Custom error" />
      </ErrorBoundary>,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('TestBoundary'),
      expect.any(Error),
    );
  });

  it('uses default boundary name when not provided', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender message="No name" />
      </ErrorBoundary>,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ErrorBoundary'),
      expect.any(Error),
    );
  });

  it('shows error details in non-production environment', () => {
    const env = process.env as Record<string, string | undefined>;
    const origNodeEnv = env.NODE_ENV;
    env.NODE_ENV = 'test';
    render(
      <ErrorBoundary>
        <ThrowOnRender message="Dev error visible" />
      </ErrorBoundary>,
    );
    expect(screen.getAllByText(/Dev error visible/).length).toBeGreaterThan(0);
    env.NODE_ENV = origNodeEnv;
  });

  it('renders children again after error boundary remounts', () => {
    const { unmount } = render(
      <ErrorBoundary>
        <ThrowOnRender message="Crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    unmount();

    render(
      <ErrorBoundary>
        <div data-testid="ok">All good</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('ok')).toHaveTextContent('All good');
  });
});
