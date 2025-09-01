import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Fab,
  Badge,
  Tooltip,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { SmartToy as AIIcon, Close as CloseIcon } from '@mui/icons-material';
import AIAssistant from './AIAssistant';

const AIFloatingButton = ({ initialQuery = '' }) => {
  const [open, setOpen] = useState(false);
  const [hasNewSuggestions] = useState(true); // Could be dynamic based on new features
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleToggle = () => {
    setOpen(!open);
  };

  const floatingButton = (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '20px' : '24px',
        right: isMobile ? '20px' : '24px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <Zoom in={true}>
        <Tooltip
          title={open ? 'Close AI Assistant' : 'Ask CollisionOS Assist'}
          placement='left'
        >
          <Fab
            color='primary'
            onClick={handleToggle}
            sx={{
              position: 'relative',
              pointerEvents: 'auto',
              width: 64,
              height: 64,
              background: open
                ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: theme.shadows[8],
              '&:hover': {
                background: open
                  ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                  : 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                transform: 'scale(1.05)',
                boxShadow: theme.shadows[12],
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.2s ease-in-out',
              '& .MuiTouchRipple-root': {
                borderRadius: '50%',
              },
            }}
          >
            <Badge
              variant='dot'
              color='error'
              invisible={!hasNewSuggestions || open}
              sx={{
                '& .MuiBadge-badge': {
                  top: 8,
                  right: 8,
                  minWidth: 12,
                  height: 12,
                  borderRadius: 6,
                },
              }}
            >
              {open ? (
                <CloseIcon sx={{ fontSize: 28, color: 'white' }} />
              ) : (
                <AIIcon sx={{ fontSize: 28, color: 'white' }} />
              )}
            </Badge>
          </Fab>
        </Tooltip>
      </Zoom>
    </div>
  );

  return (
    <>
      {createPortal(floatingButton, document.body)}
      {/* AI Assistant Dialog */}
      <AIAssistant
        open={open}
        onClose={() => setOpen(false)}
        initialQuery={initialQuery}
      />
    </>
  );
};

export default AIFloatingButton;
