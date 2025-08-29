import { useContext, useCallback, useMemo } from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useTheme as useThemeFromContext } from '../contexts/ThemeContext';

// Main theme hook that provides comprehensive theme management
export const useTheme = () => {
  const contextTheme = useThemeFromContext();
  const muiTheme = useMuiTheme();
  const prefersColorScheme = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // All hooks must be called before any conditional logic
  const switchThemeEnhanced = useCallback(async (
    themeName, 
    options = {}
  ) => {
    if (!contextTheme) return;
    const {
      withTransition = true,
      transitionDuration = 300,
      source = 'manual',
      onStart,
      onComplete,
      onError
    } = options;

    try {
      if (onStart) onStart();
      
      if (withTransition && contextTheme.previewTheme) {
        await contextTheme.previewTheme(themeName, transitionDuration);
        await new Promise(resolve => setTimeout(resolve, transitionDuration));
      }
      
      await contextTheme.switchTheme(themeName);
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Theme switching error:', error);
      if (onError) onError(error);
    }
  }, [contextTheme]);

  const themeSystem = useMemo(() => {
    if (!contextTheme) return null;
    
    return {
      currentTheme: contextTheme.currentTheme,
      isDarkMode: contextTheme.isDarkMode,
      isSystemDark: contextTheme.isSystemDark,
      muiTheme,
      switchTheme: contextTheme.switchTheme,
      toggleTheme: contextTheme.toggleTheme,
      themeConfigs: contextTheme.themeConfigs,
      getActiveTheme: contextTheme.getActiveTheme
    };
  }, [contextTheme, muiTheme]);
  
  const toggleThemeEnhanced = useCallback((options = {}) => {
    if (!contextTheme) return;
    const { source = 'manual', ...otherOptions } = options;
    const currentTheme = contextTheme.currentTheme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    return switchThemeEnhanced(newTheme, { source, ...otherOptions });
  }, [contextTheme, switchThemeEnhanced]);

  const themeMetrics = useMemo(() => {
    if (!contextTheme) return {};
    
    return {
      themeHistory: contextTheme.themeHistory || [],
      isTransitioning: contextTheme.isTransitioning || false,
      systemPreference: contextTheme.systemPreference,
      prefersReducedMotion
    };
  }, [contextTheme, prefersReducedMotion]);

  const customThemeManager = useMemo(() => {
    if (!contextTheme) return {};
    
    return {
      customThemes: contextTheme.customThemes || [],
      createCustomTheme: contextTheme.createCustomTheme,
      removeCustomTheme: contextTheme.removeCustomTheme
    };
  }, [contextTheme]);

  const themeScheduling = useMemo(() => {
    if (!contextTheme) return {};
    
    return {
      scheduledTheme: contextTheme.scheduledTheme,
      setThemeSchedule: contextTheme.setThemeSchedule
    };
  }, [contextTheme]);
  
  // Return fallback if no context
  if (!contextTheme) {
    console.warn('useTheme must be used within a ThemeProvider. Using fallback theme context.');
    
    return {
      currentTheme: 'modern',
      muiTheme,
      isDarkMode: muiTheme.palette.mode === 'dark',
      isSystemDark: prefersColorScheme,
      switchTheme: () => console.warn('Theme switching not available without ThemeProvider'),
      toggleTheme: () => console.warn('Theme toggling not available without ThemeProvider'),
      themeConfigs: {},
      getActiveTheme: () => muiTheme.palette.mode || 'light',
      prefersReducedMotion,
      switchThemeEnhanced: () => console.warn('Enhanced theme switching not available without ThemeProvider'),
      toggleThemeEnhanced: () => console.warn('Enhanced theme toggling not available without ThemeProvider'),
      themeMetrics: {},
      customThemeManager: {},
      themeScheduling: {}
    };
  }

  // Return full theme system when context is available
  return {
    ...themeSystem,
    switchThemeEnhanced,
    toggleThemeEnhanced,
    themeMetrics,
    customThemeManager,
    themeScheduling,
    prefersReducedMotion
  };
};

// HOC for theme-aware components
export const withTheme = (Component) => {
  return function ThemedComponent(props) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default useTheme;