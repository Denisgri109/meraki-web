import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainNavbar } from '../MainNavbar';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Setup default mock returns
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useEditMode } from '@/contexts/EditContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/contexts/NotificationsContext', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('@/contexts/EditContext', () => ({
  useEditMode: jest.fn(),
}));

const mockSignOut = jest.fn();
const mockMarkNotificationsSeen = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();

describe('MainNavbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
      role: 'client',
      loading: false,
      signOut: mockSignOut,
    });

    (useCart as jest.Mock).mockReturnValue({
      getItemCount: () => 0,
    });

    (useNotifications as jest.Mock).mockReturnValue({
      unreadMessages: 0,
      notifications: [],
      unreadNotifications: 0,
      markNotificationsSeen: mockMarkNotificationsSeen,
    });

    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: false,
      canEdit: false,
      toggleEditMode: jest.fn(),
      content: {},
      getContent: (_key: string, fallback: string) => fallback,
      updateContent: jest.fn(),
      refreshContent: jest.fn(),
    });
  });

  it('renders nothing but a header wrapper when loading', () => {
    (useAuth as jest.Mock).mockReturnValue({ loading: true });
    render(<MainNavbar />);

    // Using container since we expect minimal output
    expect(screen.queryByText('Merakí')).not.toBeInTheDocument();
  });

  it('renders unauthenticated state correctly', () => {
    render(<MainNavbar />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getAllByText('Merakí')[0]).toBeInTheDocument();
    expect(screen.getByText('Get Mobile App')).toBeInTheDocument();
  });

  describe('Authenticated state', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user1', email: 'test@example.com' },
        profile: { full_name: 'Test User' },
        role: 'client',
        loading: false,
        signOut: mockSignOut,
      });
    });

    it('renders client navigation by default', () => {
      render(<MainNavbar />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Book')).toBeInTheDocument();
      expect(screen.getByText('Shop')).toBeInTheDocument();
      expect(screen.getByText('Rewards')).toBeInTheDocument();
      // "Finance" is an owner link, shouldn't be here
      expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    });

    it('renders owner navigation when role is owner', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user1' },
        profile: { full_name: 'Owner User' },
        role: 'owner',
        loading: false,
        signOut: mockSignOut,
      });
      render(<MainNavbar />);

      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      // Owner doesn't have cart icon by design
      expect(screen.queryByTitle('Cart')).not.toBeInTheDocument();
    });

    it('displays unread badges correctly', () => {
      (useCart as jest.Mock).mockReturnValue({ getItemCount: () => 3 });
      (useNotifications as jest.Mock).mockReturnValue({
        unreadMessages: 5,
        notifications: [],
        unreadNotifications: 2,
        markNotificationsSeen: mockMarkNotificationsSeen,
      });

      render(<MainNavbar />);

      expect(screen.getByText('3')).toBeInTheDocument(); // Cart
      expect(screen.getByText('5')).toBeInTheDocument(); // Messages
      expect(screen.getByText('2')).toBeInTheDocument(); // Notifications
    });

    it('toggles profile dropdown and handles sign out', async () => {
      render(<MainNavbar />);

      // Click profile dropdown toggle
      const profileButton = screen.getByLabelText('Toggle profile menu');
      fireEvent.click(profileButton);

      // Verify dropdown content
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('My Appointments')).toBeInTheDocument();

      // Click sign out
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('toggles notifications dropdown and marks as seen', () => {
      (useNotifications as jest.Mock).mockReturnValue({
        unreadMessages: 0,
        notifications: [{ id: '1', title: 'Test Alert', body: 'This is a test', created_at: new Date().toISOString() }],
        unreadNotifications: 1,
        markNotificationsSeen: mockMarkNotificationsSeen,
      });

      render(<MainNavbar />);

      const notificationsButton = screen.getByLabelText('Notifications');
      fireEvent.click(notificationsButton);

      expect(mockMarkNotificationsSeen).toHaveBeenCalled();
      expect(screen.getByText('Test Alert')).toBeInTheDocument();
      expect(screen.getByText('This is a test')).toBeInTheDocument();
    });

    it('toggles mobile menu', () => {
      render(<MainNavbar />);

      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(mobileMenuButton);

      // In the mobile menu, navigation links are rendered again
      // We check that multiple 'Home' links exist now (one desktop, one mobile)
      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks.length).toBeGreaterThan(1);
    });
  });
});
