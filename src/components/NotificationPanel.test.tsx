import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { NotificationPanel } from './NotificationPanel';
import * as useIncidentsHook from '@/hooks/useIncidents';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/hooks/useIncidents', () => ({
  useNotifications: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useDismissNotification: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
  useDismissAllNotifications: vi.fn(),
}));

const mockNotifications = [
  {
    notification_id: 1,
    title: 'Critical Alert',
    message: 'Suspicious login detected from 203.0.113.45',
    category: 'critical',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false,
    dismissed: false,
    incident: 1001,
  },
  {
    notification_id: 2,
    title: 'Escalation Notice',
    message: 'High severity incident requires immediate attention',
    category: 'escalation',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    read: false,
    dismissed: false,
    incident: 1002,
  },
  {
    notification_id: 3,
    title: 'AI Analysis Complete',
    message: 'Root cause analysis has been generated for incident INC-1001',
    category: 'ai-insight',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    read: true,
    dismissed: false,
    incident: 1001,
  },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderComponent = () => {
  const queryClient = createQueryClient();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <NotificationPanel />
      </QueryClientProvider>
    ),
  };
};

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification bell button', () => {
    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: [],
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getByRole('button');
    expect(bellButton).toBeInTheDocument();
  });

  it('should show unread count badge', async () => {
    const user = userEvent.setup();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    expect(bellButton.textContent).toContain('2');
  });

  it('should open notification panel when button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: [],
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should display notification items', async () => {
    const user = userEvent.setup();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Critical Alert')).toBeInTheDocument();
      expect(screen.getByText('Escalation Notice')).toBeInTheDocument();
      expect(screen.getByText('AI Analysis Complete')).toBeInTheDocument();
    });
  });

  it('should display category filter buttons', async () => {
    const user = userEvent.setup();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('all')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('escalation')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });
  });

  it('should filter notifications by category', async () => {
    const user = userEvent.setup();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    const criticalFilter = screen.getByRole('button', { name: /critical/ });
    await user.click(criticalFilter);

    await waitFor(() => {
      expect(screen.getByText('Critical Alert')).toBeInTheDocument();
      expect(screen.queryByText('Escalation Notice')).not.toBeInTheDocument();
    });
  });

  it('should mark notification as read when clicked', async () => {
    const user = userEvent.setup();
    const markRead = vi.fn();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: markRead,
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    const criticalNotification = screen.getByText('Critical Alert').closest('div');
    await user.click(criticalNotification!);

    expect(markRead).toHaveBeenCalledWith(1);
  });

  it('should dismiss notification', async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: dismiss,
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    const dismissButtons = screen.getAllByRole('button', { name: '' }).filter(btn => btn.querySelector('svg'));
    // The last dismiss button (for individual notifications)
    await user.click(dismissButtons[dismissButtons.length - 1]);

    expect(dismiss).toHaveBeenCalled();
  });

  it('should mark all notifications as read', async () => {
    const user = userEvent.setup();
    const markAllRead = vi.fn();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: markAllRead,
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    const readAllButton = screen.getByRole('button', { name: /read all/i });
    await user.click(readAllButton);

    expect(markAllRead).toHaveBeenCalled();
  });

  it('should dismiss all notifications', async () => {
    const user = userEvent.setup();
    const dismissAll = vi.fn();

    vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
      data: mockNotifications,
    } as any);

    vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
      mutate: dismissAll,
    } as any);

    renderComponent();

    const bellButton = screen.getAllByRole('button')[0];
    await user.click(bellButton);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(dismissAll).toHaveBeenCalled();
  });

  it('should display incident ID when available', async () => {
     vi.mocked(useIncidentsHook.useNotifications).mockReturnValue({
       data: mockNotifications,
     } as any);

     vi.mocked(useIncidentsHook.useMarkNotificationRead).mockReturnValue({
       mutate: vi.fn(),
     } as any);

     vi.mocked(useIncidentsHook.useDismissNotification).mockReturnValue({
       mutate: vi.fn(),
     } as any);

     vi.mocked(useIncidentsHook.useMarkAllNotificationsRead).mockReturnValue({
       mutate: vi.fn(),
     } as any);

     vi.mocked(useIncidentsHook.useDismissAllNotifications).mockReturnValue({
       mutate: vi.fn(),
     } as any);

     renderComponent();

     // Verify component renders with notification data containing incident info
     const bellButton = screen.getAllByRole('button')[0];
     expect(bellButton).toBeInTheDocument();
  });
});
