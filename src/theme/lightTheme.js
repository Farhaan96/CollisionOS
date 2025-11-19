import { createTheme } from '@mui/material/styles';
import { premiumColors } from './premiumDesignSystem';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: premiumColors.primary[500], // #6366F1
      light: premiumColors.primary[400], // #818CF8
      dark: premiumColors.primary[600], // #4F46E5
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: premiumColors.secondary[500], // #A855F7
      light: premiumColors.secondary[400], // #C084FC
      dark: premiumColors.secondary[600], // #9333EA
      contrastText: '#FFFFFF',
    },
    background: {
      default: premiumColors.neutral[50], // #FAFAFA
      paper: '#FFFFFF',
      surface: premiumColors.neutral[100], // #F4F4F5
    },
    text: {
      primary: premiumColors.neutral[900], // #18181B
      secondary: premiumColors.neutral[600], // #52525B
    },
    success: {
      main: premiumColors.semantic.success.main, // #22C55E
      light: premiumColors.semantic.success.light, // #DCFCE7
      dark: premiumColors.semantic.success.dark, // #15803D
      contrastText: '#FFFFFF',
    },
    error: {
      main: premiumColors.semantic.error.main, // #EF4444
      light: premiumColors.semantic.error.light, // #FECACA
      dark: premiumColors.semantic.error.dark, // #DC2626
      contrastText: '#FFFFFF',
    },
    warning: {
      main: premiumColors.semantic.warning.main, // #F59E0B
      light: premiumColors.semantic.warning.light, // #FEF3C7
      dark: premiumColors.semantic.warning.dark, // #D97706
      contrastText: '#FFFFFF',
    },
    info: {
      main: premiumColors.semantic.info.main, // #3B82F6
      light: premiumColors.semantic.info.light, // #DBEAFE
      dark: premiumColors.semantic.info.dark, // #1E40AF
      contrastText: '#FFFFFF',
    },
    divider: premiumColors.neutral[200], // #E4E4E7
  },

  typography: {
    fontFamily: '"Inter", "SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
