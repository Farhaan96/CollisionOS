// Premium Design System Foundation
// Executive-level design tokens for CollisionOS

// Advanced Color System with semantic meanings and gradients
export const premiumColors = {
  // Primary Brand Colors with extended palette
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main brand color
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
    gradient: {
      default: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      vivid: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      subtle:
        'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
      radial: 'radial-gradient(circle at top left, #6366F1, #8B5CF6, #EC4899)',
    },
  },

  // Secondary Brand Colors
  secondary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  },

  // Semantic Colors for status and feedback
  semantic: {
    success: {
      light: '#DCFCE7',
      main: '#22C55E',
      dark: '#15803D',
      gradient: 'linear-gradient(135deg, #10B981 0%, #22C55E 100%)',
    },
    warning: {
      light: '#FEF3C7',
      main: '#F59E0B',
      dark: '#D97706',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
    },
    error: {
      light: '#FECACA',
      main: '#EF4444',
      dark: '#DC2626',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
    },
    info: {
      light: '#DBEAFE',
      main: '#3B82F6',
      dark: '#1E40AF',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)',
    },
  },

  // Neutral Colors for backgrounds and text
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Glass morphism specific colors
  glass: {
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      8: 'rgba(255, 255, 255, 0.08)',
      10: 'rgba(255, 255, 255, 0.10)',
      15: 'rgba(255, 255, 255, 0.15)',
      20: 'rgba(255, 255, 255, 0.20)',
      30: 'rgba(255, 255, 255, 0.30)',
    },
    dark: {
      5: 'rgba(0, 0, 0, 0.05)',
      10: 'rgba(0, 0, 0, 0.10)',
      20: 'rgba(0, 0, 0, 0.20)',
      40: 'rgba(0, 0, 0, 0.40)',
      60: 'rgba(0, 0, 0, 0.60)',
    },
  },
};

