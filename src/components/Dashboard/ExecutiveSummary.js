import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Avatar,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Badge,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Psychology,
  NotificationsActive,
  Speed,
  AttachMoney,
  Groups,
  EmojiEvents,
  Warning,
  Error,
  CheckCircle,
  AutoAwesome,
  Insights,
  Timeline,
  MenuOpen
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Utils
import { getGlassStyles, glassHoverEffects } from '../../utils/glassTheme';
import { microAnimations, springConfigs } from '../../utils/animations';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const ExecutiveSummary = ({ onTogglePeriod, selectedPeriod = 'daily' }) => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [quickActions, setQuickActions] = useState([]);

  // Mock executive data based on selected period
  const getExecutiveData = () => {
    const baseData = {
      daily: {
        revenue: 15420,
        revenueChange: 12.5,
        jobs: 8,
        jobsChange: -5.2,
        efficiency: 87,
        efficiencyChange: 3.1,
        satisfaction: 94,
        satisfactionChange: 2.8
      },
      weekly: {
        revenue: 87600,
        revenueChange: 8.3,
        jobs: 45,
        jobsChange: 15.7,
        efficiency: 89,
        efficiencyChange: 5.4,
        satisfaction: 96,
        satisfactionChange: 4.2
      },
      monthly: {
        revenue: 342800,
        revenueChange: 18.9,
        jobs: 187,
        jobsChange: 22.1,
        efficiency: 91,
        efficiencyChange: 7.8,
        satisfaction: 97,
        satisfactionChange: 6.5
      }
    };
    return baseData[selectedPeriod] || baseData.daily;
  };

  const executiveData = getExecutiveData();

  // Mock AI insights
  useEffect(() => {
    setAiInsights([
      {
        id: 1,
        type: 'opportunity',
        title: 'Revenue Optimization',
        message: 'Peak productivity hours are 10-2 PM. Consider shifting high-value jobs to these slots.',
        impact: 'High',
        confidence: 92,
        icon: <AttachMoney />
      },
      {
        id: 2,
        type: 'efficiency',
        title: 'Workflow Enhancement',
        message: 'Parts delivery delays account for 23% of cycle time increases. Recommend inventory optimization.',
        impact: 'Medium',
        confidence: 87,
        icon: <Speed />
      },
      {
        id: 3,
        type: 'quality',
        title: 'Quality Metrics',
        message: 'Customer satisfaction correlation with technician experience shows 94% accuracy.',
        impact: 'Low',
        confidence: 95,
        icon: <EmojiEvents />
      }
    ]);

    setAlerts([
      { id: 1, type: 'warning', title: '2 Jobs Approaching Deadline', count: 2 },
      { id: 2, type: 'error', title: 'Parts Delivery Overdue', count: 1 },
      { id: 3, type: 'success', title: 'Quality Targets Met', count: 5 }
    ]);

    setQuickActions([
      { id: 1, title: 'View Production Board', icon: <Timeline />, color: theme.palette.primary.main },
      { id: 2, title: 'Schedule Meeting', icon: <Groups />, color: theme.palette.info.main },
      { id: 3, title: 'Review Analytics', icon: <Assessment />, color: theme.palette.success.main },
      { id: 4, title: 'Generate Report', icon: <MenuOpen />, color: theme.palette.warning.main }
    ]);
  }, [selectedPeriod, theme.palette]);

  const MetricCard = ({ title, value, change, icon, suffix = '', color }) => (
    <motion.div
      variants={microAnimations.slideUp}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      transition={springConfigs.gentle}
    >
      <Card
        sx={{
          p: 2,
          height: '100%',
          ...getGlassStyles('elevated', mode),
          ...glassHoverEffects(mode, 1),
          background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%), ${getGlassStyles('elevated', mode).background}`,
          borderColor: `${color}30`,
          cursor: 'pointer'
        }}
      >
        <CardContent sx={{ p: '0 !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: color,
                width: 40,
                height: 40,
                boxShadow: `0 4px 16px ${color}40`
              }}
            >
              {icon}
            </Avatar>
            {change !== null && (
              <Chip
                icon={change > 0 ? <TrendingUp /> : <TrendingDown />}
                label={`${Math.abs(change)}%`}
                size="small"
                color={change > 0 ? 'success' : 'error'}
                sx={{ 
                  fontSize: '0.75rem',
                  height: 24,
                  backdropFilter: 'blur(10px)',
                  ...getGlassStyles('subtle', mode)
                }}
              />
            )}
          </Box>
          
          <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
            {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}{suffix}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const InsightCard = ({ insight }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          p: 2,
          ...getGlassStyles('subtle', mode),
          borderRadius: 2,
          borderLeft: `4px solid ${
            insight.type === 'opportunity' ? theme.palette.success.main :
            insight.type === 'efficiency' ? theme.palette.info.main :
            theme.palette.warning.main
          }`,
          '&:hover': {
            ...glassHoverEffects(mode, 1)['&:hover'],
            transform: 'translateX(4px)'
          },
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: insight.type === 'opportunity' ? theme.palette.success.main :
                      insight.type === 'efficiency' ? theme.palette.info.main :
                      theme.palette.warning.main,
              width: 32,
              height: 32
            }}
          >
            {insight.icon}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {insight.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {insight.message}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={insight.impact}
                size="small"
                color={
                  insight.impact === 'High' ? 'error' :
                  insight.impact === 'Medium' ? 'warning' : 'success'
                }
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              <Typography variant="caption" color="text.secondary">
                {insight.confidence}% confidence
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Time Controls */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2,
        mb: 3 
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Executive Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time business insights and key performance indicators
          </Typography>
        </Box>
        
        <ButtonGroup size="small" variant="outlined" sx={{ backdropFilter: 'blur(10px)' }}>
          {['daily', 'weekly', 'monthly'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'contained' : 'outlined'}
              onClick={() => onTogglePeriod && onTogglePeriod(period)}
              sx={{
                textTransform: 'capitalize',
                minWidth: 80,
                ...(selectedPeriod === period && {
                  background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)',
                })
              }}
            >
              {period}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue"
            value={executiveData.revenue}
            change={executiveData.revenueChange}
            icon={<AttachMoney />}
            suffix={selectedPeriod === 'daily' ? '' : ''}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Jobs"
            value={executiveData.jobs}
            change={executiveData.jobsChange}
            icon={<Assessment />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Efficiency"
            value={executiveData.efficiency}
            change={executiveData.efficiencyChange}
            icon={<Speed />}
            suffix="%"
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Satisfaction"
            value={executiveData.satisfaction}
            change={executiveData.satisfactionChange}
            icon={<EmojiEvents />}
            suffix="%"
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Content Tabs */}
      <Box sx={{ mb: 3 }}>
        <ButtonGroup variant="text" size="small">
          {[
            { key: 'overview', label: 'Overview', icon: <Assessment /> },
            { key: 'insights', label: 'AI Insights', icon: <Psychology /> },
            { key: 'alerts', label: 'Alerts', icon: <NotificationsActive /> },
            { key: 'actions', label: 'Quick Actions', icon: <AutoAwesome /> }
          ].map((tab) => (
            <Button
              key={tab.key}
              startIcon={tab.icon}
              variant={selectedTab === tab.key ? 'contained' : 'text'}
              onClick={() => setSelectedTab(tab.key)}
              sx={{
                textTransform: 'none',
                fontWeight: selectedTab === tab.key ? 600 : 400,
                ...(selectedTab === tab.key && {
                  background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)',
                })
              }}
            >
              {tab.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ ...getGlassStyles('default', mode), p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Performance Overview
                  </Typography>
                  
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Revenue Growth
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.abs(executiveData.revenueChange) * 4}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(90deg, #10b981, #1e40af)'
                          }
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Operational Efficiency
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={executiveData.efficiency}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          }
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Customer Satisfaction
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={executiveData.satisfaction}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(90deg, #10b981, #059669)'
                          }
                        }}
                      />
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ ...getGlassStyles('default', mode), p: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Key Highlights
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Alert severity="success" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)' }}>
                      Revenue up {executiveData.revenueChange}% vs last period
                    </Alert>
                    <Alert severity="info" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)' }}>
                      {executiveData.jobs} active jobs in pipeline
                    </Alert>
                    <Alert severity="warning" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
                      Efficiency at {executiveData.efficiency}%
                    </Alert>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          )}

          {selectedTab === 'insights' && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Insights />
                AI-Powered Insights
              </Typography>
              
              <Stack spacing={2}>
                {aiInsights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </Stack>
            </Box>
          )}

          {selectedTab === 'alerts' && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                System Alerts & Notifications
              </Typography>
              
              <Grid container spacing={2}>
                {alerts.map((alert) => (
                  <Grid item xs={12} sm={6} md={4} key={alert.id}>
                    <Card sx={{ 
                      ...getGlassStyles('subtle', mode),
                      p: 2,
                      borderLeft: `4px solid ${
                        alert.type === 'error' ? theme.palette.error.main :
                        alert.type === 'warning' ? theme.palette.warning.main :
                        theme.palette.success.main
                      }`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge badgeContent={alert.count} color={alert.type}>
                          {alert.type === 'error' ? <Error color="error" /> :
                           alert.type === 'warning' ? <Warning color="warning" /> :
                           <CheckCircle color="success" />}
                        </Badge>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {alert.title}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {selectedTab === 'actions' && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Quick Actions
              </Typography>
              
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={12} sm={6} md={3} key={action.id}>
                    <Card sx={{ 
                      ...getGlassStyles('subtle', mode),
                      ...glassHoverEffects(mode, 2),
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      height: '100%'
                    }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: action.color,
                          width: 48,
                          height: 48,
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {action.title}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default ExecutiveSummary;