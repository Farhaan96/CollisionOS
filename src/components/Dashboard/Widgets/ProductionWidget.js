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
  LinearProgress,
  Stack,
  Grid,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Engineering,
  Assignment,
  Build,
  CheckCircle,
  LocalShipping,
  Timeline,
  Speed,
  TrendingUp,
  TrendingDown,
  MoreVert,
  Visibility,
  Schedule,
  Warning,
  ErrorOutline
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// Utils
import { getGlassStyles, glassHoverEffects } from '../../../utils/glassTheme';
import { microAnimations, springConfigs } from '../../../utils/animations';
import { useTheme as useAppTheme } from '../../../contexts/ThemeContext';

const ProductionWidget = ({ period = 'daily', expanded = false }) => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  
  const [selectedView, setSelectedView] = useState('status'); // 'status', 'flow', 'efficiency'
  const [anchorEl, setAnchorEl] = useState(null);
  const [productionData, setProductionData] = useState({});
  const [flowData, setFlowData] = useState([]);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState({});

  // Production status configuration
  const statusConfig = {
    estimate: { 
      label: 'Estimate', 
      icon: <Assignment />, 
      color: theme.palette.info.main,
      description: 'Awaiting estimate approval'
    },
    scheduled: { 
      label: 'Scheduled', 
      icon: <Schedule />, 
      color: theme.palette.warning.main,
      description: 'Scheduled for production'
    },
    in_progress: { 
      label: 'In Progress', 
      icon: <Engineering />, 
      color: theme.palette.primary.main,
      description: 'Currently being worked on'
    },
    quality_check: { 
      label: 'Quality Check', 
      icon: <CheckCircle />, 
      color: theme.palette.secondary.main,
      description: 'Under quality inspection'
    },
    ready_pickup: { 
      label: 'Ready for Pickup', 
      icon: <LocalShipping />, 
      color: theme.palette.success.main,
      description: 'Completed and ready'
    },
    on_hold: { 
      label: 'On Hold', 
      icon: <Warning />, 
      color: theme.palette.error.main,
      description: 'Waiting for parts/approval'
    }
  };

  useEffect(() => {
    // Generate mock production data
    const generateProductionData = () => {
      const statuses = Object.keys(statusConfig);
      const data = {};
      let totalJobs = 0;

      statuses.forEach(status => {
        const count = Math.floor(Math.random() * 15) + 1;
        data[status] = {
          current: count,
          previous: Math.floor(Math.random() * 15) + 1,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          change: (Math.random() * 20).toFixed(1),
          avgDuration: Math.floor(Math.random() * 5) + 1, // days
          bottlenecks: Math.floor(Math.random() * 3)
        };
        totalJobs += count;
      });

      data.total = totalJobs;
      setProductionData(data);

      // Flow data for throughput chart
      const flowData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          completed: Math.floor(Math.random() * 8) + 2,
          started: Math.floor(Math.random() * 10) + 3,
          onTime: Math.floor(Math.random() * 6) + 1,
          delayed: Math.floor(Math.random() * 3)
        };
      });
      setFlowData(flowData);

      // Efficiency metrics
      setEfficiencyMetrics({
        throughput: Math.floor(Math.random() * 20) + 15, // jobs per week
        avgCycleTime: (Math.random() * 3 + 2).toFixed(1), // days
        onTimeDelivery: Math.floor(Math.random() * 20) + 80, // percentage
        utilization: Math.floor(Math.random() * 20) + 75, // percentage
        bottleneckReduction: (Math.random() * 10 + 5).toFixed(1) // percentage improvement
      });
    };

    generateProductionData();
  }, [period, theme.palette]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = (status) => {
    console.log(`Viewing details for ${status} jobs`);
  };

  // Status card component
  const StatusCard = ({ status, data, config }) => {
    const isIncreasing = data.trend === 'up';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springConfigs.gentle}
        whileHover={{ y: -2 }}
      >
        <Card
          onClick={() => handleViewDetails(status)}
          sx={{
            height: '100%',
            cursor: 'pointer',
            ...getGlassStyles('subtle', mode),
            ...glassHoverEffects(mode, 1),
            background: `linear-gradient(135deg, ${config.color}08 0%, ${config.color}03 100%), ${getGlassStyles('subtle', mode).background}`,
            borderColor: `${config.color}30`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: config.color,
                  width: 36,
                  height: 36,
                  boxShadow: `0 4px 12px ${config.color}40`
                }}
              >
                {config.icon}
              </Avatar>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isIncreasing ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
                )}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isIncreasing ? 'success.main' : 'error.main',
                    fontWeight: 600
                  }}
                >
                  {data.change}%
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {data.current}
            </Typography>
            
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              {config.label}
            </Typography>
            
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {config.description}
            </Typography>

            {data.bottlenecks > 0 && (
              <Tooltip title={`${data.bottlenecks} bottleneck(s) detected`}>
                <Chip
                  icon={<ErrorOutline />}
                  label={data.bottlenecks}
                  size="small"
                  color="warning"
                  sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    height: 20,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Tooltip>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ 
          p: 2, 
          ...getGlassStyles('elevated', mode),
          maxWidth: 200
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: entry.color 
                }} 
              />
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {entry.name}: {entry.value}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
              boxShadow: `0 4px 16px ${theme.palette.primary.main}40`
            }}
          >
            <Build />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Production Flow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Job status and workflow metrics
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Timeline />}
            onClick={() => setSelectedView(
              selectedView === 'status' ? 'flow' : 
              selectedView === 'flow' ? 'efficiency' : 'status'
            )}
            sx={{ minWidth: 100 }}
          >
            {selectedView === 'status' ? 'Status' : 
             selectedView === 'flow' ? 'Flow' : 'Efficiency'}
          </Button>
          
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          {selectedView === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={2}>
                {Object.entries(productionData).map(([status, data]) => {
                  if (status === 'total') return null;
                  const config = statusConfig[status];
                  if (!config) return null;

                  return (
                    <Grid item xs={12} sm={6} md={expanded ? 4 : 6} lg={expanded ? 3 : 4} key={status}>
                      <StatusCard status={status} data={data} config={config} />
                    </Grid>
                  );
                })}
              </Grid>

              {expanded && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Production Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ p: 2, ...getGlassStyles('subtle', mode) }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Active Jobs
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {productionData.total}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ p: 2, ...getGlassStyles('subtle', mode) }}>
                        <Typography variant="body2" color="text.secondary">
                          Avg Cycle Time
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {efficiencyMetrics.avgCycleTime}d
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ p: 2, ...getGlassStyles('subtle', mode) }}>
                        <Typography variant="body2" color="text.secondary">
                          On-Time Delivery
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {efficiencyMetrics.onTimeDelivery}%
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </motion.div>
          )}

          {selectedView === 'flow' && (
            <motion.div
              key="flow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Weekly Throughput
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={flowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="completed" fill={theme.palette.success.main} name="Completed" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="started" fill={theme.palette.primary.main} name="Started" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="delayed" fill={theme.palette.error.main} name="Delayed" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {selectedView === 'efficiency' && (
            <motion.div
              key="efficiency"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Efficiency Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, ...getGlassStyles('default', mode), height: '100%' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      Throughput Rate
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {efficiencyMetrics.throughput}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      jobs per week
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(efficiencyMetrics.throughput * 2, 100)}
                      sx={{
                        mt: 2,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #10b981, #059669)'
                        }
                      }}
                    />
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, ...getGlassStyles('default', mode), height: '100%' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      Shop Utilization
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {efficiencyMetrics.utilization}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      capacity utilized
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={efficiencyMetrics.utilization}
                      sx={{
                        mt: 2,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)'
                        }
                      }}
                    />
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" spacing={2}>
                    <Card sx={{ flex: 1, p: 2, ...getGlassStyles('subtle', mode) }}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Cycle Time
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {efficiencyMetrics.avgCycleTime} days
                      </Typography>
                    </Card>
                    <Card sx={{ flex: 1, p: 2, ...getGlassStyles('subtle', mode) }}>
                      <Typography variant="body2" color="text.secondary">
                        On-Time Delivery
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {efficiencyMetrics.onTimeDelivery}%
                      </Typography>
                    </Card>
                    <Card sx={{ flex: 1, p: 2, ...getGlassStyles('subtle', mode) }}>
                      <Typography variant="body2" color="text.secondary">
                        Bottleneck Reduction
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                        +{efficiencyMetrics.bottleneckReduction}%
                      </Typography>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            </motion.div>
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
            mt: 1
          }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 2 }} />
          View Production Board
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Timeline sx={{ mr: 2 }} />
          Workflow Analysis
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Speed sx={{ mr: 2 }} />
          Performance Report
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProductionWidget;