import React from 'react';
import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * ProgressBar - Visual progress indicator with label and percentage
 *
 * @param {number} value - Progress value (0-100)
 * @param {string} label - Label text displayed above the progress bar
 * @param {string} color - Color for the progress bar: 'primary', 'secondary', 'success', 'warning', 'error', 'info'
 * @param {boolean} showPercentage - Whether to show percentage text
 * @param {string} size - Bar size: 'small', 'medium', 'large'
 * @param {string} variant - Variant: 'determinate', 'indeterminate'
 * @param {boolean} animated - Whether to animate the progress bar
 * @param {string} customColor - Custom hex color (overrides color prop)
 */
const ProgressBar = ({
  value = 0,
  label,
  color = 'primary',
  showPercentage = true,
  size = 'medium',
  variant = 'determinate',
  animated = true,
  customColor,
}) => {
  const theme = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      height: 6,
      borderRadius: 3,
      fontSize: '0.75rem',
    },
    medium: {
      height: 8,
      borderRadius: 4,
      fontSize: '0.875rem',
    },
    large: {
      height: 12,
      borderRadius: 6,
      fontSize: '1rem',
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Get color based on value if no color specified
  const getColorByValue = (val) => {
    if (val >= 80) return theme.palette.success.main;
    if (val >= 50) return theme.palette.primary.main;
    if (val >= 30) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const barColor = customColor || (color === 'auto' ? getColorByValue(value) : theme.palette[color]?.main || theme.palette.primary.main);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Label and Percentage Row */}
      {(label || showPercentage) && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          {/* Label */}
          {label && (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: config.fontSize,
              }}
            >
              {label}
            </Typography>
          )}

          {/* Percentage */}
          {showPercentage && variant === 'determinate' && (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: barColor,
                fontSize: config.fontSize,
              }}
            >
              {Math.round(value)}%
            </Typography>
          )}
        </Box>
      )}

      {/* Progress Bar */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: config.height,
          borderRadius: config.borderRadius,
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: variant === 'determinate' ? `${Math.min(value, 100)}%` : '100%',
            borderRadius: config.borderRadius,
            backgroundColor: barColor,
            transition: animated ? 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            ...(variant === 'indeterminate' && {
              animation: 'progress-indeterminate 1.5s ease-in-out infinite',
              '@keyframes progress-indeterminate': {
                '0%': {
                  transform: 'translateX(-100%)',
                },
                '100%': {
                  transform: 'translateX(100%)',
                },
              },
            }),
            // Add shimmer effect for active bars
            ...(animated && variant === 'determinate' && value > 0 && value < 100 && {
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmer 2s infinite',
              },
              '@keyframes shimmer': {
                '0%': {
                  transform: 'translateX(-100%)',
                },
                '100%': {
                  transform: 'translateX(100%)',
                },
              },
            }),
          }}
        />
      </Box>
    </Box>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number,
  label: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'error', 'info', 'auto']),
  showPercentage: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['determinate', 'indeterminate']),
  animated: PropTypes.bool,
  customColor: PropTypes.string,
};

export default ProgressBar;
