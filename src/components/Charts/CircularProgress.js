import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

// Helper function to create SVG path for circular progress
const createCircularPath = (cx, cy, radius, startAngle, endAngle) => {
  const start = {
    x: cx + radius * Math.cos(startAngle * Math.PI / 180),
    y: cy + radius * Math.sin(startAngle * Math.PI / 180)
  };
  const end = {
    x: cx + radius * Math.cos(endAngle * Math.PI / 180),
    y: cy + radius * Math.sin(endAngle * Math.PI / 180)
  };
  
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(" ");
};

// Single circular progress ring component
const CircularRing = React.memo(({
  value = 0,
  maxValue = 100,
  radius = 50,
  strokeWidth = 8,
  color = premiumDesignSystem.colors.primary[500],
  backgroundColor = premiumDesignSystem.colors.neutral[200],
  gradient = true,
  animated = true,
  duration = 1500,
  lineCap = 'round',
  startAngle = -90,
  endAngle = 270,
  clockwise = true,
  showGlow = false,
  children,
  ...props
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const progressRef = useRef(null);
  
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;
  
  const center = radius + strokeWidth;
  const viewBoxSize = 2 * center;
  
  // Create gradient ID
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  // Animate value when component becomes visible
  useEffect(() => {
    if (!isVisible) return;
    
    if (animated) {
      let start = 0;
      const increment = percentage / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= percentage) {
          setAnimatedValue(percentage);
          clearInterval(timer);
        } else {
          setAnimatedValue(start);
        }
      }, 16);
      
      return () => clearInterval(timer);
    } else {
      setAnimatedValue(percentage);
    }
  }, [percentage, animated, duration, isVisible]);

  // Intersection observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (progressRef.current) {
      observer.observe(progressRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={progressRef}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...props?.sx
      }}
      {...props}
    >
      <svg
        width={viewBoxSize}
        height={viewBoxSize}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Gradient definitions */}
        <defs>
          {gradient && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={`${color}80`} />
            </linearGradient>
          )}
          
          {/* Glow filter */}
          {showGlow && (
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={gradient ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          strokeLinecap={lineCap}
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset,
            filter: showGlow ? `url(#glow-${gradientId})` : 'none'
          }}
          transition={{ 
            duration: animated ? duration / 1000 : 0,
            ease: [0.25, 0.8, 0.25, 1]
          }}
          style={{
            filter: showGlow ? `drop-shadow(0 0 8px ${color}40)` : 'none'
          }}
        />
      </svg>
      
      {/* Center content */}
      {children && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: radius * 1.6,
            height: radius * 1.6,
            textAlign: 'center'
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
});

// Multi-ring circular progress component
const MultiRingProgress = React.memo(({
  rings = [],
  size = 120,
  spacing = 12,
  centerContent,
  animated = true,
  showTooltips = true
}) => {
  const baseRadius = (size / 2) - 20;
  
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {rings.map((ring, index) => {
        const ringRadius = baseRadius - (index * spacing);
        const Ring = (
          <CircularRing
            key={ring.id || index}
            value={ring.value}
            maxValue={ring.maxValue || 100}
            radius={ringRadius}
            strokeWidth={ring.strokeWidth || 6}
            color={ring.color}
            gradient={ring.gradient}
            animated={animated}
            showGlow={ring.showGlow}
            sx={{ 
              position: index === 0 ? 'relative' : 'absolute',
              top: 0,
              left: 0
            }}
          />
        );

        return showTooltips && ring.tooltip ? (
          <Tooltip key={ring.id || index} title={ring.tooltip} placement="top">
            {Ring}
          </Tooltip>
        ) : Ring;
      })}
      
      {/* Center content */}
      {centerContent && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: baseRadius * 1.2
          }}
        >
          {centerContent}
        </Box>
      )}
    </Box>
  );
});

