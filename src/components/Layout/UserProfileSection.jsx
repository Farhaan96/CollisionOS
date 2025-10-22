import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Chip,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  Logout,
  HelpOutline,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

/**
 * User Profile Section Component
 * Displays user information at the bottom of the sidebar
 * Includes dropdown menu for profile, settings, help, and logout
 */
const UserProfileSection = ({ open }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    handleClose();
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  // Format user role
  const getUserRole = () => {
    if (!user || !user.role) return 'User';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          p: open ? 2 : 1,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: open ? 1.5 : 0,
            cursor: 'pointer',
            borderRadius: 2,
            p: open ? 1.5 : 0.5,
            transition: 'all 0.2s ease',
            justifyContent: open ? 'flex-start' : 'center',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <Avatar
            sx={{
              width: open ? 40 : 32,
              height: open ? 40 : 32,
              bgcolor: 'primary.main',
              fontSize: open ? '1rem' : '0.875rem',
              fontWeight: 600,
            }}
          >
            {getUserInitials()}
          </Avatar>

          {open && (
            <>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.firstName} {user.lastName}
                </Typography>
                <Chip
                  label={getUserRole()}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    mt: 0.5,
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              </Box>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {menuOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: open ? 'right' : 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: open ? 'left' : 'center',
        }}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid',
            borderColor: 'divider',
            mt: -1,
          },
        }}
      >
        {/* User Info Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {user.firstName} {user.lastName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {user.email}
          </Typography>
        </Box>

        {/* Menu Items */}
        <MenuItem
          onClick={() => handleMenuItemClick('/profile')}
          sx={{
            py: 1.5,
            px: 2,
          }}
        >
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Profile</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleMenuItemClick('/settings')}
          sx={{
            py: 1.5,
            px: 2,
          }}
        >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleMenuItemClick('/help')}
          sx={{
            py: 1.5,
            px: 2,
          }}
        >
          <ListItemIcon>
            <HelpOutline fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Help & Support</Typography>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            px: 2,
            color: 'error.main',
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserProfileSection;
