// AlertDialog - Modal alerts for critical actions with executive-level design
// Premium confirmation dialogs with backdrop blur effects and keyboard shortcuts

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Stack,
  Divider,
  Backdrop,
  useTheme,
  alpha,
  Portal,
} from '@mui/material';
import {
  CloseRounded,
  WarningAmberRounded,
  ErrorOutlineRounded,
  InfoOutlined,
  CheckCircleOutlined,
  HelpOutlineRounded,
  SecurityRounded,
  DeleteForeverRounded,
  SaveRounded,
  CancelRounded,
} from '@mui/icons-material';
import {
  premiumColors,
  premiumShadows,
  premiumBorderRadius,
  premiumEffects,
} from '../../theme/premiumDesignSystem';
import {
  advancedSpringConfigs,
  statusAnimations,
  microInteractions,
} from '../../utils/animations';
import { useAnimationState } from '../../hooks/useAnimation';

// Dialog types and their configurations
export const DIALOG_TYPES = {
  CONFIRMATION: 'confirmation',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  SUCCESS: 'success',
  DESTRUCTIVE: 'destructive',
  SECURITY: 'security',
};

// Default configurations by type
const TYPE_CONFIGS = {
  [DIALOG_TYPES.CONFIRMATION]: {
    icon: HelpOutlineRounded,
    color: premiumColors.primary[500],
    gradient: premiumColors.primary.gradient.default,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'primary',
    severity: 'info',
  },
  [DIALOG_TYPES.WARNING]: {
    icon: WarningAmberRounded,
    color: premiumColors.semantic.warning.main,
    gradient: premiumColors.semantic.warning.gradient,
    confirmText: 'Proceed',
    cancelText: 'Cancel',
    confirmColor: 'warning',
    severity: 'warning',
  },
  [DIALOG_TYPES.ERROR]: {
    icon: ErrorOutlineRounded,
    color: premiumColors.semantic.error.main,
    gradient: premiumColors.semantic.error.gradient,
    confirmText: 'OK',
    cancelText: null,
    confirmColor: 'error',
    severity: 'error',
  },
  [DIALOG_TYPES.INFO]: {
    icon: InfoOutlined,
    color: premiumColors.semantic.info.main,
    gradient: premiumColors.semantic.info.gradient,
    confirmText: 'OK',
    cancelText: null,
    confirmColor: 'info',
    severity: 'info',
  },
  [DIALOG_TYPES.SUCCESS]: {
    icon: CheckCircleOutlined,
    color: premiumColors.semantic.success.main,
    gradient: premiumColors.semantic.success.gradient,
    confirmText: 'OK',
    cancelText: null,
    confirmColor: 'success',
    severity: 'success',
  },
  [DIALOG_TYPES.DESTRUCTIVE]: {
    icon: DeleteForeverRounded,
    color: premiumColors.semantic.error.main,
    gradient: premiumColors.semantic.error.gradient,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'error',
    severity: 'error',
  },
  [DIALOG_TYPES.SECURITY]: {
    icon: SecurityRounded,
    color: premiumColors.semantic.warning.main,
    gradient: premiumColors.semantic.warning.gradient,
    confirmText: 'Authorize',
    cancelText: 'Cancel',
    confirmColor: 'warning',
    severity: 'warning',
  },
};

// Animation variants
const dialogVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: advancedSpringConfigs.executive,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    filter: 'blur(5px)',
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: 180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      ...advancedSpringConfigs.premium,
      delay: 0.2,
    },
  },
};

