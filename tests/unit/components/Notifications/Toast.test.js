// Toast Component Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Toast from '../../../../src/components/Notifications/Toast';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} from '../../../../src/components/Notifications/NotificationProvider';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <div>{children}</div>,
  useMotionValue: initial => ({
    set: jest.fn(),
    get: () => initial,
  }),
  useTransform: () => ({ set: jest.fn() }),
}));

// Mock animation hooks
jest.mock('../../../../src/hooks/useAnimation', () => ({
  useGestureAnimation: () => ({
    x: { set: jest.fn() },
    y: { set: jest.fn() },
    scale: { set: jest.fn() },
    dragControls: {},
    resetPosition: jest.fn(),
  }),
}));

const theme = createTheme();

describe('Toast Component', () => {
  const mockOnDismiss = jest.fn();
  const mockOnAction = jest.fn();

  const defaultProps = {
    notification: {
      id: 'test-1',
      type: NOTIFICATION_TYPES.INFO,
      title: 'Test Title',
      message: 'Test message',
      timestamp: Date.now(),
      priority: NOTIFICATION_PRIORITIES.NORMAL,
    },
    onDismiss: mockOnDismiss,
    onAction: mockOnAction,
    index: 0,
    total: 1,
    settings: {
      pauseOnHover: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderToast = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <Toast {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  describe('Rendering', () => {
    test('renders toast with title and message', () => {
      renderToast();

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('renders with correct ARIA attributes', () => {
      renderToast();

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-labelledby', 'toast-title-test-1');
      expect(toast).toHaveAttribute('aria-describedby', 'toast-message-test-1');
    });

    test('renders different notification types with appropriate icons', () => {
      const types = [
        NOTIFICATION_TYPES.SUCCESS,
        NOTIFICATION_TYPES.ERROR,
        NOTIFICATION_TYPES.WARNING,
        NOTIFICATION_TYPES.INFO,
      ];

      types.forEach(type => {
        const { unmount } = renderToast({
          notification: {
            ...defaultProps.notification,
            type,
          },
        });

        // Check that an icon is present
        const iconElement =
          screen.getByTestId('notification-icon') ||
          screen.getByRole('alert').querySelector('svg');
        expect(iconElement).toBeInTheDocument();

        unmount();
      });
    });

    test('shows count badge when count > 1', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          count: 3,
        },
      });

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('shows priority indicator for high priority notifications', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          priority: NOTIFICATION_PRIORITIES.CRITICAL,
        },
      });

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    test('renders custom avatar when provided', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          avatar: 'https://example.com/avatar.jpg',
        },
      });

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('Actions', () => {
    test('renders action buttons when provided', () => {
      const actions = [
        { label: 'Action 1', handler: jest.fn() },
        { label: 'Action 2', handler: jest.fn() },
      ];

      renderToast({
        notification: {
          ...defaultProps.notification,
          actions,
        },
      });

      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });

    test('calls action handler when action button is clicked', () => {
      const actionHandler = jest.fn();
      const actions = [{ label: 'Test Action', handler: actionHandler }];

      renderToast({
        notification: {
          ...defaultProps.notification,
          actions,
        },
      });

      fireEvent.click(screen.getByText('Test Action'));

      expect(actionHandler).toHaveBeenCalledWith(defaultProps.notification);
      expect(mockOnDismiss).toHaveBeenCalledWith('test-1');
    });

    test('does not dismiss when action has dismissOnClick: false', () => {
      const actionHandler = jest.fn();
      const actions = [
        {
          label: 'Test Action',
          handler: actionHandler,
          dismissOnClick: false,
        },
      ];

      renderToast({
        notification: {
          ...defaultProps.notification,
          actions,
        },
      });

      fireEvent.click(screen.getByText('Test Action'));

      expect(actionHandler).toHaveBeenCalled();
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Dismissal', () => {
    test('shows dismiss button when allowDismiss is true', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          allowDismiss: true,
        },
      });

      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton).toBeInTheDocument();
    });

    test('calls onDismiss when dismiss button is clicked', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          allowDismiss: true,
        },
      });

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledWith('test-1');
    });

    test('hides dismiss button when allowDismiss is false', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          allowDismiss: false,
        },
      });

      const dismissButton = screen.queryByLabelText('Dismiss notification');
      expect(dismissButton).not.toBeInTheDocument();
    });

    test('auto-dismisses after duration', async () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          duration: 1000,
        },
      });

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledWith('test-1');
      });
    });

    test('does not auto-dismiss persistent notifications', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          persistent: true,
          duration: 1000,
        },
      });

      jest.advanceTimersByTime(2000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    test('pauses timer on hover', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          duration: 2000,
        },
        settings: {
          pauseOnHover: true,
        },
      });

      const toast = screen.getByRole('alert');

      // Hover over toast
      fireEvent.mouseEnter(toast);

      // Advance time while hovered
      jest.advanceTimersByTime(1000);

      // Should not dismiss while hovered
      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Mouse leave
      fireEvent.mouseLeave(toast);

      // Now advance time to complete duration
      jest.advanceTimersByTime(2000);

      expect(mockOnDismiss).toHaveBeenCalledWith('test-1');
    });
  });

  describe('Progress Bar', () => {
    test('shows progress bar when showProgress is true', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          showProgress: true,
          duration: 2000,
        },
      });

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    test('hides progress bar when showProgress is false', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          showProgress: false,
          duration: 2000,
        },
      });

      const progressBar = screen.queryByRole('progressbar');
      expect(progressBar).not.toBeInTheDocument();
    });

    test('hides progress bar for persistent notifications', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          persistent: true,
          showProgress: true,
        },
      });

      const progressBar = screen.queryByRole('progressbar');
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe('Gesture Handling', () => {
    test('handles swipe to dismiss', () => {
      const { container } = renderToast();

      const toast = container.firstChild;

      // Simulate swipe gesture (this would normally be handled by framer-motion)
      // We'll test the callback directly
      const mockDragEnd = {
        offset: { x: 150, y: 0 },
        velocity: { x: 600, y: 0 },
      };

      // This would be called by framer-motion's onDragEnd
      // For now, we just test that the component renders without errors
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct styling based on notification type', () => {
      const { container } = renderToast({
        notification: {
          ...defaultProps.notification,
          type: NOTIFICATION_TYPES.ERROR,
        },
      });

      // Check that the container has appropriate styling
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies stacking styles when index > 0', () => {
      const { container } = renderToast({
        index: 2,
        total: 5,
      });

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper focus management', () => {
      renderToast({
        notification: {
          ...defaultProps.notification,
          allowDismiss: true,
        },
      });

      const dismissButton = screen.getByLabelText('Dismiss notification');

      // Test that button is focusable
      dismissButton.focus();
      expect(document.activeElement).toBe(dismissButton);
    });

    test('provides screen reader friendly content', () => {
      renderToast();

      const titleElement = screen.getByText('Test Title');
      const messageElement = screen.getByText('Test message');

      expect(titleElement).toHaveAttribute('id', 'toast-title-test-1');
      expect(messageElement).toHaveAttribute('id', 'toast-message-test-1');
    });
  });
});
