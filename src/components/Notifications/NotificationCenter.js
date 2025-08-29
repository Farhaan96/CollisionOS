// NotificationCenter - Dropdown panel with comprehensive notification management
// Executive-level notification center with advanced filtering, search, and bulk actions

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Divider,
  Badge,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  ClickAwayListener,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  NotificationsRounded,
  SearchRounded,
  FilterListRounded,
  MoreVertRounded,
  CheckRounded,
  DeleteRounded,
  MarkAsUnreadRounded,
  ClearAllRounded,
  SettingsRounded,
  CheckCircleOutlined,
  ErrorOutlined,
  WarningAmberOutlined,
  InfoOutlined,
  CloseRounded,
  ExpandMoreRounded,
  ExpandLessRounded,
  StarRounded,
  StarBorderRounded,
  HistoryRounded,
  DoNotDisturbRounded,
  NotificationsOffRounded
} from '@mui/icons-material';
import { premiumColors, premiumShadows, premiumBorderRadius, premiumEffects } from '../../theme/premiumDesignSystem';
import { advancedSpringConfigs, scrollAnimations, containerAnimations } from '../../utils/animations';
import { useScrollAnimation } from '../../hooks/useAnimation';
import { useNotification, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from './NotificationProvider';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

// Animation variants
const centerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    filter: 'blur(5px)'
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: advancedSpringConfigs.executive
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -5,
    filter: 'blur(3px)',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1]
    }
  }
};

const listItemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: advancedSpringConfigs.responsive
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    scale: 1.01,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transition: advancedSpringConfigs.snappy
  }
};

// Filter types
const FILTER_TYPES = {
  ALL: 'all',
  UNREAD: 'unread',
  READ: 'read',
  STARRED: 'starred',
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week'
};

const NOTIFICATION_FILTERS = {
  TYPE: 'type',
  PRIORITY: 'priority',
  TIME: 'time',
  STATUS: 'status'
};

// Icon components
const TypeIcons = {
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircleOutlined,
  [NOTIFICATION_TYPES.ERROR]: ErrorOutlined,
  [NOTIFICATION_TYPES.WARNING]: WarningAmberOutlined,
  [NOTIFICATION_TYPES.INFO]: InfoOutlined,
  [NOTIFICATION_TYPES.CUSTOM]: InfoOutlined
};

// Notification grouping helpers
const groupNotificationsByDate = (notifications) => {
  const groups = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.timestamp);
    let groupKey;
    
    if (isToday(date)) {
      groupKey = 'Today';
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday';
    } else {
      groupKey = format(date, 'MMMM d, yyyy');
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });
  
  return groups;
};

// Time formatting helper
const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDistanceToNow(date, { addSuffix: true });
  }
};

