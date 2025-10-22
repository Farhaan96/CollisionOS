import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00897B',
      light: '#4DB6AC',
      dark: '#00695C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
      surface: '#F1F5F9',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F57C00',
      light: '#FF9800',
      dark: '#E65100',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0288D1',
      light: '#03A9F4',
      dark: '#01579B',
      contrastText: '#FFFFFF',
    },
    divider: '#E2E8F0',
  },

  typography: {
    fontFamily: '"Roboto", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2.125rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2.5,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },

  shape: {
    borderRadius: 8,
  },

  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 2px 4px rgba(0,0,0,0.1)',
    '0 4px 8px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
  ],

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default lightTheme;
