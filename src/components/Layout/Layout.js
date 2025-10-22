import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  Chip,
  Tooltip,
  Fade,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { ThemeSwitcher } from '../Theme/ThemeSwitcher';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;

export default function Layout() {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const location = useLocation();

  // Sidebar state - load from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileOpen}
        onMobileToggle={handleMobileToggle}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: {
            xs: '100%',
            md: `calc(100% - ${sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED}px)`,
          },
          transition: muiTheme.transitions.create('width', {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Top Bar */}
        <AppBar
          position="sticky"
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
            color:
              muiTheme.palette.mode === 'light'
                ? '#374151'
                : 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Toolbar
            sx={{
              px: { xs: 2, md: 3 },
              gap: 2,
            }}
          >
            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleMobileToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Desktop Sidebar Toggle */}
            {!isMobile && (
              <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                <IconButton
                  onClick={handleSidebarToggle}
                  sx={{
                    bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: alpha(muiTheme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                </IconButton>
              </Tooltip>
            )}

            {/* Logo - Mobile Only */}
            {isMobile && (
              <Typography
                variant="h6"
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: '1.125rem',
                }}
              >
                CollisionOS
              </Typography>
            )}

            {/* Spacer */}
            {!isMobile && <Box sx={{ flex: 1 }} />}

            {/* Right Side Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Theme Switcher */}
              <ThemeSwitcher variant="icon" showShortcut={true} />

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  sx={{
                    bgcolor:
                      muiTheme.palette.mode === 'light'
                        ? alpha(muiTheme.palette.primary.main, 0.1)
                        : alpha(muiTheme.palette.common.white, 0.1),
                    color:
                      muiTheme.palette.mode === 'light'
                        ? '#374151'
                        : 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      bgcolor:
                        muiTheme.palette.mode === 'light'
                          ? alpha(muiTheme.palette.primary.main, 0.2)
                          : alpha(muiTheme.palette.common.white, 0.15),
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
                label="Connected"
                size="small"
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'success.main',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Fade in timeout={300}>
            <Box
              sx={{
                flex: 1,
                p: { xs: 2, sm: 3 },
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Breadcrumbs */}
              <Breadcrumbs />

              {/* Page Content */}
              <Outlet />
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
}
