import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardShell } from '@/components/DashboardShell';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/beauty/dashboard'),
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useAutoLocation', () => ({
  useAutoLocation: jest.fn(() => ({ isLocationMissing: false, onLocationSaved: jest.fn() })),
}));

jest.mock('@/components/MainNavbar', () => ({
  MainNavbar: () => <div data-testid="navbar">Navbar</div>,
}));

jest.mock('@/components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('@/components/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>,
}));

jest.mock('@/components/LocationGateModal', () => ({
  __esModule: true,
  default: ({ onSaved }: { onSaved: () => void }) => <div data-testid="location-gate">Gate</div>,
}));

jest.mock('@/contexts/NotificationsContext', () => ({
  NotificationsProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="notif-provider">{children}</div>,
}));

jest.mock('@/contexts/ModalContext', () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="modal-provider">{children}</div>,
}));

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useAutoLocation } from '@/hooks/useAutoLocation';

describe('DashboardShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      session: { user: { id: 'u1' } },
      profile: { role: 'owner', onboarding_completed: true },
    });
  });

  it('renders children when session and profile exist', () => {
    render(
      <DashboardShell section="beauty">
        <div data-testid="page-content">Dashboard Content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('page-content')).toHaveTextContent('Dashboard Content');
  });

  it('renders navbar and footer', () => {
    render(
      <DashboardShell section="beauty">
        <div>Content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('shows splash when loading and no session', () => {
    (useAuth as jest.Mock).mockReturnValue({
      loading: true,
      session: null,
      profile: null,
    });
    render(
      <DashboardShell section="beauty">
        <div data-testid="content">Content</div>
      </DashboardShell>,
    );
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    expect(screen.getAllByText('Merakí').length).toBeGreaterThan(0);
  });

  it('shows splash when session exists but profile is null', () => {
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      session: { user: { id: 'u1' } },
      profile: null,
    });
    render(
      <DashboardShell section="beauty">
        <div data-testid="content">Content</div>
      </DashboardShell>,
    );
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('redirects to login when not loading, no session, not checkout', () => {
    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      session: null,
      profile: null,
    });
    render(
      <DashboardShell section="beauty">
        <div>Content</div>
      </DashboardShell>,
    );
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('does NOT redirect to login on checkout page', () => {
    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (usePathname as jest.Mock).mockReturnValue('/beauty/checkout');
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      session: null,
      profile: null,
    });
    render(
      <DashboardShell section="beauty">
        <div data-testid="checkout-content">Checkout</div>
      </DashboardShell>,
    );
    expect(mockReplace).not.toHaveBeenCalledWith('/login');
  });

  it('redirects master without onboarding to onboarding page', () => {
    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      session: { user: { id: 'u1' } },
      profile: { role: 'master', onboarding_completed: false },
    });
    render(
      <DashboardShell section="beauty">
        <div>Content</div>
      </DashboardShell>,
    );
    expect(mockReplace).toHaveBeenCalledWith('/beauty/onboarding');
  });

  it('redirects away from onboarding when onboarding is done', () => {
    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (usePathname as jest.Mock).mockReturnValue('/beauty/onboarding');
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      session: { user: { id: 'u1' } },
      profile: { role: 'owner', onboarding_completed: true },
    });
    render(
      <DashboardShell section="beauty">
        <div>Content</div>
      </DashboardShell>,
    );
    expect(mockReplace).toHaveBeenCalledWith('/beauty/dashboard');
  });

  it('renders LocationGateModal when location is missing', () => {
    (useAutoLocation as jest.Mock).mockReturnValue({
      isLocationMissing: true,
      onLocationSaved: jest.fn(),
    });
    render(
      <DashboardShell section="beauty">
        <div>Content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('location-gate')).toBeInTheDocument();
  });

  it('does not render LocationGateModal when location is set', () => {
    (useAutoLocation as jest.Mock).mockReturnValue({
      isLocationMissing: false,
      onLocationSaved: jest.fn(),
    });
    render(
      <DashboardShell section="beauty">
        <div>Content</div>
      </DashboardShell>,
    );
    expect(screen.queryByTestId('location-gate')).not.toBeInTheDocument();
  });
});
