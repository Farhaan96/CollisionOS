// Premium Skeleton Loader System for CollisionOS
// Executive-level loading placeholders with glassmorphism design and shimmer animations

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';
import { loadingStates, animationUtils } from '../../utils/animations';

// Shimmer animation keyframes
const shimmerAnimation = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// Pulse animation for subtle variant
const pulseAnimation = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// Wave animation for progressive loading
const waveAnimation = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1, 1.02, 1],
    transition: {
      duration: 1.8,
      ease: 'easeInOut',
      repeat: Infinity,
      staggerChildren: 0.1,
    },
  },
};

// Base skeleton styles with glassmorphism
const createSkeletonStyles = (theme, variant, animation) => {
  const isDark = theme.palette.mode === 'dark';

  const baseStyles = {
    backgroundColor: isDark
      ? premiumDesignSystem.colors.glass.white[8]
      : premiumDesignSystem.colors.glass.dark[5],
    borderRadius: premiumDesignSystem.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    willChange: 'transform, opacity',
    transform: 'translate3d(0, 0, 0)',

    // Glassmorphism effect
    backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
    border: `1px solid ${
      isDark
        ? premiumDesignSystem.colors.glass.white[10]
        : premiumDesignSystem.colors.glass.dark[10]
    }`,

    // Premium shadow
    boxShadow: isDark
      ? premiumDesignSystem.shadows.glass.soft
      : premiumDesignSystem.shadows.glass.medium,
  };

  // Animation-specific styles
  if (animation === 'shimmer') {
    return {
      ...baseStyles,
      background: `linear-gradient(90deg, 
        ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} 25%, 
        ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} 50%, 
        ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} 75%
      )`,
      backgroundSize: '200% 100%',
    };
  }

  if (animation === 'wave') {
    return {
      ...baseStyles,
      background: `linear-gradient(135deg, 
        ${premiumDesignSystem.colors.primary[100]}20 0%,
        ${premiumDesignSystem.colors.primary[200]}30 50%,
        ${premiumDesignSystem.colors.primary[100]}20 100%
      )`,
    };
  }

  return baseStyles;
};

