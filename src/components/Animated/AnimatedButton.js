// AnimatedButton Component - Premium animated button with multiple variants
// Supports scale, glow, ripple animations with loading states and success/error transitions

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, CircularProgress, Box, useTheme } from '@mui/material';
import { Check, Error, ArrowForward } from '@mui/icons-material';
import { premiumColors, premiumShadows, premiumEffects } from '../../theme/premiumDesignSystem';
import { 
  microInteractions, 
  loadingStates, 
  statusAnimations, 
  advancedSpringConfigs,
  premiumEasings 
} from '../../utils/animations/index';
import { useAnimationState, useAccessibleAnimation } from '../../hooks/useAnimation';

const AnimatedButton = ({
  children,
  variant = 'premium', // premium, executive, minimal, glass
  animation = 'scale', // scale, glow, ripple, magnetic
  size = 'medium', // small, medium, large
  state = 'idle', // idle, loading, success, error
  onClick,
  disabled = false,
  icon,
  endIcon,
  fullWidth = false,
  glowColor,
  style = {},
  ...props
}) => {
  const theme = useTheme();
  const buttonRef = useRef(null);
  const [ripples, setRipples] = useState([]);
  const [magnetOffset, setMagnetOffset] = useState({ x: 0, y: 0 });
  
  const { 
    state: animationState, 
    animate, 
    controls 
  } = useAnimationState('rest');

  // Button variants configuration
  const buttonVariants = {
    premium: {
      rest: {
        background: premiumColors.primary.gradient.default,
        boxShadow: premiumShadows.md,
        scale: 1,
        filter: 'brightness(1)',
        y: 0
      },
      hover: {
        background: premiumColors.primary.gradient.vivid,
        boxShadow: premiumShadows.colored.primary,
        scale: 1.02,
        filter: 'brightness(1.05)',
        y: -2,
        transition: advancedSpringConfigs.premium
      },
      tap: {
        scale: 0.98,
        y: 0,
        filter: 'brightness(0.95)',
        transition: { duration: 0.1 }
      },
      loading: {
        scale: 0.95,
        filter: 'brightness(0.9)',
        transition: advancedSpringConfigs.gentle
      },
      success: {
        background: premiumColors.semantic.success.gradient,
        scale: [0.98, 1.05, 1],
        transition: {
          duration: 0.6,
          ease: premiumEasings.appleBounce
        }
      },
      error: {
        background: premiumColors.semantic.error.gradient,
        scale: [0.98, 1.02, 1],
        x: [0, -2, 2, -2, 0],
        transition: {
          scale: { duration: 0.3 },
          x: { duration: 0.4 }
        }
      }
    },

    executive: {
      rest: {
        background: `linear-gradient(135deg, ${premiumColors.neutral[900]} 0%, ${premiumColors.neutral[800]} 100%)`,
        boxShadow: premiumShadows.glass.elevated,
        scale: 1,
        borderRadius: 16,
        backdropFilter: 'blur(20px)'
      },
      hover: {
        background: `linear-gradient(135deg, ${premiumColors.neutral[800]} 0%, ${premiumColors.neutral[700]} 100%)`,
        boxShadow: premiumShadows.xl,
        scale: 1.02,
        borderRadius: 20,
        transition: advancedSpringConfigs.executive
      },
      tap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      }
    },

    minimal: {
      rest: {
        background: 'transparent',
        color: premiumColors.primary[600],
        scale: 1,
        x: 0
      },
      hover: {
        background: premiumColors.primary[50],
        color: premiumColors.primary[700],
        scale: 1.02,
        x: 4,
        transition: advancedSpringConfigs.responsive
      },
      tap: {
        scale: 0.98,
        x: 0
      }
    },

    glass: {
      rest: {
        background: premiumColors.glass.white[10],
        backdropFilter: premiumEffects.backdrop.md,
        border: `1px solid ${premiumColors.glass.white[20]}`,
        boxShadow: premiumShadows.glass.medium,
        scale: 1
      },
      hover: {
        background: premiumColors.glass.white[15],
        backdropFilter: premiumEffects.backdrop.lg,
        border: `1px solid ${premiumColors.glass.white[30]}`,
        boxShadow: premiumShadows.glass.elevated,
        scale: 1.02,
        transition: advancedSpringConfigs.buttery
      },
      tap: {
        scale: 0.98
      }
    }
  };

  // Animation-specific variants
  const animationVariants = {
    scale: microInteractions.premiumButton,
    glow: {
      ...microInteractions.premiumButton,
      hover: {
        ...microInteractions.premiumButton.hover,
        boxShadow: glowColor 
          ? `0 0 30px ${glowColor}` 
          : premiumShadows.glow.primary
      }
    },
    magnetic: microInteractions.magnetic,
    ripple: {}
  };

  // Handle click with ripple effect
  const handleClick = (event) => {
    if (disabled || state === 'loading') return;

    if (animation === 'ripple') {
      const rect = buttonRef.current.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      const newRipple = {
        id: Date.now(),
        x,
        y,
        size
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(event);
  };

  // Handle magnetic effect
  const handleMouseMove = (event) => {
    if (animation !== 'magnetic' || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (event.clientX - centerX) / rect.width;
    const y = (event.clientY - centerY) / rect.height;
    
    setMagnetOffset({ x: x * 10, y: y * 10 });
  };

  const handleMouseLeave = () => {
    setMagnetOffset({ x: 0, y: 0 });
  };

  // Size configurations
  const sizeConfig = {
    small: {
      minHeight: 32,
      padding: '8px 16px',
      fontSize: '0.875rem'
    },
    medium: {
      minHeight: 40,
      padding: '12px 24px',
      fontSize: '1rem'
    },
    large: {
      minHeight: 48,
      padding: '16px 32px',
      fontSize: '1.125rem'
    }
  };

  const currentSize = sizeConfig[size];
  const currentVariant = buttonVariants[variant];
  const currentAnimation = animationVariants[animation];

  // Combine variants
  const combinedVariants = {
    ...currentVariant,
    ...currentAnimation
  };

  // Handle magnetic animation
  if (animation === 'magnetic') {
    combinedVariants.hover = {
      ...combinedVariants.hover,
      x: magnetOffset.x * 0.5,
      y: magnetOffset.y * 0.5
    };
  }

  // Accessible variants
  const { variants: accessibleVariants } = useAccessibleAnimation(combinedVariants);

  return (
    <motion.div
      ref={buttonRef}
      variants={accessibleVariants}
      initial="rest"
      animate={state}
      whileHover="hover"
      whileTap="tap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: variant === 'executive' ? 16 : 12,
        width: fullWidth ? '100%' : 'auto',
        ...style
      }}
    >
      <Button
        onClick={handleClick}
        disabled={disabled || state === 'loading'}
        variant="contained"
        fullWidth={fullWidth}
        sx={{
          minHeight: currentSize.minHeight,
          padding: currentSize.padding,
          fontSize: currentSize.fontSize,
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 'inherit',
          border: 'none',
          background: 'transparent',
          color: 'white',
          boxShadow: 'none',
          '&:hover': {
            background: 'transparent',
            boxShadow: 'none'
          },
          '&:active': {
            background: 'transparent',
            boxShadow: 'none'
          },
          '&:disabled': {
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }}
        {...props}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Loading State */}
          <AnimatePresence mode="wait">
            {state === 'loading' && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CircularProgress size={16} sx={{ color: 'white' }} />
              </motion.div>
            )}

            {/* Success State */}
            {state === 'success' && (
              <motion.div
                variants={statusAnimations.success}
                initial="initial"
                animate="animate"
              >
                <Check sx={{ fontSize: 16 }} />
              </motion.div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <motion.div
                variants={statusAnimations.error}
                initial="initial"
                animate="animate"
              >
                <Error sx={{ fontSize: 16 }} />
              </motion.div>
            )}

            {/* Icon */}
            {icon && state === 'idle' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {icon}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button Text */}
          <AnimatePresence mode="wait">
            <motion.span
              key={state}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {state === 'loading' && 'Loading...'}
              {state === 'success' && 'Success!'}
              {state === 'error' && 'Error'}
              {state === 'idle' && children}
            </motion.span>
          </AnimatePresence>

          {/* End Icon */}
          {endIcon && state === 'idle' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ delay: 0.1 }}
            >
              {endIcon}
            </motion.div>
          )}
        </Box>

        {/* Ripple Effects */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              initial={{
                opacity: 0.3,
                scale: 0,
                x: ripple.x,
                y: ripple.y
              }}
              animate={{
                opacity: 0,
                scale: 1,
                transition: { duration: 0.6, ease: 'easeOut' }
              }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                width: ripple.size,
                height: ripple.size,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.4)',
                pointerEvents: 'none',
                top: 0,
                left: 0,
                transformOrigin: 'center'
              }}
            />
          ))}
        </AnimatePresence>

        {/* Shimmer Effect for Loading */}
        {state === 'loading' && (
          <motion.div
            variants={loadingStates.premiumShimmer}
            animate="animate"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              )`,
              backgroundSize: '200% 100%',
              zIndex: 0
            }}
          />
        )}
      </Button>
    </motion.div>
  );
};

// HOC for easy animation presets
export const PremiumButton = (props) => (
  <AnimatedButton variant="premium" animation="scale" {...props} />
);

export const ExecutiveButton = (props) => (
  <AnimatedButton variant="executive" animation="glow" {...props} />
);

export const MinimalButton = (props) => (
  <AnimatedButton variant="minimal" animation="minimal" {...props} />
);

export const GlassButton = (props) => (
  <AnimatedButton variant="glass" animation="scale" {...props} />
);

export const MagneticButton = (props) => (
  <AnimatedButton animation="magnetic" {...props} />
);

export const RippleButton = (props) => (
  <AnimatedButton animation="ripple" {...props} />
);

export default AnimatedButton;