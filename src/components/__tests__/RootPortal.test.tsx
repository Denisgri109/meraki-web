import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RootPortal } from '@/components/RootPortal';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('@/components/editable/EditModeToggle', () => ({
  EditModeToggle: () => <div data-testid="edit-toggle">EditToggle</div>,
}));

import { useRouter } from 'next/navigation';

describe('RootPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('renders Merakí branding', () => {
    render(<RootPortal isOwner={false} />);
    expect(screen.getAllByText('Merakí').length).toBeGreaterThan(0);
  });

  it('renders "Choose your experience" heading', () => {
    render(<RootPortal isOwner={false} />);
    expect(screen.getByText('Choose your experience')).toBeInTheDocument();
  });

  it('renders Beauty card by default', () => {
    render(<RootPortal isOwner={false} />);
    expect(screen.getByText('Beauty Section')).toBeInTheDocument();
    expect(screen.getByText('Enter Beauty')).toBeInTheDocument();
  });

  it('renders Beauty and Pilates toggle buttons', () => {
    render(<RootPortal isOwner={false} />);
    expect(screen.getByText('Beauty')).toBeInTheDocument();
    expect(screen.getByText('Pilates')).toBeInTheDocument();
  });

  it('switches to Pilates card when Pilates toggle clicked', () => {
    render(<RootPortal isOwner={false} />);
    fireEvent.click(screen.getByText('Pilates'));
    expect(screen.getByText('Pilates Section')).toBeInTheDocument();
    expect(screen.getByText('Enter Pilates')).toBeInTheDocument();
  });

  it('switches back to Beauty when Beauty toggle clicked', () => {
    render(<RootPortal isOwner={false} />);
    fireEvent.click(screen.getByText('Pilates'));
    expect(screen.getByText('Pilates Section')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Beauty'));
    expect(screen.getByText('Beauty Section')).toBeInTheDocument();
  });

  it('persists section choice to localStorage on toggle', () => {
    render(<RootPortal isOwner={false} />);
    fireEvent.click(screen.getByText('Pilates'));
    expect(localStorage.getItem('meraki:active-section')).toBe('pilates');
  });

  it('reads initial section from localStorage', () => {
    localStorage.setItem('meraki:active-section', 'pilates');
    render(<RootPortal isOwner={false} />);
    expect(screen.getByText('Pilates Section')).toBeInTheDocument();
  });

  it('navigates to section dashboard when card clicked', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    render(<RootPortal isOwner={false} />);
    fireEvent.click(screen.getByText('Enter Beauty'));
    expect(mockPush).toHaveBeenCalledWith('/beauty/dashboard');
  });

  it('navigates to pilates dashboard when pilates card clicked', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    render(<RootPortal isOwner={false} />);
    fireEvent.click(screen.getByText('Pilates'));
    fireEvent.click(screen.getByText('Enter Pilates'));
    expect(mockPush).toHaveBeenCalledWith('/pilates/dashboard');
  });

  it('shows owner top bar when isOwner is true', () => {
    render(<RootPortal isOwner={true} />);
    expect(screen.getByText('← Skip to Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('edit-toggle')).toBeInTheDocument();
  });

  it('does NOT show owner top bar when isOwner is false', () => {
    render(<RootPortal isOwner={false} />);
    expect(screen.queryByText('← Skip to Dashboard')).not.toBeInTheDocument();
  });

  it('renders Sign In and Get Started links', () => {
    render(<RootPortal isOwner={false} />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});
