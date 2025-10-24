import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Divider,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { navigationConfig, isItemActive } from '../../config/navigation';
import UserProfileSection from './UserProfileSection';

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;

/**
 * Persistent Sidebar Component
 * Features:
 * - Collapsible/expandable
 * - Nested submenus
 * - Active item highlighting
 * - Persistent state in localStorage
 * - Responsive drawer on mobile
 */
const Sidebar = ({ open, onToggle, mobileOpen, onMobileToggle }) => {
  const theme = useTheme();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebar-expanded-items');
    if (savedExpanded) {
      try {
        setExpandedItems(JSON.parse(savedExpanded));
      } catch (error) {
        console.error('Failed to parse sidebar expanded items:', error);
      }
    }
  }, []);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems));
  }, [expandedItems]);

  // Auto-expand parent if child is active
  useEffect(() => {
    navigationConfig.forEach(item => {
      if (item.submenu && isItemActive(item, location.pathname)) {
        setExpandedItems(prev => ({ ...prev, [item.id]: true }));
      }
    });
  }, [location.pathname]);

  const handleExpandClick = (itemId, event) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const isExpanded = (itemId) => expandedItems[itemId] || false;

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const renderNavItem = (item, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActive = isItemActive(item, location.pathname);
    const expanded = isExpanded(item.id);
    const IconComponent = item.icon;

    // For items with submenu but no direct path
    if (hasSubmenu && !item.path) {
      return (
        <React.Fragment key={item.id}>
          <ListItem
            disablePadding
            sx={{
              mx: open ? 1 : 0.5,
              mb: 0.5,
            }}
          >
            <ListItemButton
              onClick={(e) => handleExpandClick(item.id, e)}
              sx={{
                borderRadius: open ? 2 : 1,
                minHeight: 44,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2 : 1,
                bgcolor: isActive
                  ? alpha(theme.palette.primary.main, 0.12)
                  : 'transparent',
                color: isActive ? 'primary.main' : 'text.primary',
                '&:hover': {
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, 0.18)
                    : alpha(theme.palette.action.hover, 0.08),
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                {IconComponent && <IconComponent />}
              </ListItemIcon>
              {open && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </ListItem>

          {hasSubmenu && (
            <Collapse in={open && expanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                {item.submenu.map(subItem => renderNavItem(subItem, level + 1))}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    }

    // For items with a path (can be clicked)
    const content = (
      <ListItemButton
        component={item.path ? Link : 'div'}
        to={item.path || undefined}
        onClick={hasSubmenu && open ? (e) => handleExpandClick(item.id, e) : undefined}
        sx={{
          borderRadius: open ? 2 : 1,
          minHeight: 44,
          justifyContent: open ? 'initial' : 'center',
          px: open ? (level > 0 ? 3 : 2) : 1,
          bgcolor: isActiveRoute(item.path)
            ? theme.palette.primary.main
            : 'transparent',
          color: isActiveRoute(item.path) ? 'white' : 'text.primary',
          '&:hover': {
            bgcolor: isActiveRoute(item.path)
              ? theme.palette.primary.dark
              : alpha(theme.palette.action.hover, 0.08),
          },
          transition: 'all 0.2s ease',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 2 : 'auto',
            justifyContent: 'center',
            color: 'inherit',
          }}
        >
          {level > 0 ? (
            <ChevronRight sx={{ fontSize: 20 }} />
          ) : (
            IconComponent && <IconComponent />
          )}
        </ListItemIcon>
        {open && (
          <>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: level > 0 ? 13 : 14,
                fontWeight: isActiveRoute(item.path) ? 600 : level > 0 ? 400 : 500,
              }}
            />
            {hasSubmenu && (expanded ? <ExpandLess /> : <ExpandMore />)}
          </>
        )}
      </ListItemButton>
    );

    return (
      <React.Fragment key={item.id}>
        <ListItem
          disablePadding
          sx={{
            mx: open ? 1 : 0.5,
            mb: 0.5,
          }}
        >
          {!open && item.description ? (
            <Tooltip title={item.label} placement="right" arrow>
              {content}
            </Tooltip>
          ) : (
            content
          )}
        </ListItem>

        {hasSubmenu && (
          <Collapse in={open && expanded} timeout="auto" unmountOnExit>
            <List disablePadding>
              {item.submenu.map(subItem => renderNavItem(subItem, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          minHeight: 64,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            🔧
          </Box>
          {open && (
            <Box>
              <Box
                sx={{
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  color: 'primary.main',
                  lineHeight: 1.2,
                }}
              >
                CollisionOS
              </Box>
              <Box
                sx={{
                  fontSize: '0.625rem',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Pro Edition
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation Items */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 2,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.text.secondary, 0.2),
            borderRadius: 3,
            '&:hover': {
              bgcolor: alpha(theme.palette.text.secondary, 0.3),
            },
          },
        }}
      >
        <List disablePadding>
          {navigationConfig.slice(0, -1).map(item => renderNavItem(item))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <List disablePadding>
          {navigationConfig.slice(-1).map(item => renderNavItem(item))}
        </List>
      </Box>

      {/* User Profile Section */}
      <UserProfileSection open={open} />
    </Box>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
            boxSizing: 'border-box',
            border: 'none',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
