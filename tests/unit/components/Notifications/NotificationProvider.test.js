// NotificationProvider Tests
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationProvider, useNotification, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../../../src/components/Notifications/NotificationProvider';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <div>{children}</div>
}));

// Test component that uses the hook
const TestComponent = () => {
  const {
    addNotification,
    notifications,
    unreadCount,
    success,
    error,
    warning,
    info,
    critical,
    markAllAsRead,
    clearAllNotifications
  } = useNotification();

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      
      <button onClick={() => success('Success message')}>Add Success</button>
      <button onClick={() => error('Error message')}>Add Error</button>
      <button onClick={() => warning('Warning message')}>Add Warning</button>
      <button onClick={() => info('Info message')}>Add Info</button>
      <button onClick={() => critical('Critical message')}>Add Critical</button>
      
      <button onClick={() => addNotification({
        title: 'Custom',
        message: 'Custom message',
        type: NOTIFICATION_TYPES.CUSTOM,
        priority: NOTIFICATION_PRIORITIES.HIGH
      })}>Add Custom</button>
      
      <button onClick={markAllAsRead}>Mark All Read</button>
      <button onClick={clearAllNotifications}>Clear All</button>
    </div>
  );
};

describe('NotificationProvider', () => {
  const renderWithProvider = (children, providerProps = {}) => {
    return render(
      <NotificationProvider {...providerProps}>
        {children}
      </NotificationProvider>
    );
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock audio context
    global.AudioContext = jest.fn().mockImplementation(() => ({
      createOscillator: () => ({
        connect: jest.fn(),
        frequency: { setValueAtTime: jest.fn() },
        type: 'sine',
        start: jest.fn(),
        stop: jest.fn()
      }),
      createGain: () => ({
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        }
      }),
      destination: {},
      currentTime: 0
    }));

    // Mock navigator.vibrate
    global.navigator.vibrate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Setup', () => {
    test('provides notification context', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    test('throws error when hook used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<TestComponent />)).toThrow(
        'useNotification must be used within a NotificationProvider'
      );
      
      consoleError.mockRestore();
    });
  });

  describe('Adding Notifications', () => {
    test('adds success notification', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Success'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
        expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
      });
      
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    test('adds error notification with high priority', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    test('adds warning notification', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Warning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });
      
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    test('adds info notification', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Info'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });
      
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    test('adds critical notification', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Critical'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });
      
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('Critical message')).toBeInTheDocument();
    });

    test('adds custom notification', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Custom'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      });
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });

  describe('Notification Limits', () => {
    test('enforces max notification limit', async () => {
      renderWithProvider(<TestComponent />, {
        maxNotifications: 2
      });
      
      // Add 3 notifications
      fireEvent.click(screen.getByText('Add Success'));
      fireEvent.click(screen.getByText('Add Error'));
      fireEvent.click(screen.getByText('Add Warning'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Notification Actions', () => {
    test('marks all notifications as read', async () => {
      renderWithProvider(<TestComponent />);
      
      // Add notifications
      fireEvent.click(screen.getByText('Add Success'));
      fireEvent.click(screen.getByText('Add Error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
      });
      
      // Mark all as read
      fireEvent.click(screen.getByText('Mark All Read'));
      
      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    test('clears all notifications', async () => {
      renderWithProvider(<TestComponent />);
      
      // Add notifications
      fireEvent.click(screen.getByText('Add Success'));
      fireEvent.click(screen.getByText('Add Error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2');
      });
      
      // Clear all
      fireEvent.click(screen.getByText('Clear All'));
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Persistence', () => {
    test('persists settings to localStorage', async () => {
      const TestSettingsComponent = () => {
        const { updateSettings } = useNotification();
        
        return (
          <button onClick={() => updateSettings({ soundEnabled: false })}>
            Update Settings
          </button>
        );
      };

      renderWithProvider(<TestSettingsComponent />);
      
      fireEvent.click(screen.getByText('Update Settings'));
      
      await waitFor(() => {
        const stored = localStorage.getItem('collisionos_notification_settings');
        expect(stored).toBeTruthy();
        const settings = JSON.parse(stored);
        expect(settings.soundEnabled).toBe(false);
      });
    });
  });

  describe('Do Not Disturb', () => {
    test('queues notifications when DND is enabled', async () => {
      const TestDNDComponent = () => {
        const { setDoNotDisturb, success, queue } = useNotification();
        
        return (
          <div>
            <div data-testid="queue-count">{queue.length}</div>
            <button onClick={() => setDoNotDisturb(true)}>Enable DND</button>
            <button onClick={() => success('Test message')}>Add Success</button>
          </div>
        );
      };

      renderWithProvider(<TestDNDComponent />);
      
      // Enable DND
      fireEvent.click(screen.getByText('Enable DND'));
      
      // Add notification (should be queued)
      fireEvent.click(screen.getByText('Add Success'));
      
      await waitFor(() => {
        expect(screen.getByTestId('queue-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Accessibility', () => {
    test('renders with proper ARIA attributes', () => {
      renderWithProvider(<TestComponent />);
      
      const notificationRegion = screen.getByRole('region');
      expect(notificationRegion).toHaveAttribute('aria-label', 'Notifications');
      expect(notificationRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Sound and Vibration', () => {
    test('plays notification sound when enabled', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Success'));
      
      await waitFor(() => {
        expect(global.AudioContext).toHaveBeenCalled();
      });
    });

    test('triggers vibration when enabled', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Add Success'));
      
      await waitFor(() => {
        expect(global.navigator.vibrate).toHaveBeenCalled();
      });
    });
  });
});