// NotificationCenter Component
const NotificationCenter = ({ 
  anchorEl, 
  open, 
  onClose, 
  maxHeight = 600,
  width = 420,
  showSettings = true 
}) => {
  const theme = useTheme();
  const {
    notifications,
    history,
    unreadCount,
    settings,
    doNotDisturb,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    clearHistory,
    setDoNotDisturb
  } = useNotification();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(FILTER_TYPES.ALL);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set(['Today']));

  const scrollRef = useRef(null);

  // Animation hooks
  const { ref: animationRef, controls } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: false
  });

  // Get combined notifications (active + history based on toggle)
  const allNotifications = useMemo(() => {
    const active = notifications.map(n => ({ ...n, isHistory: false }));
    const historyItems = showHistory ? history.map(n => ({ ...n, isHistory: true })) : [];
    return [...active, ...historyItems].sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications, history, showHistory]);

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = allNotifications;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title?.toLowerCase().includes(query) ||
        notification.message?.toLowerCase().includes(query)
      );
    }

    // Apply type/status filters
    switch (selectedFilter) {
      case FILTER_TYPES.UNREAD:
        filtered = filtered.filter(n => !n.read);
        break;
      case FILTER_TYPES.READ:
        filtered = filtered.filter(n => n.read);
        break;
      case FILTER_TYPES.STARRED:
        filtered = filtered.filter(n => n.starred);
        break;
      case FILTER_TYPES.TODAY:
        filtered = filtered.filter(n => isToday(new Date(n.timestamp)));
        break;
      case FILTER_TYPES.YESTERDAY:
        filtered = filtered.filter(n => isYesterday(new Date(n.timestamp)));
        break;
      case FILTER_TYPES.THIS_WEEK:
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(n => n.timestamp > weekAgo);
        break;
      default:
        break;
    }

    return filtered;
  }, [allNotifications, searchQuery, selectedFilter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    if (!notification.read && !notification.isHistory) {
      markAsRead(notification.id);
    }
    
    // Execute notification action if exists
    if (notification.onClick) {
      notification.onClick(notification);
    }
  }, [markAsRead]);

  // Handle selection
  const handleSelectNotification = useCallback((id, checked) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Handle bulk actions
  const handleBulkMarkAsRead = useCallback(() => {
    selectedNotifications.forEach(id => {
      const notification = allNotifications.find(n => n.id === id);
      if (notification && !notification.read) {
        markAsRead(id);
      }
    });
    setSelectedNotifications(new Set());
  }, [selectedNotifications, allNotifications, markAsRead]);

  const handleBulkDelete = useCallback(() => {
    selectedNotifications.forEach(id => {
      removeNotification(id);
    });
    setSelectedNotifications(new Set());
  }, [selectedNotifications, removeNotification]);

  // Handle group expand/collapse
  const toggleGroupExpanded = useCallback((groupKey) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Get filter badge count
  const getFilterBadgeCount = useCallback((filter) => {
    switch (filter) {
      case FILTER_TYPES.UNREAD:
        return allNotifications.filter(n => !n.read).length;
      case FILTER_TYPES.TODAY:
        return allNotifications.filter(n => isToday(new Date(n.timestamp))).length;
      default:
        return null;
    }
  }, [allNotifications]);

  // Clear selections when closing
  useEffect(() => {
    if (!open) {
      setSelectedNotifications(new Set());
      setSearchQuery('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Fade in={open}>
        <motion.div
          ref={animationRef}
          variants={centerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            top: anchorEl?.getBoundingClientRect().bottom + 8 || '60px',
            right: anchorEl?.getBoundingClientRect().right - width || '24px',
            width,
            maxHeight,
            zIndex: theme.zIndex.modal
          }}
        >
          <Paper
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${premiumColors.glass.white[8]} 0%, ${premiumColors.glass.white[12]} 100%)`,
              backdropFilter: premiumEffects.backdrop.xl,
              border: `1px solid ${premiumColors.glass.white[20]}`,
              borderRadius: premiumBorderRadius['2xl'],
              boxShadow: `${premiumShadows.xl}, 0 0 0 1px ${alpha(premiumColors.primary[500], 0.1)}`,
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${premiumColors.glass.white[15]}` }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <NotificationsRounded sx={{ color: premiumColors.primary[500] }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      size="small"
                      sx={{
                        backgroundColor: premiumColors.primary[500],
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        minWidth: 20,
                        height: 20
                      }}
                    />
                  )}
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {/* Do Not Disturb Toggle */}
                  <Tooltip title={doNotDisturb.enabled ? "Disable Do Not Disturb" : "Enable Do Not Disturb"}>
                    <IconButton
                      size="small"
                      onClick={() => setDoNotDisturb(!doNotDisturb.enabled)}
                      sx={{
                        color: doNotDisturb.enabled ? premiumColors.semantic.warning.main : 'inherit'
                      }}
                    >
                      {doNotDisturb.enabled ? <DoNotDisturbRounded /> : <NotificationsOffRounded />}
                    </IconButton>
                  </Tooltip>

                  {/* More Actions */}
                  <IconButton
                    size="small"
                    onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                  >
                    <MoreVertRounded />
                  </IconButton>

                  {/* Close */}
                  <IconButton size="small" onClick={onClose}>
                    <CloseRounded />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Search and Filters */}
              <Stack spacing={1.5}>
                <TextField
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      backgroundColor: alpha(premiumColors.glass.white[10], 0.5),
                      borderRadius: premiumBorderRadius.lg,
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: `1px solid ${premiumColors.glass.white[15]}`
                      }
                    }
                  }}
                />

                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {/* Filter Chips */}
                  {[
                    { key: FILTER_TYPES.ALL, label: 'All' },
                    { key: FILTER_TYPES.UNREAD, label: 'Unread' },
                    { key: FILTER_TYPES.TODAY, label: 'Today' },
                    { key: FILTER_TYPES.THIS_WEEK, label: 'This Week' }
                  ].map(filter => {
                    const badgeCount = getFilterBadgeCount(filter.key);
                    return (
                      <Chip
                        key={filter.key}
                        label={
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <span>{filter.label}</span>
                            {badgeCount && (
                              <span style={{
                                backgroundColor: premiumColors.primary[500],
                                color: 'white',
                                borderRadius: '50%',
                                minWidth: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}>
                                {badgeCount}
                              </span>
                            )}
                          </Stack>
                        }
                        size="small"
                        clickable
                        onClick={() => setSelectedFilter(filter.key)}
                        variant={selectedFilter === filter.key ? 'filled' : 'outlined'}
                        sx={{
                          backgroundColor: selectedFilter === filter.key ? 
                            premiumColors.primary[500] : 'transparent',
                          color: selectedFilter === filter.key ? 'white' : 'inherit',
                          borderColor: premiumColors.glass.white[20],
                          '&:hover': {
                            backgroundColor: selectedFilter === filter.key ? 
                              premiumColors.primary[600] : premiumColors.glass.white[10]
                          }
                        }}
                      />
                    );
                  })}

                  {/* History Toggle */}
                  <Chip
                    icon={<HistoryRounded />}
                    label="History"
                    size="small"
                    clickable
                    onClick={() => setShowHistory(!showHistory)}
                    variant={showHistory ? 'filled' : 'outlined'}
                    sx={{
                      backgroundColor: showHistory ? premiumColors.secondary[500] : 'transparent',
                      color: showHistory ? 'white' : 'inherit',
                      borderColor: premiumColors.glass.white[20]
                    }}
                  />
                </Stack>

                {/* Bulk Actions */}
                {selectedNotifications.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={advancedSpringConfigs.responsive}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{
                      p: 1,
                      backgroundColor: alpha(premiumColors.primary[100], 0.1),
                      borderRadius: premiumBorderRadius.md,
                      border: `1px solid ${alpha(premiumColors.primary[300], 0.2)}`
                    }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {selectedNotifications.size} selected
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<CheckRounded />}
                        onClick={handleBulkMarkAsRead}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Mark as Read
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteRounded />}
                        onClick={handleBulkDelete}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </motion.div>
                )}
              </Stack>
            </Box>

            {/* Notification List */}
            <Box 
              ref={scrollRef}
              sx={{ 
                flex: 1, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: 6
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(premiumColors.neutral[200], 0.1)
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(premiumColors.neutral[400], 0.3),
                  borderRadius: 3,
                  '&:hover': {
                    background: alpha(premiumColors.neutral[400], 0.5)
                  }
                }
              }}
            >
              {Object.keys(groupedNotifications).length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <NotificationsRounded 
                    sx={{ 
                      fontSize: 48, 
                      color: 'text.disabled',
                      mb: 1 
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'No notifications found' : 'No notifications'}
                  </Typography>
                </Box>
              ) : (
                <motion.div
                  variants={containerAnimations.executiveStagger}
                  initial="hidden"
                  animate={controls}
                >
                  {Object.entries(groupedNotifications).map(([groupKey, notifications]) => (
                    <Box key={groupKey} sx={{ mb: 1 }}>
                      {/* Group Header */}
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: alpha(premiumColors.glass.white[5], 0.5)
                          }
                        }}
                        onClick={() => toggleGroupExpanded(groupKey)}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 600, 
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {groupKey} ({notifications.length})
                        </Typography>
                        {expandedGroups.has(groupKey) ? (
                          <ExpandLessRounded sx={{ fontSize: 16, color: 'text.secondary' }} />
                        ) : (
                          <ExpandMoreRounded sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                      </Box>

                      {/* Group Notifications */}
                      <AnimatePresence>
                        {expandedGroups.has(groupKey) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={advancedSpringConfigs.buttery}
                          >
                            <List disablePadding>
                              <AnimatePresence>
                                {notifications.map((notification, index) => {
                                  const IconComponent = TypeIcons[notification.type] || InfoOutlined;
                                  const isSelected = selectedNotifications.has(notification.id);

                                  return (
                                    <motion.div
                                      key={notification.id}
                                      variants={listItemVariants}
                                      initial="hidden"
                                      animate="visible"
                                      exit="exit"
                                      whileHover="hover"
                                      custom={index}
                                    >
                                      <ListItem
                                        sx={{
                                          px: 2,
                                          py: 1.5,
                                          cursor: 'pointer',
                                          backgroundColor: !notification.read && !notification.isHistory ? 
                                            alpha(premiumColors.primary[50], 0.1) : 'transparent',
                                          borderLeft: !notification.read && !notification.isHistory ? 
                                            `3px solid ${premiumColors.primary[500]}` : '3px solid transparent',
                                          opacity: notification.isHistory ? 0.7 : 1,
                                          '&:hover': {
                                            backgroundColor: alpha(premiumColors.glass.white[10], 0.5)
                                          }
                                        }}
                                        onClick={() => handleNotificationClick(notification)}
                                      >
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              checked={isSelected}
                                              onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                                              onClick={(e) => e.stopPropagation()}
                                              size="small"
                                            />
                                          }
                                          label=""
                                          sx={{ mr: 1, minWidth: 'auto' }}
                                        />

                                        <ListItemAvatar>
                                          {notification.avatar ? (
                                            <Avatar
                                              src={notification.avatar}
                                              sx={{ width: 32, height: 32 }}
                                            />
                                          ) : (
                                            <Avatar
                                              sx={{
                                                width: 32,
                                                height: 32,
                                                backgroundColor: alpha(
                                                  premiumColors.semantic[notification.type]?.main || premiumColors.primary[500],
                                                  0.1
                                                )
                                              }}
                                            >
                                              <IconComponent 
                                                sx={{ 
                                                  fontSize: 18,
                                                  color: premiumColors.semantic[notification.type]?.main || premiumColors.primary[500]
                                                }} 
                                              />
                                            </Avatar>
                                          )}
                                          
                                          {/* Count Badge */}
                                          {notification.count && notification.count > 1 && (
                                            <Box
                                              sx={{
                                                position: 'absolute',
                                                top: -4,
                                                right: -4,
                                                minWidth: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                backgroundColor: premiumColors.primary[500],
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                              }}
                                            >
                                              {notification.count}
                                            </Box>
                                          )}
                                        </ListItemAvatar>

                                        <ListItemText
                                          primary={
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: !notification.read && !notification.isHistory ? 600 : 400,
                                                color: 'text.primary'
                                              }}
                                            >
                                              {notification.title}
                                            </Typography>
                                          }
                                          secondary={
                                            <Stack spacing={0.5}>
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: 'text.secondary',
                                                  lineHeight: 1.3,
                                                  display: '-webkit-box',
                                                  WebkitLineClamp: 2,
                                                  WebkitBoxOrient: 'vertical',
                                                  overflow: 'hidden'
                                                }}
                                              >
                                                {notification.message}
                                              </Typography>
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: 'text.disabled',
                                                  fontSize: '0.7rem'
                                                }}
                                              >
                                                {formatNotificationTime(notification.timestamp)}
                                              </Typography>
                                            </Stack>
                                          }
                                        />

                                        <ListItemSecondaryAction>
                                          <Stack alignItems="center" spacing={0.5}>
                                            {notification.priority === NOTIFICATION_PRIORITIES.CRITICAL && (
                                              <Box
                                                sx={{
                                                  width: 8,
                                                  height: 8,
                                                  borderRadius: '50%',
                                                  backgroundColor: premiumColors.semantic.error.main
                                                }}
                                              />
                                            )}
                                            {notification.starred && (
                                              <StarRounded
                                                sx={{
                                                  fontSize: 14,
                                                  color: premiumColors.semantic.warning.main
                                                }}
                                              />
                                            )}
                                          </Stack>
                                        </ListItemSecondaryAction>
                                      </ListItem>
                                      <Divider sx={{ opacity: 0.1 }} />
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </List>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  ))}
                </motion.div>
              )}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: `1px solid ${premiumColors.glass.white[15]}` }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  sx={{ flex: 1 }}
                >
                  Mark All Read
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                  sx={{ flex: 1 }}
                >
                  Clear All
                </Button>
              </Stack>
            </Box>
          </Paper>

          {/* More Actions Menu */}
          <Menu
            anchorEl={moreMenuAnchor}
            open={Boolean(moreMenuAnchor)}
            onClose={() => setMoreMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { clearHistory(); setMoreMenuAnchor(null); }}>
              <ClearAllRounded sx={{ mr: 1 }} />
              Clear History
            </MenuItem>
            {showSettings && (
              <MenuItem onClick={() => { setMoreMenuAnchor(null); /* Open settings */ }}>
                <SettingsRounded sx={{ mr: 1 }} />
                Settings
              </MenuItem>
            )}
          </Menu>
        </motion.div>
      </Fade>
    </ClickAwayListener>
  );
};

export default NotificationCenter;