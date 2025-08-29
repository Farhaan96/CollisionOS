// Advanced Animation Hooks for CollisionOS
// Custom hooks for intersection observers, reduced motion, and animation state management

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useInView, useMotionValue, useSpring, useTransform, useAnimation, useReducedMotion } from 'framer-motion';
import { advancedSpringConfigs, premiumEasings } from '../utils/animations';

// Hook for intersection observer based animations
export const useScrollAnimation = (options = {}) => {
  const {
    threshold = 0.3,
    triggerOnce = true,
    rootMargin = '0px 0px -100px 0px',
    variants = {},
    delay = 0
  } = options;

  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, {
    threshold,
    triggerOnce,
    rootMargin
  });

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        if (shouldReduceMotion) {
          // Provide reduced motion alternative
          controls.start({
            opacity: 1,
            transition: { duration: 0.1 }
          });
        } else {
          controls.start('visible');
        }
      }, delay);

      return () => clearTimeout(timer);
    } else if (!triggerOnce) {
      controls.start('hidden');
    }
  }, [isInView, controls, delay, shouldReduceMotion, triggerOnce]);

  return {
    ref,
    controls,
    isInView,
    shouldReduceMotion
  };
};

// Hook for staggered animations
export const useStaggeredAnimation = (items = [], options = {}) => {
  const {
    staggerDelay = 0.1,
    initialDelay = 0,
    triggerOnce = true,
    threshold = 0.2
  } = options;

  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold, triggerOnce });
  const shouldReduceMotion = useReducedMotion();

  const startAnimation = useCallback(async () => {
    if (shouldReduceMotion) {
      // Instant reveal for reduced motion
      await controls.start({
        opacity: 1,
        transition: { duration: 0.1 }
      });
    } else {
      await controls.start({
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: initialDelay
        }
      });
    }
  }, [controls, staggerDelay, initialDelay, shouldReduceMotion]);

  useEffect(() => {
    if (isInView) {
      startAnimation();
    }
  }, [isInView, startAnimation]);

  return {
    ref,
    controls,
    isInView,
    itemCount: items.length
  };
};

// Hook for managing animation states
export const useAnimationState = (initialState = 'idle') => {
  const [state, setState] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();
  const shouldReduceMotion = useReducedMotion();

  const animate = useCallback(async (newState, options = {}) => {
    if (isAnimating && !options.force) return;

    setIsAnimating(true);
    setState(newState);

    try {
      if (shouldReduceMotion) {
        // Provide immediate state change for reduced motion
        await controls.set(newState);
      } else {
        await controls.start(newState, options);
      }
    } finally {
      setIsAnimating(false);
    }
  }, [controls, isAnimating, shouldReduceMotion]);

  const reset = useCallback(() => {
    setState(initialState);
    setIsAnimating(false);
    controls.stop();
  }, [controls, initialState]);

  return {
    state,
    animate,
    reset,
    isAnimating,
    controls,
    shouldReduceMotion
  };
};

// Hook for mouse tracking animations
export const useMouseTracking = (strength = 1, springConfig = advancedSpringConfigs.responsive) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  
  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15]);
  
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = useCallback((event) => {
    if (!ref.current || shouldReduceMotion) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const xPct = (mouseX / width - 0.5) * strength;
    const yPct = (mouseY / height - 0.5) * strength;
    
    x.set(xPct);
    y.set(yPct);
  }, [x, y, strength, shouldReduceMotion]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return {
    ref,
    style: shouldReduceMotion ? {} : {
      rotateX,
      rotateY,
      transformPerspective: 1000
    },
    mouseX: springX,
    mouseY: springY
  };
};

// Hook for parallax scrolling effects
export const useParallax = (speed = 0.5, direction = 'vertical') => {
  const ref = useRef(null);
  const y = useMotionValue(0);
  const x = useMotionValue(0);
  
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    const updateParallax = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const rate = scrollY * speed;

      if (direction === 'vertical') {
        y.set(rate);
      } else {
        x.set(rate);
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction, y, x, shouldReduceMotion]);

  return {
    ref,
    style: shouldReduceMotion ? {} : {
      y: direction === 'vertical' ? y : 0,
      x: direction === 'horizontal' ? x : 0
    }
  };
};

