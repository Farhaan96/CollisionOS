import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * KPICard - Reusable KPI display card component
 *
 * @param {string} title - Card title (e.g., "Active Jobs")
 * @param {string|number} value - Main KPI value to display
 * @param {string} subtitle - Optional subtitle text
 * @param {number} trend - Percentage change (positive or negative)
 * @param {string} trendLabel - Custom label for trend (default: "vs last period")
 * @param {ReactElement} icon - MUI icon component
 * @param {string} color - Primary color for the card (hex or theme color)
 * @param {function} onClick - Optional click handler
 * @param {boolean} loading - Show loading skeleton
 * @param {string} size - Card size: 'small', 'medium', 'large'
 */
const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel = 'vs last period',
  icon,
  color,
  onClick,
  loading = false,
  size = 'medium',
}) => {
  const theme = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      padding: 2,
      iconSize: 40,
      iconPadding: 2,
      valueFontSize: 'h5',
      titleFontSize: '0.7rem',
    },
    medium: {
      padding: 3,
      iconSize: 56,
      iconPadding: 2.5,
      valueFontSize: 'h3',
      titleFontSize: '0.75rem',
    },
    large: {
      padding: 4,
      iconSize: 72,
      iconPadding: 3,
      valueFontSize: 'h2',
      titleFontSize: '0.875rem',
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Determine trend color
  const getTrendColor = () => {
    if (trend === undefined || trend === null) return theme.palette.text.secondary;
    return trend > 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    return trend > 0 ? <TrendingUp /> : <TrendingDown />;
  };

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ p: config.padding }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={48} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 1) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 40px rgba(0, 0, 0, 0.4)'
            : '0 20px 40px rgba(0, 0, 0, 0.08)',
          borderColor: color || theme.palette.primary.main,
        } : {},
      }}
    >
      <CardContent sx={{ p: config.padding }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            {/* Title */}
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: config.titleFontSize,
              }}
            >
              {title}
            </Typography>

            {/* Value */}
            <Typography
              variant={config.valueFontSize}
              sx={{
                fontWeight: 800,
                mb: 0.5,
                background: color
                  ? `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {value}
            </Typography>

            {/* Subtitle */}
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.875rem' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Icon */}
          {icon && (
            <Box
              sx={{
                width: config.iconSize,
                height: config.iconSize,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: color
                  ? `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`
                  : `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}25 100%)`,
              }}
            >
              {React.cloneElement(icon, {
                sx: {
                  fontSize: config.iconSize * 0.5,
                  color: color || theme.palette.primary.main,
                },
              })}
            </Box>
          )}
        </Box>

        {/* Trend Indicator */}
        {(trend !== undefined && trend !== null) && (
          <Box display="flex" alignItems="center" mt={2}>
            {getTrendIcon() && React.cloneElement(getTrendIcon(), {
              sx: { color: getTrendColor(), fontSize: 20, mr: 0.5 }
            })}
            <Typography
              variant="caption"
              sx={{
                color: getTrendColor(),
                fontWeight: 700,
                fontSize: '0.875rem',
                mr: 0.5,
              }}
            >
              {Math.abs(trend)}%
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
              }}
            >
              {trendLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  trend: PropTypes.number,
  trendLabel: PropTypes.string,
  icon: PropTypes.element,
  color: PropTypes.string,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export default KPICard;
