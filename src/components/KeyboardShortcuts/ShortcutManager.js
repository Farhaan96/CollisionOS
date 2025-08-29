import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useNotification } from '../../hooks/useNotification';

// Keyboard Shortcut Manager Context
const ShortcutContext = createContext();

// Platform detection
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const metaKey = isMac ? 'metaKey' : 'ctrlKey';
const modifierNames = {
  ctrl: isMac ? '⌃' : 'Ctrl',
  alt: isMac ? '⌥' : 'Alt', 
  shift: isMac ? '⇧' : 'Shift',
  meta: isMac ? '⌘' : 'Win'
};

// Parse shortcut string into normalized format
const parseShortcut = (shortcut) => {
  const keys = shortcut.toLowerCase().split('+').map(k => k.trim());
  const parsed = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    key: null,
    sequence: []
  };

  keys.forEach(key => {
    switch (key) {
      case 'ctrl':
      case 'control':
        parsed.ctrl = true;
        break;
      case 'alt':
      case 'option':
        parsed.alt = true;
        break;
      case 'shift':
        parsed.shift = true;
        break;
      case 'cmd':
      case 'command':
      case 'meta':
        parsed.meta = true;
        break;
      default:
        parsed.key = key;
    }
  });

  return parsed;
};

// Normalize shortcut for display
const normalizeShortcutDisplay = (shortcut) => {
  const parsed = parseShortcut(shortcut);
  const parts = [];
  
  if (parsed.ctrl) parts.push(modifierNames.ctrl);
  if (parsed.alt) parts.push(modifierNames.alt);
  if (parsed.shift) parts.push(modifierNames.shift);
  if (parsed.meta) parts.push(modifierNames.meta);
  
  if (parsed.key) {
    // Special key names
    const specialKeys = {
      'enter': '↵',
      'space': 'Space',
      'tab': '⇥',
      'escape': 'Esc',
      'backspace': '⌫',
      'delete': '⌦',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'home': 'Home',
      'end': 'End',
      'pageup': 'PgUp',
      'pagedown': 'PgDn'
    };
    
    const displayKey = specialKeys[parsed.key] || parsed.key.toUpperCase();
    parts.push(displayKey);
  }
  
  return parts.join(isMac ? '' : '+');
};

// Check if shortcut matches current key event
const matchesShortcut = (event, shortcut) => {
  const parsed = parseShortcut(shortcut);
  
  // Check modifiers
  if (parsed.ctrl !== event.ctrlKey) return false;
  if (parsed.alt !== event.altKey) return false;
  if (parsed.shift !== event.shiftKey) return false;
  if (parsed.meta !== event.metaKey) return false;
  
  // Check key
  if (parsed.key) {
    const eventKey = event.key.toLowerCase();
    if (parsed.key !== eventKey) return false;
  }
  
  return true;
};

// Default system shortcuts
const defaultShortcuts = {
  // Command palette
  'cmd+k': {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open command palette',
    category: 'System',
    global: true,
    preventDefault: true
  },
  
  // Navigation shortcuts  
  'cmd+1': {
    id: 'nav-dashboard',
    name: 'Dashboard', 
    description: 'Go to dashboard',
    category: 'Navigation',
    global: true,
    preventDefault: true
  },
  
  'cmd+2': {
    id: 'nav-customers',
    name: 'Customers',
    description: 'Go to customers',
    category: 'Navigation', 
    global: true,
    preventDefault: true
  },
  
  'cmd+3': {
    id: 'nav-production',
    name: 'Production',
    description: 'Go to production',
    category: 'Navigation',
    global: true,
    preventDefault: true
  },
  
  'cmd+4': {
    id: 'nav-parts',
    name: 'Parts',
    description: 'Go to parts inventory',
    category: 'Navigation',
    global: true,
    preventDefault: true
  },
  
  'cmd+5': {
    id: 'nav-estimates',
    name: 'Estimates',
    description: 'Go to estimates',
    category: 'Navigation',
    global: true,
    preventDefault: true
  },
  
  // Action shortcuts
  'cmd+s': {
    id: 'save',
    name: 'Save',
    description: 'Save current changes',
    category: 'Actions',
    global: true,
    preventDefault: true
  },
  
  'cmd+n': {
    id: 'new',
    name: 'New',
    description: 'Create new item',
    category: 'Actions',
    global: true,
    preventDefault: true
  },
  
  'cmd+enter': {
    id: 'submit',
    name: 'Submit',
    description: 'Submit current form',
    category: 'Actions',
    scope: 'form',
    preventDefault: true
  },
  
  // Search shortcuts
  '/': {
    id: 'search',
    name: 'Search',
    description: 'Focus search input',
    category: 'Search',
    global: true,
    preventDefault: true
  },
  
  'cmd+f': {
    id: 'find',
    name: 'Find',
    description: 'Find in page',
    category: 'Search',
    global: true,
    preventDefault: true
  },
  
  // View shortcuts
  'cmd+\\': {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Show/hide sidebar',
    category: 'View',
    global: true,
    preventDefault: true
  },
  
  'cmd+shift+f': {
    id: 'fullscreen',
    name: 'Fullscreen',
    description: 'Toggle fullscreen mode',
    category: 'View',
    global: true,
    preventDefault: true
  },
  
  // Help
  '?': {
    id: 'help',
    name: 'Help',
    description: 'Show keyboard shortcuts',
    category: 'Help',
    global: true,
    preventDefault: true
  }
};

