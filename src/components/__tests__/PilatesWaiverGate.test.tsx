import React from 'react';
import { render, screen } from '@testing-library/react';
import { PilatesWaiverGate } from '@/components/PilatesWaiverGate';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/usePilatesWaiver', () => ({
  usePilatesWaiver: jest.fn(),
}));

jest.mock('@/components/PilatesWaiverFormSheet', () => {
  return function MockSheet({ open, onSigned, onDismiss }: any) {
    if (!open) return null;
    return <div data-testid="waiver-sheet">Sheet</div>;
  };
});

import { useAuth } from '@/contexts/AuthContext';
import { usePilatesWaiver } from '@/hooks/usePilatesWaiver';

describe('PilatesWaiverGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, role: 'client' });
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      hasWaiver: false,
      loading: true,
      checkWaiver: jest.fn(),
    });
    render(
      <PilatesWaiverGate>
        <div data-testid="child">Content</div>
      </PilatesWaiverGate>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Content');
  });

  it('does NOT show waiver sheet for owner', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' }, role: 'owner' });
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      hasWaiver: false,
      loading: false,
      checkWaiver: jest.fn(),
    });
    render(
      <PilatesWaiverGate>
        <div>Content</div>
      </PilatesWaiverGate>,
    );
    expect(screen.queryByTestId('waiver-sheet')).not.toBeInTheDocument();
  });

  it('does NOT show waiver sheet for master', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' }, role: 'master' });
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      hasWaiver: false,
      loading: false,
      checkWaiver: jest.fn(),
    });
    render(
      <PilatesWaiverGate>
        <div>Content</div>
      </PilatesWaiverGate>,
    );
    expect(screen.queryByTestId('waiver-sheet')).not.toBeInTheDocument();
  });

  it('does NOT show waiver sheet when loading', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' }, role: 'client' });
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      hasWaiver: false,
      loading: true,
      checkWaiver: jest.fn(),
    });
    render(
      <PilatesWaiverGate>
        <div>Content</div>
      </PilatesWaiverGate>,
    );
    expect(screen.queryByTestId('waiver-sheet')).not.toBeInTheDocument();
  });

  it('does NOT show waiver sheet when waiver exists', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' }, role: 'client' });
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      hasWaiver: true,
      loading: false,
      checkWaiver: jest.fn(),
    });
    render(
      <PilatesWaiverGate>
        <div>Content</div>
      </PilatesWaiverGate>,
    );
    expect(screen.queryByTestId('waiver-sheet')).not.toBeInTheDocument();
  });

  it('does NOT show waiver sheet when no user', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, role: 'client' });
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      hasWaiver: false,
      loading: false,
      checkWaiver: jest.fn(),
    });
    render(
      <PilatesWaiverGate>
        <div>Content</div>
      </PilatesWaiverGate>,
    );
    expect(screen.queryByTestId('waiver-sheet')).not.toBeInTheDocument();
  });

  it('shows waiver sheet for client without waiver', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' }, role: 'client' });
    (usePilatesWaiver as jest.Mock).mockReturnValue({
      hasWaiver: false,
      loading: false,
      checkWaiver: jest.fn(),
    });
    render(
      <PilatesWaiverGate>
        <div>Content</div>
      </PilatesWaiverGate>,
    );
    expect(screen.getByTestId('waiver-sheet')).toBeInTheDocument();
  });
});
