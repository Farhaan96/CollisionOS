// Premium Content Loader System for CollisionOS
// Facebook-style content placeholders with custom shapes and gradient animations

import React, { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';
import { animationUtils } from '../../utils/animations';

// Gradient animation for shimmer effect
const createShimmerGradient = (isDark, primaryColor, secondaryColor) => {
  const baseColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const highlightColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  if (primaryColor && secondaryColor) {
    return `linear-gradient(90deg, 
      ${primaryColor}10 25%, 
      ${secondaryColor}20 50%, 
      ${primaryColor}10 75%
    )`;
  }

  return `linear-gradient(90deg, 
    ${baseColor} 25%, 
    ${highlightColor} 50%, 
    ${baseColor} 75%
  )`;
};

// Animation configurations
const shimmerAnimation = (speed = 1.5, direction = 'right') => ({
  animate: {
    backgroundPosition:
      direction === 'right' ? ['200% 0', '-200% 0'] : ['-200% 0', '200% 0'],
    transition: {
      duration: speed,
      ease: 'linear',
      repeat: Infinity,
    },
  },
});

const pulseAnimation = (speed = 1.8) => ({
  animate: {
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: speed,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
});

// Shape components
const Rectangle = ({ width = 100, height = 20, rx = 4, ...props }) => (
  <rect width={width} height={height} rx={rx} {...props} />
);

const Circle = ({ cx = 25, cy = 25, r = 25, ...props }) => (
  <circle cx={cx} cy={cy} r={r} {...props} />
);

const CustomPath = ({ d, ...props }) => <path d={d} {...props} />;

// Preset templates
const presetTemplates = {
  post: {
    viewBox: '0 0 400 150',
    shapes: [
      { type: 'circle', props: { cx: 30, cy: 30, r: 20 } },
      {
        type: 'rectangle',
        props: { x: 60, y: 15, width: 120, height: 15, rx: 4 },
      },
      {
        type: 'rectangle',
        props: { x: 60, y: 35, width: 80, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 65, width: 370, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 85, width: 320, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 105, width: 280, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 125, width: 150, height: 12, rx: 3 },
      },
    ],
  },

  listItem: {
    viewBox: '0 0 350 60',
    shapes: [
      { type: 'circle', props: { cx: 25, cy: 30, r: 15 } },
      {
        type: 'rectangle',
        props: { x: 50, y: 15, width: 200, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 50, y: 35, width: 150, height: 10, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 280, y: 20, width: 50, height: 20, rx: 4 },
      },
    ],
  },

  profile: {
    viewBox: '0 0 300 200',
    shapes: [
      { type: 'circle', props: { cx: 150, cy: 50, r: 30 } },
      {
        type: 'rectangle',
        props: { x: 120, y: 90, width: 60, height: 15, rx: 4 },
      },
      {
        type: 'rectangle',
        props: { x: 100, y: 110, width: 100, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 50, y: 135, width: 200, height: 10, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 75, y: 155, width: 150, height: 10, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 100, y: 175, width: 100, height: 10, rx: 3 },
      },
    ],
  },

  card: {
    viewBox: '0 0 320 180',
    shapes: [
      {
        type: 'rectangle',
        props: { x: 15, y: 15, width: 290, height: 80, rx: 8 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 105, width: 180, height: 15, rx: 4 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 125, width: 220, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 145, width: 120, height: 12, rx: 3 },
      },
    ],
  },

  article: {
    viewBox: '0 0 400 250',
    shapes: [
      {
        type: 'rectangle',
        props: { x: 15, y: 15, width: 150, height: 15, rx: 4 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 40, width: 370, height: 100, rx: 8 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 155, width: 370, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 175, width: 320, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 195, width: 280, height: 12, rx: 3 },
      },
      {
        type: 'rectangle',
        props: { x: 15, y: 215, width: 200, height: 12, rx: 3 },
      },
    ],
  },

  dashboard: {
    viewBox: '0 0 400 300',
    shapes: [
      // Header
      {
        type: 'rectangle',
        props: { x: 15, y: 15, width: 100, height: 20, rx: 4 },
      },
      {
        type: 'rectangle',
        props: { x: 300, y: 15, width: 85, height: 20, rx: 4 },
      },

      // Stats row
      {
        type: 'rectangle',
        props: { x: 15, y: 50, width: 85, height: 60, rx: 8 },
      },
      {
        type: 'rectangle',
        props: { x: 110, y: 50, width: 85, height: 60, rx: 8 },
      },
      {
        type: 'rectangle',
        props: { x: 205, y: 50, width: 85, height: 60, rx: 8 },
      },
      {
        type: 'rectangle',
        props: { x: 300, y: 50, width: 85, height: 60, rx: 8 },
      },

      // Main content area
      {
        type: 'rectangle',
        props: { x: 15, y: 125, width: 250, height: 150, rx: 8 },
      },
      {
        type: 'rectangle',
        props: { x: 275, y: 125, width: 110, height: 150, rx: 8 },
      },
    ],
  },
};

// Shape renderer component
const ShapeRenderer = ({
  type,
  props: shapeProps,
  delay = 0,
  ...motionProps
}) => {
  const shapes = {
    rectangle: Rectangle,
    circle: Circle,
    path: CustomPath,
  };

  const ShapeComponent = shapes[type] || Rectangle;

  return (
    <motion.g
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: delay * 0.1,
        ease: 'easeInOut',
      }}
      {...motionProps}
    >
      <ShapeComponent {...shapeProps} />
    </motion.g>
  );
};

