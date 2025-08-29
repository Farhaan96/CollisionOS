import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Save as SaveIcon,
  FileOpen as FileOpenIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  ExitToApp as ExitToAppIcon,
  Brightness6 as ThemeIcon,
  FullscreenExit as FullscreenIcon,
  ViewKanban as KanbanIcon,
  Timeline as TimelineIcon,
  BarChart as ChartIcon,
  AccountCircle as ProfileIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  GetApp as ExportIcon,
  CloudUpload as ImportIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

// Command Provider Context
const CommandContext = createContext();

// Default command registry with comprehensive CollisionOS commands
const defaultCommands = [
  // Navigation Commands
  {
    id: 'nav-dashboard',
    title: 'Dashboard',
    description: 'Go to main dashboard',
    category: 'Navigation',
    icon: DashboardIcon,
    shortcut: 'Cmd+1',
    keywords: ['home', 'main', 'overview'],
    action: 'navigate',
    args: { path: '/dashboard' }
  },
  {
    id: 'nav-customers',
    title: 'Customers',
    description: 'Manage customer information',
    category: 'Navigation',
    icon: PeopleIcon,
    shortcut: 'Cmd+2',
    keywords: ['clients', 'contacts'],
    action: 'navigate',
    args: { path: '/customers' }
  },
  {
    id: 'nav-production',
    title: 'Production',
    description: 'View production board',
    category: 'Navigation',
    icon: BuildIcon,
    shortcut: 'Cmd+3',
    keywords: ['jobs', 'work', 'board', 'kanban'],
    action: 'navigate',
    args: { path: '/production' }
  },
  {
    id: 'nav-parts',
    title: 'Parts Inventory',
    description: 'Manage parts and inventory',
    category: 'Navigation',
    icon: KanbanIcon,
    shortcut: 'Cmd+4',
    keywords: ['inventory', 'stock', 'supplies'],
    action: 'navigate',
    args: { path: '/parts' }
  },
  {
    id: 'nav-estimates',
    title: 'Estimates',
    description: 'Create and manage estimates',
    category: 'Navigation',
    icon: AssessmentIcon,
    shortcut: 'Cmd+5',
    keywords: ['quotes', 'pricing'],
    action: 'navigate',
    args: { path: '/estimates' }
  },
  {
    id: 'nav-reports',
    title: 'Reports',
    description: 'View analytics and reports',
    category: 'Navigation',
    icon: ChartIcon,
    shortcut: 'Cmd+6',
    keywords: ['analytics', 'stats', 'metrics'],
    action: 'navigate',
    args: { path: '/reports' }
  },
  {
    id: 'nav-settings',
    title: 'Settings',
    description: 'Application settings',
    category: 'Navigation',
    icon: SettingsIcon,
    shortcut: 'Cmd+7',
    keywords: ['preferences', 'config'],
    action: 'navigate',
    args: { path: '/settings' }
  },

  // Quick Actions
  {
    id: 'action-new-customer',
    title: 'New Customer',
    description: 'Create a new customer record',
    category: 'Actions',
    icon: AddIcon,
    shortcut: 'Cmd+Shift+C',
    keywords: ['create', 'add', 'client'],
    action: 'dialog',
    args: { dialog: 'customer-form' }
  },
  {
    id: 'action-new-job',
    title: 'New Job',
    description: 'Create a new production job',
    category: 'Actions',
    icon: AddIcon,
    shortcut: 'Cmd+Shift+J',
    keywords: ['create', 'add', 'work order'],
    action: 'dialog',
    args: { dialog: 'job-form' }
  },
  {
    id: 'action-new-estimate',
    title: 'New Estimate',
    description: 'Create a new estimate',
    category: 'Actions',
    icon: AddIcon,
    shortcut: 'Cmd+Shift+E',
    keywords: ['create', 'add', 'quote'],
    action: 'dialog',
    args: { dialog: 'estimate-form' }
  },
  {
    id: 'action-save',
    title: 'Save',
    description: 'Save current changes',
    category: 'Actions',
    icon: SaveIcon,
    shortcut: 'Cmd+S',
    keywords: ['save', 'store', 'update'],
    action: 'save',
    args: {}
  },

  // Search Commands
  {
    id: 'search-customers',
    title: 'Search Customers',
    description: 'Find customers by name, phone, or email',
    category: 'Search',
    icon: SearchIcon,
    shortcut: 'Cmd+Shift+F',
    keywords: ['find', 'lookup', 'clients'],
    action: 'search',
    args: { type: 'customers' }
  },
  {
    id: 'search-jobs',
    title: 'Search Jobs',
    description: 'Find production jobs by ID or customer',
    category: 'Search',
    icon: SearchIcon,
    keywords: ['find', 'lookup', 'work orders'],
    action: 'search',
    args: { type: 'jobs' }
  },
  {
    id: 'search-parts',
    title: 'Search Parts',
    description: 'Find parts by number or description',
    category: 'Search',
    icon: SearchIcon,
    keywords: ['find', 'lookup', 'inventory'],
    action: 'search',
    args: { type: 'parts' }
  },

  // File Operations
  {
    id: 'file-import',
    title: 'Import Data',
    description: 'Import data from file',
    category: 'File',
    icon: ImportIcon,
    shortcut: 'Cmd+O',
    keywords: ['upload', 'load', 'csv', 'excel'],
    action: 'import',
    args: {}
  },
  {
    id: 'file-export',
    title: 'Export Data',
    description: 'Export current data to file',
    category: 'File',
    icon: ExportIcon,
    shortcut: 'Cmd+E',
    keywords: ['download', 'save', 'csv', 'excel', 'pdf'],
    action: 'export',
    args: {}
  },
  {
    id: 'file-print',
    title: 'Print',
    description: 'Print current document',
    category: 'File',
    icon: PrintIcon,
    shortcut: 'Cmd+P',
    keywords: ['print', 'paper'],
    action: 'print',
    args: {}
  },

  // View Commands
  {
    id: 'view-fullscreen',
    title: 'Toggle Fullscreen',
    description: 'Enter or exit fullscreen mode',
    category: 'View',
    icon: FullscreenIcon,
    shortcut: 'Cmd+Shift+F11',
    keywords: ['full', 'screen', 'maximize'],
    action: 'fullscreen',
    args: {}
  },
  {
    id: 'view-theme',
    title: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    category: 'View',
    icon: ThemeIcon,
    shortcut: 'Cmd+Shift+T',
    keywords: ['dark', 'light', 'theme'],
    action: 'theme',
    args: {}
  },

  // System Commands
  {
    id: 'system-refresh',
    title: 'Refresh Data',
    description: 'Reload all data from server',
    category: 'System',
    icon: RefreshIcon,
    shortcut: 'F5',
    keywords: ['reload', 'sync', 'update'],
    action: 'refresh',
    args: {}
  },
  {
    id: 'system-logout',
    title: 'Logout',
    description: 'Sign out of the application',
    category: 'System',
    icon: ExitToAppIcon,
    shortcut: 'Cmd+Shift+Q',
    keywords: ['sign out', 'exit'],
    action: 'logout',
    args: {}
  },
  {
    id: 'system-profile',
    title: 'My Profile',
    description: 'View and edit your profile',
    category: 'System',
    icon: ProfileIcon,
    keywords: ['account', 'user', 'settings'],
    action: 'dialog',
    args: { dialog: 'profile' }
  },
  {
    id: 'system-help',
    title: 'Help & Support',
    description: 'Get help and documentation',
    category: 'System',
    icon: HelpIcon,
    shortcut: '?',
    keywords: ['support', 'docs', 'documentation'],
    action: 'help',
    args: {}
  }
];