// Hook for managing loading states with animations
export const useLoadingAnimation = (loadingStates = ['idle', 'loading', 'success', 'error']) => {
  const [currentState, setCurrentState] = useState(loadingStates[0]);
  const [progress, setProgress] = useState(0);
  const controls = useAnimation();
  const shouldReduceMotion = useReducedMotion();

  const startLoading = useCallback(async () => {
    setCurrentState('loading');
    setProgress(0);

    if (shouldReduceMotion) {
      await controls.set({ opacity: 0.7 });
    } else {
      await controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.3, ease: premiumEasings.executive }
      });
    }
  }, [controls, shouldReduceMotion]);

  const updateProgress = useCallback((newProgress) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
  }, []);

  const finishLoading = useCallback(async (success = true) => {
    const finalState = success ? 'success' : 'error';
    setCurrentState(finalState);
    setProgress(100);

    if (shouldReduceMotion) {
      await controls.set({ opacity: 1 });
    } else {
      await controls.start({
        scale: success ? [1, 1.1, 1] : [1, 0.95, 1.02, 1],
        transition: { 
          duration: success ? 0.6 : 0.4,
          ease: premiumEasings.appleBounce 
        }
      });
    }

    // Reset after delay
    setTimeout(() => {
      setCurrentState(loadingStates[0]);
      setProgress(0);
    }, 2000);
  }, [controls, shouldReduceMotion, loadingStates]);

  return {
    currentState,
    progress,
    controls,
    startLoading,
    updateProgress,
    finishLoading,
    isLoading: currentState === 'loading',
    isSuccess: currentState === 'success',
    isError: currentState === 'error'
  };
};

// Hook for gesture-based animations
export const useGestureAnimation = (options = {}) => {
  const {
    swipeThreshold = 50,
    dragElastic = 0.2,
    snapBack = true
  } = options;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  
  const springX = useSpring(x, advancedSpringConfigs.responsive);
  const springY = useSpring(y, advancedSpringConfigs.responsive);
  const springScale = useSpring(scale, advancedSpringConfigs.snappy);
  
  const shouldReduceMotion = useReducedMotion();

  const handleDragStart = useCallback(() => {
    if (shouldReduceMotion) return;
    scale.set(1.05);
  }, [scale, shouldReduceMotion]);

  const handleDragEnd = useCallback((event, info) => {
    if (shouldReduceMotion) {
      x.set(0);
      y.set(0);
      scale.set(1);
      return;
    }

    const { velocity, offset } = info;
    
    // Check for swipe gesture
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      // Handle swipe
      return { swiped: true, direction: offset.x > 0 ? 'right' : 'left' };
    }

    // Snap back to center
    if (snapBack) {
      x.set(0);
      y.set(0);
    }
    
    scale.set(1);
    return { swiped: false };
  }, [x, y, scale, swipeThreshold, snapBack, shouldReduceMotion]);

  const resetPosition = useCallback(() => {
    x.set(0);
    y.set(0);
    scale.set(1);
  }, [x, y, scale]);

  return {
    x: springX,
    y: springY,
    scale: springScale,
    dragControls: shouldReduceMotion ? {} : {
      drag: true,
      dragElastic,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd
    },
    resetPosition
  };
};

// Hook for sequence animations
export const useSequenceAnimation = (sequence = [], options = {}) => {
  const { loop = false, delay = 0 } = options;
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const controls = useAnimation();
  const shouldReduceMotion = useReducedMotion();

  const playSequence = useCallback(async () => {
    if (isPlaying || shouldReduceMotion) return;

    setIsPlaying(true);
    
    for (let i = 0; i < sequence.length; i++) {
      setCurrentStep(i);
      await controls.start(sequence[i], { delay: delay });
    }

    if (loop) {
      setCurrentStep(0);
      setTimeout(playSequence, 1000);
    } else {
      setIsPlaying(false);
    }
  }, [sequence, controls, delay, loop, isPlaying, shouldReduceMotion]);

  const stopSequence = useCallback(() => {
    setIsPlaying(false);
    controls.stop();
  }, [controls]);

  return {
    currentStep,
    isPlaying,
    controls,
    playSequence,
    stopSequence
  };
};

// Hook for reduced motion preferences
export const useAccessibleAnimation = (variants) => {
  const shouldReduceMotion = useReducedMotion();
  
  const accessibleVariants = useMemo(() => {
    if (!shouldReduceMotion) return variants;
    
    // Create reduced motion variants
    const reducedVariants = {};
    Object.keys(variants).forEach(key => {
      const variant = variants[key];
      reducedVariants[key] = {
        ...variant,
        transition: { duration: 0.01 },
        // Remove transforms that might cause motion sickness
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: Array.isArray(variant.scale) ? 1 : variant.scale
      };
    });
    
    return reducedVariants;
  }, [variants, shouldReduceMotion]);

  return {
    variants: accessibleVariants,
    shouldReduceMotion
  };
};

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const [fps, setFps] = useState(60);
  const [isOptimized, setIsOptimized] = useState(true);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      
      if (now - lastTime.current >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        setFps(currentFps);
        setIsOptimized(currentFps >= 30); // Consider 30fps as minimum for smooth
        
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      requestAnimationFrame(measureFPS);
    };

    const animationFrame = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return {
    fps,
    isOptimized,
    quality: fps >= 50 ? 'high' : fps >= 30 ? 'medium' : 'low'
  };
};

export default {
  useScrollAnimation,
  useStaggeredAnimation,
  useAnimationState,
  useMouseTracking,
  useParallax,
  useLoadingAnimation,
  useGestureAnimation,
  useSequenceAnimation,
  useAccessibleAnimation,
  useAnimationPerformance
};