// Text skeleton component
const TextSkeleton = forwardRef(
  (
    {
      lines = 1,
      width = '100%',
      height = '1em',
      spacing = '0.5em',
      animation = 'shimmer',
      variant = 'text',
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const getAnimationVariant = () => {
      switch (animation) {
        case 'pulse':
          return pulseAnimation;
        case 'wave':
          return waveAnimation;
        case 'shimmer':
        default:
          return shimmerAnimation;
      }
    };

    const renderLine = index => {
      const isLastLine = index === lines - 1;
      const lineWidth =
        typeof width === 'object'
          ? width[index] || '100%'
          : isLastLine && lines > 1
            ? '75%'
            : width;

      return (
        <motion.div
          key={index}
          variants={getAnimationVariant()}
          animate='animate'
          style={{
            width: lineWidth,
            height,
            marginBottom: index < lines - 1 ? spacing : 0,
            ...createSkeletonStyles(theme, variant, animation),
          }}
          {...animationUtils.optimizedTransform}
        />
      );
    };

    return (
      <Box ref={ref} {...props}>
        {Array.from({ length: lines }, (_, i) => renderLine(i))}
      </Box>
    );
  }
);

// Avatar skeleton component
const AvatarSkeleton = forwardRef(
  ({ size = 40, variant = 'circular', animation = 'pulse', ...props }, ref) => {
    const theme = useTheme();
    const responsiveSize =
      typeof size === 'object' ? size : { xs: size, sm: size, md: size };

    return (
      <motion.div
        ref={ref}
        variants={animation === 'pulse' ? pulseAnimation : shimmerAnimation}
        animate='animate'
        style={{
          width: responsiveSize,
          height: responsiveSize,
          borderRadius:
            variant === 'circular'
              ? '50%'
              : variant === 'rounded'
                ? premiumDesignSystem.borderRadius.lg
                : premiumDesignSystem.borderRadius.sm,
          flexShrink: 0,
          ...createSkeletonStyles(theme, 'avatar', animation),
          ...animationUtils.optimizedTransform,
        }}
        {...props}
      />
    );
  }
);

// Card skeleton component
const CardSkeleton = forwardRef(
  (
    {
      width = '100%',
      height = 200,
      padding = 24,
      animation = 'shimmer',
      children,
      hasHeader = true,
      hasAvatar = false,
      hasActions = false,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const cardPadding = isMobile ? padding * 0.75 : padding;

    return (
      <motion.div
        ref={ref}
        variants={waveAnimation}
        animate='animate'
        style={{
          width,
          height,
          padding: cardPadding,
          display: 'flex',
          flexDirection: 'column',
          gap: premiumDesignSystem.spacing[4],
          ...createSkeletonStyles(theme, 'card', animation),
          ...animationUtils.optimizedTransform,
        }}
        {...props}
      >
        {hasHeader && (
          <Box display='flex' alignItems='center' gap={2}>
            {hasAvatar && (
              <AvatarSkeleton size={isMobile ? 32 : 40} animation='pulse' />
            )}
            <Box flex={1}>
              <TextSkeleton
                lines={1}
                width='60%'
                height='1.2em'
                animation='pulse'
              />
              <TextSkeleton
                lines={1}
                width='40%'
                height='0.9em'
                animation='pulse'
              />
            </Box>
          </Box>
        )}

        {children || (
          <Box flex={1} display='flex' flexDirection='column' gap={2}>
            <TextSkeleton lines={3} animation='pulse' />
            <Box
              sx={{
                height: '60%',
                borderRadius: premiumDesignSystem.borderRadius.md,
                ...createSkeletonStyles(theme, 'content', 'pulse'),
              }}
            />
          </Box>
        )}

        {hasActions && (
          <Box display='flex' gap={1} justifyContent='flex-end'>
            <Box
              sx={{
                width: 80,
                height: 32,
                borderRadius: premiumDesignSystem.borderRadius.md,
                ...createSkeletonStyles(theme, 'button', 'pulse'),
              }}
            />
            <Box
              sx={{
                width: 80,
                height: 32,
                borderRadius: premiumDesignSystem.borderRadius.md,
                ...createSkeletonStyles(theme, 'button', 'pulse'),
              }}
            />
          </Box>
        )}
      </motion.div>
    );
  }
);

// Table skeleton component
const TableSkeleton = forwardRef(
  (
    { rows = 5, columns = 4, hasHeader = true, animation = 'wave', ...props },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const visibleColumns = isMobile ? Math.min(columns, 2) : columns;

    return (
      <motion.div
        ref={ref}
        variants={waveAnimation}
        animate='animate'
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: premiumDesignSystem.spacing[2],
          ...animationUtils.optimizedTransform,
        }}
        {...props}
      >
        {hasHeader && (
          <Box
            display='grid'
            gridTemplateColumns={`repeat(${visibleColumns}, 1fr)`}
            gap={2}
            p={2}
            sx={{
              borderRadius: `${premiumDesignSystem.borderRadius.lg} ${premiumDesignSystem.borderRadius.lg} 0 0`,
              ...createSkeletonStyles(theme, 'header', 'pulse'),
            }}
          >
            {Array.from({ length: visibleColumns }, (_, i) => (
              <TextSkeleton
                key={i}
                lines={1}
                height='1.1em'
                width='80%'
                animation='pulse'
              />
            ))}
          </Box>
        )}

        {Array.from({ length: rows }, (_, rowIndex) => (
          <Box
            key={rowIndex}
            display='grid'
            gridTemplateColumns={`repeat(${visibleColumns}, 1fr)`}
            gap={2}
            p={2}
            sx={{
              borderRadius:
                rowIndex === rows - 1 && !hasHeader
                  ? premiumDesignSystem.borderRadius.lg
                  : 0,
              ...createSkeletonStyles(theme, 'row', 'pulse'),
            }}
          >
            {Array.from({ length: visibleColumns }, (_, colIndex) => (
              <TextSkeleton
                key={colIndex}
                lines={1}
                height='1em'
                width={colIndex === 0 ? '90%' : '70%'}
                animation='pulse'
              />
            ))}
          </Box>
        ))}
      </motion.div>
    );
  }
);

