import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// A helper component to test the useToast hook within the ToastProvider
const TestComponent = ({ message, type }: { message: string; type?: 'success' | 'error' | 'info' }) => {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast(message, type)}>
      Show Toast
    </button>
  );
};

describe('Toast Component and Context', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing and provides no-op outside provider', () => {
    // Testing default context value when used outside of ToastProvider
    const OutOfContextComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('test outside')}>
          Show Outside
        </button>
      );
    };

    render(<OutOfContextComponent />);

    // Clicking should not crash, it will use the default empty function
    expect(() => fireEvent.click(screen.getByText('Show Outside'))).not.toThrow();
  });

  it('shows a default (info) toast message when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent message="Test default message" />
      </ToastProvider>
    );

    expect(screen.queryByText('Test default message')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Show Toast'));

    expect(screen.getByText('Test default message')).toBeInTheDocument();
  });

  it('shows multiple toasts with different types', () => {
    const MultipleToastComponent = () => {
      const { showToast } = useToast();
      return (
        <div>
          <button onClick={() => showToast('Success msg', 'success')}>Success</button>
          <button onClick={() => showToast('Error msg', 'error')}>Error</button>
        </div>
      );
    };

    render(
      <ToastProvider>
        <MultipleToastComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success'));
    fireEvent.click(screen.getByText('Error'));

    expect(screen.getByText('Success msg')).toBeInTheDocument();
    expect(screen.getByText('Error msg')).toBeInTheDocument();
  });

  it('automatically dismisses toast after 3500ms', () => {
    render(
      <ToastProvider>
        <TestComponent message="Auto dismiss message" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Auto dismiss message')).toBeInTheDocument();

    // Fast-forward time by 3499ms, toast should still be there
    act(() => {
      jest.advanceTimersByTime(3499);
    });
    expect(screen.getByText('Auto dismiss message')).toBeInTheDocument();

    // Fast-forward to exactly 3500ms or beyond
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByText('Auto dismiss message')).not.toBeInTheDocument();
  });

  it('manually dismisses toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent message="Manual dismiss message" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Manual dismiss message')).toBeInTheDocument();

    // Find the dismiss button - the component renders a button inside the toast
    // with aria-label="Dismiss notification"
    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Manual dismiss message')).not.toBeInTheDocument();
  });
});