// Main CircularProgress component
export const CircularProgress = React.memo(({
  value = 75,
  maxValue = 100,
  size = 120,
  strokeWidth = 8,
  color,
  backgroundColor,
  gradient = true,
  animated = true,
  duration = 1500,
  showPercentage = true,
  showValue = false,
  label,
  subtitle,
  rings = null, // For multi-ring mode
  variant = 'single', // 'single', 'multi', 'comparison'
  thickness = 'medium', // 'thin', 'medium', 'thick'
  glow = false,
  lineCap = 'round', // 'round', 'square', 'butt'
  centerContent,
  comparisonValue, // For comparison variant
  comparisonLabel = 'Previous',
  theme: customTheme,
  tooltip,
  onClick,
  ...props
}) => {
  const theme = useTheme();
  
  // Determine colors based on theme
  const finalColor = color || premiumDesignSystem.colors.primary[500];
  const finalBackgroundColor = backgroundColor || premiumDesignSystem.colors.neutral[200];
  
  // Thickness mapping
  const strokeWidthMap = {
    thin: Math.max(size * 0.04, 4),
    medium: Math.max(size * 0.06, 6),
    thick: Math.max(size * 0.08, 8)
  };
  
  const finalStrokeWidth = strokeWidth || strokeWidthMap[thickness];
  const radius = (size / 2) - (finalStrokeWidth * 1.5);
  
  // Format display values
  const formatValue = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return Math.round(val).toLocaleString();
  };

  // Multi-ring configuration
  if (variant === 'multi' && rings) {
    return (
      <MultiRingProgress
        rings={rings}
        size={size}
        animated={animated}
        centerContent={centerContent}
        {...props}
      />
    );
  }

  // Comparison variant
  if (variant === 'comparison' && comparisonValue !== undefined) {
    const comparisonRings = [
      {
        id: 'main',
        value: value,
        maxValue: maxValue,
        color: finalColor,
        strokeWidth: finalStrokeWidth,
        gradient: gradient,
        showGlow: glow,
        tooltip: `Current: ${formatValue(value)}`
      },
      {
        id: 'comparison',
        value: comparisonValue,
        maxValue: maxValue,
        color: `${finalColor}40`,
        strokeWidth: Math.max(finalStrokeWidth - 2, 3),
        gradient: false,
        showGlow: false,
        tooltip: `${comparisonLabel}: ${formatValue(comparisonValue)}`
      }
    ];

    return (
      <MultiRingProgress
        rings={comparisonRings}
        size={size}
        animated={animated}
        centerContent={centerContent || (
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: premiumDesignSystem.typography.fontWeight.bold,
                color: finalColor,
                fontSize: `${size * 0.12}px`,
                lineHeight: 1
              }}
            >
              {showPercentage ? `${Math.round((value / maxValue) * 100)}%` : formatValue(value)}
            </Typography>
            {label && (
              <Typography
                variant="caption"
                sx={{
                  color: premiumDesignSystem.colors.neutral[600],
                  fontSize: `${size * 0.08}px`,
                  textAlign: 'center',
                  mt: 0.5
                }}
              >
                {label}
              </Typography>
            )}
          </Box>
        )}
        showTooltips={true}
        {...props}
      />
    );
  }

  // Single ring component
  const progressComponent = (
    <CircularRing
      value={value}
      maxValue={maxValue}
      radius={radius}
      strokeWidth={finalStrokeWidth}
      color={finalColor}
      backgroundColor={finalBackgroundColor}
      gradient={gradient}
      animated={animated}
      duration={duration}
      lineCap={lineCap}
      showGlow={glow}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: premiumDesignSystem.animations.transitions.transform,
        '&:hover': onClick ? {
          transform: 'scale(1.05)'
        } : {}
      }}
    >
      {centerContent || (
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: premiumDesignSystem.typography.fontWeight.bold,
              color: finalColor,
              fontSize: `${size * 0.15}px`,
              lineHeight: 1,
              background: gradient ? premiumDesignSystem.colors.primary.gradient.default : 'inherit',
              backgroundClip: gradient ? 'text' : 'initial',
              WebkitBackgroundClip: gradient ? 'text' : 'initial',
              WebkitTextFillColor: gradient ? 'transparent' : 'inherit'
            }}
          >
            {showPercentage ? `${Math.round((value / maxValue) * 100)}%` : formatValue(value)}
          </Typography>
          {showValue && showPercentage && (
            <Typography
              variant="caption"
              sx={{
                color: premiumDesignSystem.colors.neutral[600],
                fontSize: `${size * 0.08}px`,
                display: 'block',
                mt: -0.5
              }}
            >
              {formatValue(value)} / {formatValue(maxValue)}
            </Typography>
          )}
          {label && (
            <Typography
              variant="caption"
              sx={{
                color: premiumDesignSystem.colors.neutral[600],
                fontSize: `${size * 0.08}px`,
                textAlign: 'center',
                display: 'block',
                mt: 0.5,
                lineHeight: 1.2
              }}
            >
              {label}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: premiumDesignSystem.colors.neutral[500],
                fontSize: `${size * 0.07}px`,
                textAlign: 'center',
                display: 'block',
                mt: 0.25,
                opacity: 0.8
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </CircularRing>
  );

  return tooltip ? (
    <Tooltip title={tooltip} placement="top">
      <div>{progressComponent}</div>
    </Tooltip>
  ) : progressComponent;
});

CircularProgress.displayName = 'CircularProgress';

// Export sub-components
export { CircularRing, MultiRingProgress };

export default CircularProgress;