// Custom backdrop component
const CustomBackdrop = ({ open, onClose, blur = true }) => (
  <AnimatePresence>
    {open && (
      <Portal>
        <motion.div
          variants={backdropVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${alpha('#000', 0.4)} 0%, ${alpha('#000', 0.6)} 100%)`,
            backdropFilter: blur ? 'blur(20px) saturate(180%)' : 'none',
            zIndex: 1300,
          }}
        />
      </Portal>
    )}
  </AnimatePresence>
);

// Focus trap hook
const useFocusTrap = (isOpen, containerRef) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = e => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, containerRef]);
};

// Keyboard shortcuts hook
const useKeyboardShortcuts = (
  isOpen,
  onConfirm,
  onCancel,
  disabled = false
) => {
  useEffect(() => {
    if (!isOpen || disabled) return;

    const handleKeyDown = e => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onCancel?.();
          break;
        case 'Enter':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onConfirm?.();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel, disabled]);
};

// AlertDialog Component
const AlertDialog = ({
  open = false,
  onClose,
  onConfirm,
  onCancel,
  type = DIALOG_TYPES.CONFIRMATION,
  title,
  message,
  children,
  confirmText,
  cancelText,
  confirmColor,
  icon: CustomIcon,
  severity,
  maxWidth = 'sm',
  fullWidth = true,
  showCloseButton = true,
  disableKeyboardShortcuts = false,
  disableBackdropClick = false,
  loading = false,
  autoFocus = true,
  customActions,
  gradient,
  blur = true,
  persistent = false,
  ...props
}) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  const config = TYPE_CONFIGS[type] || TYPE_CONFIGS[DIALOG_TYPES.CONFIRMATION];
  const IconComponent = CustomIcon || config.icon;

  // Animation state management
  const { animate: animateIcon, controls: iconControls } =
    useAnimationState('hidden');

  // Focus trap
  useFocusTrap(open, containerRef);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    open,
    onConfirm,
    onCancel || onClose,
    disableKeyboardShortcuts || loading
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    e => {
      if (disableBackdropClick || persistent) return;
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [disableBackdropClick, persistent, onClose]
  );

  // Handle close with animation
  const handleClose = useCallback(async () => {
    if (persistent && !onCancel && !onClose) return;

    setIsClosing(true);

    // Small delay for exit animation
    setTimeout(() => {
      setIsClosing(false);
      (onCancel || onClose)?.();
    }, 200);
  }, [persistent, onCancel, onClose]);

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    if (loading) return;

    try {
      await onConfirm?.();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  }, [onConfirm, loading]);

  // Animate icon when dialog opens
  useEffect(() => {
    if (open) {
      animateIcon('visible');
    }
  }, [open, animateIcon]);

  // Resolved props
  const resolvedConfirmText = confirmText || config.confirmText;
  const resolvedCancelText =
    cancelText !== undefined ? cancelText : config.cancelText;
  const resolvedConfirmColor = confirmColor || config.confirmColor;
  const resolvedGradient = gradient || config.gradient;

  return (
    <>
      <CustomBackdrop
        open={open && !isClosing}
        onClose={disableBackdropClick ? undefined : handleClose}
        blur={blur}
      />

      <AnimatePresence mode='wait'>
        {open && !isClosing && (
          <Portal>
            <motion.div
              variants={dialogVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              onClick={handleBackdropClick}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                zIndex: 1400,
              }}
            >
              <Box
                ref={containerRef}
                onClick={e => e.stopPropagation()}
                sx={{
                  background: `linear-gradient(135deg, ${premiumColors.glass.white[12]} 0%, ${premiumColors.glass.white[8]} 100%)`,
                  backdropFilter: premiumEffects.backdrop.xl,
                  border: `1px solid ${premiumColors.glass.white[20]}`,
                  borderRadius: premiumBorderRadius['3xl'],
                  boxShadow: `${premiumShadows['2xl']}, 0 0 0 1px ${alpha(config.color, 0.1)}`,
                  maxWidth: theme.breakpoints.values[maxWidth],
                  width: fullWidth ? '100%' : 'auto',
                  minWidth: 400,
                  overflow: 'hidden',
                  outline: 'none',
                }}
                {...props}
              >
                {/* Header */}
                <Box sx={{ p: 3, pb: 2 }}>
                  <Stack direction='row' alignItems='flex-start' spacing={2}>
                    {/* Icon */}
                    <motion.div
                      variants={iconVariants}
                      initial='hidden'
                      animate={iconControls}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: resolvedGradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${alpha(config.color, 0.3)}`,
                          mt: 0.5,
                        }}
                      >
                        <IconComponent
                          sx={{
                            fontSize: 24,
                            color: 'white',
                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                          }}
                        />
                      </Box>
                    </motion.div>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction='row'
                        alignItems='center'
                        justifyContent='space-between'
                      >
                        <Typography
                          variant='h6'
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            mb: 1,
                          }}
                        >
                          {title}
                        </Typography>

                        {showCloseButton && !persistent && (
                          <IconButton
                            size='small'
                            onClick={handleClose}
                            disabled={loading}
                            sx={{
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                backgroundColor: alpha(
                                  theme.palette.text.primary,
                                  0.05
                                ),
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <CloseRounded />
                          </IconButton>
                        )}
                      </Stack>

                      {message && (
                        <Typography
                          variant='body2'
                          sx={{
                            color: theme.palette.text.secondary,
                            lineHeight: 1.5,
                          }}
                        >
                          {message}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>

                {/* Custom Content */}
                {children && (
                  <>
                    <Divider sx={{ opacity: 0.1 }} />
                    <Box sx={{ p: 3, py: 2 }}>{children}</Box>
                  </>
                )}

                {/* Actions */}
                {(customActions ||
                  resolvedConfirmText ||
                  resolvedCancelText) && (
                  <>
                    <Divider sx={{ opacity: 0.1 }} />
                    <Box sx={{ p: 3, pt: 2 }}>
                      {customActions || (
                        <Stack
                          direction='row'
                          spacing={2}
                          justifyContent='flex-end'
                        >
                          {resolvedCancelText && (
                            <Button
                              variant='outlined'
                              onClick={handleClose}
                              disabled={loading}
                              startIcon={<CancelRounded />}
                              sx={{
                                minWidth: 100,
                                borderColor: alpha(
                                  theme.palette.text.secondary,
                                  0.3
                                ),
                                color: theme.palette.text.secondary,
                                '&:hover': {
                                  backgroundColor: alpha(
                                    theme.palette.text.secondary,
                                    0.05
                                  ),
                                },
                              }}
                            >
                              {resolvedCancelText}
                            </Button>
                          )}

                          {resolvedConfirmText && (
                            <Button
                              variant='contained'
                              color={resolvedConfirmColor}
                              onClick={handleConfirm}
                              disabled={loading}
                              autoFocus={autoFocus}
                              startIcon={
                                loading ? null : type ===
                                  DIALOG_TYPES.DESTRUCTIVE ? (
                                  <DeleteForeverRounded />
                                ) : (
                                  <SaveRounded />
                                )
                              }
                              sx={{
                                minWidth: 100,
                                background: resolvedGradient,
                                boxShadow: `0 4px 12px ${alpha(config.color, 0.3)}`,
                                '&:hover': {
                                  boxShadow: `0 6px 16px ${alpha(config.color, 0.4)}`,
                                  transform: 'translateY(-1px)',
                                },
                                '&:disabled': {
                                  background: alpha(config.color, 0.3),
                                },
                                ...microInteractions.executiveButton,
                              }}
                            >
                              {resolvedConfirmText}
                            </Button>
                          )}
                        </Stack>
                      )}
                    </Box>
                  </>
                )}

                {/* Keyboard shortcuts hint */}
                {!disableKeyboardShortcuts && (
                  <Box sx={{ px: 3, pb: 2 }}>
                    <Typography
                      variant='caption'
                      sx={{
                        color: theme.palette.text.disabled,
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                      }}
                    >
                      Press ESC to cancel • ⌘+Enter to confirm
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
};

// Convenience methods
AlertDialog.confirm = props => {
  return new Promise((resolve, reject) => {
    const handleConfirm = () => resolve(true);
    const handleCancel = () => resolve(false);

    // This would need to be implemented with a context provider
    // For now, returning the component props
    return {
      ...props,
      type: DIALOG_TYPES.CONFIRMATION,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    };
  });
};

AlertDialog.alert = props => {
  return {
    ...props,
    type: DIALOG_TYPES.INFO,
    cancelText: null,
  };
};

AlertDialog.warning = props => {
  return {
    ...props,
    type: DIALOG_TYPES.WARNING,
  };
};

AlertDialog.error = props => {
  return {
    ...props,
    type: DIALOG_TYPES.ERROR,
    cancelText: null,
  };
};

AlertDialog.destructive = props => {
  return {
    ...props,
    type: DIALOG_TYPES.DESTRUCTIVE,
    persistent: true,
  };
};

// Export types
export { DIALOG_TYPES };
export default AlertDialog;