// Chart skeleton component
const ChartSkeleton = forwardRef(
  (
    {
      type = 'line',
      width = '100%',
      height = 300,
      hasLegend = true,
      hasTitle = true,
      animation = 'wave',
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    return (
      <motion.div
        ref={ref}
        variants={waveAnimation}
        animate='animate'
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          gap: premiumDesignSystem.spacing[4],
          padding: premiumDesignSystem.spacing[6],
          ...createSkeletonStyles(theme, 'chart', animation),
          ...animationUtils.optimizedTransform,
        }}
        {...props}
      >
        {hasTitle && (
          <TextSkeleton
            lines={1}
            width='40%'
            height='1.5em'
            animation='pulse'
          />
        )}

        <Box flex={1} position='relative'>
          {type === 'line' && (
            <svg width='100%' height='100%' style={{ position: 'absolute' }}>
              {/* Animated line path */}
              <motion.path
                d='M10,150 Q50,100 100,120 T200,80 T300,110 T400,60'
                stroke={premiumDesignSystem.colors.primary[400]}
                strokeWidth='3'
                fill='none'
                opacity='0.3'
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            </svg>
          )}

          {type === 'bar' && (
            <Box display='flex' alignItems='end' height='100%' gap={1}>
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.random() * 60 + 40}%`,
                    ...createSkeletonStyles(theme, 'bar', 'pulse'),
                  }}
                  animate={{
                    height: [
                      `${Math.random() * 60 + 40}%`,
                      `${Math.random() * 60 + 40}%`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </Box>
          )}

          {type === 'pie' && (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              height='100%'
            >
              <motion.div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  border: `20px solid ${premiumDesignSystem.colors.primary[200]}`,
                  borderTopColor: premiumDesignSystem.colors.primary[500],
                  ...animationUtils.optimizedTransform,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </Box>
          )}
        </Box>

        {hasLegend && (
          <Box display='flex' gap={3} justifyContent='center' flexWrap='wrap'>
            {Array.from({ length: 4 }, (_, i) => (
              <Box key={i} display='flex' alignItems='center' gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor:
                      premiumDesignSystem.colors.primary[300 + i * 100],
                  }}
                />
                <TextSkeleton
                  lines={1}
                  width='60px'
                  height='0.9em'
                  animation='pulse'
                />
              </Box>
            ))}
          </Box>
        )}
      </motion.div>
    );
  }
);

// Main SkeletonLoader component
const SkeletonLoader = forwardRef(
  (
    { variant = 'text', animation = 'shimmer', responsive = true, ...props },
    ref
  ) => {
    const components = {
      text: TextSkeleton,
      avatar: AvatarSkeleton,
      card: CardSkeleton,
      table: TableSkeleton,
      chart: ChartSkeleton,
    };

    const Component = components[variant] || TextSkeleton;

    return (
      <Component
        ref={ref}
        animation={animation}
        responsive={responsive}
        {...props}
      />
    );
  }
);

SkeletonLoader.displayName = 'SkeletonLoader';
TextSkeleton.displayName = 'TextSkeleton';
AvatarSkeleton.displayName = 'AvatarSkeleton';
CardSkeleton.displayName = 'CardSkeleton';
TableSkeleton.displayName = 'TableSkeleton';
ChartSkeleton.displayName = 'ChartSkeleton';

export default SkeletonLoader;

export {
  TextSkeleton,
  AvatarSkeleton,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  SkeletonLoader,
};
