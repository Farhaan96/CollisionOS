import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

export const ThemeContextProvider = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || (prefersDarkMode ? 'dark' : 'light');
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light theme colors
                primary: {
                  main: '#1e40af',
                  light: '#3b82f6',
                  dark: '#1e3a8a',
                },
                secondary: {
                  main: '#10b981',
                  light: '#34d399',
                  dark: '#059669',
                },
                background: {
                  default: '#f8fafc',
                  paper: 'rgba(255, 255, 255, 0.8)',
                },
                text: {
                  primary: '#1e293b',
                  secondary: '#64748b',
                },
                divider: 'rgba(148, 163, 184, 0.2)',
                glass: {
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                },
              }
            : {
                // Dark theme colors
                primary: {
                  main: '#3b82f6',
                  light: '#60a5fa',
                  dark: '#1d4ed8',
                },
                secondary: {
                  main: '#34d399',
                  light: '#6ee7b7',
                  dark: '#10b981',
                },
                background: {
                  default: '#0f172a',
                  paper: 'rgba(30, 41, 59, 0.8)',
                },
                text: {
                  primary: '#f1f5f9',
                  secondary: '#cbd5e1',
                },
                divider: 'rgba(148, 163, 184, 0.1)',
                glass: {
                  background: 'rgba(30, 41, 59, 0.1)',
                  border: 'rgba(148, 163, 184, 0.1)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                },
              }),
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: ({ theme, ownerState }) => ({
                ...(ownerState?.variant === 'glass' && {
                  background:
                    theme.palette.glass?.background ||
                    'rgba(255, 255, 255, 0.08)',
                  backdropFilter:
                    theme.palette.glass?.backdropFilter ||
                    'blur(20px) saturate(180%)',
                  border: `1px solid ${theme.palette.glass?.border || 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: 16,
                }),
              }),
            },
          },
          MuiCard: {
            styleOverrides: {
              root: ({ theme }) => ({
                '&.glass-card': {
                  background:
                    theme.palette.glass?.background ||
                    'rgba(255, 255, 255, 0.08)',
                  backdropFilter:
                    theme.palette.glass?.backdropFilter ||
                    'blur(20px) saturate(180%)',
                  border: `1px solid ${theme.palette.glass?.border || 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: 16,
                },
              }),
            },
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 700,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        shadows:
          mode === 'light'
            ? [
                'none',
                '0px 2px 4px rgba(0, 0, 0, 0.05)',
                '0px 4px 8px rgba(0, 0, 0, 0.1)',
                '0px 8px 16px rgba(0, 0, 0, 0.1)',
                '0px 12px 24px rgba(0, 0, 0, 0.15)',
                '0px 16px 32px rgba(0, 0, 0, 0.15)',
                '0px 20px 40px rgba(0, 0, 0, 0.2)',
                '0px 24px 48px rgba(0, 0, 0, 0.2)',
                // ... continue with more shadows if needed
              ]
            : [
                'none',
                '0px 2px 4px rgba(0, 0, 0, 0.3)',
                '0px 4px 8px rgba(0, 0, 0, 0.4)',
                '0px 8px 16px rgba(0, 0, 0, 0.4)',
                '0px 12px 24px rgba(0, 0, 0, 0.5)',
                '0px 16px 32px rgba(0, 0, 0, 0.5)',
                '0px 20px 40px rgba(0, 0, 0, 0.6)',
                '0px 24px 48px rgba(0, 0, 0, 0.6)',
                // ... continue with more shadows if needed
              ],
      }),
    [mode]
  );

  const value = {
    mode,
    toggleColorMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
