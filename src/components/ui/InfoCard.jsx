import React from 'react';
import { Card, CardContent, Box, Typography, IconButton, useTheme, Skeleton, Divider } from '@mui/material';
import { Edit } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * InfoCard - Specialized card for displaying structured information (customer, vehicle, insurance)
 *
 * @param {string} title - Card title
 * @param {ReactElement} icon - Icon element for the card header
 * @param {string} iconColor - Color for icon background (hex or theme color)
 * @param {Array<object>} items - Array of info items {label, value, icon, onClick, href}
 * @param {function} onEdit - Optional edit handler (shows edit button)
 * @param {boolean} loading - Show loading skeleton
 * @param {string} variant - Card variant: 'default', 'outlined', 'elevated'
 * @param {ReactNode} children - Optional custom content
 */
const InfoCard = ({
  title,
  icon,
  iconColor,
  items = [],
  onEdit,
  loading = false,
  variant = 'default',
  children,
}) => {
  const theme = useTheme();

  // Get card styles based on variant
  const getCardStyles = () => {
    const baseStyles = {
      height: '100%',
      borderRadius: 2,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    const variants = {
      default: {
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      },
      outlined: {
        background: 'transparent',
        border: `2px solid ${theme.palette.divider}`,
      },
      elevated: {
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 1) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[2],
      },
    };

    return { ...baseStyles, ...variants[variant] };
  };

  if (loading) {
    return (
      <Card sx={getCardStyles()}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={120} height={28} />
            </Box>
            {onEdit && <Skeleton variant="circular" width={32} height={32} />}
          </Box>
          <Divider sx={{ mb: 2 }} />
          {[...Array(3)].map((_, i) => (
            <Box key={i} mb={2}>
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="70%" height={24} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={getCardStyles()}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
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
                  backgroundColor: iconColor
                    ? `${iconColor}15`
                    : `${theme.palette.primary.main}15`,
                }}
              >
                {React.cloneElement(icon, {
                  sx: {
                    fontSize: 24,
                    color: iconColor || theme.palette.primary.main,
                  },
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

          {/* Edit Button */}
          {onEdit && (
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}10`,
                },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Info Items */}
        {items.length > 0 && (
          <Box display="flex" flexDirection="column" gap={2}>
            {items.map((item, index) => (
              <Box key={index}>
                {/* Label */}
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  {item.label}
                </Typography>

                {/* Value */}
                <Box display="flex" alignItems="center" gap={1}>
                  {item.icon && React.cloneElement(item.icon, {
                    sx: { fontSize: 18, color: theme.palette.text.secondary },
                  })}
                  {item.href ? (
                    <Typography
                      variant="body1"
                      component="a"
                      href={item.href}
                      onClick={item.onClick}
                      sx={{
                        fontWeight: 500,
                        color: theme.palette.primary.main,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {item.value || 'N/A'}
                    </Typography>
                  ) : item.onClick ? (
                    <Typography
                      variant="body1"
                      onClick={item.onClick}
                      sx={{
                        fontWeight: 500,
                        color: theme.palette.primary.main,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {item.value || 'N/A'}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {item.value || 'N/A'}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Custom Children Content */}
        {children && (
          <Box mt={items.length > 0 ? 2 : 0}>
            {children}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

InfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element,
  iconColor: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
      icon: PropTypes.element,
      onClick: PropTypes.func,
      href: PropTypes.string,
    })
  ),
  onEdit: PropTypes.func,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated']),
  children: PropTypes.node,
};

export default InfoCard;
