// Toast Component - Premium notification toast with animations, swipe to dismiss, and action buttons
// Executive-level toast notifications with glassmorphism design

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  Button,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircleOutlined,
  ErrorOutlined,
  WarningAmberOutlined,
  InfoOutlined,
  CloseRounded,
  PriorityHighRounded
} from '@mui/icons-material';
import { premiumColors, premiumShadows, premiumBorderRadius, premiumEffects } from '../../theme/premiumDesignSystem';
import { advancedSpringConfigs, microInteractions, statusAnimations } from '../../utils/animations';
import { useGestureAnimation } from '../../hooks/useAnimation';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from './NotificationProvider';

// Toast animation variants
const toastVariants = {
  initial: (position) => {
    const isTop = position.includes('top');
    const isRight = position.includes('right');
    const isLeft = position.includes('left');
    
    return {
      opacity: 0,
      scale: 0.8,
      y: isTop ? -100 : 100,
      x: isRight ? 50 : isLeft ? -50 : 0,
      filter: 'blur(10px)'
    };
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      ...advancedSpringConfigs.executive,
      filter: { duration: 0.3 }
    }
  },
  exit: (position) => {
    const isTop = position.includes('top');
    const isRight = position.includes('right');
    const isLeft = position.includes('left');
    
    return {
      opacity: 0,
      scale: 0.9,
      y: isTop ? -50 : 50,
      x: isRight ? 100 : isLeft ? -100 : 0,
      filter: 'blur(5px)',
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 1, 1]
      }
    };
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: premiumShadows.xl,
    transition: advancedSpringConfigs.responsive
  }
};

// Stack animation for multiple toasts
const stackVariants = {
  animate: (index) => ({
    y: index * -8,
    scale: 1 - (index * 0.02),
    zIndex: 1000 - index,
    transition: advancedSpringConfigs.buttery
  })
};

// Icon components by type
const TypeIcons = {
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircleOutlined,
  [NOTIFICATION_TYPES.ERROR]: ErrorOutlined,
  [NOTIFICATION_TYPES.WARNING]: WarningAmberOutlined,
  [NOTIFICATION_TYPES.INFO]: InfoOutlined,
  [NOTIFICATION_TYPES.CUSTOM]: InfoOutlined
};

// Color schemes by type
const getTypeColors = (type, theme) => {
  const colors = {
    [NOTIFICATION_TYPES.SUCCESS]: {
      background: `linear-gradient(135deg, ${alpha(premiumColors.semantic.success.light, 0.15)} 0%, ${alpha(premiumColors.semantic.success.main, 0.05)} 100%)`,
      border: alpha(premiumColors.semantic.success.main, 0.3),
      icon: premiumColors.semantic.success.main,
      progress: premiumColors.semantic.success.main
    },
    [NOTIFICATION_TYPES.ERROR]: {
      background: `linear-gradient(135deg, ${alpha(premiumColors.semantic.error.light, 0.15)} 0%, ${alpha(premiumColors.semantic.error.main, 0.05)} 100%)`,
      border: alpha(premiumColors.semantic.error.main, 0.3),
      icon: premiumColors.semantic.error.main,
      progress: premiumColors.semantic.error.main
    },
    [NOTIFICATION_TYPES.WARNING]: {
      background: `linear-gradient(135deg, ${alpha(premiumColors.semantic.warning.light, 0.15)} 0%, ${alpha(premiumColors.semantic.warning.main, 0.05)} 100%)`,
      border: alpha(premiumColors.semantic.warning.main, 0.3),
      icon: premiumColors.semantic.warning.main,
      progress: premiumColors.semantic.warning.main
    },
    [NOTIFICATION_TYPES.INFO]: {
      background: `linear-gradient(135deg, ${alpha(premiumColors.semantic.info.light, 0.15)} 0%, ${alpha(premiumColors.semantic.info.main, 0.05)} 100%)`,
      border: alpha(premiumColors.semantic.info.main, 0.3),
      icon: premiumColors.semantic.info.main,
      progress: premiumColors.semantic.info.main
    },
    [NOTIFICATION_TYPES.CUSTOM]: {
      background: `linear-gradient(135deg, ${premiumColors.glass.white[8]} 0%, ${premiumColors.glass.white[15]} 100%)`,
      border: premiumColors.glass.white[20],
      icon: premiumColors.primary[500],
      progress: premiumColors.primary[500]
    }
  };
  
  return colors[type] || colors[NOTIFICATION_TYPES.CUSTOM];
};

