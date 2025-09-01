import { useEffect, useCallback, useRef } from 'react';
import { useShortcutManager } from '../components/KeyboardShortcuts/ShortcutManager';

/**
 * Hook for registering keyboard shortcuts with cleanup
 *
 * @param {string} shortcut - Keyboard shortcut (e.g., 'cmd+k', 'ctrl+shift+n')
 * @param {function} handler - Function to execute when shortcut is pressed
 * @param {object} options - Configuration options
 * @param {boolean} options.preventDefault - Prevent default browser behavior (default: true)
 * @param {boolean} options.stopPropagation - Stop event propagation (default: true)
 * @param {string} options.scope - Shortcut scope (default: 'global')
 * @param {boolean} options.enabled - Whether shortcut is enabled (default: true)
 * @param {array} deps - Dependency array for effect
 */
export const useKeyboardShortcut = (
  shortcut,
  handler,
  options = {},
  deps = []
) => {
  const { registerShortcut, unregisterShortcut } = useShortcutManager();
  const handlerRef = useRef(handler);
  const optionsRef = useRef(options);

  // Update refs when values change
  useEffect(() => {
    handlerRef.current = handler;
    optionsRef.current = options;
  }, [handler, options]);

  // Register/unregister shortcut
  useEffect(() => {
    if (!shortcut || !handlerRef.current || options.enabled === false) {
      return;
    }

    const wrappedHandler = event => {
      if (optionsRef.current.preventDefault !== false) {
        event.preventDefault();
      }
      if (optionsRef.current.stopPropagation !== false) {
        event.stopPropagation();
      }
      handlerRef.current(event);
    };

    const success = registerShortcut(shortcut, wrappedHandler, {
      ...optionsRef.current,
      id: `hook-${shortcut}-${Date.now()}`,
    });

    if (success) {
      return () => {
        unregisterShortcut(shortcut);
      };
    }
  }, [
    shortcut,
    registerShortcut,
    unregisterShortcut,
    options.enabled,
    ...deps,
  ]);
};

/**
 * Hook for registering multiple keyboard shortcuts
 *
 * @param {object} shortcuts - Object mapping shortcuts to handlers
 * @param {object} globalOptions - Global options applied to all shortcuts
 * @param {array} deps - Dependency array for effect
 */
export const useKeyboardShortcuts = (
  shortcuts,
  globalOptions = {},
  deps = []
) => {
  const { registerShortcut, unregisterShortcut } = useShortcutManager();
  const shortcutsRef = useRef(shortcuts);
  const globalOptionsRef = useRef(globalOptions);

  // Update refs when values change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    globalOptionsRef.current = globalOptions;
  }, [shortcuts, globalOptions]);

  useEffect(() => {
    const registeredShortcuts = [];

    Object.entries(shortcutsRef.current).forEach(([shortcut, config]) => {
      if (!shortcut || !config) return;

      let handler, options;

      if (typeof config === 'function') {
        handler = config;
        options = {};
      } else {
        handler = config.handler;
        options = config.options || {};
      }

      if (!handler || options.enabled === false) return;

      const mergedOptions = { ...globalOptionsRef.current, ...options };

      const wrappedHandler = event => {
        if (mergedOptions.preventDefault !== false) {
          event.preventDefault();
        }
        if (mergedOptions.stopPropagation !== false) {
          event.stopPropagation();
        }
        handler(event);
      };

      const success = registerShortcut(shortcut, wrappedHandler, {
        ...mergedOptions,
        id: `hook-multi-${shortcut}-${Date.now()}`,
      });

      if (success) {
        registeredShortcuts.push(shortcut);
      }
    });

    return () => {
      registeredShortcuts.forEach(unregisterShortcut);
    };
  }, [...deps]);
};

/**
 * Hook for conditional keyboard shortcuts
 *
 * @param {string} shortcut - Keyboard shortcut
 * @param {function} handler - Handler function
 * @param {function|boolean} condition - Condition function or boolean
 * @param {object} options - Configuration options
 * @param {array} deps - Dependency array
 */
export const useConditionalKeyboardShortcut = (
  shortcut,
  handler,
  condition,
  options = {},
  deps = []
) => {
  const conditionMet =
    typeof condition === 'function' ? condition() : condition;

  useKeyboardShortcut(
    shortcut,
    handler,
    { ...options, enabled: conditionMet },
    deps
  );
};

