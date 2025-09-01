// Notifications Module - Premium notification and toast system for CollisionOS
// Export all notification components and utilities

export {
  default as NotificationProvider,
  useNotification as useNotificationContext,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} from './NotificationProvider';
export { default as Toast } from './Toast';
export { default as NotificationCenter } from './NotificationCenter';
export { default as AlertDialog, DIALOG_TYPES } from './AlertDialog';

// Export the enhanced notification hook
export {
  useNotification,
  useNotificationBuilder,
  useAsyncNotification,
} from '../../hooks/useNotification';

// Re-export constants for convenience
export {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  DIALOG_TYPES,
} from './NotificationProvider';
