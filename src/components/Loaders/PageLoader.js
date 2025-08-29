// Premium Page Loader for CollisionOS
// Executive-level full page loading overlay with logo animation and progress tracking

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Fade, 
  Backdrop,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';
import { advancedSpringConfigs, premiumEasings } from '../../utils/animations';

// Loading tips and messages
const loadingMessages = [
  'Optimizing your dashboard experience...',
  'Loading premium features...',
  'Preparing collision management tools...',
  'Synchronizing real-time data...',
  'Initializing executive dashboard...',
  'Setting up advanced analytics...',
  'Configuring workflow automation...',
  'Loading customer communications...',
  'Preparing parts inventory system...',
  'Initializing quality control features...',
  'Setting up production tracking...',
  'Loading business intelligence...',
  'Configuring notification system...',
  'Preparing advanced reporting...',
  'Initializing secure connections...',
];

// Logo animation variants
const logoAnimations = {
  pulse: {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    }
  },
  
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }
    }
  },
  
  bounce: {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: premiumEasings.appleBounce,
      }
    }
  },
  
  breathe: {
    animate: {
      scale: [1, 1.05, 1],
      filter: [
        'brightness(1) hue-rotate(0deg)',
        'brightness(1.2) hue-rotate(10deg)',
        'brightness(1) hue-rotate(0deg)'
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    }
  },

  glow: {
    animate: {
      boxShadow: [
        `0 0 20px ${premiumDesignSystem.colors.primary[500]}40`,
        `0 0 40px ${premiumDesignSystem.colors.primary[500]}80`,
        `0 0 20px ${premiumDesignSystem.colors.primary[500]}40`,
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    }
  }
};

// Progress bar animations
const progressAnimations = {
  smooth: {
    initial: { scaleX: 0, originX: 0 },
    animate: (progress) => ({
      scaleX: progress / 100,
      transition: {
        duration: 0.5,
        ease: premiumEasings.executive,
      }
    })
  },
  
  wave: {
    animate: {
      background: [
        `linear-gradient(90deg, ${premiumDesignSystem.colors.primary[400]} 0%, ${premiumDesignSystem.colors.primary[600]} 100%)`,
        `linear-gradient(90deg, ${premiumDesignSystem.colors.primary[600]} 0%, ${premiumDesignSystem.colors.primary[400]} 100%)`,
        `linear-gradient(90deg, ${premiumDesignSystem.colors.primary[400]} 0%, ${premiumDesignSystem.colors.primary[600]} 100%)`
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    }
  }
};

// Container animations
const containerVariants = {
  initial: { 
    opacity: 0,
    scale: 0.95,
    filter: 'blur(10px)'
  },
  animate: { 
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: premiumEasings.executive,
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    filter: 'blur(5px)',
    transition: {
      duration: 0.4,
      ease: premiumEasings.emphasized,
    }
  }
};

const childVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: premiumEasings.executive
    }
  }
};

// Spinning dots animation
const DotsLoader = ({ size = 8, color }) => {
  return (
    <Box display="flex" gap={1} alignItems="center">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color || premiumDesignSystem.colors.primary[500],
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </Box>
  );
};