// Priority indicators
const getPriorityIndicator = (priority) => {
  const indicators = {
    [NOTIFICATION_PRIORITIES.CRITICAL]: {
      color: premiumColors.semantic.error.main,
      pulse: true,
      label: 'Critical'
    },
    [NOTIFICATION_PRIORITIES.HIGH]: {
      color: premiumColors.semantic.warning.main,
      pulse: false,
      label: 'High'
    },
    [NOTIFICATION_PRIORITIES.NORMAL]: null,
    [NOTIFICATION_PRIORITIES.LOW]: {
      color: premiumColors.neutral[400],
      pulse: false,
      label: 'Low'
    }
  };
  
  return indicators[priority];
};

// Toast Component
const Toast = ({ 
  notification, 
  onDismiss, 
  onAction, 
  index = 0, 
  total = 1, 
  settings = {},
  position = 'top-right' 
}) => {
  const theme = useTheme();
  const timerRef = useRef();
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const pausedTimeRef = useRef(0);
  
  // Gesture handling for swipe to dismiss
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 0.5, 1, 0.5, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);
  const rotate = useTransform(x, [-200, 0, 200], [-5, 0, 5]);

  const {
    type,
    title,
    message,
    duration = 5000,
    actions = [],
    priority = NOTIFICATION_PRIORITIES.NORMAL,
    customIcon,
    avatar,
    count,
    persistent = false,
    showProgress = true,
    allowDismiss = true
  } = notification;

  const colors = getTypeColors(type, theme);
  const priorityIndicator = getPriorityIndicator(priority);
  const IconComponent = TypeIcons[type] || InfoOutlined;
  const shouldShowProgress = showProgress && duration > 0 && !persistent;
  const swipeThreshold = 100;

  // Handle auto-dismiss timer
  useEffect(() => {
    if (duration <= 0 || persistent || isPaused) return;

    const remainingTime = duration - (Date.now() - startTimeRef.current - pausedTimeRef.current);
    
    if (remainingTime <= 0) {
      onDismiss(notification.id);
      return;
    }

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
      const newProgress = Math.max(0, ((duration - elapsed) / duration) * 100);
      
      setProgress(newProgress);
      
      if (newProgress <= 0) {
        onDismiss(notification.id);
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [duration, persistent, isPaused, onDismiss, notification.id]);

  // Handle mouse interactions
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!persistent && settings.pauseOnHover !== false) {
      setIsPaused(true);
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    }
  }, [persistent, settings.pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!persistent && settings.pauseOnHover !== false) {
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
    }
  }, [persistent, settings.pauseOnHover]);

  // Handle swipe gesture
  const handleDragEnd = useCallback((event, info) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      onDismiss(notification.id);
    } else {
      // Snap back
      x.set(0);
    }
  }, [onDismiss, notification.id, x, swipeThreshold]);

  // Handle dismiss
  const handleDismiss = useCallback((event) => {
    event?.stopPropagation();
    onDismiss(notification.id);
  }, [onDismiss, notification.id]);

  // Handle action click
  const handleActionClick = useCallback((action) => (event) => {
    event.stopPropagation();
    
    if (action.handler) {
      action.handler(notification);
    }
    
    if (action.dismissOnClick !== false) {
      onDismiss(notification.id);
    }
    
    if (onAction) {
      onAction(action);
    }
  }, [notification, onDismiss, onAction]);

  return (
    <motion.div
      style={{ x, opacity, scale, rotate }}
      custom={position}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      drag="x"
      dragElastic={0.2}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      layout
    >
      <motion.div
        variants={stackVariants}
        custom={index}
        animate="animate"
        style={{
          pointerEvents: 'auto',
          willChange: 'transform'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            background: colors.background,
            backdropFilter: premiumEffects.backdrop.lg,
            border: `1px solid ${colors.border}`,
            borderRadius: premiumBorderRadius['2xl'],
            boxShadow: `${premiumShadows.lg}, 0 0 0 1px ${alpha(colors.icon, 0.1)}`,
            overflow: 'hidden',
            minWidth: 320,
            maxWidth: 400,
            cursor: allowDismiss ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          role="alert"
          aria-labelledby={`toast-title-${notification.id}`}
          aria-describedby={`toast-message-${notification.id}`}
        >
          {/* Priority Pulse Effect */}
          {priorityIndicator?.pulse && (
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 20px ${alpha(priorityIndicator.color, 0.3)}`,
                  `0 0 30px ${alpha(priorityIndicator.color, 0.6)}`,
                  `0 0 20px ${alpha(priorityIndicator.color, 0.3)}`
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Content */}
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              {/* Icon or Avatar */}
              <Box sx={{ position: 'relative', mt: 0.5 }}>
                {avatar ? (
                  <Box
                    component="img"
                    src={avatar}
                    alt=""
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <motion.div
                    variants={statusAnimations[type] || statusAnimations.info}
                    initial="initial"
                    animate="animate"
                  >
                    {customIcon || (
                      <IconComponent
                        sx={{
                          fontSize: 24,
                          color: colors.icon,
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                        }}
                      />
                    )}
                  </motion.div>
                )}
                
                {/* Count Badge */}
                {count && count > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      minWidth: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: premiumColors.primary[500],
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Box>

              {/* Message Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography
                    id={`toast-title-${notification.id}`}
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: '0.95rem'
                    }}
                  >
                    {title}
                  </Typography>
                  
                  {/* Priority Indicator */}
                  {priorityIndicator && (
                    <Chip
                      label={priorityIndicator.label}
                      size="small"
                      icon={<PriorityHighRounded sx={{ fontSize: '14px !important' }} />}
                      sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        backgroundColor: alpha(priorityIndicator.color, 0.1),
                        color: priorityIndicator.color,
                        border: `1px solid ${alpha(priorityIndicator.color, 0.2)}`,
                        '& .MuiChip-icon': {
                          color: 'inherit'
                        }
                      }}
                    />
                  )}
                </Stack>

                {message && (
                  <Typography
                    id={`toast-message-${notification.id}`}
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}
                  >
                    {message}
                  </Typography>
                )}

                {/* Actions */}
                {actions.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    {actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        size="small"
                        variant={action.variant || 'text'}
                        color={action.color || 'primary'}
                        onClick={handleActionClick(action)}
                        startIcon={action.icon}
                        sx={{
                          minHeight: 28,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          borderRadius: premiumBorderRadius.lg,
                          ...microInteractions.premiumButton
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Dismiss Button */}
              {allowDismiss && (
                <IconButton
                  size="small"
                  onClick={handleDismiss}
                  sx={{
                    color: theme.palette.text.secondary,
                    opacity: isHovered ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.text.primary, 0.05),
                      transform: 'scale(1.1)'
                    }
                  }}
                  aria-label="Dismiss notification"
                >
                  <CloseRounded sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Stack>
          </Box>

          {/* Progress Bar */}
          {shouldShowProgress && (
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 3,
                  backgroundColor: alpha(colors.progress, 0.1),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors.progress,
                    borderRadius: 0,
                    transition: 'transform 0.1s linear'
                  }
                }}
              />
            </Box>
          )}

          {/* Shine Effect */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '100%', opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />
            )}
          </AnimatePresence>
        </Box>
      </motion.div>
    </motion.div>
  );
};

// Memoize for performance
export default React.memo(Toast);