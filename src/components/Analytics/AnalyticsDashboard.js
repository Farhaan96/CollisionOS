import React, { useState, useEffect } from 'react';
import {
  Grid2 as Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Build,
  People,
  Inventory,
  Warning,
  CheckCircle,
} from '@mui/icons-material';

/**
 * Advanced Analytics Dashboard Component
 * Displays comprehensive business intelligence for collision repair shops
 */
const AnalyticsDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Color schemes for charts
  const colors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    info: '#0288d1',
    light: '#f5f5f5',
  };

  const chartColors = [
    '#1976d2',
    '#dc004e',
    '#2e7d32',
    '#ed6c02',
    '#0288d1',
    '#7b1fa2',
  ];

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch multiple analytics endpoints
      const [dashboardRes, revenueRes, customerRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?period=${period}`),
        fetch(`/api/analytics/revenue?period=year&groupBy=month`),
        fetch('/api/analytics/customers/segments'),
      ]);

      if (!dashboardRes.ok || !revenueRes.ok || !customerRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [dashboard, revenue, customers] = await Promise.all([
        dashboardRes.json(),
        revenueRes.json(),
        customerRes.json(),
      ]);

      setDashboardData(dashboard.data);
      setRevenueData(revenue.data);
      setCustomerData(customers.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercent = value => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const formatNumber = value => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  // Loading state
  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress />
        <Typography variant='h6' sx={{ ml: 2 }}>
          Loading Analytics...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        Failed to load analytics: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h4' gutterBottom>
          Analytics Dashboard
        </Typography>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            label='Period'
          >
            <MenuItem value='today'>Today</MenuItem>
            <MenuItem value='week'>This Week</MenuItem>
            <MenuItem value='month'>This Month</MenuItem>
            <MenuItem value='quarter'>This Quarter</MenuItem>
            <MenuItem value='year'>This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} mb={3}>
        <Grid xs={12} sm={6} md={3}>
          <MetricCard
            title='Total Revenue'
            value={formatCurrency(dashboardData?.jobs?.revenue_this_month)}
            icon={<AttachMoney sx={{ fontSize: 40, color: colors.success }} />}
            trend={12.5}
            trendUp={true}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <MetricCard
            title='Jobs Completed'
            value={dashboardData?.jobs?.completed || 0}
            icon={<Build sx={{ fontSize: 40, color: colors.primary }} />}
            trend={8.3}
            trendUp={true}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <MetricCard
            title='Active Customers'
            value={dashboardData?.customers?.total || 0}
            icon={<People sx={{ fontSize: 40, color: colors.info }} />}
            trend={5.2}
            trendUp={true}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <MetricCard
            title='Cycle Time'
            value={`${(dashboardData?.jobs?.avg_cycle_time || 0).toFixed(1)} days`}
            icon={<CheckCircle sx={{ fontSize: 40, color: colors.warning }} />}
            trend={-2.1}
            trendUp={false}
          />
        </Grid>
      </Grid>

      {/* Revenue Trends Chart */}
      <Grid container spacing={3} mb={3}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant='h6' gutterBottom>
              Revenue Trends
            </Typography>
            {revenueData?.timeline && (
              <ResponsiveContainer width='100%' height='85%'>
                <AreaChart data={revenueData.timeline}>
                  <defs>
                    <linearGradient
                      id='colorRevenue'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop
                        offset='5%'
                        stopColor={colors.primary}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset='95%'
                        stopColor={colors.primary}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={value => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type='monotone'
                    dataKey='revenue'
                    stroke={colors.primary}
                    fillOpacity={1}
                    fill='url(#colorRevenue)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Revenue Breakdown */}
        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant='h6' gutterBottom>
              Revenue Breakdown
            </Typography>
            {revenueData?.totals && (
              <ResponsiveContainer width='100%' height='85%'>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Labor',
                        value: revenueData.totals.labor,
                        color: chartColors[0],
                      },
                      {
                        name: 'Parts',
                        value: revenueData.totals.parts,
                        color: chartColors[1],
                      },
                      {
                        name: 'Materials',
                        value: revenueData.totals.materials,
                        color: chartColors[2],
                      },
                    ]}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey='value'
                  >
                    {[
                      {
                        name: 'Labor',
                        value: revenueData.totals.labor,
                        color: chartColors[0],
                      },
                      {
                        name: 'Parts',
                        value: revenueData.totals.parts,
                        color: chartColors[1],
                      },
                      {
                        name: 'Materials',
                        value: revenueData.totals.materials,
                        color: chartColors[2],
                      },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Customer Segments and Alerts */}
      <Grid container spacing={3} mb={3}>
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Customer Segments
            </Typography>
            {customerData?.segmentDistribution && (
              <Box>
                {Object.entries(customerData.segmentDistribution).map(
                  ([segment, count], index) => (
                    <Box
                      key={segment}
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                      mb={1}
                    >
                      <Box display='flex' alignItems='center'>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor:
                              chartColors[index % chartColors.length],
                            mr: 2,
                          }}
                        />
                        <Typography variant='body2'>{segment}</Typography>
                      </Box>
                      <Chip
                        label={count}
                        size='small'
                        sx={{
                          backgroundColor:
                            chartColors[index % chartColors.length],
                          color: 'white',
                        }}
                      />
                    </Box>
                  )
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Business Alerts
            </Typography>
            <Box>
              {/* Overdue Jobs Alert */}
              {dashboardData?.jobs?.overdue > 0 && (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  <Typography variant='body2'>
                    {dashboardData.jobs.overdue} jobs are overdue
                  </Typography>
                </Alert>
              )}

              {/* Low Stock Alert */}
              {dashboardData?.parts?.low_stock > 0 && (
                <Alert severity='error' sx={{ mb: 2 }}>
                  <Typography variant='body2'>
                    {dashboardData.parts.low_stock} parts are low in stock
                  </Typography>
                </Alert>
              )}

              {/* Ready for Pickup */}
              {dashboardData?.jobs?.ready > 0 && (
                <Alert severity='info' sx={{ mb: 2 }}>
                  <Typography variant='body2'>
                    {dashboardData.jobs.ready} jobs ready for pickup
                  </Typography>
                </Alert>
              )}

              {/* All Good */}
              {!dashboardData?.jobs?.overdue &&
                !dashboardData?.parts?.low_stock && (
                  <Alert severity='success'>
                    <Typography variant='body2'>
                      All systems operating normally
                    </Typography>
                  </Alert>
                )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Summary */}
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Performance Summary
            </Typography>

            <Grid container spacing={3}>
              <Grid xs={12} md={3}>
                <Box textAlign='center'>
                  <Typography variant='h4' color='primary' gutterBottom>
                    {formatCurrency(revenueData?.averages?.revenue_per_job)}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Average Job Value
                  </Typography>
                </Box>
              </Grid>

              <Grid xs={12} md={3}>
                <Box textAlign='center'>
                  <Typography variant='h4' color='primary' gutterBottom>
                    {(dashboardData?.jobs?.avg_cycle_time || 0).toFixed(1)}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Average Cycle Time (days)
                  </Typography>
                </Box>
              </Grid>

              <Grid xs={12} md={3}>
                <Box textAlign='center'>
                  <Typography variant='h4' color='primary' gutterBottom>
                    {formatPercent(85.5)}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Shop Efficiency
                  </Typography>
                </Box>
              </Grid>

              <Grid xs={12} md={3}>
                <Box textAlign='center'>
                  <Typography variant='h4' color='primary' gutterBottom>
                    4.2
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Customer Satisfaction
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Reusable Metric Card Component
 */
const MetricCard = ({ title, value, icon, trend, trendUp }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
      >
        <Box>
          <Typography color='textSecondary' gutterBottom variant='overline'>
            {title}
          </Typography>
          <Typography variant='h4' component='div' gutterBottom>
            {value}
          </Typography>
          {trend && (
            <Box display='flex' alignItems='center'>
              {trendUp ? (
                <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
              )}
              <Typography
                variant='body2'
                sx={{ color: trendUp ? 'success.main' : 'error.main' }}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export default AnalyticsDashboard;