// Main ContentLoader component
const ContentLoader = forwardRef(
  (
    {
      width = 400,
      height = 130,
      viewBox,
      speed = 1.2,
      direction = 'right',
      backgroundColor,
      foregroundColor,
      primaryColor,
      secondaryColor,
      animate = true,
      preset,
      children,
      className,
      style,
      uniqueKey = 'content-loader',
      preserveAspectRatio = 'xMidYMid meet',
      rtl = false,
      interval = 0.25,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Responsive sizing
    const responsiveWidth =
      isMobile && typeof width === 'number' ? width * 0.9 : width;
    const responsiveHeight =
      isMobile && typeof height === 'number' ? height * 0.9 : height;

    // Color configuration
    const colors = useMemo(() => {
      const bgColor =
        backgroundColor ||
        (isDark
          ? premiumDesignSystem.colors.glass.white[5]
          : premiumDesignSystem.colors.glass.dark[5]);

      const fgColor =
        foregroundColor ||
        (isDark
          ? premiumDesignSystem.colors.glass.white[10]
          : premiumDesignSystem.colors.glass.dark[10]);

      return { bgColor, fgColor };
    }, [backgroundColor, foregroundColor, isDark]);

    // Template configuration
    const templateConfig = preset ? presetTemplates[preset] : null;
    const svgViewBox =
      viewBox || templateConfig?.viewBox || `0 0 ${width} ${height}`;

    // Gradient setup
    const gradientId = `${uniqueKey}-gradient`;
    const shimmerGradient = createShimmerGradient(
      isDark,
      primaryColor,
      secondaryColor
    );

    // Animation configuration
    const animationProps = animate
      ? speed > 0
        ? shimmerAnimation(
            speed,
            rtl ? (direction === 'right' ? 'left' : 'right') : direction
          )
        : pulseAnimation(Math.abs(speed) || 1.8)
      : {};

    const containerStyles = {
      width: responsiveWidth,
      height: responsiveHeight,
      opacity: animate ? 1 : 0.6,
      ...animationUtils.optimizedTransform,
      ...style,
    };

    // Render template shapes
    const renderTemplateShapes = () => {
      if (!templateConfig) return null;

      return templateConfig.shapes.map((shape, index) => (
        <ShapeRenderer
          key={index}
          type={shape.type}
          props={{
            ...shape.props,
            fill: `url(#${gradientId})`,
          }}
          delay={index * interval}
        />
      ));
    };

    return (
      <motion.div
        ref={ref}
        className={className}
        style={containerStyles}
        {...animationProps}
        {...props}
      >
        <svg
          width='100%'
          height='100%'
          viewBox={svgViewBox}
          preserveAspectRatio={preserveAspectRatio}
          style={{
            display: 'block',
            ...animationUtils.optimizedTransform,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='25%' stopColor={colors.bgColor} stopOpacity='1' />
              <stop offset='50%' stopColor={colors.fgColor} stopOpacity='1' />
              <stop offset='75%' stopColor={colors.bgColor} stopOpacity='1' />
            </linearGradient>

            {/* Premium branded gradient */}
            <linearGradient
              id={`${uniqueKey}-premium`}
              x1='0%'
              y1='0%'
              x2='100%'
              y2='0%'
            >
              <stop
                offset='0%'
                stopColor={
                  primaryColor || premiumDesignSystem.colors.primary[200]
                }
                stopOpacity='0.1'
              />
              <stop
                offset='50%'
                stopColor={
                  secondaryColor || premiumDesignSystem.colors.primary[400]
                }
                stopOpacity='0.2'
              />
              <stop
                offset='100%'
                stopColor={
                  primaryColor || premiumDesignSystem.colors.primary[200]
                }
                stopOpacity='0.1'
              />
            </linearGradient>

            {/* Glassmorphism filter */}
            <filter
              id={`${uniqueKey}-glass`}
              x='-20%'
              y='-20%'
              width='140%'
              height='140%'
            >
              <feGaussianBlur
                in='SourceGraphic'
                stdDeviation='3'
                result='blur'
              />
              <feColorMatrix
                in='blur'
                mode='matrix'
                values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7'
                result='glow'
              />
              <feBlend in='SourceGraphic' in2='glow' />
            </filter>
          </defs>

          {/* Background with glassmorphism */}
          <rect
            width='100%'
            height='100%'
            fill={`url(#${uniqueKey}-premium)`}
            rx='12'
            filter={`url(#${uniqueKey}-glass)`}
            opacity='0.3'
          />

          {/* Template shapes or custom children */}
          {preset ? renderTemplateShapes() : children}

          {/* Animated shimmer overlay */}
          {animate && speed > 0 && (
            <motion.rect
              width='100%'
              height='100%'
              fill={shimmerGradient}
              backgroundSize='200% 100%'
              rx='12'
              opacity='0.6'
              {...shimmerAnimation(speed, direction)}
              style={{
                backgroundSize: '200% 100%',
              }}
            />
          )}
        </svg>
      </motion.div>
    );
  }
);

// Convenience components for common patterns
const PostLoader = props => (
  <ContentLoader preset='post' width={400} height={150} {...props} />
);

const ListItemLoader = props => (
  <ContentLoader preset='listItem' width={350} height={60} {...props} />
);

const ProfileLoader = props => (
  <ContentLoader preset='profile' width={300} height={200} {...props} />
);

const CardLoader = props => (
  <ContentLoader preset='card' width={320} height={180} {...props} />
);

const ArticleLoader = props => (
  <ContentLoader preset='article' width={400} height={250} {...props} />
);

const DashboardLoader = props => (
  <ContentLoader preset='dashboard' width={400} height={300} {...props} />
);

ContentLoader.displayName = 'ContentLoader';

export default ContentLoader;

export {
  PostLoader,
  ListItemLoader,
  ProfileLoader,
  CardLoader,
  ArticleLoader,
  DashboardLoader,
  Rectangle,
  Circle,
  CustomPath,
};
