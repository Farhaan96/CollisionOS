import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommandPalette from './CommandPalette';
import { useCommandProvider } from './CommandProvider';
import {
  useKeyboardShortcut,
  useNavigationShortcuts,
} from '../../hooks/useKeyboardShortcut';
import { useShortcutManager } from '../KeyboardShortcuts/ShortcutManager';
import ShortcutHelper from '../KeyboardShortcuts/ShortcutHelper';
import { useTheme } from '../../hooks/useTheme';

/**
 * CommandPaletteIntegration - Main integration component for command palette and shortcuts
 * This component handles the integration between command palette, keyboard shortcuts,
 * and the overall application state.
 */
const CommandPaletteIntegration = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { registerShortcut } = useShortcutManager();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutHelperOpen, setShortcutHelperOpen] = useState(false);

  // Command Palette shortcut (Cmd+K)
  useKeyboardShortcut(
    'cmd+k',
    () => {
      setCommandPaletteOpen(true);
    },
    {
      name: 'Command Palette',
      description: 'Open command palette for quick actions',
      category: 'System',
      global: true,
    }
  );

  // Shortcut Helper shortcut (?)
  useKeyboardShortcut(
    '?',
    () => {
      setShortcutHelperOpen(true);
    },
    {
      name: 'Keyboard Shortcuts',
      description: 'Show keyboard shortcuts help',
      category: 'Help',
      global: true,
    }
  );

  // Navigation shortcuts
  useNavigationShortcuts(navigate);

  // Register system-wide shortcuts
  useEffect(() => {
    // Theme toggle shortcut
    registerShortcut(
      'cmd+shift+t',
      () => {
        toggleTheme();
      },
      {
        id: 'theme-toggle',
        name: 'Toggle Theme',
        description: 'Switch between light and dark theme',
        category: 'View',
        global: true,
        preventDefault: true,
      }
    );

    // Sidebar toggle shortcut
    registerShortcut(
      'cmd+\\',
      () => {
        window.dispatchEvent(new CustomEvent('toggleSidebar'));
      },
      {
        id: 'toggle-sidebar',
        name: 'Toggle Sidebar',
        description: 'Show/hide navigation sidebar',
        category: 'View',
        global: true,
        preventDefault: true,
      }
    );

    // Fullscreen shortcut
    registerShortcut(
      'cmd+shift+f',
      () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      },
      {
        id: 'fullscreen',
        name: 'Toggle Fullscreen',
        description: 'Enter or exit fullscreen mode',
        category: 'View',
        global: true,
        preventDefault: true,
      }
    );

    // Quick save shortcut
    registerShortcut(
      'cmd+s',
      event => {
        window.dispatchEvent(
          new CustomEvent('quickSave', { detail: { event } })
        );
      },
      {
        id: 'quick-save',
        name: 'Quick Save',
        description: 'Save current changes',
        category: 'Actions',
        global: true,
        preventDefault: true,
      }
    );

    // Quick search shortcut
    registerShortcut(
      '/',
      event => {
        // Only trigger if not in an input field
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          window.dispatchEvent(
            new CustomEvent('focusSearch', { detail: { event } })
          );
        }
      },
      {
        id: 'focus-search',
        name: 'Focus Search',
        description: 'Focus the search input',
        category: 'Search',
        global: true,
        preventDefault: true,
      }
    );

    // Refresh shortcut
    registerShortcut(
      'f5',
      () => {
        window.dispatchEvent(new CustomEvent('refreshData'));
      },
      {
        id: 'refresh-data',
        name: 'Refresh',
        description: 'Refresh current data',
        category: 'Actions',
        global: true,
        preventDefault: true,
      }
    );
  }, [registerShortcut, toggleTheme]);

  // Handle ESC key to close modals
  useKeyboardShortcut(
    'escape',
    () => {
      if (commandPaletteOpen) {
        setCommandPaletteOpen(false);
      } else if (shortcutHelperOpen) {
        setShortcutHelperOpen(false);
      } else {
        // Close any other open modals/dialogs
        window.dispatchEvent(new CustomEvent('closeModals'));
      }
    },
    {
      name: 'Close/Cancel',
      description: 'Close open dialogs or cancel current action',
      category: 'System',
      global: true,
    }
  );

  // Listen for custom events from other components
  useEffect(() => {
    const handleOpenCommandPalette = () => setCommandPaletteOpen(true);
    const handleOpenShortcutHelper = () => setShortcutHelperOpen(true);

    window.addEventListener('openCommandPalette', handleOpenCommandPalette);
    window.addEventListener('openShortcutHelper', handleOpenShortcutHelper);

    return () => {
      window.removeEventListener(
        'openCommandPalette',
        handleOpenCommandPalette
      );
      window.removeEventListener(
        'openShortcutHelper',
        handleOpenShortcutHelper
      );
    };
  }, []);

  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Keyboard Shortcuts Helper */}
      <ShortcutHelper
        open={shortcutHelperOpen}
        onClose={() => setShortcutHelperOpen(false)}
      />
    </>
  );
};

export default CommandPaletteIntegration;
