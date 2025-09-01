// Enhanced Glassmorphism Theme Utilities

export const glassVariants = {
  subtle: {
    light: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(16px) saturate(150%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    },
    dark: {
      background: 'rgba(30, 41, 59, 0.08)',
      border: 'rgba(148, 163, 184, 0.08)',
      backdropFilter: 'blur(16px) saturate(150%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
  },

  default: {
    light: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    },
    dark: {
      background: 'rgba(30, 41, 59, 0.1)',
      border: 'rgba(148, 163, 184, 0.1)',
      backdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
  },

  elevated: {
    light: {
      background: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(24px) saturate(200%)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    },
    dark: {
      background: 'rgba(30, 41, 59, 0.15)',
      border: 'rgba(148, 163, 184, 0.15)',
      backdropFilter: 'blur(24px) saturate(200%)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
    },
  },

  frosted: {
    light: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(30px) saturate(220%)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
    },
    dark: {
      background: 'rgba(30, 41, 59, 0.2)',
      border: 'rgba(148, 163, 184, 0.2)',
      backdropFilter: 'blur(30px) saturate(220%)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
    },
  },
};

export const getGlassStyles = (variant = 'default', mode = 'light') => {
  const config = glassVariants[variant]?.[mode] || glassVariants.default[mode];

  return {
    background: config.background,
    backdropFilter: config.backdropFilter,
    WebkitBackdropFilter: config.backdropFilter, // Safari support
    border: `1px solid ${config.border}`,
    boxShadow: config.boxShadow,
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',

    // Fallback for browsers without backdrop-filter support
    '@supports not (backdrop-filter: blur(20px))': {
      background:
        mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.9)',
    },
  };
};

export const glassHoverEffects = (mode = 'light', depth = 1) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: `translateY(-${depth * 2}px)`,
    background:
      mode === 'light' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(30, 41, 59, 0.15)',
    borderColor:
      mode === 'light'
        ? 'rgba(255, 255, 255, 0.3)'
        : 'rgba(148, 163, 184, 0.15)',
    boxShadow:
      mode === 'light'
        ? `0 ${8 + depth * 4}px ${32 + depth * 8}px rgba(0, 0, 0, 0.12)`
        : `0 ${8 + depth * 4}px ${32 + depth * 8}px rgba(0, 0, 0, 0.4)`,
  },
});

export const glassGradientBorder = (mode = 'light') => ({
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background:
      mode === 'light'
        ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)'
        : 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.2), transparent)',
    pointerEvents: 'none',
  },
});

// Color-specific glass variants for KPI cards
export const coloredGlassVariants = {
  primary: (mode = 'light') => ({
    background:
      mode === 'light' ? 'rgba(30, 64, 175, 0.08)' : 'rgba(59, 130, 246, 0.1)',
    border:
      mode === 'light' ? 'rgba(30, 64, 175, 0.2)' : 'rgba(59, 130, 246, 0.2)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }),

  success: (mode = 'light') => ({
    background:
      mode === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(52, 211, 153, 0.1)',
    border:
      mode === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(52, 211, 153, 0.2)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }),

  warning: (mode = 'light') => ({
    background:
      mode === 'light' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(251, 191, 36, 0.1)',
    border:
      mode === 'light' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(251, 191, 36, 0.2)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }),

  error: (mode = 'light') => ({
    background:
      mode === 'light' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(248, 113, 113, 0.1)',
    border:
      mode === 'light' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(248, 113, 113, 0.2)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }),

  info: (mode = 'light') => ({
    background:
      mode === 'light' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(96, 165, 250, 0.1)',
    border:
      mode === 'light' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(96, 165, 250, 0.2)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }),
};
