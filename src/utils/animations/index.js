// Advanced Animation System for CollisionOS
// Executive-level animations with 60fps optimization and gesture support

import { motion } from 'framer-motion';
import { premiumAnimations, premiumColors, premiumEffects, premiumShadows } from '../../theme/premiumDesignSystem';

// Advanced Spring Physics Configurations
export const advancedSpringConfigs = {
  // Ultra smooth for executive interfaces
  executive: {
    type: 'spring',
    stiffness: 100,
    damping: 12,
    mass: 0.8,
    velocity: 0,
    restDelta: 0.001,
    restSpeed: 0.001,
  },
  
  // Responsive interactions
  responsive: {
    type: 'spring',
    stiffness: 200,
    damping: 15,
    mass: 0.6,
    velocity: 0.5,
  },
  
  // Premium bouncy feel
  premium: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 0.5,
    velocity: 1,
  },
  
  // Buttery smooth transitions
  buttery: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
    mass: 1,
    restDelta: 0.0001,
    restSpeed: 0.0001,
  },
  
  // Snappy for micro-interactions
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
    mass: 0.4,
  },
  
  // Gentle for large elements
  gentle: {
    type: 'spring',
    stiffness: 80,
    damping: 12,
    mass: 1.5,
  },
};

// Advanced Easing Functions with Premium Feel
export const premiumEasings = {
  // Apple-inspired easings
  appleSmooth: [0.25, 0.1, 0.25, 1],
  appleSnappy: [0.2, 0, 0, 1],
  appleBounce: [0.175, 0.885, 0.32, 1.275],
  
  // Material Design 3 inspired
  emphasized: [0.2, 0, 0, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  standard: [0.2, 0, 0, 1],
  
  // Custom executive easings
  executive: [0.25, 0.8, 0.25, 1],
  luxurious: [0.19, 1, 0.22, 1],
  sophisticated: [0.23, 1, 0.32, 1],
  elegant: [0.25, 0.46, 0.45, 0.94],
  premium: [0.4, 0, 0.2, 1],
};

// Page Transition Animations
export const pageTransitions = {
  // Slide transitions with momentum
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { 
        ...advancedSpringConfigs.executive,
        opacity: { duration: 0.2 }
      }
    },
    exit: { 
      x: '-100%', 
      opacity: 0,
      transition: { 
        ...advancedSpringConfigs.responsive,
        opacity: { duration: 0.15 }
      }
    }
  },
  
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { 
        ...advancedSpringConfigs.executive,
        opacity: { duration: 0.2 }
      }
    },
    exit: { 
      x: '100%', 
      opacity: 0,
      transition: { 
        ...advancedSpringConfigs.responsive,
        opacity: { duration: 0.15 }
      }
    }
  },
  
  // Scale with blur effect
  scaleBlur: {
    initial: { 
      scale: 0.95, 
      opacity: 0,
      filter: 'blur(10px)'
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        ...advancedSpringConfigs.executive,
        filter: { duration: 0.3 }
      }
    },
    exit: { 
      scale: 1.05, 
      opacity: 0,
      filter: 'blur(5px)',
      transition: {
        duration: 0.2,
        ease: premiumEasings.emphasized
      }
    }
  },
  
  // Executive fade with subtle movement
  executiveFade: {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.98
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: advancedSpringConfigs.executive
    },
    exit: { 
      opacity: 0, 
      y: -10,
      scale: 1.02,
      transition: {
        duration: 0.15,
        ease: premiumEasings.emphasized
      }
    }
  },
  
  // 3D rotation transition
  rotation3D: {
    initial: { 
      rotateY: 90, 
      opacity: 0,
      transformPerspective: 1000
    },
    animate: { 
      rotateY: 0, 
      opacity: 1,
      transformPerspective: 1000,
      transition: advancedSpringConfigs.premium
    },
    exit: { 
      rotateY: -90, 
      opacity: 0,
      transformPerspective: 1000,
      transition: {
        duration: 0.3,
        ease: premiumEasings.emphasized
      }
    }
  }
};

