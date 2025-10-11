import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976d2',
    secondary: '#f57c00',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    disabled: '#9e9e9e',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 8,
};

export const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#64b5f6',
    secondary: '#ffb74d',
    error: '#ef5350',
    success: '#66bb6a',
    warning: '#fff176',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    disabled: '#616161',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
  roundness: 8,
};
