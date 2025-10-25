import React from 'react';
import { Box, Tooltip, Typography, Chip } from '@mui/material';
import {
  RadioButtonUnchecked,
  Search,
  ShoppingCart,
  Schedule,
  LocalShipping,
  CheckCircle,
  Cancel,
  KeyboardReturn,
} from '@mui/icons-material';

/**
 * PartsStatusIndicator
 *
 * Color-coded status indicators for parts workflow:
 * - Green circle: delivered/received/installed
 * - Yellow circle: ordered/on order
 * - Red circle: canceled
 * - Purple circle: returned
 * - Gray circle: needed
 * - Blue circle: sourcing
 */
const PartsStatusIndicator = ({ status, size = 'medium', showLabel = false, variant = 'circle' }) => {
  // Status configuration with exact color requirements
  const statusConfig = {
    needed: {
      color: '#9E9E9E', // Gray
      icon: RadioButtonUnchecked,
      label: 'Needed',
      description: 'Part needs to be sourced and ordered'
    },
    sourcing: {
      color: '#2196F3', // Blue
      icon: Search,
      label: 'Sourcing',
      description: 'Currently sourcing suppliers'
    },
    quoted: {
      color: '#2196F3', // Blue
      icon: Search,
      label: 'Quoted',
      description: 'Quote received from supplier'
    },
    ordered: {
      color: '#FFC107', // Yellow - As per requirements
      icon: ShoppingCart,
      label: 'Ordered',
      description: 'Part has been ordered from supplier'
    },
    backordered: {
      color: '#FF9800', // Orange
      icon: Schedule,
      label: 'Backordered',
      description: 'Part is on backorder'
    },
    shipped: {
      color: '#FFC107', // Yellow (considered "on order")
      icon: LocalShipping,
      label: 'Shipped',
      description: 'Part has been shipped'
    },
    received: {
      color: '#4CAF50', // Green - As per requirements
      icon: CheckCircle,
      label: 'Received',
      description: 'Part has been received at shop'
    },
    inspected: {
      color: '#4CAF50', // Green (considered delivered)
      icon: CheckCircle,
      label: 'Inspected',
      description: 'Part has been inspected'
    },
    installed: {
      color: '#4CAF50', // Green - As per requirements
      icon: CheckCircle,
      label: 'Installed',
      description: 'Part has been installed on vehicle'
    },
    returned: {
      color: '#9C27B0', // Purple - As per requirements
      icon: KeyboardReturn,
      label: 'Returned',
      description: 'Part has been returned to supplier'
    },
    cancelled: {
      color: '#F44336', // Red - As per requirements
      icon: Cancel,
      label: 'Canceled',
      description: 'Part order has been canceled'
    },
  };

  const config = statusConfig[status] || statusConfig.needed;
  const StatusIcon = config.icon;

  // Size configurations
  const sizeConfig = {
    small: {
      circle: 16,
      icon: 12,
      fontSize: '0.75rem',
    },
    medium: {
      circle: 24,
      icon: 16,
      fontSize: '0.875rem',
    },
    large: {
      circle: 32,
      icon: 20,
      fontSize: '1rem',
    },
  };

  const sizes = sizeConfig[size] || sizeConfig.medium;

  // Circle variant - solid filled circle
  if (variant === 'circle') {
    const indicator = (
      <Box
        sx={{
          width: sizes.circle,
          height: sizes.circle,
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${config.color}`,
          boxShadow: `0 0 0 2px ${config.color}20`,
        }}
      >
        <StatusIcon
          sx={{
            fontSize: sizes.icon,
            color: '#FFFFFF',
          }}
        />
      </Box>
    );

    return showLabel ? (
      <Box display="flex" alignItems="center" gap={1}>
        <Tooltip title={config.description} arrow placement="top">
          {indicator}
        </Tooltip>
        <Typography variant="body2" fontSize={sizes.fontSize} fontWeight={500}>
          {config.label}
        </Typography>
      </Box>
    ) : (
      <Tooltip title={`${config.label}: ${config.description}`} arrow placement="top">
        {indicator}
      </Tooltip>
    );
  }

  // Chip variant - Material-UI chip with color
  if (variant === 'chip') {
    return (
      <Chip
        icon={<StatusIcon />}
        label={config.label}
        size={size === 'small' ? 'small' : 'medium'}
        sx={{
          backgroundColor: `${config.color}15`,
          color: config.color,
          borderColor: config.color,
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: config.color,
          },
        }}
        variant="outlined"
      />
    );
  }

  // Dot variant - simple colored dot
  if (variant === 'dot') {
    const indicator = (
      <Box
        sx={{
          width: sizes.circle / 2,
          height: sizes.circle / 2,
          borderRadius: '50%',
          backgroundColor: config.color,
          border: `2px solid ${config.color}`,
        }}
      />
    );

    return showLabel ? (
      <Box display="flex" alignItems="center" gap={0.5}>
        <Tooltip title={config.description} arrow placement="top">
          {indicator}
        </Tooltip>
        <Typography variant="body2" fontSize={sizes.fontSize}>
          {config.label}
        </Typography>
      </Box>
    ) : (
      <Tooltip title={`${config.label}: ${config.description}`} arrow placement="top">
        {indicator}
      </Tooltip>
    );
  }

  // Badge variant - icon with colored background
  if (variant === 'badge') {
    return (
      <Tooltip title={`${config.label}: ${config.description}`} arrow placement="top">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: `${config.color}15`,
            color: config.color,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: sizes.fontSize,
            fontWeight: 600,
          }}
        >
          <StatusIcon sx={{ fontSize: sizes.icon }} />
          {showLabel && config.label}
        </Box>
      </Tooltip>
    );
  }

  return null;
};

/**
 * PartsStatusLegend
 *
 * Displays a legend of all status colors for reference
 */
export const PartsStatusLegend = () => {
  const statuses = ['needed', 'sourcing', 'ordered', 'backordered', 'received', 'installed', 'returned', 'cancelled'];

  return (
    <Box display="flex" flexWrap="wrap" gap={2} p={2}>
      {statuses.map(status => (
        <PartsStatusIndicator
          key={status}
          status={status}
          size="small"
          showLabel={true}
          variant="circle"
        />
      ))}
    </Box>
  );
};

export default PartsStatusIndicator;