// CollisionOS Logo Component
const CollisionOSLogo = ({ animation = 'breathe', size = 120 }) => {
  const theme = useTheme();
  const logoAnimation = logoAnimations[animation] || logoAnimations.breathe;
  
  return (
    <motion.div
      variants={logoAnimation}
      animate="animate"
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: premiumDesignSystem.borderRadius['2xl'],
        background: premiumDesignSystem.colors.primary.gradient.default,
        color: 'white',
        fontWeight: 700,
        fontSize: size * 0.25,
        boxShadow: premiumDesignSystem.shadows.colored.primary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 30% 30%, ${premiumDesignSystem.colors.glass.white[20]} 0%, transparent 50%)`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      <Box zIndex={1} textAlign="center">
        <Typography 
          variant="h6" 
          component="div" 
          fontWeight={800}
          fontSize={size * 0.15}
          lineHeight={1}
        >
          C•OS
        </Typography>
        <Typography 
          variant="caption" 
          component="div"
          fontSize={size * 0.08}
          opacity={0.9}
          letterSpacing="0.1em"
        >
          PREMIUM
        </Typography>
      </Box>
    </motion.div>
  );
};

// Main PageLoader component
const PageLoader = forwardRef(({
  isLoading = true,
  progress = 0,
  message,
  showProgress = true,
  showLogo = true,
  showMessages = true,
  logoAnimation = 'breathe',
  progressAnimation = 'smooth',
  blur = true,
  backgroundColor,
  onComplete,
  minimumLoadTime = 1000,
  autoProgress = false,
  progressSpeed = 100, // ms per percent
  customLogo,
  variant = 'default', // 'default', 'minimal', 'executive'
  ...props
}, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message || loadingMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [startTime] = useState(Date.now());
  
  // Auto-progress functionality
  useEffect(() => {
    if (autoProgress && isLoading && currentProgress < 90) {
      const timer = setTimeout(() => {
        setCurrentProgress(prev => Math.min(prev + 1, 90));
      }, progressSpeed);
      return () => clearTimeout(timer);
    }
  }, [autoProgress, isLoading, currentProgress, progressSpeed]);
  
  // Message rotation
  useEffect(() => {
    if (!showMessages || !isLoading) return;
    
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3000);
    
    return () => clearInterval(messageTimer);
  }, [showMessages, isLoading]);
  
  // Update current message
  useEffect(() => {
    if (showMessages) {
      setCurrentMessage(message || loadingMessages[messageIndex]);
    }
  }, [message, messageIndex, showMessages]);
  
  // Handle completion
  const handleComplete = useCallback(() => {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minimumLoadTime - elapsedTime);
    
    setTimeout(() => {
      onComplete?.();
    }, remainingTime);
  }, [startTime, minimumLoadTime, onComplete]);
  
  // Monitor progress completion
  useEffect(() => {
    if (progress >= 100 || currentProgress >= 100) {
      handleComplete();
    }
  }, [progress, currentProgress, handleComplete]);
  
  // Style variants
  const getVariantStyles = () => {
    const baseStyles = {
      background: backgroundColor || (isDark 
        ? `rgba(0, 0, 0, 0.9)` 
        : `rgba(255, 255, 255, 0.95)`),
      backdropFilter: blur ? 'blur(20px) saturate(180%)' : 'none',
      WebkitBackdropFilter: blur ? 'blur(20px) saturate(180%)' : 'none',
    };
    
    switch (variant) {
      case 'minimal':
        return {
          ...baseStyles,
          background: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        };
      case 'executive':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, 
            ${premiumDesignSystem.colors.neutral[900]}95 0%,
            ${premiumDesignSystem.colors.primary[900]}90 100%
          )`,
        };
      default:
        return baseStyles;
    }
  };
  
  const finalProgress = progress || currentProgress;
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: premiumDesignSystem.zIndex.max,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            ...getVariantStyles(),
          }}
          {...props}
        >
          {/* Main content container */}
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={isMobile ? 3 : 4}
            textAlign="center"
            maxWidth={isMobile ? 300 : 400}
            px={3}
          >
            {/* Logo */}
            {showLogo && (
              <motion.div variants={childVariants}>
                {customLogo || (
                  <CollisionOSLogo 
                    animation={logoAnimation}
                    size={isMobile ? 100 : 120}
                  />
                )}
              </motion.div>
            )}
            
            {/* Loading message */}
            {showMessages && (
              <motion.div variants={childVariants}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography 
                      variant={isMobile ? "body1" : "h6"}
                      color="textPrimary"
                      fontWeight={variant === 'executive' ? 600 : 500}
                      sx={{
                        background: variant === 'executive' ? 
                          `linear-gradient(135deg, ${premiumDesignSystem.colors.primary[400]}, ${premiumDesignSystem.colors.secondary[400]})` :
                          'inherit',
                        WebkitBackgroundClip: variant === 'executive' ? 'text' : 'initial',
                        WebkitTextFillColor: variant === 'executive' ? 'transparent' : 'inherit',
                      }}
                    >
                      {currentMessage}
                    </Typography>
                  </motion.div>
                </AnimatePresence>
                
                {/* Loading dots */}
                <Box mt={2}>
                  <DotsLoader 
                    size={isMobile ? 6 : 8}
                    color={variant === 'executive' ? 
                      premiumDesignSystem.colors.primary[400] : 
                      undefined
                    }
                  />
                </Box>
              </motion.div>
            )}
            
            {/* Progress bar */}
            {showProgress && (
              <motion.div 
                variants={childVariants}
                style={{ width: '100%' }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    fontWeight={500}
                  >
                    {Math.round(finalProgress)}%
                  </Typography>
                  <Box flex={1}>
                    <Box
                      position="relative"
                      height={6}
                      borderRadius={3}
                      overflow="hidden"
                      bgcolor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    >
                      <motion.div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          borderRadius: 3,
                          background: premiumDesignSystem.colors.primary.gradient.default,
                          boxShadow: `0 0 10px ${premiumDesignSystem.colors.primary[500]}40`,
                        }}
                        variants={progressAnimations[progressAnimation]}
                        animate="animate"
                        custom={finalProgress}
                      />
                    </Box>
                  </Box>
                </Box>
                
                {/* Time estimate */}
                {autoProgress && (
                  <Typography 
                    variant="caption" 
                    color="textSecondary"
                    display="block"
                  >
                    Estimated time: {Math.ceil((100 - finalProgress) * progressSpeed / 1000)}s
                  </Typography>
                )}
              </motion.div>
            )}
          </Box>
          
          {/* Background decoration */}
          {variant === 'executive' && (
            <Box
              position="absolute"
              inset={0}
              zIndex={-1}
              sx={{
                background: `radial-gradient(circle at 20% 80%, ${premiumDesignSystem.colors.primary[600]}20 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, ${premiumDesignSystem.colors.secondary[600]}20 0%, transparent 50%)`
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PageLoader.displayName = 'PageLoader';

export default PageLoader;

export {
  CollisionOSLogo,
  DotsLoader,
};