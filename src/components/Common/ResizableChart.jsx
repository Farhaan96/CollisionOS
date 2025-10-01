import React, { useState, useEffect, useCallback } from 'react';
import { Resizable } from 're-resizable';
import { Box, IconButton, Tooltip, Paper, useTheme } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

/**
 * ResizableChart - Wrapper component for making charts resizable with settings
 *
 * @param {string} title - Chart title for identification
 * @param {number} defaultHeight - Default height in pixels (default: 400)
 * @param {string} chartId - Unique ID for localStorage persistence
 * @param {function} onSettingsClick - Callback when settings icon is clicked
 * @param {React.ReactNode} children - Chart component to render
 */
export const ResizableChart = ({
  title,
  defaultHeight = 400,
  chartId,
  onSettingsClick,
  children,
}) => {
  const theme = useTheme();
  const storageKey = `chart-size-${chartId}`;

  // Load saved size from localStorage
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          width: '100%',
          height: parsed.height || defaultHeight,
        };
      }
    } catch (error) {
      console.error('Error loading chart size:', error);
    }
    return {
      width: '100%',
      height: defaultHeight,
    };
  });

  // Save size to localStorage on change
  const handleResizeStop = useCallback(
    (e, direction, ref, delta) => {
      const newHeight = ref.style.height;
      const heightValue = parseInt(newHeight);

      setSize(prev => ({
        ...prev,
        height: heightValue,
      }));

      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ height: heightValue })
        );
      } catch (error) {
        console.error('Error saving chart size:', error);
      }
    },
    [storageKey]
  );

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'relative',
        borderRadius: 2,
        overflow: 'visible',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      {/* Settings Button */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          gap: 1,
        }}
      >
        {onSettingsClick && (
          <Tooltip title="Chart Settings" arrow>
            <IconButton
              size="small"
              onClick={onSettingsClick}
              sx={{
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Resizable Container */}
      <Resizable
        size={size}
        onResizeStop={handleResizeStop}
        minHeight={250}
        maxHeight={800}
        enable={{
          top: false,
          right: false,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: true,
          bottomLeft: true,
          topLeft: false,
        }}
        handleStyles={{
          bottom: {
            bottom: 0,
            height: '10px',
            cursor: 'ns-resize',
            width: '100%',
            background: 'transparent',
          },
          bottomRight: {
            bottom: 0,
            right: 0,
            width: '20px',
            height: '20px',
            cursor: 'nwse-resize',
          },
          bottomLeft: {
            bottom: 0,
            left: 0,
            width: '20px',
            height: '20px',
            cursor: 'nesw-resize',
          },
        }}
        handleComponent={{
          bottomRight: (
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 16,
                height: 16,
                borderRight: `3px solid ${theme.palette.divider}`,
                borderBottom: `3px solid ${theme.palette.divider}`,
                opacity: 0.5,
                transition: 'opacity 0.2s ease-in-out',
                '&:hover': {
                  opacity: 1,
                },
              }}
            />
          ),
        }}
        style={{
          border: `2px dashed transparent`,
          transition: 'border-color 0.2s ease-in-out',
        }}
        handleWrapperStyle={{
          '&:hover': {
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: '100%',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Resizable>

      {/* Resize Indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.75rem',
          color: theme.palette.text.disabled,
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: 'none',
          '.MuiPaper-root:hover &': {
            opacity: 0.7,
          },
        }}
      >
        Drag to resize
      </Box>
    </Paper>
  );
};

export default ResizableChart;
