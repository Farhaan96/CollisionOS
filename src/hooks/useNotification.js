// useNotification Hook - Easy API for showing notifications with promise-based operations
// Executive-level notification management with chainable methods and async operations

import { useContext, useCallback, useMemo, useRef } from 'react';
import {
  useNotification as useNotificationContext,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} from '../components/Notifications/NotificationProvider';

// Hook for enhanced notification functionality
export const useNotification = () => {
  const context = useNotificationContext();
  const notificationRefs = useRef(new Map());

  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }

  const {
    addNotification: contextAddNotification,
    removeNotification,
    updateNotification,
    ...rest
  } = context;

  // Enhanced add notification with promise support
  const addNotification = useCallback(
    notification => {
      const id = contextAddNotification(notification);

      // Store reference for chaining
      const notificationRef = {
        id,
        update: updates => updateNotification(id, updates),
        dismiss: () => removeNotification(id),
        then: callback => {
          // Execute callback after notification is added
          setTimeout(callback, 100);
          return notificationRef;
        },
        catch: errorCallback => {
          // Handle errors in notification display
          try {
            return notificationRef;
          } catch (error) {
            errorCallback(error);
            return notificationRef;
          }
        },
      };

      notificationRefs.current.set(id, notificationRef);

      // Clean up reference when notification is dismissed
      setTimeout(() => {
        notificationRefs.current.delete(id);
      }, notification.duration || 5000);

      return notificationRef;
    },
    [contextAddNotification, updateNotification, removeNotification]
  );

  // Promise-based notification methods
  const showNotification = useCallback(
    options => {
      return new Promise((resolve, reject) => {
        try {
          const notification = addNotification({
            ...options,
            onDismiss: id => {
              resolve({ dismissed: true, id });
              options.onDismiss?.(id);
            },
            onAction: action => {
              resolve({ action, dismissed: false });
              options.onAction?.(action);
            },
          });

          // Auto-resolve if no actions
          if (!options.actions?.length && options.duration !== 0) {
            setTimeout(() => {
              resolve({ dismissed: true, auto: true });
            }, options.duration || 5000);
          }
        } catch (error) {
          reject(error);
        }
      });
    },
    [addNotification]
  );

  // Chainable notification builder
  const createNotification = useCallback(() => {
    const builder = {
      _options: {},

      type(type) {
        this._options.type = type;
        return this;
      },

      title(title) {
        this._options.title = title;
        return this;
      },

      message(message) {
        this._options.message = message;
        return this;
      },

      priority(priority) {
        this._options.priority = priority;
        return this;
      },

      duration(duration) {
        this._options.duration = duration;
        return this;
      },

      persistent() {
        this._options.persistent = true;
        this._options.duration = 0;
        return this;
      },

      icon(icon) {
        this._options.customIcon = icon;
        return this;
      },

      avatar(avatar) {
        this._options.avatar = avatar;
        return this;
      },

      actions(actions) {
        this._options.actions = actions;
        return this;
      },

      addAction(label, handler, options = {}) {
        this._options.actions = this._options.actions || [];
        this._options.actions.push({
          label,
          handler,
          ...options,
        });
        return this;
      },

      progress() {
        this._options.showProgress = true;
        return this;
      },

      noProgress() {
        this._options.showProgress = false;
        return this;
      },

      dismissible(dismissible = true) {
        this._options.allowDismiss = dismissible;
        return this;
      },

      data(data) {
        this._options.data = data;
        return this;
      },

      onClick(handler) {
        this._options.onClick = handler;
        return this;
      },

      onDismiss(handler) {
        this._options.onDismiss = handler;
        return this;
      },

      // Show the notification
      show() {
        return showNotification(this._options);
      },

      // Show and return the notification reference for immediate manipulation
      showAndReturn() {
        return addNotification(this._options);
      },
    };

    return builder;
  }, [addNotification, showNotification]);

  // Enhanced convenience methods with promise support
  const success = useCallback(
    (message, options = {}) => {
      return showNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        title: 'Success',
        message,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        ...options,
      });
    },
    [showNotification]
  );

  const error = useCallback(
    (message, options = {}) => {
      return showNotification({
        type: NOTIFICATION_TYPES.ERROR,
        title: 'Error',
        message,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        duration: 0, // Don't auto-dismiss errors
        ...options,
      });
    },
    [showNotification]
  );

  const warning = useCallback(
    (message, options = {}) => {
      return showNotification({
        type: NOTIFICATION_TYPES.WARNING,
        title: 'Warning',
        message,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        ...options,
      });
    },
    [showNotification]
  );

  const info = useCallback(
    (message, options = {}) => {
      return showNotification({
        type: NOTIFICATION_TYPES.INFO,
        title: 'Info',
        message,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        ...options,
      });
    },
    [showNotification]
  );

  const critical = useCallback(
    (message, options = {}) => {
      return showNotification({
        type: NOTIFICATION_TYPES.ERROR,
        title: 'Critical',
        message,
        priority: NOTIFICATION_PRIORITIES.CRITICAL,
        duration: 0, // Critical notifications don't auto-dismiss
        persistent: true,
        ...options,
      });
    },
    [showNotification]
  );

  // Loading notification with progress updates
  const loading = useCallback(
    (message, options = {}) => {
      const notification = addNotification({
        type: NOTIFICATION_TYPES.INFO,
        title: 'Loading...',
        message,
        duration: 0, // Don't auto-dismiss
        showProgress: true,
        allowDismiss: false,
        ...options,
      });

      return {
        ...notification,
        updateProgress: (progress, newMessage) => {
          notification.update({
            progress,
            message: newMessage || message,
          });
        },
        complete: (successMessage, options = {}) => {
          notification.dismiss();
          return success(successMessage, options);
        },
        fail: (errorMessage, options = {}) => {
          notification.dismiss();
          return error(errorMessage, options);
        },
      };
    },
    [addNotification, success, error]
  );

  // Async operation wrapper
  const withNotification = useCallback(
    async (
      operation,
      {
        loadingMessage = 'Processing...',
        successMessage = 'Operation completed successfully',
        errorMessage = 'Operation failed',
        showLoading = true,
        showSuccess = true,
        showError = true,
        ...options
      } = {}
    ) => {
      let loadingNotification;

      try {
        // Show loading notification
        if (showLoading) {
          loadingNotification = loading(loadingMessage, options);
        }

        // Execute the operation
        const result = await operation();

        // Dismiss loading and show success
        if (loadingNotification) {
          loadingNotification.dismiss();
        }

        if (showSuccess) {
          success(
            typeof successMessage === 'function'
              ? successMessage(result)
              : successMessage,
            options
          );
        }

        return result;
      } catch (err) {
        // Dismiss loading and show error
        if (loadingNotification) {
          loadingNotification.dismiss();
        }

        if (showError) {
          error(
            typeof errorMessage === 'function'
              ? errorMessage(err)
              : errorMessage,
            options
          );
        }

        throw err;
      }
    },
    [loading, success, error]
  );

  // Batch notifications
  const batch = useCallback(
    notifications => {
      const refs = notifications.map((notification, index) =>
        addNotification({
          ...notification,
          // Stagger the notifications slightly
          delay: index * 200,
        })
      );

      return {
        dismiss: () => refs.forEach(ref => ref.dismiss()),
        update: updates => refs.forEach(ref => ref.update(updates)),
      };
    },
    [addNotification]
  );

  // Update existing notification
  const updateExisting = useCallback((id, updates) => {
    const ref = notificationRefs.current.get(id);
    if (ref) {
      ref.update(updates);
      return ref;
    }
    return null;
  }, []);

  // Dismiss by pattern
  const dismissBy = useCallback(
    predicate => {
      const { notifications } = context;
      notifications.forEach(notification => {
        if (predicate(notification)) {
          removeNotification(notification.id);
        }
      });
    },
    [context, removeNotification]
  );

  // Queue notification for later
  const queue = useCallback(
    (notification, delay = 0) => {
      return new Promise(resolve => {
        setTimeout(() => {
          const ref = addNotification(notification);
          resolve(ref);
        }, delay);
      });
    },
    [addNotification]
  );

  // Enhanced API
  return useMemo(
    () => ({
      // Context methods
      ...rest,
      addNotification,
      removeNotification,
      updateNotification,

      // Promise-based methods
      show: showNotification,
      success,
      error,
      warning,
      info,
      critical,
      loading,

      // Utility methods
      create: createNotification,
      batch,
      queue,
      updateExisting,
      dismissBy,
      withNotification,

      // Convenience getters
      get hasNotifications() {
        return context.totalCount > 0;
      },

      get hasUnread() {
        return context.unreadCount > 0;
      },

      get latestNotification() {
        return context.notifications[context.notifications.length - 1];
      },

      // Constants
      TYPES: NOTIFICATION_TYPES,
      PRIORITIES: NOTIFICATION_PRIORITIES,
    }),
    [
      rest,
      addNotification,
      removeNotification,
      updateNotification,
      showNotification,
      success,
      error,
      warning,
      info,
      critical,
      loading,
      createNotification,
      batch,
      queue,
      updateExisting,
      dismissBy,
      withNotification,
      context,
    ]
  );
};

// Export convenience functions for direct import
export const useNotificationBuilder = () => {
  const { create } = useNotification();
  return create;
};

export const useAsyncNotification = () => {
  const { withNotification } = useNotification();
  return withNotification;
};

// Export types and constants
export { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES };

export default useNotification;
