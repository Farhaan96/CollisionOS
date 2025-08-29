import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60A5FA',
      light: '#93C5FD',
      dark: '#3B82F6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#9CA3AF',
      light: '#D1D5DB',
      dark: '#6B7280',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#111827',
      paper: '#1F2937',
      surface: '#1F2937',
    },
    text: {
      primary: '#F3F4F6',
      secondary: '#9CA3AF',
    },
    success: {
      main: '#34D399',
      light: '#6EE7B7',
      dark: '#10B981',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F87171',
      light: '#FCA5A5',
      dark: '#EF4444',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FCD34D',
      light: '#FDE68A',
      dark: '#F59E0B',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#60A5FA',
      light: '#93C5FD',
      dark: '#3B82F6',
      contrastText: '#FFFFFF',
    },
    divider: '#374151',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "SF Pro Display", sans-serif',
    h1: { 
      fontSize: '2rem', 
      fontWeight: 600, 
      lineHeight: 1.2 
    },
    h2: { 
      fontSize: '1.75rem', 
      fontWeight: 600, 
      lineHeight: 1.3 
    },
    h3: { 
      fontSize: '1.5rem', 
      fontWeight: 600, 
      lineHeight: 1.4 
    },
    h4: { 
      fontSize: '1.25rem', 
      fontWeight: 600, 
      lineHeight: 1.4 
    },
    h5: { 
      fontSize: '1.125rem', 
      fontWeight: 600, 
      lineHeight: 1.5 
    },
    h6: { 
      fontSize: '1rem', 
      fontWeight: 600, 
      lineHeight: 1.5 
    },
    body1: { 
      fontSize: '1rem', 
      lineHeight: 1.6 
    },
    body2: { 
      fontSize: '0.875rem', 
      lineHeight: 1.6 
    },
    button: { 
      textTransform: 'none' 
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
    '0 8px 16px rgba(0,0,0,0.1)'
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