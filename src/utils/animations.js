import { motion } from 'framer-motion';

// Enhanced spring configurations
export const springConfigs = {
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
    mass: 1,
  },
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 1,
  },
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  },
  smooth: {
    type: 'spring',
    stiffness: 200,
    damping: 18,
    mass: 1.2,
  },
};

// Easing functions
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  backOut: [0.175, 0.885, 0.32, 1.275],
};

// Micro-animation variants
export const microAnimations = {
  // Hover scale effect
  hoverScale: {
    rest: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: springConfigs.gentle,
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  },

  // Bounce on hover
  bounceHover: {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.05,
      y: -2,
      transition: springConfigs.bouncy,
    },
    tap: {
      scale: 0.95,
      y: 1,
      transition: { duration: 0.1 },
    },
  },

  // Glow effect
  glowHover: {
    rest: {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      boxShadow: '0 8px 40px rgba(59, 130, 246, 0.3)',
      transition: { duration: 0.3 },
    },
  },

  // Slide up reveal
  slideUp: {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: springConfigs.smooth,
    },
  },

  // Staggered fade in
  staggeredFade: {
    hidden: { opacity: 0, y: 10 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        ...springConfigs.gentle,
        delay: i * 0.1,
      },
    }),
  },

  // Floating animation
  floating: {
    initial: { y: 0 },
    animate: {
      y: [-2, 2, -2],
      transition: {
        duration: 4,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    },
  },

  // Pulse effect
  pulse: {
    initial: { scale: 1, opacity: 0.8 },
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    },
  },

  // Card entrance
  cardEntrance: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 40,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        mass: 1,
      },
    },
  },

  // Shimmer loading
  shimmer: {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        duration: 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    },
  },
};

// Scroll-triggered animations
export const scrollAnimations = {
  fadeInUp: {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: springConfigs.smooth,
    },
  },

  slideInFromLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: springConfigs.gentle,
    },
  },

  slideInFromRight: {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: springConfigs.gentle,
    },
  },

  scaleIn: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: springConfigs.bouncy,
    },
  },
};

// Container animations for orchestrated entrances
export const containerAnimations = {
  staggerChildren: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  grid: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },

  list: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
};

// Higher-order component for adding micro-animations
export const withMicroAnimation = (Component, animationType = 'hoverScale') => {
  return motion(Component, {
    variants: microAnimations[animationType],
    initial: 'rest',
    whileHover: 'hover',
    whileTap: 'tap',
  });
};

// Loading states
export const loadingAnimations = {
  spinner: {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: 'linear',
        repeat: Infinity,
      },
    },
  },

  dots: {
    initial: { opacity: 0.3, scale: 0.8 },
    animate: i => ({
      opacity: [0.3, 1, 0.3],
      scale: [0.8, 1, 0.8],
      transition: {
        duration: 1.2,
        ease: 'easeInOut',
        repeat: Infinity,
        delay: i * 0.2,
      },
    }),
  },

  skeleton: {
    initial: { opacity: 1 },
    animate: {
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    },
  },
};

// Page transitions
export const pageTransitions = {
  slideLeft: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: springConfigs.smooth,
  },

  slideRight: {
    initial: { x: -300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
    transition: springConfigs.smooth,
  },

  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: springConfigs.gentle,
  },
};

export default {
  springConfigs,
  easings,
  microAnimations,
  scrollAnimations,
  containerAnimations,
  loadingAnimations,
  pageTransitions,
  withMicroAnimation,
};
