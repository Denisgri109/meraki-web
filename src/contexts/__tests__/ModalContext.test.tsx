import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalProvider, useModal } from '../ModalContext';

// Dummy component to consume the context
function TestComponent() {
  const { showAlert, showConfirm, showPrompt } = useModal();
  const [result, setResult] = useState<any>(null);

  return (
    <div>
      <button onClick={async () => {
        await showAlert('Alert Message', 'Alert Title', 'Got it');
        setResult('alert resolved');
      }}>Show Alert</button>

      <button onClick={async () => {
        const res = await showConfirm('Confirm Message', 'Confirm Title', 'Yes', 'No', 'danger');
        setResult(res);
      }}>Show Confirm</button>

      <button onClick={async () => {
        const res = await showPrompt('Prompt Message', 'Prompt Title', 'Placeholder text', 'Submit', 'Cancel');
        setResult(res);
      }}>Show Prompt</button>

      <div data-testid="result">{JSON.stringify(result)}</div>
    </div>
  );
}

describe('ModalContext', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders children properly when no modal is active', () => {
    render(
      <ModalProvider>
        <div>Test Child Content</div>
      </ModalProvider>
    );
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  describe('showAlert', () => {
    it('displays an alert modal and resolves when confirmed', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger alert
      await user.click(screen.getByText('Show Alert'));

      // Check modal content
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
      expect(screen.getByText('Alert Message')).toBeInTheDocument();
      expect(screen.getByText('Got it')).toBeInTheDocument();

      // Click OK
      await user.click(screen.getByText('Got it'));

      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByText('Alert Title')).not.toBeInTheDocument();
      });

      // Check if promise resolved correctly
      expect(screen.getByTestId('result')).toHaveTextContent('"alert resolved"');
    });
  });

  describe('showConfirm', () => {
    it('displays a confirm modal and resolves true when confirmed', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger confirm
      await user.click(screen.getByText('Show Confirm'));

      // Check modal content
      expect(screen.getByText('Confirm Title')).toBeInTheDocument();
      expect(screen.getByText('Confirm Message')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();

      // Click Yes (confirm)
      await user.click(screen.getByText('Yes'));

      await waitFor(() => {
        expect(screen.queryByText('Confirm Title')).not.toBeInTheDocument();
      });

      // Result should be true
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });

    it('resolves false when canceled', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger confirm
      await user.click(screen.getByText('Show Confirm'));

      // Click No (cancel)
      await user.click(screen.getByText('No'));

      await waitFor(() => {
        expect(screen.queryByText('Confirm Title')).not.toBeInTheDocument();
      });

      // Result should be false
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
  });

  describe('showPrompt', () => {
    it('displays a prompt modal and resolves with input value when confirmed', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger prompt
      await user.click(screen.getByText('Show Prompt'));

      // Check modal content
      expect(screen.getByText('Prompt Title')).toBeInTheDocument();
      expect(screen.getByText('Prompt Message')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Placeholder text')).toBeInTheDocument();

      // Type into input
      const input = screen.getByPlaceholderText('Placeholder text');
      await user.type(input, 'Test Input Value');

      // Click Submit
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.queryByText('Prompt Title')).not.toBeInTheDocument();
      });

      // Result should be input value
      expect(screen.getByTestId('result')).toHaveTextContent('"Test Input Value"');
    });

    it('resolves with input value when enter key is pressed', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger prompt
      await user.click(screen.getByText('Show Prompt'));

      // Type into input and hit enter
      const input = screen.getByPlaceholderText('Placeholder text');
      await user.type(input, 'Enter Key Value{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Prompt Title')).not.toBeInTheDocument();
      });

      // Result should be input value
      expect(screen.getByTestId('result')).toHaveTextContent('"Enter Key Value"');
    });

    it('resolves with null when canceled', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger prompt
      await user.click(screen.getByText('Show Prompt'));

      // Click Cancel
      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Prompt Title')).not.toBeInTheDocument();
      });

      // Result should be null
      expect(screen.getByTestId('result')).toHaveTextContent('null');
    });
  });

  describe('close functionality', () => {
    it('closes modal when close button (X) is clicked', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger confirm
      await user.click(screen.getByText('Show Confirm'));

      expect(screen.getByText('Confirm Title')).toBeInTheDocument();

      // Find and click close button
      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Title')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });

    it('closes modal when overlay is clicked', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger confirm
      await user.click(screen.getByText('Show Confirm'));

      expect(screen.getByText('Confirm Title')).toBeInTheDocument();

      // Click overlay (first element with modal-overlay class)
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) {
        await user.click(overlay);
      }

      await waitFor(() => {
        expect(screen.queryByText('Confirm Title')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });

    it('does not close modal when modal content is clicked', async () => {
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );

      // Trigger confirm
      await user.click(screen.getByText('Show Confirm'));

      expect(screen.getByText('Confirm Title')).toBeInTheDocument();

      // Click modal content
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) {
        await user.click(modalContent);
      }

      // Wait a bit to ensure it doesn't close
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be open
      expect(screen.getByText('Confirm Title')).toBeInTheDocument();
    });
  });
});