// Micro-Interactions for Premium Feel
export const microInteractions = {
  // Button animations
  premiumButton: {
    rest: { 
      scale: 1,
      boxShadow: premiumShadows.md,
      filter: 'brightness(1)',
    },
    hover: { 
      scale: 1.02,
      boxShadow: premiumShadows.lg,
      filter: 'brightness(1.05)',
      transition: advancedSpringConfigs.responsive
    },
    tap: { 
      scale: 0.98,
      boxShadow: premiumShadows.sm,
      filter: 'brightness(0.95)',
      transition: { duration: 0.1 }
    }
  },
  
  // Executive button with glow
  executiveButton: {
    rest: { 
      scale: 1,
      boxShadow: premiumShadows.md,
      background: premiumColors.primary.gradient.default,
    },
    hover: { 
      scale: 1.05,
      boxShadow: premiumShadows.colored.primary,
      background: premiumColors.primary.gradient.vivid,
      transition: advancedSpringConfigs.premium
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  },
  
  // Ripple effect
  ripple: {
    rest: { scale: 0, opacity: 0.3 },
    tap: {
      scale: [0, 1],
      opacity: [0.3, 0],
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  },
  
  // Card hover with 3D tilt
  cardTilt: {
    rest: { 
      rotateX: 0, 
      rotateY: 0,
      scale: 1,
      transformPerspective: 1000,
      boxShadow: premiumShadows.md
    },
    hover: { 
      rotateX: 5, 
      rotateY: 5,
      scale: 1.02,
      transformPerspective: 1000,
      boxShadow: premiumShadows.xl,
      transition: advancedSpringConfigs.responsive
    }
  },
  
  // Magnetic effect
  magnetic: {
    rest: { x: 0, y: 0 },
    hover: (magnetOffset = { x: 0, y: 0 }) => ({
      x: magnetOffset.x * 0.5,
      y: magnetOffset.y * 0.5,
      transition: advancedSpringConfigs.responsive
    })
  },
  
  // Glow pulse animation
  glowPulse: {
    initial: { 
      boxShadow: premiumShadows.glow.primary 
    },
    animate: {
      boxShadow: [
        premiumShadows.glow.primary,
        `0 0 30px ${premiumColors.primary[500]}50`,
        premiumShadows.glow.primary
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }
};

// Loading State Animations
export const loadingStates = {
  // Sophisticated spinner
  executiveSpinner: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: 'linear',
        repeat: Infinity
      }
    }
  },
  
  // Shimmer with gradient
  premiumShimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        ease: 'linear',
        repeat: Infinity
      }
    }
  },
  
  // Pulse with color change
  colorPulse: {
    animate: {
      backgroundColor: [
        premiumColors.primary[500],
        premiumColors.primary[600],
        premiumColors.primary[500]
      ],
      transition: {
        duration: 1.5,
        ease: 'easeInOut',
        repeat: Infinity
      }
    }
  },
  
  // Skeleton with wave
  skeletonWave: {
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.02, 1],
      transition: {
        duration: 1.8,
        ease: 'easeInOut',
        repeat: Infinity,
        staggerChildren: 0.1
      }
    }
  }
};

// Success and Error Animations
export const statusAnimations = {
  success: {
    initial: { scale: 0, rotate: 0 },
    animate: {
      scale: [0, 1.2, 1],
      rotate: [0, 10, 0],
      transition: {
        duration: 0.6,
        ease: premiumEasings.appleBounce,
        times: [0, 0.6, 1]
      }
    }
  },
  
  error: {
    initial: { scale: 0, x: 0 },
    animate: {
      scale: [0, 1],
      x: [0, -5, 5, -5, 0],
      transition: {
        scale: { duration: 0.3 },
        x: { duration: 0.4, delay: 0.1 }
      }
    }
  },
  
  warning: {
    initial: { scale: 0, rotate: 0 },
    animate: {
      scale: 1,
      rotate: [0, -5, 5, 0],
      transition: {
        scale: { duration: 0.3, ease: premiumEasings.appleBounce },
        rotate: { duration: 0.5, delay: 0.2 }
      }
    }
  }
};

