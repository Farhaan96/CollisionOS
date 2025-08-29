// AnimatedCard Component - Premium animated card with 3D tilt, glassmorphism, and flip animations
// Supports entrance animations with stagger and state change transitions

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardActions, Box, useTheme } from '@mui/material';
import { premiumColors, premiumShadows, premiumEffects, premiumBorderRadius } from '../../theme/premiumDesignSystem';
import { 
  microInteractions, 
  containerAnimations, 
  scrollAnimations,
  advancedSpringConfigs,
  premiumEasings 
} from '../../utils/animations';
import { useMouseTracking, useScrollAnimation, useAccessibleAnimation } from '../../hooks/useAnimation';

const AnimatedCard = ({
  children,
  header,
  actions,
  variant = 'premium', // premium, glass, minimal, executive
  animation = 'tilt', // tilt, scale, glow, float, flip
  elevation = 'medium', // low, medium, high, dynamic
  interactive = true,
  flippable = false,
  backContent,
  glowColor,
  delay = 0,
  onCardClick,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const cardRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for 3D tilt effect
  const { 
    ref: mouseRef, 
    style: mouseStyle 
  } = useMouseTracking(0.5, advancedSpringConfigs.responsive);

  // Scroll animation
  const { 
    ref: scrollRef, 
    controls: scrollControls 
  } = useScrollAnimation({
    threshold: 0.2,
    delay: delay * 1000
  });

  // Card variants based on style
  const cardVariants = {
    premium: {
      rest: {
        background: `linear-gradient(135deg, 
          ${premiumColors.glass.white[5]} 0%, 
          ${premiumColors.glass.white[10]} 100%)`,
        backdropFilter: premiumEffects.backdrop.md,
        borderRadius: premiumBorderRadius['2xl'],
        border: `1px solid ${premiumColors.glass.white[15]}`,
        boxShadow: premiumShadows.md,
        scale: 1,
        y: 0
      },
      hover: {
        background: `linear-gradient(135deg, 
          ${premiumColors.glass.white[8]} 0%, 
          ${premiumColors.glass.white[15]} 100%)`,
        backdropFilter: premiumEffects.backdrop.lg,
        border: `1px solid ${premiumColors.glass.white[20]}`,
        boxShadow: premiumShadows.lg,
        scale: interactive ? 1.02 : 1,
        y: interactive ? -4 : 0,
        transition: advancedSpringConfigs.premium
      }
    },

    glass: {
      rest: {
        background: premiumColors.glass.white[8],
        backdropFilter: premiumEffects.backdrop.xl,
        borderRadius: premiumBorderRadius['3xl'],
        border: `1px solid ${premiumColors.glass.white[20]}`,
        boxShadow: premiumShadows.glass.soft,
        scale: 1
      },
      hover: {
        background: premiumColors.glass.white[12],
        backdropFilter: premiumEffects.backdrop['2xl'],
        border: `1px solid ${premiumColors.glass.white[30]}`,
        boxShadow: premiumShadows.glass.elevated,
        scale: interactive ? 1.01 : 1,
        transition: advancedSpringConfigs.buttery
      }
    },

    minimal: {
      rest: {
        background: premiumColors.neutral[50],
        borderRadius: premiumBorderRadius.xl,
        border: `1px solid ${premiumColors.neutral[200]}`,
        boxShadow: premiumShadows.sm,
        scale: 1
      },
      hover: {
        background: premiumColors.neutral[100],
        border: `1px solid ${premiumColors.neutral[300]}`,
        boxShadow: premiumShadows.md,
        scale: interactive ? 1.01 : 1,
        transition: advancedSpringConfigs.gentle
      }
    },

    executive: {
      rest: {
        background: `linear-gradient(135deg, 
          ${premiumColors.neutral[900]} 0%, 
          ${premiumColors.neutral[800]} 100%)`,
        borderRadius: premiumBorderRadius['2xl'],
        border: `1px solid ${premiumColors.neutral[700]}`,
        boxShadow: premiumShadows.glass.elevated,
        scale: 1
      },
      hover: {
        background: `linear-gradient(135deg, 
          ${premiumColors.neutral[800]} 0%, 
          ${premiumColors.neutral[700]} 100%)`,
        border: `1px solid ${premiumColors.neutral[600]}`,
        boxShadow: premiumShadows.xl,
        scale: interactive ? 1.01 : 1,
        transition: advancedSpringConfigs.executive
      }
    }
  };

  // Animation variants
  const animationVariants = {
    tilt: {
      ...cardVariants[variant],
      hover: {
        ...cardVariants[variant].hover,
        ...mouseStyle
      }
    },

    scale: microInteractions.cardTilt,

    glow: {
      ...cardVariants[variant],
      hover: {
        ...cardVariants[variant].hover,
        boxShadow: glowColor 
          ? `0 8px 32px ${glowColor}40, ${premiumShadows.lg}`
          : premiumShadows.glow.primary
      }
    },

    float: {
      ...cardVariants[variant],
      animate: {
        y: [-2, 2, -2],
        transition: {
          duration: 4,
          ease: 'easeInOut',
          repeat: Infinity
        }
      }
    },

    flip: {
      front: {
        rotateY: 0,
        transformPerspective: 1000
      },
      back: {
        rotateY: 180,
        transformPerspective: 1000
      }
    }
  };

  // Elevation configurations
  const elevationConfig = {
    low: premiumShadows.sm,
    medium: premiumShadows.md,
    high: premiumShadows.lg,
    dynamic: isHovered ? premiumShadows.xl : premiumShadows.md
  };

  // Entrance animations
  const entranceVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
      rotateX: 10
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        ...advancedSpringConfigs.executive,
        delay
      }
    }
  };

  // Handle card interactions
  const handleCardClick = () => {
    if (flippable) {
      setIsFlipped(!isFlipped);
    }
    onCardClick?.();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Get current variants
  const currentVariants = animation === 'flip' 
    ? animationVariants.flip 
    : animationVariants[animation] || animationVariants.tilt;

  // Accessible variants
  const { variants: accessibleVariants } = useAccessibleAnimation(currentVariants);
  const { variants: accessibleEntranceVariants } = useAccessibleAnimation(entranceVariants);

  // Flip card variants
  const flipVariants = {
    front: {
      rotateY: 0,
      transformPerspective: 1000,
      backfaceVisibility: 'hidden'
    },
    back: {
      rotateY: 180,
      transformPerspective: 1000,
      backfaceVisibility: 'hidden'
    }
  };

  return (
    <motion.div
      ref={(node) => {
        cardRef.current = node;
        scrollRef.current = node;
        if (animation === 'tilt') {
          mouseRef.current = node;
        }
      }}
      variants={accessibleEntranceVariants}
      initial="hidden"
      animate={scrollControls}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d'
      }}
    >
      <motion.div
        variants={accessibleVariants}
        initial="rest"
        animate={animation === 'float' ? 'animate' : 'rest'}
        whileHover={interactive ? "hover" : "rest"}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: interactive || flippable ? 'pointer' : 'default',
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
      >
        <AnimatePresence mode="wait">
          {!flippable || !isFlipped ? (
            // Front of card
            <motion.div
              key="front"
              variants={flippable ? flipVariants : {}}
              initial="front"
              animate="front"
              exit="back"
              transition={advancedSpringConfigs.premium}
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d'
              }}
            >
              <Card
                elevation={0}
                sx={{
                  background: 'transparent',
                  boxShadow: elevation === 'dynamic' 
                    ? elevationConfig.dynamic 
                    : elevationConfig[elevation],
                  borderRadius: 'inherit',
                  overflow: 'hidden',
                  position: 'relative',
                  ...sx
                }}
                {...props}
              >
                {/* Header */}
                {header && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 0.1 }}
                  >
                    <CardHeader {...header} />
                  </motion.div>
                )}

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: delay + 0.2 }}
                >
                  <CardContent>
                    {children}
                  </CardContent>
                </motion.div>

                {/* Actions */}
                {actions && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 0.3 }}
                  >
                    <CardActions>
                      {actions}
                    </CardActions>
                  </motion.div>
                )}

                {/* Shine effect on hover */}
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={isHovered ? { x: '100%', opacity: 1 } : { x: '-100%', opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(
                      90deg,
                      transparent,
                      rgba(255, 255, 255, 0.1),
                      transparent
                    )`,
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                />
              </Card>
            </motion.div>
          ) : (
            // Back of card
            <motion.div
              key="back"
              variants={flipVariants}
              initial="front"
              animate="back"
              exit="front"
              transition={advancedSpringConfigs.premium}
              style={{
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            >
              <Card
                elevation={0}
                sx={{
                  background: 'transparent',
                  boxShadow: elevationConfig[elevation],
                  borderRadius: 'inherit',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  ...sx
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {backContent}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Pre-configured card variants
export const PremiumCard = (props) => (
  <AnimatedCard variant="premium" animation="tilt" {...props} />
);

export const GlassCard = (props) => (
  <AnimatedCard variant="glass" animation="scale" {...props} />
);

export const ExecutiveCard = (props) => (
  <AnimatedCard variant="executive" animation="glow" {...props} />
);

export const MinimalCard = (props) => (
  <AnimatedCard variant="minimal" animation="scale" {...props} />
);

export const FloatingCard = (props) => (
  <AnimatedCard animation="float" {...props} />
);

export const FlipCard = (props) => (
  <AnimatedCard flippable animation="flip" {...props} />
);

export const TiltCard = (props) => (
  <AnimatedCard animation="tilt" {...props} />
);

// Container for staggered card animations
export const CardGrid = ({ children, staggerDelay = 0.1, ...props }) => {
  return (
    <motion.div
      variants={containerAnimations.executiveStagger}
      initial="hidden"
      animate="visible"
      style={{
        display: 'grid',
        gap: 24,
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        ...props.style
      }}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          variants={scrollAnimations.scrollReveal}
          custom={index}
          key={index}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedCard;