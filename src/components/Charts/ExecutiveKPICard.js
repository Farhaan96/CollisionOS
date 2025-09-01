import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Tooltip, IconButton, Chip } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Info,
  Visibility,
} from '@mui/icons-material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

// Counter animation hook
const useCountUp = (value, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return count;
};

// Sparkline component for trend visualization
const Sparkline = React.memo(({ data, color, height = 40 }) => {
  const formattedData =
    data?.map((value, index) => ({
      index,
      value: typeof value === 'number' ? value : 0,
    })) || [];

  return (
    <ResponsiveContainer width='100%' height={height}>
      <LineChart data={formattedData}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line
          type='monotone'
          dataKey='value'
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

export const ExecutiveKPICard = React.memo(
  ({
    title,
    value,
    previousValue,
    unit = '',
    prefix = '',
    suffix = '',
    sparklineData = [],
    status = 'neutral', // 'positive', 'negative', 'neutral', 'warning'
    trend,
    comparison,
    detailedTooltip,
    icon: Icon,
    size = 'medium', // 'small', 'medium', 'large'
    showSparkline = true,
    animated = true,
    onClick,
    customColor,
    gradient = true,
    ...props
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const controls = useAnimation();

    const animatedValue = useCountUp(
      animated && isVisible ? value : value,
      1500
    );
    const currentValue = animated ? animatedValue : value;

    // Calculate trend automatically if not provided
    const calculatedTrend = useMemo(() => {
      if (trend !== undefined) return trend;
      if (previousValue !== undefined && value !== undefined) {
        const change = ((value - previousValue) / previousValue) * 100;
        return change;
      }
      return null;
    }, [trend, value, previousValue]);

    // Determine status color
    const statusColors = useMemo(() => {
      const colors = premiumDesignSystem.colors;

      if (customColor) {
        return {
          primary: customColor,
          light: `${customColor}20`,
          gradient: `linear-gradient(135deg, ${customColor} 0%, ${customColor}80 100%)`,
        };
      }

      switch (status) {
        case 'positive':
          return {
            primary: colors.semantic.success.main,
            light: colors.semantic.success.light,
            gradient: colors.semantic.success.gradient,
          };
        case 'negative':
          return {
            primary: colors.semantic.error.main,
            light: colors.semantic.error.light,
            gradient: colors.semantic.error.gradient,
          };
        case 'warning':
          return {
            primary: colors.semantic.warning.main,
            light: colors.semantic.warning.light,
            gradient: colors.semantic.warning.gradient,
          };
        default:
          return {
            primary: colors.primary[500],
            light: colors.primary[50],
            gradient: colors.primary.gradient.default,
          };
      }
    }, [status, customColor]);

    // Size configurations
    const sizeConfig = useMemo(() => {
      switch (size) {
        case 'small':
          return {
            padding: premiumDesignSystem.spacing[4],
            valueSize: premiumDesignSystem.typography.fontSize.xl,
            titleSize: premiumDesignSystem.typography.fontSize.sm,
            iconSize: 20,
            minHeight: '120px',
          };
        case 'large':
          return {
            padding: premiumDesignSystem.spacing[8],
            valueSize: premiumDesignSystem.typography.fontSize['4xl'],
            titleSize: premiumDesignSystem.typography.fontSize.lg,
            iconSize: 32,
            minHeight: '200px',
          };
        default: // medium
          return {
            padding: premiumDesignSystem.spacing[6],
            valueSize: premiumDesignSystem.typography.fontSize['3xl'],
            titleSize: premiumDesignSystem.typography.fontSize.base,
            iconSize: 24,
            minHeight: '160px',
          };
      }
    }, [size]);

    // Format number with appropriate notation
    const formatValue = useCallback(val => {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }, []);

    // Handle visibility for animations
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            controls.start({
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 0.6,
                ease: [0.25, 0.8, 0.25, 1],
                delay: 0.1,
              },
            });
          }
        },
        { threshold: 0.1 }
      );

      const element = document.getElementById(
        `kpi-card-${title?.replace(/\s+/g, '-')}`
      );
      if (element) observer.observe(element);

      return () => observer.disconnect();
    }, [controls, title]);

    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
      controls.start({
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 },
      });
    }, [controls]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
      controls.start({
        scale: 1,
        y: 0,
        transition: { duration: 0.2 },
      });
    }, [controls]);

    return (
      <motion.div
        id={`kpi-card-${title?.replace(/\s+/g, '-')}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={controls}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
      >
        <Box
          onClick={onClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            minHeight: sizeConfig.minHeight,
            p: sizeConfig.padding,
            background: gradient
              ? `linear-gradient(135deg, ${premiumDesignSystem.colors.glass.white[10]} 0%, ${premiumDesignSystem.colors.glass.white[5]} 100%)`
              : premiumDesignSystem.colors.glass.white[8],
            backdropFilter: premiumDesignSystem.effects.backdrop.lg,
            border: `1px solid ${premiumDesignSystem.colors.glass.white[15]}`,
            borderRadius: premiumDesignSystem.borderRadius.xl,
            boxShadow: isHovered
              ? premiumDesignSystem.shadows.glass.elevated
              : premiumDesignSystem.shadows.glass.medium,
            position: 'relative',
            overflow: 'hidden',
            cursor: onClick ? 'pointer' : 'default',
            transition: premiumDesignSystem.animations.transitions.all,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: statusColors.gradient,
              opacity: isHovered ? 1 : 0.7,
              transition: premiumDesignSystem.animations.transitions.opacity,
            },
            '&:hover': {
              borderColor: `${statusColors.primary}40`,
            },
          }}
          {...props}
        >
          {/* Header with title and icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Typography
              variant='h6'
              sx={{
                fontSize: sizeConfig.titleSize,
                fontWeight: premiumDesignSystem.typography.fontWeight.medium,
                color: premiumDesignSystem.colors.neutral[600],
                lineHeight: premiumDesignSystem.typography.lineHeight.tight,
                textTransform: 'uppercase',
                letterSpacing:
                  premiumDesignSystem.typography.letterSpacing.wider,
                mb: 1,
              }}
            >
              {title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {Icon && (
                <Icon
                  sx={{
                    fontSize: sizeConfig.iconSize,
                    color: statusColors.primary,
                    opacity: 0.8,
                  }}
                />
              )}
              {detailedTooltip && (
                <Tooltip title={detailedTooltip} placement='top'>
                  <IconButton size='small' sx={{ opacity: 0.6 }}>
                    <Info fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Main value */}
          <Box sx={{ mb: 2 }}>
            <Typography
              component='div'
              sx={{
                fontSize: sizeConfig.valueSize,
                fontWeight: premiumDesignSystem.typography.fontWeight.bold,
                color: statusColors.primary,
                lineHeight: premiumDesignSystem.typography.lineHeight.tight,
                background: gradient ? statusColors.gradient : 'inherit',
                backgroundClip: gradient ? 'text' : 'initial',
                WebkitBackgroundClip: gradient ? 'text' : 'initial',
                WebkitTextFillColor: gradient ? 'transparent' : 'inherit',
                display: 'flex',
                alignItems: 'baseline',
                gap: 0.5,
              }}
            >
              {prefix && (
                <Box
                  component='span'
                  sx={{
                    fontSize: `calc(${sizeConfig.valueSize} * 0.6)`,
                    opacity: 0.8,
                  }}
                >
                  {prefix}
                </Box>
              )}
              {formatValue(currentValue)}
              {unit && (
                <Box
                  component='span'
                  sx={{
                    fontSize: `calc(${sizeConfig.valueSize} * 0.6)`,
                    opacity: 0.8,
                    ml: 0.5,
                  }}
                >
                  {unit}
                </Box>
              )}
              {suffix && (
                <Box
                  component='span'
                  sx={{
                    fontSize: `calc(${sizeConfig.valueSize} * 0.6)`,
                    opacity: 0.8,
                  }}
                >
                  {suffix}
                </Box>
              )}
            </Typography>
          </Box>

          {/* Trend and comparison section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: showSparkline ? 2 : 0,
            }}
          >
            {calculatedTrend !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {calculatedTrend > 0 ? (
                  <TrendingUp
                    sx={{
                      fontSize: 16,
                      color: premiumDesignSystem.colors.semantic.success.main,
                    }}
                  />
                ) : calculatedTrend < 0 ? (
                  <TrendingDown
                    sx={{
                      fontSize: 16,
                      color: premiumDesignSystem.colors.semantic.error.main,
                    }}
                  />
                ) : null}
                <Typography
                  variant='body2'
                  sx={{
                    color:
                      calculatedTrend > 0
                        ? premiumDesignSystem.colors.semantic.success.main
                        : calculatedTrend < 0
                          ? premiumDesignSystem.colors.semantic.error.main
                          : premiumDesignSystem.colors.neutral[500],
                    fontWeight:
                      premiumDesignSystem.typography.fontWeight.medium,
                    fontSize: premiumDesignSystem.typography.fontSize.sm,
                  }}
                >
                  {Math.abs(calculatedTrend).toFixed(1)}%
                </Typography>
              </Box>
            )}

            {comparison && (
              <Chip
                label={comparison}
                size='small'
                sx={{
                  backgroundColor: `${statusColors.primary}20`,
                  color: statusColors.primary,
                  fontSize: premiumDesignSystem.typography.fontSize.xs,
                  fontWeight: premiumDesignSystem.typography.fontWeight.medium,
                  border: 'none',
                }}
              />
            )}
          </Box>

          {/* Sparkline */}
          {showSparkline && sparklineData.length > 0 && (
            <Box
              sx={{
                height: size === 'large' ? 50 : 40,
                opacity: isHovered ? 1 : 0.8,
                transition: premiumDesignSystem.animations.transitions.opacity,
              }}
            >
              <Sparkline
                data={sparklineData}
                color={statusColors.primary}
                height={size === 'large' ? 50 : 40}
              />
            </Box>
          )}

          {/* Hover overlay effect */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${statusColors.primary}05 0%, transparent 50%)`,
              opacity: isHovered ? 1 : 0,
              transition: premiumDesignSystem.animations.transitions.opacity,
              pointerEvents: 'none',
              borderRadius: premiumDesignSystem.borderRadius.xl,
            }}
          />
        </Box>
      </motion.div>
    );
  }
);

ExecutiveKPICard.displayName = 'ExecutiveKPICard';

export default ExecutiveKPICard;
