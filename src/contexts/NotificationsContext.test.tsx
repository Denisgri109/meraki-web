import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { NotificationsProvider, useNotifications } from './NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

const TestComponent = () => {
  const { unreadMessages, notifications, unreadNotifications, markNotificationsSeen } = useNotifications();
  return (
    <div>
      <div data-testid="unread-messages">{unreadMessages}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-notifications">{unreadNotifications}</div>
      <button onClick={markNotificationsSeen} data-testid="mark-seen-btn">
        Mark Seen
      </button>
    </div>
  );
};

describe('NotificationsContext', () => {
  let mockSupabase: any;
  let mockConversationsBuilder: any;
  let mockMessagesBuilder: any;
  let mockNotificationsBuilder: any;

  const createMockBuilder = () => {
    const builder: any = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({ data: [], error: null })),
    };
    return builder;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();

    mockConversationsBuilder = createMockBuilder();
    mockMessagesBuilder = createMockBuilder();
    mockNotificationsBuilder = createMockBuilder();

    mockSupabase = {
      from: jest.fn((table) => {
        if (table === 'conversations') return mockConversationsBuilder;
        if (table === 'messages') return mockMessagesBuilder;
        if (table === 'scheduled_notifications') return mockNotificationsBuilder;
        return createMockBuilder();
      }),
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      }),
      removeChannel: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('provides default fallback values when used outside of provider', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('unread-messages')).toHaveTextContent('0');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-notifications')).toHaveTextContent('0');
  });

  it('fetches unread messages and notifications when authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });

    // Mock conversations fetch
    mockConversationsBuilder.then.mockImplementation((resolve: any) => resolve({
      data: [{ id: 'conv-1' }],
      error: null,
    }));

    // Mock messages fetch
    mockMessagesBuilder.then.mockImplementation((resolve: any) => resolve({
      count: 3,
      error: null,
    }));

    // Mock notifications fetch
    const mockNotifications = [
      { id: 'notif-1', created_at: new Date(Date.now() + 1000).toISOString() },
      { id: 'notif-2', created_at: new Date(Date.now() + 2000).toISOString() },
    ];
    mockNotificationsBuilder.then.mockImplementation((resolve: any) => resolve({
      data: mockNotifications,
      error: null,
    }));

    render(
      <NotificationsProvider>
        <TestComponent />
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-messages')).toHaveTextContent('3');
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      // All are unread because lastSeen is 0 initially
      expect(screen.getByTestId('unread-notifications')).toHaveTextContent('2');
    });
  });

  it('handles unauthenticated users gracefully', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    render(
      <NotificationsProvider>
        <TestComponent />
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-messages')).toHaveTextContent('0');
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
      expect(screen.getByTestId('unread-notifications')).toHaveTextContent('0');
    });

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('updates unread notifications count when marked as seen', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });

    mockConversationsBuilder.then.mockImplementation((resolve: any) => resolve({ data: [], error: null }));

    const timeNow = Date.now();
    const mockNotifications = [
      { id: 'notif-1', created_at: new Date(timeNow - 5000).toISOString() }, // 5 seconds ago
    ];
    mockNotificationsBuilder.then.mockImplementation((resolve: any) => resolve({
      data: mockNotifications,
      error: null,
    }));

    render(
      <NotificationsProvider>
        <TestComponent />
      </NotificationsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      expect(screen.getByTestId('unread-notifications')).toHaveTextContent('1');
    });

    act(() => {
      screen.getByTestId('mark-seen-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('unread-notifications')).toHaveTextContent('0');
    });

    const storedVal = window.localStorage.getItem('meraki:notifications:lastSeenAt:user-1');
    expect(storedVal).toBeTruthy();
    expect(Number(storedVal)).toBeGreaterThanOrEqual(timeNow);
  });
});
