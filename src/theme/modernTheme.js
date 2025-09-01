import { createTheme } from '@mui/material/styles';

// Theme module extensions for custom properties
const themeExtensions = theme => ({
  ...theme,
  custom: {
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    },
    glass: {
      surface: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.18)',
      shadow: '0 8px 32px rgba(0,0,0,0.35)',
    },
  },
});

// TypeScript declarations for theme extensions (for IDE support)
// declare module '@mui/material/styles' {
//   interface Theme {
//     custom: {
//       gradients: {
//         primary: string;
//         background: string;
//       };
//       glass: {
//         surface: string;
//         border: string;
//         shadow: string;
//       };
//     };
//   }
//   interface ThemeOptions {
//     custom?: {
//       gradients?: {
//         primary?: string;
//         background?: string;
//       };
//       glass?: {
//         surface?: string;
//         border?: string;
//         shadow?: string;
//       };
//     };
//   }
// }

export const modernTheme = themeExtensions(
  createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#6366F1',
        light: '#818CF8',
        dark: '#4F46E5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#8B5CF6',
        light: '#A78BFA',
        dark: '#7C3AED',
        contrastText: '#ffffff',
      },
      background: {
        default: '#0F172A',
        paper: 'rgba(30,41,59,0.50)',
        surface: 'rgba(15, 23, 42, 0.8)',
        elevated: 'rgba(30, 41, 59, 0.9)',
      },
      text: {
        primary: 'rgba(255, 255, 255, 0.95)',
        secondary: 'rgba(255, 255, 255, 0.75)',
        disabled: 'rgba(255, 255, 255, 0.45)',
      },
      success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
        contrastText: '#ffffff',
      },
      info: {
        main: '#0EA5E9',
        light: '#38BDF8',
        dark: '#0284C7',
        contrastText: '#ffffff',
      },
      divider: 'rgba(255, 255, 255, 0.08)',
      action: {
        active: 'rgba(255, 255, 255, 0.75)',
        hover: 'rgba(255, 255, 255, 0.05)',
        selected: 'rgba(255, 255, 255, 0.08)',
        disabled: 'rgba(255, 255, 255, 0.3)',
        disabledBackground: 'rgba(255, 255, 255, 0.08)',
        focus: 'rgba(255, 255, 255, 0.1)',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        'SF Pro Text',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700 },
      subtitle1: { opacity: 0.9 },
    },
    shape: { borderRadius: 20 },
    shadows: [
      'none',
      '0 8px 24px rgba(0,0,0,0.12)',
      '0 12px 32px rgba(0,0,0,0.16)',
      '0 16px 48px rgba(0,0,0,0.18)',
      ...Array(21).fill('0 16px 48px rgba(0,0,0,0.18)'),
    ],

    components: {
      MuiCssBaseline: {
        styleOverrides: `
        :root { color-scheme: dark; }
        .glassmorphic-card { 
          background: rgba(255,255,255,0.08);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        }
        .no-blur .glassmorphic-card { backdrop-filter: none; -webkit-backdrop-filter: none; }
        .ambient-gradient {
          background-image: radial-gradient( 800px 400px at 0% 0%, rgba(99,102,241,.25), transparent 45%),
                            radial-gradient( 800px 400px at 100% 0%, rgba(139,92,246,.20), transparent 45%),
                            radial-gradient( 1200px 600px at 50% 100%, rgba(236,72,153,.18), transparent 45%);
        }
        @keyframes grow {
          from { width: 0%; }
          to { width: var(--target-width, 100%); }
        }
        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `,
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: 'rgba(30,41,59,0.50)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'saturate(160%) blur(18px)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 14, textTransform: 'none', fontWeight: 600 },
        },
      },
    },
  })
);

export default modernTheme;
