import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Stack,
  Grid,
  Badge,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  NotificationsActive,
  Warning,
  Error,
  Info,
  CheckCircle,
  Schedule,
  Inventory,
  Build,
  Person,
  AttachMoney,
  LocalShipping,
  Security,
  BugReport,
  Update,
  MoreVert,
  FilterList,
  Settings,
  Close,
  ExpandMore,
  ExpandLess,
  Snooze,
  Delete,
  MarkAsUnread,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Utils
import { getGlassStyles, glassHoverEffects } from '../../../utils/glassTheme';
import { microAnimations, springConfigs } from '../../../utils/animations';
import { useTheme as useAppTheme } from '../../../contexts/ThemeContext';

const AlertsWidget = ({ expanded = false }) => {
  const theme = useTheme();
  const { mode } = useAppTheme();

  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'critical', 'warning', 'info'
  const [anchorEl, setAnchorEl] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  // Alert configuration
  const alertConfig = {
    critical: {
      icon: <Error />,
      color: theme.palette.error.main,
      bgColor: theme.palette.error.main + '10',
      borderColor: theme.palette.error.main + '30',
      label: 'Critical',
      priority: 1,
    },
    warning: {
      icon: <Warning />,
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.main + '10',
      borderColor: theme.palette.warning.main + '30',
      label: 'Warning',
      priority: 2,
    },
    info: {
      icon: <Info />,
      color: theme.palette.info.main,
      bgColor: theme.palette.info.main + '10',
      borderColor: theme.palette.info.main + '30',
      label: 'Info',
      priority: 3,
    },
    success: {
      icon: <CheckCircle />,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.main + '10',
      borderColor: theme.palette.success.main + '30',
      label: 'Success',
      priority: 4,
    },
  };

  // Alert categories
  const categoryIcons = {
    production: <Build />,
    inventory: <Inventory />,
    schedule: <Schedule />,
    financial: <AttachMoney />,
    shipping: <LocalShipping />,
    staff: <Person />,
    security: <Security />,
    system: <BugReport />,
    update: <Update />,
  };

  useEffect(() => {
    // Generate mock alerts
    const generateAlerts = () => {
      const mockAlerts = [
        {
          id: 1,
          type: 'critical',
          category: 'production',
          title: 'Production Line Bottleneck',
          message:
            'Bay 3 has been idle for 2+ hours. Vehicle JOB-045 requires immediate attention.',
          details:
            'Customer John Smith is waiting for pickup. ETA was 2 hours ago. Technician Mike needs parts approval.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          actionRequired: true,
          jobNumber: 'JOB-045',
          technician: 'Mike Johnson',
          customer: 'John Smith',
        },
        {
          id: 2,
          type: 'warning',
          category: 'inventory',
          title: 'Low Parts Inventory',
          message: '3 critical parts below minimum stock level.',
          details:
            'Bumper covers (2 units), Headlight assembly (1 unit), and Paint primer (500ml) need immediate reordering.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
          actionRequired: true,
          partsNeeded: ['Bumper Cover', 'Headlight Assembly', 'Paint Primer'],
        },
        {
          id: 3,
          type: 'warning',
          category: 'schedule',
          title: 'Schedule Conflict',
          message: 'Double booking detected for Bay 2 tomorrow at 10 AM.',
          details:
            'Both JOB-048 and JOB-052 are scheduled for the same time slot. Please reschedule one appointment.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          actionRequired: true,
          conflictingJobs: ['JOB-048', 'JOB-052'],
        },
        {
          id: 4,
          type: 'info',
          category: 'shipping',
          title: 'Parts Delivery Update',
          message: 'Expected delivery delayed by 1 day.',
          details:
            'Order #PO-2024-156 from AutoParts Plus will arrive tomorrow instead of today due to weather conditions.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          actionRequired: false,
          orderNumber: 'PO-2024-156',
        },
        {
          id: 5,
          type: 'critical',
          category: 'financial',
          title: 'Payment Overdue',
          message: 'Insurance payment 30+ days overdue.',
          details:
            'AllState Insurance claim #CLM-789456 for $4,250 is now 35 days overdue. Follow-up required.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          actionRequired: true,
          amount: 4250,
          insurer: 'AllState Insurance',
          claimNumber: 'CLM-789456',
        },
        {
          id: 6,
          type: 'warning',
          category: 'staff',
          title: 'Technician Overtime Alert',
          message: 'Sarah Chen approaching overtime limit.',
          details:
            'Current week hours: 38/40. Scheduled hours today: 6. Consider adjusting schedule to avoid overtime.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          actionRequired: false,
          employee: 'Sarah Chen',
          hoursThisWeek: 38,
        },
        {
          id: 7,
          type: 'success',
          category: 'production',
          title: 'Quality Check Completed',
          message: 'JOB-043 passed final inspection.',
          details:
            'Vehicle ready for customer pickup. All quality standards met. Customer notification sent.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
          actionRequired: false,
          jobNumber: 'JOB-043',
          qualityScore: 98,
        },
        {
          id: 8,
          type: 'info',
          category: 'system',
          title: 'System Update Available',
          message: 'CollisionOS v2.1.3 ready for installation.',
          details:
            'New features include enhanced reporting, improved scheduling, and bug fixes. Update during off-hours recommended.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          actionRequired: false,
          version: 'v2.1.3',
        },
      ];

      // Sort by priority and timestamp
      mockAlerts.sort((a, b) => {
        const priorityDiff =
          alertConfig[a.type].priority - alertConfig[b.type].priority;
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp - a.timestamp;
      });

      setAlerts(mockAlerts);
    };

    generateAlerts();
  }, [theme.palette]);

  const handleMenuClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDismissAlert = alertId => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleExpandAlert = alertId => {
    setExpandedAlerts(prev => {
      const newExpanded = new Set([...prev]);
      if (newExpanded.has(alertId)) {
        newExpanded.delete(alertId);
      } else {
        newExpanded.add(alertId);
      }
      return newExpanded;
    });
  };

  const getTimeAgo = timestamp => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredAlerts = alerts.filter(alert => {
    const isDismissed = dismissedAlerts.has(alert.id);
    if (!showDismissed && isDismissed) return false;
    if (selectedFilter === 'all') return true;
    return alert.type === selectedFilter;
  });

  const alertCounts = {
    all: alerts.filter(a => !dismissedAlerts.has(a.id)).length,
    critical: alerts.filter(
      a => a.type === 'critical' && !dismissedAlerts.has(a.id)
    ).length,
    warning: alerts.filter(
      a => a.type === 'warning' && !dismissedAlerts.has(a.id)
    ).length,
    info: alerts.filter(a => a.type === 'info' && !dismissedAlerts.has(a.id))
      .length,
  };

  // Alert card component
  const AlertCard = ({ alert }) => {
    const config = alertConfig[alert.type];
    const isExpanded = expandedAlerts.has(alert.id);
    const isDismissed = dismissedAlerts.has(alert.id);

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: isDismissed ? 0.6 : 1,
          x: 0,
          scale: isDismissed ? 0.95 : 1,
        }}
        exit={{ opacity: 0, x: 20, height: 0 }}
        transition={springConfigs.gentle}
        layout
      >
        <Card
          sx={{
            mb: 1,
            ...getGlassStyles('subtle', mode),
            background: `${config.bgColor}, ${getGlassStyles('subtle', mode).background}`,
            borderColor: config.borderColor,
            borderWidth: alert.actionRequired ? 2 : 1,
            borderLeft: `4px solid ${config.color}`,
            position: 'relative',
            overflow: 'visible',
            opacity: isDismissed ? 0.6 : 1,
            transform: isDismissed ? 'scale(0.95)' : 'scale(1)',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <CardContent sx={{ p: 2, pb: isExpanded ? 2 : '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Badge
                badgeContent={alert.actionRequired ? '!' : null}
                color='error'
                overlap='circular'
                invisible={!alert.actionRequired}
              >
                <Avatar
                  sx={{
                    bgcolor: config.color,
                    width: 36,
                    height: 36,
                    boxShadow: `0 4px 12px ${config.color}40`,
                  }}
                >
                  {categoryIcons[alert.category] || config.icon}
                </Avatar>
              </Badge>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant='subtitle2'
                    sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    {alert.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={config.label}
                      size='small'
                      sx={{
                        bgcolor: config.color,
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 18,
                        fontWeight: 600,
                      }}
                    />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {getTimeAgo(alert.timestamp)}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant='body2'
                  sx={{
                    fontSize: '0.85rem',
                    lineHeight: 1.3,
                    color: 'text.secondary',
                    mb: 1,
                  }}
                >
                  {alert.message}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {alert.details && (
                      <Button
                        size='small'
                        startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                        onClick={() => handleExpandAlert(alert.id)}
                        sx={{
                          fontSize: '0.7rem',
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                        }}
                      >
                        {isExpanded ? 'Less' : 'Details'}
                      </Button>
                    )}

                    {alert.actionRequired && (
                      <Chip
                        label='Action Required'
                        size='small'
                        color='warning'
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title='Snooze'>
                      <IconButton size='small' sx={{ color: 'text.secondary' }}>
                        <Snooze sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Dismiss'>
                      <IconButton
                        size='small'
                        onClick={() => handleDismissAlert(alert.id)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <Close sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Collapse in={isExpanded} timeout={300}>
              <Box
                sx={{ mt: 2, pt: 2, borderTop: `1px solid ${config.color}30` }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    fontSize: '0.8rem',
                    lineHeight: 1.4,
                    mb: 2,
                  }}
                >
                  {alert.details}
                </Typography>

                {/* Alert-specific details */}
                {alert.jobNumber && (
                  <Chip
                    label={`Job: ${alert.jobNumber}`}
                    size='small'
                    variant='outlined'
                    sx={{ mr: 1, mb: 1, fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {alert.customer && (
                  <Chip
                    label={`Customer: ${alert.customer}`}
                    size='small'
                    variant='outlined'
                    sx={{ mr: 1, mb: 1, fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {alert.technician && (
                  <Chip
                    label={`Tech: ${alert.technician}`}
                    size='small'
                    variant='outlined'
                    sx={{ mr: 1, mb: 1, fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {alert.amount && (
                  <Chip
                    label={`$${alert.amount.toLocaleString()}`}
                    size='small'
                    variant='outlined'
                    sx={{ mr: 1, mb: 1, fontSize: '0.7rem', height: 20 }}
                  />
                )}

                {alert.actionRequired && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size='small'
                      variant='contained'
                      sx={{
                        bgcolor: config.color,
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 2,
                      }}
                    >
                      Take Action
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      sx={{
                        fontSize: '0.7rem',
                        py: 0.5,
                        px: 2,
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            badgeContent={alertCounts.critical + alertCounts.warning}
            color='error'
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.warning.main,
                width: 40,
                height: 40,
                boxShadow: `0 4px 16px ${theme.palette.warning.main}40`,
              }}
            >
              <NotificationsActive />
            </Avatar>
          </Badge>
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              System Alerts
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {alertCounts.all} active alerts
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Filter Buttons */}
      <Box sx={{ mb: 3 }}>
        <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {[
            { key: 'all', label: 'All', count: alertCounts.all },
            { key: 'critical', label: 'Critical', count: alertCounts.critical },
            { key: 'warning', label: 'Warning', count: alertCounts.warning },
            { key: 'info', label: 'Info', count: alertCounts.info },
          ].map(filter => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? 'contained' : 'outlined'}
              size='small'
              startIcon={
                filter.key !== 'all' ? (
                  alertConfig[filter.key]?.icon
                ) : (
                  <FilterList />
                )
              }
              onClick={() => setSelectedFilter(filter.key)}
              sx={{
                fontSize: '0.75rem',
                px: 2,
                py: 0.5,
                minWidth: 'auto',
                ...(selectedFilter === filter.key &&
                  filter.key !== 'all' && {
                    bgcolor: alertConfig[filter.key]?.color,
                    '&:hover': {
                      bgcolor: alertConfig[filter.key]?.color,
                      opacity: 0.8,
                    },
                  }),
              }}
            >
              {filter.label} {filter.count > 0 && `(${filter.count})`}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Show Dismissed Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={showDismissed}
            onChange={e => setShowDismissed(e.target.checked)}
            size='small'
          />
        }
        label={
          <Typography variant='caption' sx={{ fontSize: '0.75rem' }}>
            Show dismissed alerts
          </Typography>
        }
        sx={{ mb: 2, alignSelf: 'flex-start' }}
      />

      {/* Alerts List */}
      <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
        <AnimatePresence>
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  p: 4,
                  ...getGlassStyles('subtle', mode),
                  textAlign: 'center',
                }}
              >
                <CheckCircle
                  sx={{ fontSize: 48, color: 'success.main', mb: 2 }}
                />
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
                  All Clear!
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  No alerts matching your current filter.
                </Typography>
              </Card>
            </motion.div>
          ) : (
            filteredAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </AnimatePresence>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            ...getGlassStyles('elevated', mode),
            backdropFilter: 'blur(20px)',
            mt: 1,
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Settings sx={{ mr: 2 }} />
          Alert Settings
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <MarkAsUnread sx={{ mr: 2 }} />
          Mark All as Read
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Delete sx={{ mr: 2 }} />
          Clear Dismissed
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AlertsWidget;
