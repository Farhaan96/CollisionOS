import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
  Fade,
  Slide,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Build,
  People,
  Inventory,
  Engineering,
  VerifiedUser,
  Assessment,
  AccountCircle,
  Logout,
  Notifications,
  Settings,
  Close,
  Handyman,
  Search,
  Analytics,
  ShoppingCart,
  Message,
  Timeline,
  AutoMode,
  Insights,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { ThemeSwitcher } from '../Theme/ThemeSwitcher';

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/search', label: 'Search', icon: <Search /> },
  { path: '/analytics', label: 'Analytics', icon: <Analytics /> },
  {
    path: '/production',
    label: 'Production Board',
    icon: <Timeline />,
  },
  {
    path: '/purchase-orders',
    label: 'Purchase Orders',
    icon: <ShoppingCart />,
  },
  { path: '/communications', label: 'Communications', icon: <Message /> },
  { path: '/bms-import', label: 'BMS Import', icon: <Inventory /> },
  { path: '/customers', label: 'Customers', icon: <People /> },
  { path: '/parts', label: 'Parts', icon: <Handyman /> },
  { path: '/automated-sourcing', label: 'Auto Sourcing', icon: <AutoMode /> },
  { path: '/vendor-integration', label: 'Vendor Integration', icon: <Insights /> },
  { path: '/quality-control', label: 'QC', icon: <VerifiedUser /> },
];

export default function Layout() {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const location = useLocation();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const isActiveRoute = path => {
    return location.pathname === path;
  };

  // Mobile Drawer
  const drawer = (
    <Box sx={{ width: 280, height: '100%', bgcolor: 'background.paper' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          🔧 CollisionOS
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <Close />
        </IconButton>
      </Box>

      <List sx={{ pt: 2 }}>
        {navigationItems.map(item => (
          <ListItem
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              bgcolor: isActiveRoute(item.path)
                ? 'primary.main'
                : 'transparent',
              color: isActiveRoute(item.path) ? 'white' : 'text.primary',
              '&:hover': {
                bgcolor: isActiveRoute(item.path)
                  ? 'primary.dark'
                  : 'action.hover',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: isActiveRoute(item.path) ? 600 : 400,
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Box
        sx={{
          mt: 'auto',
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AccountCircle />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {user?.role || 'User'}
            </Typography>
          </Box>
          <ThemeSwitcher variant='compact' size='small' />
        </Box>
        <Button
          fullWidth
          variant='outlined'
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{ borderRadius: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'auto',
        isolation: 'isolate',
      }}
    >
      {/* App Bar */}
      <AppBar
        position='sticky'
        elevation={0}
        sx={{
          zIndex: 1100,
          background:
            muiTheme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pointerEvents: 'auto',
          color:
            muiTheme.palette.mode === 'light'
              ? '#374151'
              : 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <Toolbar
          sx={{
            pointerEvents: 'auto',
            zIndex: 'inherit',
            px: { xs: 2, md: 3 },
          }}
        >
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color='inherit'
              aria-label='open drawer'
              edge='start'
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Typography
            variant='h6'
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'primary.main',
              textShadow:
                muiTheme.palette.mode === 'light'
                  ? '0 1px 2px rgba(0,0,0,0.1)'
                  : '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            🔧 CollisionOS
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {navigationItems.map(item => (
                <Tooltip key={item.path} title={item.label}>
                  <Button
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      color: isActiveRoute(item.path)
                        ? 'primary.main'
                        : muiTheme.palette.mode === 'light'
                          ? '#374151'
                          : 'rgba(255, 255, 255, 0.85)',
                      bgcolor: isActiveRoute(item.path)
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'transparent',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: isActiveRoute(item.path) ? 600 : 500,
                      '&:hover': {
                        bgcolor: isActiveRoute(item.path)
                          ? 'rgba(99, 102, 241, 0.15)'
                          : muiTheme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.05)'
                            : 'rgba(255, 255, 255, 0.05)',
                        transform: 'translateY(-1px)',
                        boxShadow:
                          muiTheme.palette.mode === 'light'
                            ? '0 4px 12px rgba(0,0,0,0.1)'
                            : '0 4px 12px rgba(0,0,0,0.3)',
                      },
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {item.label}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          )}

          {/* Right Side Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            {/* Theme Switcher */}
            <ThemeSwitcher variant='icon' showShortcut={true} />

            {/* Notifications */}
            <Tooltip title='Notifications'>
              <IconButton
                sx={{
                  bgcolor:
                    muiTheme.palette.mode === 'light'
                      ? 'rgba(30, 64, 175, 0.1)'
                      : 'rgba(255, 255, 255, 0.1)',
                  color:
                    muiTheme.palette.mode === 'light'
                      ? '#374151'
                      : 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    bgcolor:
                      muiTheme.palette.mode === 'light'
                        ? 'rgba(30, 64, 175, 0.2)'
                        : 'rgba(255, 255, 255, 0.15)',
                  },
                }}
              >
                <Notifications />
              </IconButton>
            </Tooltip>

            {/* Connection Status */}
            <Chip
              icon={
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />
              }
              label='Connected'
              size='small'
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'success.main',
                fontWeight: 600,
              }}
            />

            {/* User Profile */}
            <Tooltip title='Profile'>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  bgcolor:
                    muiTheme.palette.mode === 'light'
                      ? 'rgba(30, 64, 175, 0.1)'
                      : 'rgba(255, 255, 255, 0.1)',
                  color:
                    muiTheme.palette.mode === 'light'
                      ? '#374151'
                      : 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    bgcolor:
                      muiTheme.palette.mode === 'light'
                        ? 'rgba(30, 64, 175, 0.2)'
                        : 'rgba(255, 255, 255, 0.15)',
                  },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            border: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'auto',
          contain: 'layout style',
          minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
          overflow: 'hidden', // Prevent content shifting
        }}
      >
        <Fade in timeout={300}>
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              zIndex: 1,
              pointerEvents: 'auto',
            }}
          >
            <Outlet />
          </Box>
        </Fade>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {user?.email}
          </Typography>
        </Box>

        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize='small' />
          </ListItemIcon>
          Profile
        </MenuItem>

        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Settings fontSize='small' />
          </ListItemIcon>
          Settings
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize='small' />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
