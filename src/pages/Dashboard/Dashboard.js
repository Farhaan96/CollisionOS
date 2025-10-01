import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Badge,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  CircularProgress,
} from '@mui/material';
import {
  AttachMoney,
  AccessTime,
  Inventory,
  Schedule,
  StarRate,
  TrendingUp,
  TrendingDown,
  Person,
  DirectionsCar,
  Warning,
  CheckCircle,
  Assignment,
  Assessment,
  Group,
  Business,
  Notifications,
  ShowChart,
  AccountBalance,
  Engineering,
  ArrowForwardIos,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Components
import { CustomerForm } from '../../components/Customer/CustomerForm';
import { KPIChart } from '../../components/Dashboard/KPIChart';
import { ResizableChart, ChartSettingsDialog } from '../../components/Common';

// Hooks
import { useAuth } from '../../contexts/AuthContext';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [chartSettingsOpen, setChartSettingsOpen] = useState(false);
  const [chartSettings, setChartSettings] = useState({
    chartType: 'line',
    colorScheme: 'default',
    showLegend: true,
    animated: true,
    gradient: true,
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);

        // Transform API data to match dashboard structure
        const apiData = response.data;
        const transformedData = {
          // Core Metrics from API
          activeRepairs: {
            count: apiData.activeRepairs?.count || 0,
            breakdown: apiData.activeRepairs?.breakdown || {
              estimate: 0,
              inProgress: 0,
              qualityCheck: 0,
              readyPickup: 0,
              waitingParts: 0,
              insurance: 0,
            },
            trend: 8.5,
          },
          todaysDeliveries: {
            count: apiData.todaysDeliveries || 0,
            completed: 0,
            scheduled: [],
          },
          revenueThisMonth: {
            amount: apiData.monthRevenue || 0,
            trend: 15.2,
            target: 275000,
            lastMonth: 216300,
          },

          // Expanded Metrics
          technicianUtilization: {
            average: apiData.technicianUtilization || 75,
            breakdown: [
              { name: 'Mike Rodriguez', utilization: 94, hours: 7.5, jobs: 3 },
              { name: 'Sarah Chen', utilization: 89, hours: 7.1, jobs: 4 },
              { name: 'James Wilson', utilization: 82, hours: 6.6, jobs: 2 },
              { name: 'Lisa Garcia', utilization: 85, hours: 6.8, jobs: 3 },
            ],
          },

          partsInventory: {
            totalItems: apiData.partsInventory?.total || 0,
            lowStock: apiData.partsInventory?.lowStock || 0,
            onOrder: apiData.partsInventory?.onOrder || 0,
            urgent: [],
          },

          customerSatisfaction: {
            rating: 4.7,
            totalReviews: 89,
            thisMonth: 23,
            breakdown: { excellent: 65, good: 20, fair: 4, poor: 0 },
            recentFeedback: [],
          },

          avgCycleTime: {
            days: 5.8,
            trend: -12.5,
            target: 6.0,
            breakdown: {
              estimate: 0.8,
              parts: 1.2,
              repair: 3.1,
              qc: 0.4,
              delivery: 0.3,
            },
          },

          jobCompletionRate: {
            percentage: 94.2,
            trend: 3.1,
            onTime: 89,
            early: 5,
            late: 6,
          },

          insuranceClaimsStatus: {
            total: 156,
            approved: 142,
            pending: 12,
            denied: 2,
            avgApprovalTime: 3.2,
          },

          dailyCapacity: {
            current: apiData.activeRepairs?.count || 0,
            maximum: 28,
            utilization: apiData.activeRepairs?.count
              ? ((apiData.activeRepairs.count / 28) * 100).toFixed(1)
              : 0,
            forecast: [
              { date: 'Today', capacity: 85.7 },
              { date: 'Tomorrow', capacity: 92.3 },
              { date: 'Wed', capacity: 78.6 },
              { date: 'Thu', capacity: 96.4 },
            ],
          },

          // Real-time Activity Feed from API
          recentActivity: (apiData.recentJobs || []).map(job => ({
            type: 'job_update',
            message: `${job.customerName} - ${job.vehicleInfo}`,
            time: 'Recently',
            priority: 'info',
            customer: job.customerName,
            jobNumber: job.jobNumber,
            value: job.totalAmount,
          })),

          // Alert System (static for now)
          alerts: [
            {
              type: 'critical',
              title: 'Parts Delay Alert',
              message: 'Critical parts for 3 jobs delayed by supplier',
              action: 'Review affected jobs',
              count: 3,
            },
            {
              type: 'warning',
              title: 'Capacity Warning',
              message: 'Shop at 96% capacity tomorrow',
              action: 'Schedule review',
              count: 1,
            },
            {
              type: 'info',
              title: 'Insurance Follow-up',
              message: '5 claims pending approval over 7 days',
              action: 'Contact adjusters',
              count: 5,
            },
          ],
        };

        setDashboardData(transformedData);
        setError(null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message);
        // Fallback to empty data structure
        setDashboardData({
          activeRepairs: { count: 0, breakdown: {}, trend: 0 },
          todaysDeliveries: { count: 0, completed: 0, scheduled: [] },
          revenueThisMonth: { amount: 0, trend: 0, target: 0, lastMonth: 0 },
          technicianUtilization: { average: 0, breakdown: [] },
          partsInventory: { totalItems: 0, lowStock: 0, onOrder: 0, urgent: [] },
          customerSatisfaction: { rating: 0, totalReviews: 0, thisMonth: 0, breakdown: {}, recentFeedback: [] },
          avgCycleTime: { days: 0, trend: 0, target: 0, breakdown: {} },
          jobCompletionRate: { percentage: 0, trend: 0, onTime: 0, early: 0, late: 0 },
          insuranceClaimsStatus: { total: 0, approved: 0, pending: 0, denied: 0, avgApprovalTime: 0 },
          dailyCapacity: { current: 0, maximum: 0, utilization: 0, forecast: [] },
          recentActivity: [],
          alerts: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      setRefreshTime(new Date());
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Navigation handlers for dashboard elements
  const navigateToProduction = (view = '', filter = '') => {
    const params = new URLSearchParams();
    if (view) params.set('view', view);
    if (filter) params.set('filter', filter);
    navigate(`/production${params.toString() ? '?' + params.toString() : ''}`);
  };

  const navigateToReports = (type = '', period = '', metric = '') => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (period) params.set('period', period);
    if (metric) params.set('metric', metric);
    navigate(`/reports${params.toString() ? '?' + params.toString() : ''}`);
  };

  const navigateToParts = (highlight = '', view = '', filter = '') => {
    const params = new URLSearchParams();
    if (highlight) params.set('highlight', highlight);
    if (view) params.set('view', view);
    if (filter) params.set('filter', filter);
    navigate(`/parts${params.toString() ? '?' + params.toString() : ''}`);
  };

  const navigateToTechnicians = (view = '', id = '', metric = '') => {
    const params = new URLSearchParams();
    if (view) params.set('view', view);
    if (id) params.set('id', id);
    if (metric) params.set('metric', metric);
    navigate(`/technician${params.toString() ? '?' + params.toString() : ''}`);
  };

  const navigateToCustomers = (view = '', highlight = '', action = '') => {
    const params = new URLSearchParams();
    if (view) params.set('view', view);
    if (highlight) params.set('highlight', highlight);
    if (action) params.set('action', action);
    navigate(`/customers${params.toString() ? '?' + params.toString() : ''}`);
  };

  const navigateToQuality = (view = '', highlight = '', period = '') => {
    const params = new URLSearchParams();
    if (view) params.set('view', view);
    if (highlight) params.set('highlight', highlight);
    if (period) params.set('period', period);
    navigate(
      `/quality-control${params.toString() ? '?' + params.toString() : ''}`
    );
  };

  // Enhanced metric card component with navigation
  const MetricCard = ({
    title,
    icon,
    value,
    subtitle,
    trend,
    color = '#667eea',
    children,
    onClick,
    navigationHint,
  }) => (
    <Tooltip
      title={
        onClick ? `Click to view ${navigationHint || title.toLowerCase()}` : ''
      }
      arrow
    >
      <Card
        sx={{
          boxShadow:
            '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
          borderRadius: 3,
          height: '100%',
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.2s ease-in-out',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          '&:hover': onClick
            ? {
                transform: 'translateY(-2px)',
                boxShadow:
                  '0 8px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
                borderColor: color,
              }
            : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='flex-start'
            mb={2}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant='body2'
                sx={{
                  color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                  fontWeight: 500,
                  mb: 1,
                }}
              >
                {title}
              </Typography>
              {value && (
                <Typography
                  variant='h4'
                  sx={{
                    color:
                      theme.palette.mode === 'dark' ? '#F3F4F6' : '#111827',
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  {value}
                </Typography>
              )}
              {subtitle && (
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  backgroundColor: `${color}15`,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.cloneElement(icon, {
                  sx: { color, fontSize: 24 },
                })}
              </Box>
              {onClick && (
                <Box
                  sx={{
                    opacity: 0.6,
                    transition: 'opacity 0.2s ease-in-out',
                    '.MuiCard-root:hover &': {
                      opacity: 1,
                    },
                  }}
                >
                  <ArrowForwardIos
                    sx={{ color: theme.palette.text.secondary, fontSize: 16 }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {trend && (
            <Box display='flex' alignItems='center' mt={2}>
              {trend > 0 ? (
                <TrendingUp sx={{ color: '#10B981', fontSize: 18, mr: 0.5 }} />
              ) : (
                <TrendingDown
                  sx={{ color: '#EF4444', fontSize: 18, mr: 0.5 }}
                />
              )}
              <Typography
                variant='caption'
                sx={{
                  color: trend > 0 ? '#10B981' : '#EF4444',
                  fontWeight: 600,
                }}
              >
                {Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'}
              </Typography>
            </Box>
          )}

          {children}
        </CardContent>
      </Card>
    </Tooltip>
  );

  // Activity Feed Item Component with navigation
  const ActivityItem = ({ activity }) => {
    const getActivityIcon = type => {
      switch (type) {
        case 'job_completed':
          return <CheckCircle sx={{ color: '#10B981' }} />;
        case 'parts_arrived':
          return <Inventory sx={{ color: '#3B82F6' }} />;
        case 'quality_issue':
          return <Warning sx={{ color: '#F59E0B' }} />;
        case 'customer_pickup':
          return <Person sx={{ color: '#8B5CF6' }} />;
        case 'estimate_approved':
          return <AccountBalance sx={{ color: '#10B981' }} />;
        default:
          return <Notifications sx={{ color: '#6B7280' }} />;
      }
    };

    const getPriorityColor = priority => {
      switch (priority) {
        case 'critical':
          return '#EF4444';
        case 'warning':
          return '#F59E0B';
        case 'success':
          return '#10B981';
        case 'info':
          return '#3B82F6';
        default:
          return '#6B7280';
      }
    };

    const handleActivityClick = () => {
      switch (activity.type) {
        case 'job_completed':
          if (activity.jobNumber) {
            navigateToProduction(
              'job-details',
              `highlight=${activity.jobNumber}`
            );
          } else {
            navigateToProduction('completed-jobs');
          }
          break;
        case 'parts_arrived':
          navigateToParts('recent-arrivals', 'inventory');
          break;
        case 'quality_issue':
          navigateToQuality('issues', 'current');
          break;
        case 'customer_pickup':
          if (activity.customer) {
            navigateToCustomers('pickup-schedule', activity.customer, 'pickup');
          } else {
            navigateToCustomers('pickup-schedule');
          }
          break;
        case 'estimate_approved':
          navigateToReports('estimates', 'approved');
          break;
        default:
          break;
      }
    };

    return (
      <ListItem
        sx={{
          px: 0,
          py: 1,
          cursor: 'pointer',
          borderRadius: 1,
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
        onClick={handleActivityClick}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: `${getPriorityColor(activity.priority)}15`,
            }}
          >
            {getActivityIcon(activity.type)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              {activity.message}
            </Typography>
          }
          secondary={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography
                variant='caption'
                sx={{ color: 'text.secondary' }}
                component='span'
              >
                {activity.time}
              </Typography>
              {activity.value && (
                <Chip
                  label={`$${activity.value.toLocaleString()}`}
                  size='small'
                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                />
              )}
            </div>
          }
        />
        <ArrowForwardIos
          sx={{
            color: theme.palette.text.disabled,
            fontSize: 14,
            opacity: 0.6,
            ml: 1,
          }}
        />
      </ListItem>
    );
  };

  // Loading state
  if (loading && !dashboardData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: theme.palette.mode === 'dark' ? '#0f1419' : '#f8fafc',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state with fallback
  if (error && !dashboardData) {
    return (
      <Box
        sx={{
          p: 3,
          minHeight: '100vh',
          bgcolor: theme.palette.mode === 'dark' ? '#0f1419' : '#f8fafc',
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard data. Using fallback mode.
        </Alert>
      </Box>
    );
  }

  // Ensure we have data to display
  if (!dashboardData) return null;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: theme.palette.mode === 'dark' ? '#0f1419' : '#f8fafc',
        minHeight: '100vh',
      }}
    >
      {/* Error Alert if data failed but we have fallback */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Using cached data. Unable to refresh: {error}
        </Alert>
      )}

      {/* Header with Real-time Indicator */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant='h4'
              component='h1'
              sx={{
                fontWeight: 700,
                mb: 1,
                color: theme.palette.mode === 'dark' ? '#F3F4F6' : '#111827',
              }}
            >
              Auto Body Shop Dashboard
            </Typography>
            <Typography
              variant='body1'
              sx={{
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
              }}
            >
              Welcome back, {user?.firstName || 'Manager'}. Here's your
              collision repair operation overview.
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  animation: 'pulse 2s infinite',
                }}
              />
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                Live Updates
              </Typography>
            </Box>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Last updated: {refreshTime.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>

        {/* Alert Banner with Navigation */}
        {dashboardData.alerts.length > 0 && (
          <Alert
            severity={
              dashboardData.alerts[0].type === 'critical'
                ? 'error'
                : dashboardData.alerts[0].type
            }
            sx={{
              mb: 3,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              },
            }}
            onClick={() => {
              const alert = dashboardData.alerts[0];
              switch (alert.type) {
                case 'critical':
                  if (alert.title.includes('Parts')) {
                    navigateToParts('delayed', '', 'urgent');
                  }
                  break;
                case 'warning':
                  if (alert.title.includes('Capacity')) {
                    navigateToProduction('capacity', 'alert');
                  }
                  break;
                case 'info':
                  if (alert.title.includes('Insurance')) {
                    navigateToCustomers('insurance', '', 'follow-up');
                  }
                  break;
                default:
                  break;
              }
            }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={dashboardData.alerts.length} color='error'>
                  <IconButton size='small'>
                    <Notifications />
                  </IconButton>
                </Badge>
                <ArrowForwardIos sx={{ fontSize: 16, opacity: 0.7 }} />
              </Box>
            }
          >
            <strong>{dashboardData.alerts[0].title}</strong> -{' '}
            {dashboardData.alerts[0].message}
          </Alert>
        )}
      </Box>

      {/* Comprehensive Metrics Grid - 12+ KPIs */}
      <Grid container spacing={3}>
        {/* Row 1: Core Operations */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Active Repairs'
            icon={<DirectionsCar />}
            value={dashboardData.activeRepairs.count}
            subtitle={`${dashboardData.activeRepairs.breakdown.inProgress} in progress`}
            trend={dashboardData.activeRepairs.trend}
            color='#667eea'
            onClick={() => navigateToProduction('active-repairs', 'status=all')}
            navigationHint='production board with active repairs'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Today's Deliveries"
            icon={<Schedule />}
            value={`${dashboardData.todaysDeliveries.completed}/${dashboardData.todaysDeliveries.count}`}
            subtitle={`${dashboardData.todaysDeliveries.count - dashboardData.todaysDeliveries.completed} remaining`}
            color='#10B981'
            onClick={() =>
              navigateToProduction('ready-for-pickup', 'filter=today')
            }
            navigationHint="today's delivery schedule"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Monthly Revenue'
            icon={<AttachMoney />}
            value={`$${Math.round(dashboardData.revenueThisMonth.amount / 1000)}K`}
            subtitle={`Target: $${Math.round(dashboardData.revenueThisMonth.target / 1000)}K`}
            trend={dashboardData.revenueThisMonth.trend}
            color='#F59E0B'
            onClick={() => navigateToReports('revenue', 'period=monthly')}
            navigationHint='revenue analytics and reports'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Parts Inventory'
            icon={<Inventory />}
            value={dashboardData.partsInventory.totalItems}
            subtitle={`${dashboardData.partsInventory.lowStock} low stock`}
            color='#EF4444'
            onClick={() => navigateToParts('low-stock', 'view=inventory')}
            navigationHint='parts inventory with low stock alerts'
          />
        </Grid>

        {/* Row 2: Performance Metrics */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Technician Utilization'
            icon={<Engineering />}
            value={`${dashboardData.technicianUtilization.average}%`}
            subtitle='4 technicians active'
            trend={5.2}
            color='#8B5CF6'
            onClick={() =>
              navigateToTechnicians('performance', '', 'utilization')
            }
            navigationHint='technician performance analytics'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Average Cycle Time'
            icon={<AccessTime />}
            value={`${dashboardData.avgCycleTime.days} days`}
            subtitle={`Target: ${dashboardData.avgCycleTime.target} days`}
            trend={dashboardData.avgCycleTime.trend}
            color='#06B6D4'
            onClick={() =>
              navigateToReports('cycle-time', '', 'view=analytics')
            }
            navigationHint='cycle time analytics and reports'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Job Completion Rate'
            icon={<Assignment />}
            value={`${dashboardData.jobCompletionRate.percentage}%`}
            subtitle={`${dashboardData.jobCompletionRate.onTime}% on-time`}
            trend={dashboardData.jobCompletionRate.trend}
            color='#10B981'
            onClick={() =>
              navigateToProduction('completion-stats', 'period=current')
            }
            navigationHint='job completion statistics'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Customer Satisfaction'
            icon={<StarRate />}
            value={`${dashboardData.customerSatisfaction.rating}/5.0`}
            subtitle={`${dashboardData.customerSatisfaction.thisMonth} reviews this month`}
            color='#F59E0B'
            onClick={() =>
              navigateToCustomers('satisfaction', '', 'period=recent')
            }
            navigationHint='customer satisfaction reports'
          />
        </Grid>

        {/* Row 3: Business Intelligence */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Insurance Claims'
            icon={<AccountBalance />}
            value={dashboardData.insuranceClaimsStatus.approved}
            subtitle={`${dashboardData.insuranceClaimsStatus.pending} pending`}
            color='#3B82F6'
            onClick={() => navigateToReports('insurance', 'status=all')}
            navigationHint='insurance claims management'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Shop Capacity'
            icon={<Business />}
            value={`${dashboardData.dailyCapacity.current}/${dashboardData.dailyCapacity.maximum}`}
            subtitle={`${dashboardData.dailyCapacity.utilization}% utilized`}
            color='#EC4899'
            onClick={() => navigateToProduction('capacity', 'forecast=true')}
            navigationHint='capacity planning and forecasting'
          >
            <LinearProgress
              variant='determinate'
              value={dashboardData.dailyCapacity.utilization}
              sx={{
                mt: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(236, 72, 153, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#EC4899',
                },
              }}
            />
          </MetricCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Quality Score'
            icon={<Assessment />}
            value='96.8%'
            subtitle='No quality issues today'
            color='#10B981'
            onClick={() => navigateToQuality('metrics', '', 'period=current')}
            navigationHint='quality control metrics'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title='Average Ticket'
            icon={<ShowChart />}
            value='$3,247'
            subtitle='15% above target'
            trend={15.3}
            color='#7C3AED'
            onClick={() =>
              navigateToReports('financial', '', 'metric=average-ticket')
            }
            navigationHint='financial analytics'
          />
        </Grid>

        {/* Row 4: Activity Feed and Technician Performance */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow:
                '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
              height: 400,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'between',
                mb: 2,
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ShowChart sx={{ color: '#667eea' }} />
                Real-time Activity Feed
              </Typography>
              <Chip
                label='Live'
                size='small'
                sx={{
                  bgcolor: '#10B981',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
            <List sx={{ maxHeight: 320, overflow: 'auto' }}>
              {dashboardData.recentActivity.map((activity, index) => (
                <Box key={index}>
                  <ActivityItem activity={activity} />
                  {index < dashboardData.recentActivity.length - 1 && (
                    <Divider variant='inset' component='li' />
                  )}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow:
                '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
              height: 400,
            }}
          >
            <Typography
              variant='h6'
              sx={{
                fontWeight: 600,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Group sx={{ color: '#667eea' }} />
              Technician Performance
            </Typography>
            {dashboardData.technicianUtilization.breakdown.map(
              (tech, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 3,
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => {
                    const techSlug = tech.name
                      .toLowerCase()
                      .replace(/\s+/g, '-');
                    navigateToTechnicians('performance', techSlug);
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: '#667eea' }}
                      >
                        {tech.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </Avatar>
                      <Box>
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                          {tech.name}
                        </Typography>
                        <Typography
                          variant='caption'
                          sx={{ color: 'text.secondary' }}
                        >
                          {tech.hours}h worked • {tech.jobs} jobs
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 600, color: '#667eea' }}
                      >
                        {tech.utilization}%
                      </Typography>
                      <ArrowForwardIos
                        sx={{
                          color: theme.palette.text.disabled,
                          fontSize: 12,
                          opacity: 0.6,
                        }}
                      />
                    </Box>
                  </Box>
                  <LinearProgress
                    variant='determinate'
                    value={tech.utilization}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#667eea',
                      },
                    }}
                  />
                </Box>
              )
            )}
          </Paper>
        </Grid>

        {/* Revenue Trend Chart - Resizable Demo */}
        <Grid size={{ xs: 12 }}>
          <ResizableChart
            title="Monthly Revenue Trend"
            defaultHeight={350}
            chartId="dashboard-revenue-chart"
            onSettingsClick={() => setChartSettingsOpen(true)}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Revenue Performance
            </Typography>
            <KPIChart
              data={[
                { label: 'Jan', value: 95000 },
                { label: 'Feb', value: 108000 },
                { label: 'Mar', value: 112000 },
                { label: 'Apr', value: 125000 },
                { label: 'May', value: 119000 },
                { label: 'Jun', value: 135000 },
                { label: 'Jul', value: 142000 },
                { label: 'Aug', value: 138000 },
                { label: 'Sep', value: 155000 },
                { label: 'Oct', value: dashboardData.revenueThisMonth.amount },
              ]}
              type={chartSettings.chartType}
              height={250}
              title="Monthly Revenue"
              currency={true}
              animated={chartSettings.animated}
              gradient={chartSettings.gradient}
              colors={[theme.palette.success.main]}
            />
          </ResizableChart>
        </Grid>
      </Grid>

      {/* Chart Settings Dialog */}
      <ChartSettingsDialog
        open={chartSettingsOpen}
        onClose={() => setChartSettingsOpen(false)}
        chartId="dashboard-revenue-chart"
        defaultSettings={chartSettings}
        onSettingsChange={(newSettings) => {
          setChartSettings(newSettings);
          setChartSettingsOpen(false);
        }}
      />

      {/* Floating Action Button for Quick Actions */}
      <SpeedDial
        ariaLabel='Quick Actions'
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        <SpeedDialAction
          key='new-customer'
          icon={<Person />}
          tooltipTitle='New Customer'
          onClick={() => {
            setSpeedDialOpen(false);
            setCustomerFormOpen(true);
          }}
        />
        <SpeedDialAction
          key='new-job'
          icon={<Assignment />}
          tooltipTitle='New Job'
          onClick={() => {
            setSpeedDialOpen(false);
            navigate('/jobs/new');
          }}
        />
        <SpeedDialAction
          key='new-estimate'
          icon={<Assessment />}
          tooltipTitle='New Estimate'
          onClick={() => {
            setSpeedDialOpen(false);
            navigate('/estimates/new');
          }}
        />
      </SpeedDial>

      {/* Customer Form Dialog */}
      <CustomerForm
        open={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        onSave={customer => {
          console.log('Customer saved:', customer);
          setCustomerFormOpen(false);
        }}
      />
    </Box>
  );
};

export default Dashboard;