// Premium Typography System
export const premiumTypography = {
  // Font Families
  fontFamily: {
    display: "'Inter Display', 'SF Pro Display', system-ui, sans-serif",
    body: "'Inter', 'SF Pro Text', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  },

  // Font Sizes with fluid scaling
  fontSize: {
    xs: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)',
    sm: 'clamp(0.875rem, 0.8rem + 0.3vw, 0.9375rem)',
    base: 'clamp(1rem, 0.95rem + 0.2vw, 1.0625rem)',
    lg: 'clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)',
    xl: 'clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)',
    '2xl': 'clamp(1.5rem, 1.35rem + 0.6vw, 1.875rem)',
    '3xl': 'clamp(1.875rem, 1.65rem + 0.9vw, 2.25rem)',
    '4xl': 'clamp(2.25rem, 1.95rem + 1.2vw, 3rem)',
    '5xl': 'clamp(3rem, 2.5rem + 2vw, 3.75rem)',
    '6xl': 'clamp(3.75rem, 3rem + 3vw, 4.5rem)',
    '7xl': 'clamp(4.5rem, 3.5rem + 4vw, 6rem)',
  },

  // Font Weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line Heights
  lineHeight: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Styles (Pre-composed)
  styles: {
    display: {
      fontSize: 'clamp(3rem, 2.5rem + 2vw, 4.5rem)',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.025em',
    },
    hero: {
      fontSize: 'clamp(2.25rem, 1.95rem + 1.2vw, 3.5rem)',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    title: {
      fontSize: 'clamp(1.875rem, 1.65rem + 0.9vw, 2.25rem)',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    subtitle: {
      fontSize: 'clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body: {
      fontSize: 'clamp(1rem, 0.95rem + 0.2vw, 1.0625rem)',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    caption: {
      fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 0.9375rem)',
      fontWeight: 400,
      lineHeight: 1.5,
      opacity: 0.8,
    },
    overline: {
      fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
};

// Premium Spacing System (based on 8px grid)
export const premiumSpacing = {
  0: '0',
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
};

// Premium Shadow System
export const premiumShadows = {
  // Elevation shadows
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Glass morphism shadows
  glass: {
    soft: '0 8px 32px rgba(0, 0, 0, 0.08)',
    medium: '0 8px 32px rgba(0, 0, 0, 0.12)',
    strong: '0 8px 32px rgba(0, 0, 0, 0.2)',
    elevated: '0 16px 48px rgba(0, 0, 0, 0.15)',
  },

  // Colored shadows for branding
  colored: {
    primary: '0 10px 40px -10px rgba(99, 102, 241, 0.35)',
    secondary: '0 10px 40px -10px rgba(168, 85, 247, 0.35)',
    success: '0 10px 40px -10px rgba(34, 197, 94, 0.35)',
    warning: '0 10px 40px -10px rgba(245, 158, 11, 0.35)',
    error: '0 10px 40px -10px rgba(239, 68, 68, 0.35)',
  },

  // Inner shadows
  inner: {
    sm: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    lg: 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },

  // Premium glow effects
  glow: {
    primary: '0 0 20px rgba(99, 102, 241, 0.5)',
    secondary: '0 0 20px rgba(168, 85, 247, 0.5)',
    success: '0 0 20px rgba(34, 197, 94, 0.5)',
    warning: '0 0 20px rgba(245, 158, 11, 0.5)',
    error: '0 0 20px rgba(239, 68, 68, 0.5)',
  },
};

// Premium Border Radius System
export const premiumBorderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
};

// Premium Animation System
export const premiumAnimations = {
  // Timing Functions
  timing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  },

  // Duration presets
  duration: {
    instant: '75ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Pre-defined transitions
  transitions: {
    all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors:
      'background-color, border-color, color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Keyframe animations
  keyframes: {
    fadeIn: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
    fadeOut: {
      '0%': { opacity: 1 },
      '100%': { opacity: 0 },
    },
    slideIn: {
      '0%': { transform: 'translateY(20px)', opacity: 0 },
      '100%': { transform: 'translateY(0)', opacity: 1 },
    },
    slideUp: {
      '0%': { transform: 'translateY(100%)' },
      '100%': { transform: 'translateY(0)' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.95)', opacity: 0 },
      '100%': { transform: 'scale(1)', opacity: 1 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    glow: {
      '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
      '50%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.8)' },
    },
  },
};

// Premium Blur and Filter Effects
export const premiumEffects = {
  blur: {
    none: 'blur(0)',
    sm: 'blur(4px)',
    md: 'blur(12px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)',
    '2xl': 'blur(40px)',
    '3xl': 'blur(64px)',
  },

  backdrop: {
    none: 'none',
    sm: 'blur(4px) saturate(150%)',
    md: 'blur(12px) saturate(180%)',
    lg: 'blur(16px) saturate(180%)',
    xl: 'blur(24px) saturate(200%)',
    '2xl': 'blur(40px) saturate(200%)',
  },

  brightness: {
    0: 'brightness(0)',
    50: 'brightness(0.5)',
    75: 'brightness(0.75)',
    90: 'brightness(0.9)',
    95: 'brightness(0.95)',
    100: 'brightness(1)',
    105: 'brightness(1.05)',
    110: 'brightness(1.1)',
    125: 'brightness(1.25)',
    150: 'brightness(1.5)',
    200: 'brightness(2)',
  },

  contrast: {
    0: 'contrast(0)',
    50: 'contrast(0.5)',
    75: 'contrast(0.75)',
    100: 'contrast(1)',
    125: 'contrast(1.25)',
    150: 'contrast(1.5)',
    200: 'contrast(2)',
  },

  saturate: {
    0: 'saturate(0)',
    50: 'saturate(0.5)',
    100: 'saturate(1)',
    150: 'saturate(1.5)',
    200: 'saturate(2)',
  },
};

// Premium Z-Index System
export const premiumZIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
  max: 9999,
};

// Premium Breakpoints for responsive design
export const premiumBreakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  '4xl': '2560px',
};

// Export the complete design system
export const premiumDesignSystem = {
  colors: premiumColors,
  typography: premiumTypography,
  spacing: premiumSpacing,
  shadows: premiumShadows,
  borderRadius: premiumBorderRadius,
  animations: premiumAnimations,
  effects: premiumEffects,
  zIndex: premiumZIndex,
  breakpoints: premiumBreakpoints,
};

export default premiumDesignSystem;