/**
 * Hook for form-specific shortcuts
 *
 * @param {object} shortcuts - Form shortcuts configuration
 * @param {boolean} formActive - Whether form is active
 */
export const useFormShortcuts = (shortcuts = {}, formActive = true) => {
  const defaultFormShortcuts = {
    'cmd+enter': shortcuts.submit || (() => {}),
    'cmd+s': shortcuts.save || (() => {}),
    escape: shortcuts.cancel || (() => {}),
    ...shortcuts,
  };

  useKeyboardShortcuts(
    defaultFormShortcuts,
    {
      scope: 'form',
      enabled: formActive,
      preventDefault: true,
    },
    [formActive]
  );
};

/**
 * Hook for navigation shortcuts
 *
 * @param {function} navigate - Navigation function from react-router
 * @param {object} routes - Routes configuration
 */
export const useNavigationShortcuts = (navigate, routes = {}) => {
  const defaultRoutes = {
    'cmd+1': '/dashboard',
    'cmd+2': '/customers',
    'cmd+3': '/production',
    'cmd+4': '/parts',
    'cmd+5': '/estimates',
    'cmd+6': '/reports',
    'cmd+7': '/settings',
    ...routes,
  };

  const navigationShortcuts = Object.entries(defaultRoutes).reduce(
    (acc, [shortcut, path]) => {
      acc[shortcut] = () => navigate(path);
      return acc;
    },
    {}
  );

  useKeyboardShortcuts(navigationShortcuts, {
    category: 'Navigation',
    global: true,
    preventDefault: true,
  });
};

/**
 * Hook for modal/dialog shortcuts
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {function} onSubmit - Submit handler (optional)
 */
export const useModalShortcuts = (isOpen, onClose, onSubmit) => {
  const shortcuts = {
    escape: onClose,
  };

  if (onSubmit) {
    shortcuts['cmd+enter'] = onSubmit;
  }

  useKeyboardShortcuts(
    shortcuts,
    {
      scope: 'modal',
      enabled: isOpen,
      preventDefault: true,
    },
    [isOpen]
  );
};

/**
 * Hook for search shortcuts
 *
 * @param {function} onSearch - Search handler
 * @param {function} onFocus - Focus search input handler
 * @param {function} onClear - Clear search handler
 */
export const useSearchShortcuts = (onSearch, onFocus, onClear) => {
  const shortcuts = {};

  if (onFocus) {
    shortcuts['/'] = onFocus;
    shortcuts['cmd+f'] = onFocus;
  }

  if (onSearch) {
    shortcuts['cmd+k'] = onSearch;
  }

  if (onClear) {
    shortcuts['escape'] = onClear;
  }

  useKeyboardShortcuts(shortcuts, {
    category: 'Search',
    global: true,
    preventDefault: true,
  });
};

/**
 * Hook for data table shortcuts
 *
 * @param {object} tableActions - Table action handlers
 */
export const useTableShortcuts = (tableActions = {}) => {
  const shortcuts = {};

  if (tableActions.selectAll) {
    shortcuts['cmd+a'] = tableActions.selectAll;
  }

  if (tableActions.copy) {
    shortcuts['cmd+c'] = tableActions.copy;
  }

  if (tableActions.delete) {
    shortcuts['delete'] = tableActions.delete;
  }

  if (tableActions.edit) {
    shortcuts['enter'] = tableActions.edit;
  }

  if (tableActions.refresh) {
    shortcuts['f5'] = tableActions.refresh;
  }

  if (tableActions.export) {
    shortcuts['cmd+e'] = tableActions.export;
  }

  useKeyboardShortcuts(shortcuts, {
    category: 'Table',
    scope: 'table',
    preventDefault: true,
  });
};

/**
 * Hook for development shortcuts (only in development mode)
 *
 * @param {object} devActions - Development action handlers
 */
export const useDevShortcuts = (devActions = {}) => {
  const isDev = process.env.NODE_ENV === 'development';

  const shortcuts = {};

  if (isDev && devActions.devTools) {
    shortcuts['f12'] = devActions.devTools;
  }

  if (isDev && devActions.refresh) {
    shortcuts['cmd+r'] = devActions.refresh;
  }

  if (isDev && devActions.hardRefresh) {
    shortcuts['cmd+shift+r'] = devActions.hardRefresh;
  }

  useKeyboardShortcuts(shortcuts, {
    category: 'Development',
    enabled: isDev,
    preventDefault: false,
  });
};

export default useKeyboardShortcut;
