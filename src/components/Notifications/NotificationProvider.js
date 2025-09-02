// NotificationProvider - Global notification context with queue management, priority system, and persistence
// Executive-level notification management with sophisticated features

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  premiumColors,
  premiumShadows,
  premiumZIndex,
} from '../../theme/premiumDesignSystem';
import { advancedSpringConfigs } from '../../utils/animations';
import Toast from './Toast';
import { v4 as uuidv4 } from 'uuid';

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  CUSTOM: 'custom',
};

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATIONS: 'collisionos_notification_history',
  SETTINGS: 'collisionos_notification_settings',
  DO_NOT_DISTURB: 'collisionos_notification_dnd',
};

// Initial state
const initialState = {
  notifications: [],
  history: [],
  settings: {
    maxNotifications: 5,
    defaultDuration: 5000,
    position: 'top-right',
    soundEnabled: true,
    vibrationEnabled: true,
    persistHistory: true,
    groupSimilar: true,
    showPreview: true,
  },
  doNotDisturb: {
    enabled: false,
    until: null,
    allowCritical: true,
  },
  queue: [],
  isProcessing: false,
};

// Reducer actions
const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_SETTINGS: 'SET_SETTINGS',
  SET_DO_NOT_DISTURB: 'SET_DO_NOT_DISTURB',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  PROCESS_QUEUE: 'PROCESS_QUEUE',
  SET_PROCESSING: 'SET_PROCESSING',
};

// Priority order for queue processing
const PRIORITY_ORDER = {
  [NOTIFICATION_PRIORITIES.CRITICAL]: 0,
  [NOTIFICATION_PRIORITIES.HIGH]: 1,
  [NOTIFICATION_PRIORITIES.NORMAL]: 2,
  [NOTIFICATION_PRIORITIES.LOW]: 3,
};

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION: {
      const notification = {
        id: uuidv4(),
        timestamp: Date.now(),
        read: false,
        ...action.payload,
      };

      // Check if we're in do not disturb mode
      if (
        state.doNotDisturb.enabled &&
        notification.priority !== NOTIFICATION_PRIORITIES.CRITICAL &&
        !state.doNotDisturb.allowCritical
      ) {
        return {
          ...state,
          queue: [...state.queue, notification].sort(
            (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
          ),
        };
      }

      // Check for similar notifications to group
      if (state.settings.groupSimilar) {
        const similar = state.notifications.find(
          n => n.type === notification.type && n.title === notification.title
        );

        if (similar) {
          return {
            ...state,
            notifications: state.notifications.map(n =>
              n.id === similar.id
                ? { ...n, count: (n.count || 1) + 1, timestamp: Date.now() }
                : n
            ),
          };
        }
      }

      const newNotifications = [...state.notifications, notification];

      // Enforce max notifications limit
      if (newNotifications.length > state.settings.maxNotifications) {
        const removed = newNotifications.splice(
          0,
          newNotifications.length - state.settings.maxNotifications
        );
        // Move removed to history
        return {
          ...state,
          notifications: newNotifications,
          history: [
            ...removed.map(n => ({ ...n, dismissed: true })),
            ...state.history,
          ],
        };
      }

      return {
        ...state,
        notifications: newNotifications,
      };
    }

    case ACTIONS.REMOVE_NOTIFICATION: {
      const notification = state.notifications.find(
        n => n.id === action.payload
      );
      const filteredNotifications = state.notifications.filter(
        n => n.id !== action.payload
      );

      return {
        ...state,
        notifications: filteredNotifications,
        history: notification
          ? [
              { ...notification, dismissed: true, dismissedAt: Date.now() },
              ...state.history,
            ]
          : state.history,
      };
    }

    case ACTIONS.UPDATE_NOTIFICATION: {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload.updates } : n
        ),
      };
    }

    case ACTIONS.CLEAR_ALL: {
      const dismissedNotifications = state.notifications.map(n => ({
        ...n,
        dismissed: true,
        dismissedAt: Date.now(),
      }));

      return {
        ...state,
        notifications: [],
        history: [...dismissedNotifications, ...state.history],
      };
    }

    case ACTIONS.SET_SETTINGS: {
      const newSettings = { ...state.settings, ...action.payload };

      // Persist settings
      if (typeof Storage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(newSettings)
        );
      }

      return {
        ...state,
        settings: newSettings,
      };
    }

    case ACTIONS.SET_DO_NOT_DISTURB: {
      const dndSettings = { ...state.doNotDisturb, ...action.payload };

      // Persist DND settings
      if (typeof Storage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.DO_NOT_DISTURB,
          JSON.stringify(dndSettings)
        );
      }

      return {
        ...state,
        doNotDisturb: dndSettings,
      };
    }

    case ACTIONS.ADD_TO_HISTORY: {
      const newHistory = [action.payload, ...state.history].slice(0, 100); // Keep last 100

      // Persist history
      if (state.settings.persistHistory && typeof Storage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.NOTIFICATIONS,
          JSON.stringify(newHistory)
        );
      }

      return {
        ...state,
        history: newHistory,
      };
    }

    case ACTIONS.CLEAR_HISTORY: {
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      }

      return {
        ...state,
        history: [],
      };
    }

    case ACTIONS.PROCESS_QUEUE: {
      if (state.queue.length === 0 || state.isProcessing) {
        return state;
      }

      // Process highest priority notification from queue
      const nextNotification = state.queue[0];
      const remainingQueue = state.queue.slice(1);

      return {
        ...state,
        queue: remainingQueue,
        notifications: [...state.notifications, nextNotification],
      };
    }

    case ACTIONS.SET_PROCESSING: {
      return {
        ...state,
        isProcessing: action.payload,
      };
    }

    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Load persisted data
