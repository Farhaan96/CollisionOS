import React from 'react';
import { Card, CardContent, Box, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

const ModernCard = ({
  children,
  variant = 'glass',
  hover = true,
  glow = false,
  gradient = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cardVariants = {
    glass: {
      background: isDark ? 'rgba(26, 31, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
    },

    elevated: {
      background: isDark
        ? 'linear-gradient(135deg, rgba(26, 31, 46, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'}`,
      boxShadow: theme.customShadows?.lg || theme.shadows[8],
    },

    gradient: {
      background: isDark
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(16, 185, 129, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
      position: 'relative',
      overflow: 'hidden',

      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: isDark
          ? 'linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.6) 50%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
      },
    },

    solid: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
    },
  };

  const hoverEffects = hover
    ? {
        transform: 'translateY(-4px)',
        boxShadow:
          theme.customShadows?.glowHover ||
          `0 0 30px ${alpha(theme.palette.primary.main, 0.3)}`,
        border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.4 : 0.2)}`,

        '&::before':
          variant === 'gradient'
            ? {
                background: isDark
                  ? 'linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.8) 50%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.5) 50%, transparent 100%)',
              }
            : {},
      }
    : {};

  const glowEffect = glow
    ? {
        boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,

        '&:hover': {
          boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.5)}`,
        },
      }
    : {};

  const MotionCard = motion(Card);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4 } : {}}
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: hover ? 'pointer' : 'default',
        isolation: 'isolate',
        pointerEvents: 'auto',
        ...cardVariants[variant],
        ...glowEffect,

        '&:hover': hover ? hoverEffects : {},

        '&::after': {
          display: 'none',
        },

        '&:hover::after':
          (variant === 'glass' || variant === 'elevated') && hover
            ? {
                opacity: 1,
              }
            : {},

        ...sx,
      }}
      {...props}
    >
      {children}
    </MotionCard>
  );
};

export default ModernCard;
