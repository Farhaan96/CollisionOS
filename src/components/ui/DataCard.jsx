import React from 'react';
import { Card, CardContent, Box, Typography, IconButton, useTheme, Skeleton } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * DataCard - General purpose data display card
 *
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {string} subtitle - Optional subtitle
 * @param {ReactElement} icon - Optional icon element
 * @param {ReactElement|ReactElement[]} actions - Action buttons (displayed in top-right)
 * @param {ReactNode} children - Optional custom content below value
 * @param {boolean} loading - Show loading skeleton
 * @param {function} onClick - Optional click handler for entire card
 * @param {string} variant - Card variant: 'default', 'outlined', 'elevated'
 */
const DataCard = ({
  title,
  value,
  subtitle,
  icon,
  actions,
  children,
  loading = false,
  onClick,
  variant = 'default',
}) => {
  const theme = useTheme();

  // Get card styles based on variant
  const getCardStyles = () => {
    const baseStyles = {
      height: '100%',
      borderRadius: 2,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    const variants = {
      default: {
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': onClick ? {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        } : {},
      },
      outlined: {
        background: 'transparent',
        border: `2px solid ${theme.palette.divider}`,
        '&:hover': onClick ? {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
        } : {},
      },
      elevated: {
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 1) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[2],
        '&:hover': onClick ? {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-4px)',
        } : {},
      },
    };

    return { ...baseStyles, ...variants[variant] };
  };

  if (loading) {
    return (
      <Card sx={getCardStyles()}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Skeleton variant="text" width="60%" height={24} />
            {actions && <Skeleton variant="circular" width={32} height={32} />}
          </Box>
          <Skeleton variant="text" width="40%" height={40} />
          {subtitle && <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />}
          {children && <Skeleton variant="rectangular" height={60} sx={{ mt: 2, borderRadius: 1 }} />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card onClick={onClick} sx={getCardStyles()}>
      <CardContent sx={{ p: 3 }}>
        {/* Header: Title and Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5} flex={1}>
            {/* Icon */}
            {icon && (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme.palette.primary.main}15`,
                }}
              >
                {React.cloneElement(icon, {
                  sx: { fontSize: 24, color: theme.palette.primary.main },
                })}
              </Box>
            )}

            {/* Title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Actions */}
          {actions && (
            <Box display="flex" gap={0.5}>
              {Array.isArray(actions) ? (
                actions.map((action, index) => (
                  <React.Fragment key={index}>{action}</React.Fragment>
                ))
              ) : (
                actions
              )}
            </Box>
          )}
        </Box>

        {/* Value */}
        {value !== undefined && value !== null && (
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: subtitle ? 0.5 : 0,
            }}
          >
            {value}
          </Typography>
        )}

        {/* Subtitle */}
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {/* Custom Children Content */}
        {children && (
          <Box mt={2}>
            {children}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

DataCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subtitle: PropTypes.string,
  icon: PropTypes.element,
  actions: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]),
  children: PropTypes.node,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated']),
};

export default DataCard;