const loadPersistedData = () => {
  if (typeof Storage === 'undefined') return {};

  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const history = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const dnd = localStorage.getItem(STORAGE_KEYS.DO_NOT_DISTURB);

    return {
      settings: settings ? JSON.parse(settings) : undefined,
      history: history ? JSON.parse(history) : undefined,
      doNotDisturb: dnd ? JSON.parse(dnd) : undefined,
    };
  } catch (error) {
    console.warn('Failed to load notification preferences:', error);
    return {};
  }
};

// Sound and vibration utilities
const playNotificationSound = (type, settings) => {
  if (!settings.soundEnabled || typeof Audio === 'undefined') return;

  try {
    // Different sounds for different types
    const frequencies = {
      success: 800,
      error: 300,
      warning: 600,
      info: 500,
      custom: 400,
    };

    // Create AudioContext for sound generation
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(
      frequencies[type] || 500,
      audioContext.currentTime
    );
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

const triggerVibration = (pattern, settings) => {
  if (!settings.vibrationEnabled || !navigator.vibrate) return;

  try {
    const patterns = {
      success: [100],
      error: [100, 50, 100],
      warning: [200],
      info: [50],
      critical: [200, 100, 200, 100, 200],
    };

    navigator.vibrate(patterns[pattern] || [50]);
  } catch (error) {
    console.warn('Failed to trigger vibration:', error);
  }
};

// NotificationProvider component
export const NotificationProvider = ({
  children,
  customToastContainer,
  position = 'top-right',
}) => {
  const persistedData = useMemo(() => loadPersistedData(), []);

  const [state, dispatch] = useReducer(notificationReducer, {
    ...initialState,
    settings: { ...initialState.settings, ...persistedData.settings, position },
    history: persistedData.history || [],
    doNotDisturb: {
      ...initialState.doNotDisturb,
      ...persistedData.doNotDisturb,
    },
  });

  // Process notification queue
  useEffect(() => {
    if (state.queue.length > 0 && !state.isProcessing) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.PROCESS_QUEUE });
      }, 500); // Delay between queue processing

      return () => clearTimeout(timer);
    }
  }, [state.queue.length, state.isProcessing]);

  // Check do not disturb timeout
  useEffect(() => {
    if (state.doNotDisturb.enabled && state.doNotDisturb.until) {
      const now = Date.now();
      if (now >= state.doNotDisturb.until) {
        dispatch({
          type: ACTIONS.SET_DO_NOT_DISTURB,
          payload: { enabled: false, until: null },
        });
      }
    }
  }, [state.doNotDisturb]);

  // API functions
  const addNotification = useCallback(
    notification => {
      const fullNotification = {
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        type: NOTIFICATION_TYPES.INFO,
        duration: state.settings.defaultDuration,
        ...notification,
      };

      // Play sound and vibration
      playNotificationSound(fullNotification.type, state.settings);
      triggerVibration(fullNotification.priority, state.settings);

      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: fullNotification });

      return fullNotification.id;
    },
    [state.settings]
  );

  const removeNotification = useCallback(id => {
    dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const updateNotification = useCallback((id, updates) => {
    dispatch({ type: ACTIONS.UPDATE_NOTIFICATION, payload: { id, updates } });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);

  const updateSettings = useCallback(newSettings => {
    dispatch({ type: ACTIONS.SET_SETTINGS, payload: newSettings });
  }, []);

  const setDoNotDisturb = useCallback(
    (enabled, duration = null, allowCritical = true) => {
      const until = enabled && duration ? Date.now() + duration : null;
      dispatch({
        type: ACTIONS.SET_DO_NOT_DISTURB,
        payload: { enabled, until, allowCritical },
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_HISTORY });
  }, []);

  const markAsRead = useCallback(
    id => {
      updateNotification(id, { read: true });
    },
    [updateNotification]
  );

  const markAllAsRead = useCallback(() => {
    state.notifications.forEach(notification => {
      if (!notification.read) {
        updateNotification(notification.id, { read: true });
      }
    });
  }, [state.notifications, updateNotification]);

  // Context value
  const contextValue = useMemo(
    () => ({
      // State
      notifications: state.notifications,
      history: state.history,
      settings: state.settings,
      doNotDisturb: state.doNotDisturb,
      queue: state.queue,

      // Stats
      unreadCount: state.notifications.filter(n => !n.read).length,
      totalCount: state.notifications.length,
      historyCount: state.history.length,

      // Actions
      addNotification,
      removeNotification,
      updateNotification,
      clearAllNotifications,
      updateSettings,
      setDoNotDisturb,
      clearHistory,
      markAsRead,
      markAllAsRead,

      // Convenience methods
      success: (message, options = {}) =>
        addNotification({
          type: NOTIFICATION_TYPES.SUCCESS,
          title: 'Success',
          message,
          ...options,
        }),
      error: (message, options = {}) =>
        addNotification({
          type: NOTIFICATION_TYPES.ERROR,
          title: 'Error',
          message,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          ...options,
        }),
      warning: (message, options = {}) =>
        addNotification({
          type: NOTIFICATION_TYPES.WARNING,
          title: 'Warning',
          message,
          ...options,
        }),
      info: (message, options = {}) =>
        addNotification({
          type: NOTIFICATION_TYPES.INFO,
          title: 'Info',
          message,
          ...options,
        }),
      critical: (message, options = {}) =>
        addNotification({
          type: NOTIFICATION_TYPES.ERROR,
          title: 'Critical',
          message,
          priority: NOTIFICATION_PRIORITIES.CRITICAL,
          duration: 0, // Don't auto-dismiss critical
          ...options,
        }),
    }),
    [
      state,
      addNotification,
      removeNotification,
      updateNotification,
      clearAllNotifications,
      updateSettings,
      setDoNotDisturb,
      clearHistory,
      markAsRead,
      markAllAsRead,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      {customToastContainer || (
        <div
          style={{
            position: 'fixed',
            ...getPositionStyles(state.settings.position),
            zIndex: premiumZIndex.notification,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: '400px',
            width: '100%',
          }}
          role='region'
          aria-label='Notifications'
          aria-live='polite'
        >
          <AnimatePresence mode='popLayout'>
            {state.notifications.map((notification, index) => (
              <Toast
                key={notification.id}
                notification={notification}
                onDismiss={removeNotification}
                onAction={action => action.handler?.(notification)}
                index={index}
                total={state.notifications.length}
                settings={state.settings}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

// Position styles helper
const getPositionStyles = position => {
  const positions = {
    'top-right': { top: 24, right: 24 },
    'top-left': { top: 24, left: 24 },
    'top-center': { top: 24, left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'bottom-center': { bottom: 24, left: '50%', transform: 'translateX(-50%)' },
  };

  return positions[position] || positions['top-right'];
};

// Hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

// Export types and constants
export { NOTIFICATION_PRIORITIES, NOTIFICATION_TYPES };

// Use named export instead of mixing with default
export { NotificationProvider };
export default NotificationProvider;