// Permission-based command filtering
const getPermissionsForRole = (role) => {
  const permissions = {
    admin: ['*'],
    manager: [
      'nav-*', 'action-*', 'search-*', 'file-*', 
      'view-*', 'system-refresh', 'system-profile', 'system-help'
    ],
    user: [
      'nav-dashboard', 'nav-customers', 'nav-production', 'nav-estimates',
      'search-*', 'action-new-customer', 'action-new-job', 'action-save',
      'view-*', 'system-profile', 'system-help'
    ],
    viewer: [
      'nav-dashboard', 'nav-reports', 'search-*', 
      'view-*', 'system-profile', 'system-help'
    ]
  };
  return permissions[role] || permissions.viewer;
};

// Command Provider Component
export const CommandProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [commands, setCommands] = useState(defaultCommands);
  const [recentCommands, setRecentCommands] = useState([]);
  const [commandAliases, setCommandAliases] = useState({});

  // Load recent commands from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('collisionos-recent-commands');
    if (saved) {
      try {
        setRecentCommands(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load recent commands:', error);
      }
    }
  }, []);

  // Save recent commands to localStorage
  useEffect(() => {
    localStorage.setItem('collisionos-recent-commands', JSON.stringify(recentCommands));
  }, [recentCommands]);

  // Filter commands based on user permissions
  const getFilteredCommands = useCallback(() => {
    if (!user) return [];
    
    const userPermissions = getPermissionsForRole(user.role);
    
    if (userPermissions.includes('*')) {
      return commands;
    }
    
    return commands.filter(command => {
      return userPermissions.some(permission => {
        if (permission.endsWith('*')) {
          return command.id.startsWith(permission.slice(0, -1));
        }
        return command.id === permission;
      });
    });
  }, [commands, user]);

  // Register new command
  const registerCommand = useCallback((command) => {
    setCommands(prev => {
      const existing = prev.find(cmd => cmd.id === command.id);
      if (existing) {
        return prev.map(cmd => cmd.id === command.id ? { ...cmd, ...command } : cmd);
      }
      return [...prev, command];
    });
  }, []);

  // Unregister command
  const unregisterCommand = useCallback((commandId) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== commandId));
  }, []);

  // Add command alias
  const addCommandAlias = useCallback((alias, commandId) => {
    setCommandAliases(prev => ({ ...prev, [alias]: commandId }));
  }, []);

  // Add command to recent list
  const addToRecent = useCallback((commandId) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId);
      return [commandId, ...filtered].slice(0, 10); // Keep last 10
    });
  }, []);

  // Execute command
  const executeCommand = useCallback(async (commandId, args = {}) => {
    // Check for alias
    const actualCommandId = commandAliases[commandId] || commandId;
    const command = commands.find(cmd => cmd.id === actualCommandId);
    
    if (!command) {
      showNotification('Command not found', 'error');
      return;
    }

    try {
      switch (command.action) {
        case 'navigate':
          if (args.path) {
            navigate(args.path);
            showNotification(`Navigated to ${command.title}`, 'success');
          }
          break;

        case 'dialog':
          if (args.dialog) {
            // Dispatch custom event for dialog opening
            window.dispatchEvent(new CustomEvent('openDialog', {
              detail: { dialog: args.dialog, data: args.data }
            }));
            showNotification(`Opening ${command.title}`, 'info');
          }
          break;

        case 'search':
          if (args.type) {
            // Dispatch search event
            window.dispatchEvent(new CustomEvent('performSearch', {
              detail: { type: args.type, query: args.query }
            }));
            showNotification(`Searching ${command.title}`, 'info');
          }
          break;

        case 'save':
          // Dispatch save event
          window.dispatchEvent(new CustomEvent('performSave'));
          showNotification('Saved successfully', 'success');
          break;

        case 'import':
          // Dispatch import event
          window.dispatchEvent(new CustomEvent('performImport'));
          showNotification('Import dialog opened', 'info');
          break;

        case 'export':
          // Dispatch export event
          window.dispatchEvent(new CustomEvent('performExport', {
            detail: { format: args.format }
          }));
          showNotification('Export started', 'info');
          break;

        case 'print':
          window.print();
          showNotification('Print dialog opened', 'info');
          break;

        case 'fullscreen':
          if (document.fullscreenElement) {
            document.exitFullscreen();
            showNotification('Exited fullscreen', 'info');
          } else {
            document.documentElement.requestFullscreen();
            showNotification('Entered fullscreen', 'info');
          }
          break;

        case 'theme':
          // Dispatch theme toggle event
          window.dispatchEvent(new CustomEvent('toggleTheme'));
          showNotification('Theme toggled', 'info');
          break;

        case 'refresh':
          window.location.reload();
          break;

        case 'logout':
          await logout();
          showNotification('Logged out successfully', 'success');
          break;

        case 'help':
          window.open('/help', '_blank');
          showNotification('Help opened in new tab', 'info');
          break;

        default:
          // Custom command handler
          if (command.handler) {
            await command.handler(args);
          } else {
            showNotification('Command executed', 'success');
          }
      }
    } catch (error) {
      console.error('Command execution error:', error);
      showNotification(`Failed to execute ${command.title}`, 'error');
    }
  }, [commands, commandAliases, navigate, showNotification, logout]);

  // Context value
  const value = {
    commands: getFilteredCommands(),
    recentCommands,
    registerCommand,
    unregisterCommand,
    addCommandAlias,
    executeCommand,
    addToRecent
  };

  return (
    <CommandContext.Provider value={value}>
      {children}
    </CommandContext.Provider>
  );
};

// Hook for using command context
export const useCommandProvider = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandProvider must be used within CommandProvider');
  }
  return context;
};

// Hook for registering commands dynamically
export const useCommandRegistration = (commands = []) => {
  const { registerCommand, unregisterCommand } = useCommandProvider();

  useEffect(() => {
    // Register commands
    commands.forEach(registerCommand);

    // Cleanup on unmount
    return () => {
      commands.forEach(command => unregisterCommand(command.id));
    };
  }, [commands, registerCommand, unregisterCommand]);
};

export default CommandProvider;