# CollisionOS Navigation System Documentation

## Overview

The CollisionOS navigation system has been completely redesigned to provide a modern, intuitive user experience with the following features:

- **Persistent Sidebar Navigation** - Always visible on desktop with collapsible functionality
- **Responsive Mobile Drawer** - Smooth drawer navigation on mobile devices
- **Hierarchical Submenus** - Organized navigation with expandable submenus
- **Breadcrumbs** - Clear location indication with clickable navigation path
- **Active Item Highlighting** - Visual feedback showing current location
- **Persistent State** - Sidebar and submenu states saved to localStorage
- **Dark Mode Support** - Full dark mode compatibility
- **User Profile Section** - Quick access to profile, settings, and logout

## Architecture

### Files Created/Modified

1. **`src/config/navigation.js`** - Navigation configuration
2. **`src/components/Layout/Sidebar.jsx`** - Main sidebar component
3. **`src/components/Layout/Breadcrumbs.jsx`** - Breadcrumbs component
4. **`src/components/Layout/UserProfileSection.jsx`** - User profile section
5. **`src/components/Layout/Layout.js`** - Updated main layout

### Component Hierarchy

```
Layout
├── Sidebar (persistent/drawer)
│   ├── Logo Section
│   ├── Navigation Items
│   │   ├── Main Items
│   │   └── Submenus (collapsible)
│   └── UserProfileSection
│       └── Profile Menu
├── TopBar
│   ├── Sidebar Toggle
│   ├── Theme Switcher
│   ├── Notifications
│   └── Connection Status
└── Main Content
    ├── Breadcrumbs
    └── Page Content (Outlet)
```

## Navigation Configuration

### Structure

The navigation is defined in `src/config/navigation.js` with the following structure:

```javascript
{
  id: 'unique-id',
  label: 'Display Label',
  icon: IconComponent,
  path: '/route-path', // Optional for items with submenu
  description: 'Tooltip description',
  submenu: [ // Optional
    {
      id: 'submenu-id',
      label: 'Submenu Label',
      path: '/submenu-path',
      description: 'Description'
    }
  ]
}
```

### Current Navigation Items

**Main Sections:**
1. **Dashboard** - Overview and key metrics
2. **Jobs** - Repair order management
   - All Jobs
   - Search Jobs
   - New Job
   - Production Board
3. **Parts** - Parts and inventory
   - Parts Management
   - Purchase Orders
   - Automated Sourcing
   - Vendor Integration
4. **CRM** - Customer management
   - Customers
   - Communications
5. **Calendar** - Scheduling and appointments
6. **Financial** - Financial management
   - Invoicing
   - Reports
   - Analytics
7. **Tools** - Shop utilities
   - BMS Import
   - Courtesy Cars
   - Technician View
   - Quality Control
8. **Settings** - Application settings

## Features

### 1. Persistent Sidebar

**Desktop Behavior:**
- Always visible
- Can be collapsed to icon-only mode (64px width)
- Expanded mode shows icons + text (240px width)
- State persists across sessions (localStorage)
- Smooth animations on expand/collapse

**Mobile Behavior:**
- Hidden by default
- Opens as temporary drawer overlay
- Swipe or button to close
- Full width (280px)

### 2. Expandable Submenus

**Features:**
- Click parent item to expand/collapse submenu
- Auto-expand when child route is active
- Visual indicators (chevron icons)
- Smooth collapse animations
- State persists in localStorage

**Behavior:**
- Parent items without direct paths expand/collapse submenus
- Parent items with paths navigate and can also expand submenus
- Submenu items are indented and use smaller icons
- Active submenu items highlighted in primary color

### 3. Breadcrumbs

**Features:**
- Automatically generated from current route
- Clickable navigation (except current page)
- Shows hierarchy: Home > Section > Subsection > Current Page
- Responsive: Shows last 2 levels on mobile
- Home icon on first breadcrumb

**Usage:**
```javascript
// Breadcrumbs are automatically rendered in Layout
// They use the navigation configuration to generate hierarchy
```

**Customization:**
Dynamic routes can be customized by passing params:
```javascript
generateBreadcrumbs('/ro/RO-2024-001', { id: 'RO-2024-001' })
// Result: Home > Jobs > RO-2024-001
```

### 4. User Profile Section

**Features:**
- User avatar with initials
- User name and role badge
- Dropdown menu with:
  - Profile
  - Settings
  - Help & Support
  - Logout
- Visual feedback on hover
- Compact mode when sidebar collapsed

**Styling:**
- Positioned at bottom of sidebar
- Subtle background color
- Smooth hover transitions
- Role badge with color coding

### 5. Active State Highlighting

**Visual Indicators:**
- Active nav items: Primary blue background, white text
- Parent of active submenu: Light blue background
- Hover states: Light background color
- Font weight: 600 for active, 500 for normal

### 6. Responsive Design

**Breakpoints:**
- **Mobile (< 960px)**: Sidebar as temporary drawer
- **Desktop (≥ 960px)**: Persistent sidebar

**Adaptations:**
- Top bar shows hamburger menu on mobile
- Breadcrumbs show only last 2 levels on mobile
- Connection status chip hidden on small screens
- Sidebar toggle button only on desktop

### 7. Dark Mode Support

**Features:**
- All components support light and dark modes
- Automatic color adjustments based on theme
- Consistent contrast ratios
- Proper text colors for readability

