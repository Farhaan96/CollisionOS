import React from 'react';
import { Chip, Box, useTheme } from '@mui/material';
import { Circle } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * StatusBadge - Color-coded status indicator component
 *
 * @param {string} status - Status value (e.g., "completed", "in-progress", "pending")
 * @param {string} size - Badge size: 'small', 'medium', 'large'
 * @param {string} variant - Badge variant: 'dot', 'pill', 'outlined'
 * @param {object} statusMap - Custom status-to-color mapping
 * @param {string} label - Optional custom label (overrides status text)
 */
const StatusBadge = ({
  status,
  size = 'medium',
  variant = 'pill',
  statusMap,
  label,
}) => {
  const theme = useTheme();

  // Default status color mappings for collision repair workflow
  const defaultStatusMap = {
    // Repair Order Statuses
    'estimating': { color: theme.palette.info.main, label: 'Estimating' },
    'pending-approval': { color: theme.palette.warning.main, label: 'Pending Approval' },
    'approved': { color: theme.palette.success.main, label: 'Approved' },
    'in-progress': { color: theme.palette.primary.main, label: 'In Progress' },
    'waiting-parts': { color: theme.palette.warning.main, label: 'Waiting Parts' },
    'quality-control': { color: theme.palette.info.main, label: 'Quality Control' },
    'completed': { color: theme.palette.success.main, label: 'Completed' },
    'delivered': { color: theme.palette.success.dark, label: 'Delivered' },
    'cancelled': { color: theme.palette.error.main, label: 'Cancelled' },
    'on-hold': { color: theme.palette.warning.dark, label: 'On Hold' },

    // Parts Statuses
    'needed': { color: theme.palette.warning.main, label: 'Needed' },
    'sourcing': { color: theme.palette.info.main, label: 'Sourcing' },
    'ordered': { color: theme.palette.primary.main, label: 'Ordered' },
    'backordered': { color: theme.palette.error.main, label: 'Backordered' },
    'received': { color: theme.palette.success.main, label: 'Received' },
    'installed': { color: theme.palette.success.dark, label: 'Installed' },
    'returned': { color: theme.palette.error.light, label: 'Returned' },

    // Payment Statuses
    'paid': { color: theme.palette.success.main, label: 'Paid' },
    'unpaid': { color: theme.palette.error.main, label: 'Unpaid' },
    'partial': { color: theme.palette.warning.main, label: 'Partial Payment' },
    'overdue': { color: theme.palette.error.dark, label: 'Overdue' },

    // Generic Statuses
    'active': { color: theme.palette.success.main, label: 'Active' },
    'inactive': { color: theme.palette.text.secondary, label: 'Inactive' },
    'pending': { color: theme.palette.warning.main, label: 'Pending' },
    'failed': { color: theme.palette.error.main, label: 'Failed' },
    'success': { color: theme.palette.success.main, label: 'Success' },
  };

  const mapping = statusMap || defaultStatusMap;
  const statusKey = status?.toLowerCase().replace(/ /g, '-');
  const statusConfig = mapping[statusKey] || {
    color: theme.palette.text.secondary,
    label: status || 'Unknown',
  };

  const displayLabel = label || statusConfig.label;

  // Size configurations
  const sizeConfig = {
    small: {
      height: 20,
      fontSize: '0.6875rem',
      px: 1,
      dotSize: 6,
    },
    medium: {
      height: 24,
      fontSize: '0.8125rem',
      px: 1.5,
      dotSize: 8,
    },
    large: {
      height: 32,
      fontSize: '0.9375rem',
      px: 2,
      dotSize: 10,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Variant: Dot (icon + text)
  if (variant === 'dot') {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Circle sx={{ fontSize: config.dotSize, color: statusConfig.color }} />
        <Box
          component="span"
          sx={{
            fontSize: config.fontSize,
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          {displayLabel}
        </Box>
      </Box>
    );
  }

  // Variant: Outlined
  if (variant === 'outlined') {
    return (
      <Chip
        label={displayLabel}
        size={size === 'small' ? 'small' : 'medium'}
        variant="outlined"
        sx={{
          height: config.height,
          fontSize: config.fontSize,
          fontWeight: 600,
          borderColor: statusConfig.color,
          color: statusConfig.color,
          backgroundColor: 'transparent',
          '& .MuiChip-label': {
            px: config.px,
          },
        }}
      />
    );
  }

  // Variant: Pill (default - filled background)
  return (
    <Chip
      label={displayLabel}
      size={size === 'small' ? 'small' : 'medium'}
      sx={{
        height: config.height,
        fontSize: config.fontSize,
        fontWeight: 600,
        backgroundColor: `${statusConfig.color}20`,
        color: statusConfig.color,
        border: `1px solid ${statusConfig.color}40`,
        '& .MuiChip-label': {
          px: config.px,
        },
      }}
    />
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['dot', 'pill', 'outlined']),
  statusMap: PropTypes.object,
  label: PropTypes.string,
};

export default StatusBadge;