// Shortcut Manager Component
export const ShortcutManager = ({ children }) => {
  const { showNotification } = useNotification();
  const shortcuts = useRef(new Map(Object.entries(defaultShortcuts)));
  const handlers = useRef(new Map());
  const sequenceBuffer = useRef([]);
  const sequenceTimeout = useRef(null);
  const currentScope = useRef('global');

  // Register shortcut handler
  const registerShortcut = useCallback((shortcut, handler, options = {}) => {
    const normalizedShortcut = shortcut.toLowerCase();
    
    // Check for conflicts
    if (shortcuts.current.has(normalizedShortcut) && !options.override) {
      console.warn(`Shortcut conflict: ${shortcut} is already registered`);
      if (!options.allowConflicts) {
        return false;
      }
    }
    
    const shortcutConfig = {
      id: options.id || `custom-${Date.now()}`,
      name: options.name || shortcut,
      description: options.description || '',
      category: options.category || 'Custom',
      global: options.global !== false,
      preventDefault: options.preventDefault !== false,
      scope: options.scope || 'global',
      sequence: options.sequence || false,
      ...options
    };
    
    shortcuts.current.set(normalizedShortcut, shortcutConfig);
    handlers.current.set(normalizedShortcut, handler);
    
    return true;
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((shortcut) => {
    const normalizedShortcut = shortcut.toLowerCase();
    shortcuts.current.delete(normalizedShortcut);
    handlers.current.delete(normalizedShortcut);
  }, []);

  // Set current scope
  const setScope = useCallback((scope) => {
    currentScope.current = scope;
  }, []);

  // Get all shortcuts for current scope
  const getShortcuts = useCallback((scope) => {
    const result = [];
    shortcuts.current.forEach((config, shortcut) => {
      if (!scope || config.global || config.scope === scope) {
        result.push({
          shortcut,
          display: normalizeShortcutDisplay(shortcut),
          ...config
        });
      }
    });
    
    // Group by category
    const grouped = result.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {});
    
    return grouped;
  }, []);

  // Handle sequence shortcuts
  const handleSequence = useCallback((key, event) => {
    sequenceBuffer.current.push(key);
    
    // Clear existing timeout
    if (sequenceTimeout.current) {
      clearTimeout(sequenceTimeout.current);
    }
    
    // Check for sequence match
    const sequence = sequenceBuffer.current.join(' ');
    const handler = handlers.current.get(sequence);
    const config = shortcuts.current.get(sequence);
    
    if (handler && config) {
      if (config.preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      handler(event);
      sequenceBuffer.current = [];
      return true;
    }
    
    // Set timeout to clear buffer
    sequenceTimeout.current = setTimeout(() => {
      sequenceBuffer.current = [];
    }, 2000);
    
    return false;
  }, []);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event) => {
    // Skip if user is typing in an input
    const activeElement = document.activeElement;
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
    
    // Build shortcut string
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('cmd');
    
    if (event.key && event.key !== 'Control' && event.key !== 'Alt' && event.key !== 'Shift' && event.key !== 'Meta') {
      parts.push(event.key.toLowerCase());
    }
    
    const shortcut = parts.join('+');
    
    // Skip empty shortcuts
    if (!shortcut || shortcut.match(/^(ctrl|alt|shift|cmd)$/)) {
      return;
    }
    
    // Handle sequence shortcuts first
    if (handleSequence(shortcut, event)) {
      return;
    }
    
    // Find matching shortcut
    const config = shortcuts.current.get(shortcut);
    const handler = handlers.current.get(shortcut);
    
    if (!config || !handler) {
      return;
    }
    
    // Check scope
    if (!config.global && config.scope !== currentScope.current) {
      return;
    }
    
    // Skip if input is active and shortcut is not global
    if (isInputActive && !config.global) {
      return;
    }
    
    // Special case for search shortcut
    if (shortcut === '/' && !isInputActive) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
      return;
    }
    
    // Prevent default if configured
    if (config.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      handler(event);
    } catch (error) {
      console.error('Shortcut handler error:', error);
      showNotification('Shortcut execution failed', 'error');
    }
  }, [handleSequence, showNotification]);

  // Handle key up for modifier keys
  const handleKeyUp = useCallback((event) => {
    // Clear sequence buffer on escape
    if (event.key === 'Escape') {
      sequenceBuffer.current = [];
      if (sequenceTimeout.current) {
        clearTimeout(sequenceTimeout.current);
      }
    }
  }, []);

  // Set up global event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      
      if (sequenceTimeout.current) {
        clearTimeout(sequenceTimeout.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  // Context value
  const value = {
    registerShortcut,
    unregisterShortcut,
    setScope,
    getShortcuts,
    normalizeShortcutDisplay
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
};

// Hook for using shortcut context
export const useShortcutManager = () => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcutManager must be used within ShortcutManager');
  }
  return context;
};

// Hook for registering shortcuts with cleanup
export const useShortcuts = (shortcuts, dependencies = []) => {
  const { registerShortcut, unregisterShortcut } = useShortcutManager();

  useEffect(() => {
    const registeredShortcuts = [];
    
    Object.entries(shortcuts).forEach(([shortcut, config]) => {
      const { handler, ...options } = config;
      if (registerShortcut(shortcut, handler, options)) {
        registeredShortcuts.push(shortcut);
      }
    });
    
    return () => {
      registeredShortcuts.forEach(unregisterShortcut);
    };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
};

export default ShortcutManager;