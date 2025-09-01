import React from 'react';
import { IconButton, Tooltip, useTheme as useMUITheme } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const MotionIconButton = motion(IconButton);

const ThemeToggle = ({ size = 'medium', sx = {} }) => {
  const { mode, toggleColorMode } = useTheme();
  const muiTheme = useMUITheme();

  const isDark = mode === 'dark';

  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <MotionIconButton
        onClick={toggleColorMode}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: muiTheme.palette.text.primary,
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.15)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
          ...sx,
        }}
        size={size}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{
          rotate: isDark ? 0 : 180,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 10,
        }}
      >
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DarkMode />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LightMode />
        </motion.div>
      </MotionIconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