**Colors (Light Mode):**
- Sidebar: White background
- Active item: Primary blue (#1976D2)
- Hover: Light blue (#E3F2FD)
- Text: Dark gray (#2C3E50)

**Colors (Dark Mode):**
- Sidebar: Dark slate (#1E293B)
- Active item: Light blue (#42A5F5)
- Hover: Medium slate (#334155)
- Text: Light gray (#E2E8F0)

## Usage Examples

### Adding a New Navigation Item

Edit `src/config/navigation.js`:

```javascript
{
  id: 'inventory',
  label: 'Inventory',
  icon: Inventory2,
  path: '/inventory',
  description: 'Inventory management',
}
```

### Adding a Submenu

```javascript
{
  id: 'reports',
  label: 'Reports',
  icon: Assessment,
  description: 'Reports and analytics',
  submenu: [
    {
      id: 'financial-reports',
      label: 'Financial Reports',
      path: '/reports/financial',
      description: 'Financial reporting',
    },
    {
      id: 'production-reports',
      label: 'Production Reports',
      path: '/reports/production',
      description: 'Production metrics',
    },
  ],
}
```

### Custom Breadcrumbs for Dynamic Routes

For routes with dynamic segments (e.g., `/ro/:id`), breadcrumbs will automatically use the ID. To customize:

1. Fetch the entity name in the page component
2. Use document title or page header for display

The breadcrumb will show:
- Static routes: Uses label from navigation config
- Dynamic routes: Uses the ID parameter or last segment

## Customization

### Sidebar Width

Edit constants in `src/components/Layout/Sidebar.jsx`:

```javascript
const SIDEBAR_WIDTH_EXPANDED = 240; // Change to desired width
const SIDEBAR_WIDTH_COLLAPSED = 64;
```

### Animation Speed

Transitions use Material-UI theme settings:

```javascript
transition: theme.transitions.create('width', {
  easing: theme.transitions.easing.sharp,
  duration: theme.transitions.duration.enteringScreen, // 225ms
})
```

### Icon Set

Icons are from `@mui/icons-material`. To change:

```javascript
import { NewIcon } from '@mui/icons-material';

// In navigation config:
{
  icon: NewIcon,
  // ...
}
```

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate through items
- **Enter/Space**: Activate item or expand submenu
- **Arrow Keys**: Move between items (native browser)
- **Escape**: Close mobile drawer

### Screen Readers

- Proper ARIA labels on interactive elements
- Semantic HTML structure
- Focus indicators
- Tooltips for collapsed sidebar items

### Color Contrast

- WCAG AA compliant color ratios
- High contrast mode compatible
- Icons paired with text labels

## Performance

### Optimizations

1. **Lazy State Initialization**: Sidebar state loaded once from localStorage
2. **Memoization**: Consider using `React.memo()` for nav items if performance issues arise
3. **CSS Transitions**: Hardware-accelerated transforms
4. **Code Splitting**: Navigation items use icon imports (tree-shakeable)

### Bundle Size

- Material-UI icons: ~5KB per icon (tree-shaken)
- Navigation config: ~2KB
- Component code: ~15KB total

## Troubleshooting

### Sidebar Not Appearing

1. Check if Layout component is rendered
2. Verify sidebar state in localStorage: `localStorage.getItem('sidebar-open')`
3. Check console for JavaScript errors

### Submenu Not Expanding

1. Verify item has `submenu` array in config
2. Check localStorage: `localStorage.getItem('sidebar-expanded-items')`
3. Ensure `id` is unique for each item

### Active State Not Working

1. Verify route path matches navigation config
2. Check React Router is working: `console.log(location.pathname)`
3. Ensure `isItemActive` function logic is correct

### Breadcrumbs Not Showing

1. Verify Breadcrumbs component is rendered in Layout
2. Check navigation config has correct paths
3. Verify React Router `useLocation` returns correct path

## Future Enhancements

### Planned Features

1. **Global Search**
   - Keyboard shortcut (Cmd/Ctrl + K)
   - Search across jobs, customers, parts
   - Dropdown results with categories

2. **Notifications Center**
   - Real-time notifications
   - Badge count on bell icon
   - Dropdown list with categories
   - Mark as read functionality

3. **Recent Items**
   - Track recently viewed pages
   - Quick access dropdown
   - Persistent in localStorage

4. **Favorites/Bookmarks**
   - Star favorite pages
   - Quick access section in sidebar
   - Drag to reorder

5. **Keyboard Shortcuts**
   - Configurable shortcuts
   - Shortcut hint tooltips
   - Shortcut reference modal (?)

6. **Collapsible Sections**
   - Group navigation items
   - Collapse/expand sections
   - Persistent section state

## Migration Notes

### Breaking Changes

The navigation system replaces the previous horizontal top bar navigation. Pages that referenced the old navigation structure may need updates:

1. **No more top bar nav buttons**: All navigation is now in the sidebar
2. **Breadcrumbs required**: Pages should remove custom breadcrumbs
3. **Layout structure changed**: Main content now includes padding and breadcrumbs

### Migration Steps

1. **Remove custom breadcrumbs** from page components
2. **Remove custom navigation** from pages
3. **Test all routes** to ensure navigation works
4. **Update route paths** if needed in navigation config
5. **Test responsive behavior** on mobile devices

## Support

For issues or questions about the navigation system:

1. Check this documentation
2. Review the source code comments
3. Check console for error messages
4. Contact the development team

---

**Last Updated**: October 22, 2025
**Version**: 1.0.0
**Author**: CollisionOS Development Team