// Container Animations for Staggered Entrances
export const containerAnimations = {
  // Executive stagger
  executiveStagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
        when: 'beforeChildren'
      }
    }
  },
  
  // Grid with wave effect
  gridWave: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: 1,
        delayChildren: 0.1
      }
    }
  },
  
  // Radial stagger from center
  radialStagger: {
    hidden: { opacity: 0 },
    visible: (centerIndex = 0) => ({
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: centerIndex * 0.05
      }
    })
  }
};

// Gesture Animations
export const gestureAnimations = {
  // Swipe configurations
  swipeConfig: {
    swipeThreshold: 50,
    swipeVelocityThreshold: 500,
    swipeDirectionThreshold: 0.5
  },
  
  // Drag configurations
  dragConfig: {
    dragElastic: 0.2,
    dragMomentum: false,
    dragTransition: advancedSpringConfigs.responsive
  },
  
  // Pan gesture
  panVariants: {
    rest: { x: 0, y: 0, scale: 1 },
    drag: { 
      scale: 1.05,
      rotate: 2,
      transition: { duration: 0.2 }
    }
  },
  
  // Pinch to zoom
  pinchVariants: {
    initial: { scale: 1 },
    pinch: (scale) => ({
      scale: Math.max(0.5, Math.min(2, scale)),
      transition: { type: 'spring', ...advancedSpringConfigs.responsive }
    })
  }
};

// Scroll-triggered Animations
export const scrollAnimations = {
  // Parallax effect
  parallax: (offset = 0.5) => ({
    y: offset,
    transition: { type: 'spring', ...advancedSpringConfigs.buttery }
  }),
  
  // Reveal on scroll
  scrollReveal: {
    hidden: { 
      opacity: 0, 
      y: 50, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: advancedSpringConfigs.executive
    }
  },
  
  // Fade in direction variants
  fadeInUp: {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: advancedSpringConfigs.executive 
    }
  },
  
  fadeInLeft: {
    hidden: { opacity: 0, x: -60 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: advancedSpringConfigs.executive 
    }
  },
  
  fadeInRight: {
    hidden: { opacity: 0, x: 60 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: advancedSpringConfigs.executive 
    }
  },
  
  // Scale reveal
  scaleReveal: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: advancedSpringConfigs.premium 
    }
  }
};

// Form Animations
export const formAnimations = {
  // Input focus
  inputFocus: {
    rest: { 
      borderColor: premiumColors.neutral[300],
      boxShadow: 'none',
      scale: 1
    },
    focus: {
      borderColor: premiumColors.primary[500],
      boxShadow: `0 0 0 3px ${premiumColors.primary[100]}`,
      scale: 1.01,
      transition: advancedSpringConfigs.responsive
    },
    error: {
      borderColor: premiumColors.semantic.error.main,
      boxShadow: `0 0 0 3px ${premiumColors.semantic.error.light}`,
      x: [-2, 2, -2, 0],
      transition: { duration: 0.4 }
    }
  },
  
  // Label float
  labelFloat: {
    rest: { y: 0, scale: 1, opacity: 0.7 },
    active: {
      y: -20,
      scale: 0.85,
      opacity: 1,
      color: premiumColors.primary[600],
      transition: advancedSpringConfigs.responsive
    }
  }
};

// Advanced Animation Utilities
export const animationUtils = {
  // Create staggered delay
  createStagger: (items, delay = 0.1) => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1
      }
    }
  }),
  
  // Create sequence animation
  createSequence: (animations, duration = 0.5) => ({
    initial: animations[0],
    animate: animations,
    transition: {
      duration,
      times: animations.map((_, i) => i / (animations.length - 1))
    }
  }),
  
  // Create loop animation
  createLoop: (keyframes, duration = 2) => ({
    animate: keyframes,
    transition: {
      duration,
      repeat: Infinity,
      ease: 'linear'
    }
  }),
  
  // Performance optimized transform
  optimizedTransform: {
    transform: 'translate3d(0, 0, 0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden'
  }
};

// Export all animations
export default {
  advancedSpringConfigs,
  premiumEasings,
  pageTransitions,
  microInteractions,
  loadingStates,
  statusAnimations,
  containerAnimations,
  gestureAnimations,
  scrollAnimations,
  formAnimations,
  animationUtils
};

// Individual exports for convenience (already exported inline above)