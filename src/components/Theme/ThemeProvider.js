import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from '../../theme/lightTheme';
import { darkTheme } from '../../theme/darkTheme';

export const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Simplified theme configurations
const themeConfigs = {
  light: {
    name: 'Light',
    description: 'Clean, professional light theme',
  },
  dark: {
    name: 'Dark',
    description: 'Professional dark theme',
  },
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [systemPreference, setSystemPreference] = useState('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('collisionos-theme');

    // Detect system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setCurrentTheme(savedTheme);
    } else {
      // Default to system preference
      setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = e => {
      setSystemPreference(e.matches ? 'dark' : 'light');
      updateMetaThemeColor(currentTheme);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () =>
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [currentTheme]);

  // Update color-scheme for FOUC prevention
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('color-scheme', currentTheme);
  }, [currentTheme]);

  const getThemeObject = themeName => {
    return themeName === 'dark' ? darkTheme : lightTheme;
  };

  const updateMetaThemeColor = themeName => {
    const theme = getThemeObject(themeName);
    const themeColor = theme.palette.primary.main;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
  };

  const switchTheme = newTheme => {
    if (
      newTheme === currentTheme ||
      (newTheme !== 'light' && newTheme !== 'dark')
    )
      return;

    setCurrentTheme(newTheme);
    localStorage.setItem('collisionos-theme', newTheme);
    updateMetaThemeColor(newTheme);
  };

  const toggleTheme = () => {
    switchTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  const contextValue = {
    // Current state
    currentTheme,
    systemPreference,

    // Theme management
    switchTheme,
    toggleTheme,

    // Configuration
    themeConfigs,
    getThemeObject: (theme = currentTheme) => getThemeObject(theme),

    // Utilities
    isSystemDark: systemPreference === 'dark',
    isDarkMode: currentTheme === 'dark',
  };

  const currentThemeObject = getThemeObject(currentTheme);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={currentThemeObject}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
