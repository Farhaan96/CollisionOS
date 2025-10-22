import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#42A5F5',
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#26A69A',
      light: '#4DB6AC',
      dark: '#00897B',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
      surface: '#334155',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#CBD5E1',
    },
    success: {
      main: '#4CAF50',
      light: '#66BB6A',
      dark: '#2E7D32',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF5350',
      light: '#E57373',
      dark: '#D32F2F',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#03A9F4',
      light: '#4FC3F7',
      dark: '#0288D1',
      contrastText: '#FFFFFF',
    },
    divider: '#475569',
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

export default darkTheme;
