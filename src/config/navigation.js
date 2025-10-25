import {
  Dashboard,
  Build,
  People,
  Inventory,
  CalendarToday,
  AttachMoney,
  Settings,
  Search,
  Assessment,
  CloudUpload,
  Timeline,
  DirectionsCar,
  ShoppingCart,
  Description,
  Engineering,
  VerifiedUser,
  Message,
  Analytics,
  AutoMode,
  Receipt,
} from '@mui/icons-material';

/**
 * Navigation configuration for CollisionOS
 * Defines all navigation items with their routes, icons, labels, and submenus
 */
export const navigationConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Dashboard,
    path: '/dashboard',
    description: 'Overview and key metrics',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Build,
    description: 'Manage repair orders and work orders',
    submenu: [
      {
        id: 'jobs-list',
        label: 'All Jobs',
        path: '/jobs',
        description: 'View all repair orders',
      },
      {
        id: 'jobs-search',
        label: 'Search Jobs',
        path: '/search',
        description: 'Search and filter repair orders',
      },
      {
        id: 'jobs-new',
        label: 'New Job',
        path: '/jobs/new',
        description: 'Create a new repair order',
      },
      {
        id: 'production-board',
        label: 'Production Board',
        path: '/production',
        description: 'Visual production workflow',
      },
    ],
  },
  {
    id: 'parts',
    label: 'Parts',
    icon: Inventory,
    description: 'Parts management and ordering',
    submenu: [
      {
        id: 'parts-list',
        label: 'Parts Management',
        path: '/parts',
        description: 'Manage parts inventory',
      },
      {
        id: 'purchase-orders',
        label: 'Purchase Orders',
        path: '/purchase-orders',
        description: 'View and manage POs',
      },
      {
        id: 'automated-sourcing',
        label: 'Automated Sourcing',
        path: '/automated-sourcing',
        description: 'AI-powered parts sourcing',
      },
      {
        id: 'vendor-integration',
        label: 'Vendor Integration',
        path: '/vendor-integration',
        description: 'Vendor integration status',
      },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: People,
    description: 'Customer relationship management',
    submenu: [
      {
        id: 'customers',
        label: 'Customers',
        path: '/customers',
        description: 'Manage customer records',
      },
      {
        id: 'communications',
        label: 'Communications',
        path: '/communications',
        description: 'Customer communications',
      },
    ],
  },
  {
    id: 'schedule',
    label: 'Calendar',
    icon: CalendarToday,
    path: '/schedule',
    description: 'Scheduling and appointments',
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: AttachMoney,
    description: 'Financial management',
    submenu: [
      {
        id: 'invoicing',
        label: 'Invoicing',
        path: '/invoicing',
        description: 'Create and manage invoices',
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        description: 'Financial reports',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        description: 'Business intelligence',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Engineering,
    path: '/tools',
    description: 'Shop tools and utilities',
    submenu: [
      {
        id: 'tools-hub',
        label: 'All Tools',
        path: '/tools',
        description: 'View all available tools',
      },
      {
        id: 'bms-import',
        label: 'BMS Import',
        path: '/bms-import',
        description: 'Import estimates from BMS',
      },
      {
        id: 'vin-decoder',
        label: 'VIN Decoder',
        path: '/tools/vin-decoder',
        description: 'Decode vehicle identification numbers',
      },
      {
        id: 'courtesy-cars',
        label: 'Courtesy Cars',
        path: '/courtesy-cars',
        description: 'Loaner vehicle management',
      },
      {
        id: 'technician',
        label: 'Technician View',
        path: '/technician',
        description: 'Technician dashboard',
      },
      {
        id: 'quality-control',
        label: 'Quality Control',
        path: '/quality-control',
        description: 'QC inspections',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    description: 'Application settings',
  },
];

/**
 * Get navigation item by path
 * @param {string} path - The route path
 * @returns {Object|null} Navigation item or null if not found
 */
export const getNavigationItemByPath = (path) => {
  for (const item of navigationConfig) {
    if (item.path === path) {
      return item;
    }
    if (item.submenu) {
      const submenuItem = item.submenu.find(sub => sub.path === path);
      if (submenuItem) {
        return { parent: item, ...submenuItem };
      }
    }
  }
  return null;
};

/**
 * Check if a navigation item or its submenu items are active
 * @param {Object} item - Navigation item
 * @param {string} currentPath - Current route path
 * @returns {boolean} True if item or any submenu item is active
 */
export const isItemActive = (item, currentPath) => {
  if (item.path === currentPath) {
    return true;
  }
  if (item.submenu) {
    return item.submenu.some(sub => sub.path === currentPath);
  }
  return false;
};

/**
 * Generate breadcrumbs from current path
 * @param {string} pathname - Current route pathname
 * @param {Object} params - Route params (for dynamic segments)
 * @returns {Array} Array of breadcrumb objects
 */
export const generateBreadcrumbs = (pathname, params = {}) => {
  const breadcrumbs = [
    { label: 'Home', path: '/dashboard' }
  ];

  const navItem = getNavigationItemByPath(pathname);

  if (navItem) {
    if (navItem.parent) {
      // Item is in a submenu
      breadcrumbs.push({
        label: navItem.parent.label,
        path: navItem.parent.path || pathname,
      });
    }
    breadcrumbs.push({
      label: navItem.label,
      path: pathname,
      isCurrentPage: true,
    });
  } else {
    // Handle dynamic routes
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length > 0) {
      // Try to match the base path
      const basePath = '/' + segments[0];
      const baseItem = navigationConfig.find(item => item.path === basePath);

      if (baseItem) {
        breadcrumbs.push({
          label: baseItem.label,
          path: basePath,
        });

        // Add dynamic segments
        if (segments.length > 1) {
          const dynamicLabel = params.id || segments[segments.length - 1];
          breadcrumbs.push({
            label: dynamicLabel,
            path: pathname,
            isCurrentPage: true,
          });
        }
      }
    }
  }

  return breadcrumbs;
};
