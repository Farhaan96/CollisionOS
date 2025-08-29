import { premiumAnimations } from '../theme/premiumDesignSystem';

// Theme transition utilities for smooth color changes
export class ThemeTransition {
  constructor(options = {}) {
    this.duration = options.duration || 300;
    this.easing = options.easing || premiumAnimations.timing.smooth;
    this.interpolationSteps = options.steps || 60;
    this.isTransitioning = false;
    this.abortController = null;
  }

  // Main theme transition function
  async transition(fromTheme, toTheme, element = document.documentElement) {
    if (this.isTransitioning) {
      this.abort();
    }

    this.isTransitioning = true;
    this.abortController = new AbortController();
    
    try {
      // Prevent flash of unstyled content
      this.preventFOUC(toTheme);
      
      // Extract color values for interpolation
      const fromColors = this.extractThemeColors(fromTheme);
      const toColors = this.extractThemeColors(toTheme);
      
      // Create interpolation frames
      const frames = this.createInterpolationFrames(fromColors, toColors);
      
      // Apply transition CSS
      this.applyTransitionStyles(element);
      
      // Animate through frames
      await this.animateFrames(frames, element);
      
      // Clean up
      this.cleanupTransition(element);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Theme transition error:', error);
      }
    } finally {
      this.isTransitioning = false;
      this.abortController = null;
    }
  }

  // Extract theme colors for interpolation
  extractThemeColors(theme) {
    const colors = {};
    
    if (theme.palette) {
      // Primary colors
      colors.primaryMain = this.hexToRgb(theme.palette.primary.main);
      colors.primaryLight = this.hexToRgb(theme.palette.primary.light);
      colors.primaryDark = this.hexToRgb(theme.palette.primary.dark);
      
      // Secondary colors
      colors.secondaryMain = this.hexToRgb(theme.palette.secondary.main);
      colors.secondaryLight = this.hexToRgb(theme.palette.secondary.light);
      colors.secondaryDark = this.hexToRgb(theme.palette.secondary.dark);
      
      // Background colors
      colors.background = this.parseColor(theme.palette.background.default);
      colors.surface = this.parseColor(theme.palette.background.paper);
      
      // Text colors
      colors.textPrimary = this.parseColor(theme.palette.text.primary);
      colors.textSecondary = this.parseColor(theme.palette.text.secondary);
      
      // Status colors
      colors.success = this.hexToRgb(theme.palette.success.main);
      colors.error = this.hexToRgb(theme.palette.error.main);
      colors.warning = this.hexToRgb(theme.palette.warning.main);
      colors.info = this.hexToRgb(theme.palette.info.main);
    }
    
    // Custom colors from theme extensions
    if (theme.custom) {
      if (theme.custom.glass) {
        colors.glassSurface = this.parseColor(theme.custom.glass.surface);
        colors.glassBorder = this.parseColor(theme.custom.glass.border);
      }
      
      if (theme.custom.text) {
        colors.customTextPrimary = this.parseColor(theme.custom.text.primary);
        colors.customTextSecondary = this.parseColor(theme.custom.text.secondary);
      }
    }
    
    return colors;
  }

  // Create interpolation frames between colors
  createInterpolationFrames(fromColors, toColors) {
    const frames = [];
    
    for (let i = 0; i <= this.interpolationSteps; i++) {
      const progress = i / this.interpolationSteps;
      const easedProgress = this.applyEasing(progress);
      const frame = {};
      
      // Interpolate each color
      Object.keys(fromColors).forEach(key => {
        if (toColors[key]) {
          frame[key] = this.interpolateColor(
            fromColors[key],
            toColors[key],
            easedProgress
          );
        }
      });
      
      frames.push(frame);
    }
    
    return frames;
  }

  // Interpolate between two colors
  interpolateColor(color1, color2, progress) {
    if (!color1 || !color2) return color1 || color2;
    
    const r = Math.round(color1.r + (color2.r - color1.r) * progress);
    const g = Math.round(color1.g + (color2.g - color1.g) * progress);
    const b = Math.round(color1.b + (color2.b - color1.b) * progress);
    const a = color1.a !== undefined && color2.a !== undefined
      ? color1.a + (color2.a - color1.a) * progress
      : color1.a || color2.a || 1;
    
    return { r, g, b, a };
  }

  // Apply easing function to progress
  applyEasing(progress) {
    // Cubic bezier approximation for smooth easing
    const t = progress;
    const t2 = t * t;
    const t3 = t2 * t;
    
    // cubic-bezier(0.25, 0.8, 0.25, 1) approximation
    return 3 * t2 - 2 * t3;
  }

  // Animate through interpolation frames
  async animateFrames(frames, element) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const animate = (currentTime) => {
        if (this.abortController?.signal.aborted) {
          reject(new DOMException('Animation aborted', 'AbortError'));
          return;
        }
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const frameIndex = Math.floor(progress * (frames.length - 1));
        
        // Apply current frame colors
        const frame = frames[frameIndex];
        this.applyFrameColors(frame, element);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  // Apply frame colors to CSS custom properties
  applyFrameColors(frame, element) {
    Object.entries(frame).forEach(([key, color]) => {
      if (color) {
        const cssValue = color.a !== undefined && color.a !== 1
          ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
          : `rgb(${color.r}, ${color.g}, ${color.b})`;
        
        element.style.setProperty(`--theme-transition-${key}`, cssValue);
      }
    });
  }

  // Apply transition CSS styles
  applyTransitionStyles(element) {
    element.classList.add('theme-transitioning');
    
    // Inject transition CSS if not already present
    if (!document.getElementById('theme-transition-styles')) {
      const style = document.createElement('style');
      style.id = 'theme-transition-styles';
      style.textContent = `
        .theme-transitioning {
          --transition-duration: ${this.duration}ms;
          --transition-easing: ${this.easing};
        }
        
        .theme-transitioning *,
        .theme-transitioning *::before,
        .theme-transitioning *::after {
          transition: 
            background-color var(--transition-duration) var(--transition-easing),
            border-color var(--transition-duration) var(--transition-easing),
            color var(--transition-duration) var(--transition-easing),
            box-shadow var(--transition-duration) var(--transition-easing),
            backdrop-filter var(--transition-duration) var(--transition-easing) !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .theme-transitioning *,
          .theme-transitioning *::before,
          .theme-transitioning *::after {
            transition: none !important;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Clean up transition styles
  cleanupTransition(element) {
    element.classList.remove('theme-transitioning');
    
    // Remove transition custom properties
    const styles = element.style;
    for (let i = styles.length - 1; i >= 0; i--) {
      const property = styles[i];
      if (property.startsWith('--theme-transition-')) {
        element.style.removeProperty(property);
      }
    }
  }

  // Prevent flash of unstyled content
  preventFOUC(toTheme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]') ||
      document.createElement('meta');
    
    if (!metaThemeColor.parentNode) {
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    // Update meta theme color immediately
    if (toTheme.palette?.primary?.main) {
      metaThemeColor.content = toTheme.palette.primary.main;
    }
    
    // Update color scheme
    document.documentElement.style.colorScheme = toTheme.palette?.mode || 'light';
  }

  // Abort current transition
  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // Color utility functions
  hexToRgb(hex) {
    if (!hex) return null;
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-character hex codes
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  parseColor(color) {
    if (!color) return null;
    
    // Handle rgba/rgb colors
    const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const values = rgbaMatch[1].split(',').map(v => parseFloat(v.trim()));
      return {
        r: values[0] || 0,
        g: values[1] || 0,
        b: values[2] || 0,
        a: values[3] !== undefined ? values[3] : 1
      };
    }
    
    // Handle hex colors
    if (color.startsWith('#')) {
      return this.hexToRgb(color);
    }
    
    // Handle named colors (basic support)
    const namedColors = {
      white: { r: 255, g: 255, b: 255 },
      black: { r: 0, g: 0, b: 0 },
      transparent: { r: 0, g: 0, b: 0, a: 0 }
    };
    
    return namedColors[color.toLowerCase()] || null;
  }
}

// CSS Variable Management for smooth transitions
export class CSSVariableManager {
  constructor() {
    this.root = document.documentElement;
    this.variables = new Map();
  }

  // Set CSS variable with optional transition
  setVariable(name, value, transition = true) {
    const fullName = name.startsWith('--') ? name : `--${name}`;
    
    if (transition && this.variables.has(fullName)) {
      this.transitionVariable(fullName, this.variables.get(fullName), value);
    } else {
      this.root.style.setProperty(fullName, value);
    }
    
    this.variables.set(fullName, value);
  }

  // Get CSS variable value
  getVariable(name) {
    const fullName = name.startsWith('--') ? name : `--${name}`;
    return getComputedStyle(this.root).getPropertyValue(fullName).trim();
  }

  // Remove CSS variable
  removeVariable(name) {
    const fullName = name.startsWith('--') ? name : `--${name}`;
    this.root.style.removeProperty(fullName);
    this.variables.delete(fullName);
  }

  // Transition between variable values
  transitionVariable(name, fromValue, toValue, duration = 300) {
    // Simple value interpolation for numeric values
    if (this.isNumericValue(fromValue) && this.isNumericValue(toValue)) {
      this.animateNumericVariable(name, fromValue, toValue, duration);
    } else {
      // Instant change for non-numeric values
      this.root.style.setProperty(name, toValue);
    }
  }

  // Check if value is numeric (for interpolation)
  isNumericValue(value) {
    return /^-?\d*\.?\d+/.test(value.toString());
  }

  // Animate numeric CSS variable
  animateNumericVariable(name, from, to, duration) {
    const startTime = performance.now();
    const fromNum = parseFloat(from);
    const toNum = parseFloat(to);
    const unit = from.toString().replace(/^-?\d*\.?\d+/, '') || '';
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeInOutQuad(progress);
      
      const currentValue = fromNum + (toNum - fromNum) * easedProgress;
      this.root.style.setProperty(name, `${currentValue}${unit}`);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  // Easing function for smooth animations
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Batch update multiple variables
  setVariables(variables, transition = true) {
    Object.entries(variables).forEach(([name, value]) => {
      this.setVariable(name, value, transition);
    });
  }

  // Clear all managed variables
  clear() {
    this.variables.forEach((_, name) => {
      this.root.style.removeProperty(name);
    });
    this.variables.clear();
  }
}

// Theme-specific transition presets
export const themeTransitionPresets = {
  instant: {
    duration: 0,
    easing: 'linear'
  },
  
  fast: {
    duration: 150,
    easing: premiumAnimations.timing.easeOut
  },
  
  normal: {
    duration: 300,
    easing: premiumAnimations.timing.smooth
  },
  
  slow: {
    duration: 500,
    easing: premiumAnimations.timing.ease
  },
  
  smooth: {
    duration: 300,
    easing: premiumAnimations.timing.smooth,
    steps: 60
  },
  
  elastic: {
    duration: 400,
    easing: premiumAnimations.timing.elastic,
    steps: 80
  }
};

// Global theme transition instance
export const globalThemeTransition = new ThemeTransition(themeTransitionPresets.smooth);

// Global CSS variable manager instance
export const globalCSSVariables = new CSSVariableManager();

// Helper functions for common operations
export const themeTransitionHelpers = {
  // Quick theme switch with transition
  async switchTheme(fromTheme, toTheme, preset = 'normal') {
    const transitioner = new ThemeTransition(themeTransitionPresets[preset]);
    await transitioner.transition(fromTheme, toTheme);
  },
  
  // Update meta tags for new theme
  updateMetaTags(theme) {
    // Theme color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = theme.palette?.primary?.main || '#6366f1';
    
    // Status bar style for mobile
    let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaStatusBar) {
      metaStatusBar = document.createElement('meta');
      metaStatusBar.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(metaStatusBar);
    }
    metaStatusBar.content = theme.palette?.mode === 'dark' ? 'black-translucent' : 'default';
    
    // Color scheme
    document.documentElement.style.colorScheme = theme.palette?.mode || 'light';
  },
  
  // Preload theme assets
  preloadThemeAssets(theme) {
    // Preload any theme-specific assets like fonts, images, etc.
    if (theme.custom?.assets) {
      theme.custom.assets.forEach(asset => {
        if (asset.type === 'font') {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = asset.url;
          link.as = 'font';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        }
      });
    }
  }
};

export default {
  ThemeTransition,
  CSSVariableManager,
  themeTransitionPresets,
  globalThemeTransition,
  globalCSSVariables,
  themeTransitionHelpers
};