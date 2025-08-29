import React, { useContext } from 'react';
import {
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material';
import { ThemeContext } from './ThemeProvider';

export const ThemeSwitcher = ({ variant = 'icon', size = 'medium', showShortcut = false }) => {
  const { currentTheme, toggleTheme } = useContext(ThemeContext);
  const isDarkMode = currentTheme === 'dark';

  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode${showShortcut ? ' (Cmd+Shift+L)' : ''}`}>
      <IconButton 
        onClick={handleToggle}
        color="inherit"
        size={size}
        sx={{ ml: variant === 'compact' ? 0 : 1 }}
        aria-label="toggle theme"
      >
        {isDarkMode ? <LightIcon /> : <DarkIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeSwitcher;