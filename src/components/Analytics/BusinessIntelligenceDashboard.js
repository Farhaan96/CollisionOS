import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  Schedule,
  AttachMoney,
  Person,
  DirectionsCar,
  Business,
  Speed,
  Star,
  Warning,
  CheckCircle,
  Timer,
  Groups,
  Assessment,
  CompareArrows,
  Insights,
  Download,
  Share,
  Refresh,
  DateRange,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * BusinessIntelligenceDashboard - Comprehensive analytics and insights
 * Executive-level business intelligence for collision repair operations
 */
const BusinessIntelligenceDashboard = ({
  timeRange = '30d',
  className,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock analytics data
  const mockAnalytics = {
    overview: {
      totalRevenue: 1250000,
      revenueChange: 12.5,
      totalJobs: 342,
      jobsChange: 8.3,
      avgCycleTime: 6.2,
      cycleTimeChange: -8.1,
      customerSatisfaction: 4.7,
      satisfactionChange: 2.1,
      shopUtilization: 87.5,
      utilizationChange: 5.2,
    },
    revenue: {
      monthly: [
        { month: 'Jan', revenue: 98000, target: 95000, jobs: 28 },
        { month: 'Feb', revenue: 105000, target: 100000, jobs: 31 },
        { month: 'Mar', revenue: 112000, target: 105000, jobs: 34 },
        { month: 'Apr', revenue: 108000, target: 110000, jobs: 29 },
        { month: 'May', revenue: 125000, target: 115000, jobs: 38 },
        { month: 'Jun', revenue: 135000, target: 120000, jobs: 42 },
        { month: 'Jul', revenue: 142000, target: 125000, jobs: 45 },
      ],
      byCategory: [
        { category: 'Body Repair', amount: 650000, percentage: 52, jobs: 180 },
        { category: 'Paint', amount: 325000, percentage: 26, jobs: 95 },
        { category: 'Mechanical', amount: 162500, percentage: 13, jobs: 48 },
        { category: 'Parts', amount: 112500, percentage: 9, jobs: 19 },
      ],
    },
    production: {
      cycleTimeByStage: [
        { stage: 'Estimate', avgDays: 0.5, target: 1, efficiency: 120 },
        { stage: 'Parts Hold', avgDays: 2.8, target: 2, efficiency: 71 },
        { stage: 'Body Work', avgDays: 4.2, target: 4, efficiency: 105 },
        { stage: 'Paint Prep', avgDays: 1.1, target: 1, efficiency: 91 },
        { stage: 'Paint', avgDays: 2.8, target: 2.5, efficiency: 89 },
        { stage: 'Assembly', avgDays: 3.5, target: 3, efficiency: 86 },
        { stage: 'QC', avgDays: 0.8, target: 0.5, efficiency: 62 },
      ],
      bottlenecks: [
        {
          stage: 'Parts Hold',
          impact: 'High',
          avgDelay: 2.3,
          affectedJobs: 15,
        },
        { stage: 'Paint', impact: 'Medium', avgDelay: 1.2, affectedJobs: 8 },
        { stage: 'QC', impact: 'Low', avgDelay: 0.8, affectedJobs: 5 },
      ],
      throughput: [
        { week: 'W1', completed: 12, started: 14, wip: 45 },
        { week: 'W2', completed: 15, started: 13, wip: 43 },
        { week: 'W3', completed: 18, started: 16, wip: 41 },
        { week: 'W4', completed: 16, started: 18, wip: 43 },
      ],
    },
    technicians: [
      {
        id: 'TECH-001',
        name: 'Mike Rodriguez',
        specialization: 'Body Repair',
        utilization: 94.2,
        hoursWorked: 162,
        jobsCompleted: 12,
        avgJobTime: 13.5,
        efficiency: 108,
        satisfaction: 4.8,
      },
      {
        id: 'TECH-002',
        name: 'Lisa Chen',
        specialization: 'Paint',
        utilization: 89.5,
        hoursWorked: 154,
        jobsCompleted: 18,
        avgJobTime: 8.6,
        efficiency: 115,
        satisfaction: 4.9,
      },
      {
        id: 'TECH-003',
        name: 'James Wilson',
        specialization: 'Mechanical',
        utilization: 82.1,
        hoursWorked: 141,
        jobsCompleted: 9,
        avgJobTime: 15.7,
        efficiency: 98,
        satisfaction: 4.6,
      },
    ],
    customers: {
      satisfaction: [
        { period: 'Jan', score: 4.5, responses: 45, nps: 68 },
        { period: 'Feb', score: 4.6, responses: 52, nps: 71 },
        { period: 'Mar', score: 4.7, responses: 48, nps: 74 },
        { period: 'Apr', score: 4.6, responses: 41, nps: 69 },
        { period: 'May', score: 4.8, responses: 55, nps: 78 },
        { period: 'Jun', score: 4.7, responses: 49, nps: 75 },
        { period: 'Jul', score: 4.8, responses: 58, nps: 79 },
      ],
      retention: {
        newCustomers: 45,
        returningCustomers: 28,
        retentionRate: 73.5,
        avgLifetimeValue: 3250,
        referralRate: 18.2,
      },
    },
  };

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedTimeRange]);

  // Chart colors
  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

  // Render overview metrics
  const renderOverviewMetrics = () => {
    if (!analytics) return null;

    const metrics = [
      {
        title: 'Total Revenue',
        value: `$${analytics.overview.totalRevenue.toLocaleString()}`,
        change: analytics.overview.revenueChange,
        icon: AttachMoney,
        color: 'primary',
      },
      {
        title: 'Total Jobs',
        value: analytics.overview.totalJobs.toString(),
        change: analytics.overview.jobsChange,
        icon: DirectionsCar,
        color: 'secondary',
      },
      {
        title: 'Avg Cycle Time',
        value: `${analytics.overview.avgCycleTime} days`,
        change: analytics.overview.cycleTimeChange,
        icon: Schedule,
        color: 'info',
        inverse: true,
      },
      {
        title: 'Customer Satisfaction',
        value: `${analytics.overview.customerSatisfaction}/5`,
        change: analytics.overview.satisfactionChange,
        icon: Star,
        color: 'warning',
      },
      {
        title: 'Shop Utilization',
        value: `${analytics.overview.shopUtilization}%`,
        change: analytics.overview.utilizationChange,
        icon: Speed,
        color: 'success',
      },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid xs={12} sm={6} lg={2.4} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${metric.color}.main`,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <metric.icon />
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {(
                      metric.inverse ? metric.change < 0 : metric.change > 0
                    ) ? (
                      <TrendingUp color='success' fontSize='small' />
                    ) : (
                      <TrendingDown color='error' fontSize='small' />
                    )}
                    <Typography
                      variant='caption'
                      color={
                        metric.inverse
                          ? metric.change < 0
                            ? 'success.main'
                            : 'error.main'
                          : metric.change > 0
                            ? 'success.main'
                            : 'error.main'
                      }
                      sx={{ fontWeight: 600 }}
                    >
                      {Math.abs(metric.change)}%
                    </Typography>
                  </Box>
                </Box>

                <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
                  {metric.value}
                </Typography>

                <Typography variant='body2' color='text.secondary'>
                  {metric.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render revenue analytics
  const renderRevenueAnalytics = () => {
    if (!analytics) return null;

    return (
      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width='100%' height={400}>
                <AreaChart data={analytics.revenue.monthly}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' />
                  <YAxis />
                  <RechartsTooltip
                    formatter={value => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Area
                    type='monotone'
                    dataKey='revenue'
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.2}
                    name='Actual Revenue'
                  />
                  <Line
                    type='monotone'
                    dataKey='target'
                    stroke={theme.palette.secondary.main}
                    strokeDasharray='5 5'
                    name='Target Revenue'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Revenue by Category
              </Typography>
              <ResponsiveContainer width='100%' height={400}>
                <PieChart>
                  <Pie
                    data={analytics.revenue.byCategory}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ category, percentage }) =>
                      `${category} ${percentage}%`
                    }
                    outerRadius={120}
                    fill='#8884d8'
                    dataKey='amount'
                  >
                    {analytics.revenue.byCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={value => [`$${value.toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render production analytics
  const renderProductionAnalytics = () => {
    if (!analytics) return null;

    return (
      <Box>
        {/* Cycle Time by Stage */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Cycle Time by Stage
            </Typography>
            <ResponsiveContainer width='100%' height={400}>
              <BarChart data={analytics.production.cycleTimeByStage}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='stage' />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar
                  dataKey='avgDays'
                  fill={theme.palette.primary.main}
                  name='Actual Days'
                />
                <Bar
                  dataKey='target'
                  fill={theme.palette.secondary.main}
                  name='Target Days'
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bottlenecks */}
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Production Bottlenecks
                </Typography>
                {analytics.production.bottlenecks.map((bottleneck, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
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
                      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                        {bottleneck.stage}
                      </Typography>
                      <Chip
                        label={bottleneck.impact}
                        size='small'
                        color={
                          bottleneck.impact === 'High'
                            ? 'error'
                            : bottleneck.impact === 'Medium'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Box>
                    <Typography variant='body2' color='text.secondary'>
                      Avg Delay: {bottleneck.avgDelay} days •{' '}
                      {bottleneck.affectedJobs} jobs affected
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Weekly Throughput
                </Typography>
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart data={analytics.production.throughput}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='week' />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='completed'
                      stroke={theme.palette.success.main}
                      name='Completed'
                    />
                    <Line
                      type='monotone'
                      dataKey='started'
                      stroke={theme.palette.primary.main}
                      name='Started'
                    />
                    <Line
                      type='monotone'
                      dataKey='wip'
                      stroke={theme.palette.warning.main}
                      name='Work in Progress'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render technician performance
  const renderTechnicianPerformance = () => {
    if (!analytics) return null;

    return (
      <Grid container spacing={3}>
        {analytics.technicians.map(tech => (
          <Grid xs={12} md={6} lg={4} key={tech.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                      {tech.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {tech.specialization}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Utilization
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      {tech.utilization}%
                    </Typography>
                  </Grid>
                  <Grid xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Efficiency
                    </Typography>
                    <Typography
                      variant='h6'
                      color={
                        tech.efficiency >= 100 ? 'success.main' : 'warning.main'
                      }
                    >
                      {tech.efficiency}%
                    </Typography>
                  </Grid>
                  <Grid xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Jobs Completed
                    </Typography>
                    <Typography variant='h6'>{tech.jobsCompleted}</Typography>
                  </Grid>
                  <Grid xs={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Satisfaction
                    </Typography>
                    <Typography variant='h6' color='primary'>
                      {tech.satisfaction}/5
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant='body2' color='text.secondary'>
                  {tech.hoursWorked}h worked • {tech.avgJobTime}h avg per job
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render customer analytics
  const renderCustomerAnalytics = () => {
    if (!analytics) return null;

    return (
      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Customer Satisfaction Trend
              </Typography>
              <ResponsiveContainer width='100%' height={400}>
                <LineChart data={analytics.customers.satisfaction}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='period' />
                  <YAxis domain={[0, 5]} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='score'
                    stroke={theme.palette.primary.main}
                    name='Satisfaction Score'
                  />
                  <Line
                    type='monotone'
                    dataKey='nps'
                    stroke={theme.palette.secondary.main}
                    name='NPS Score'
                    yAxisId='right'
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Customer Retention
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant='h4'
                  color='primary'
                  sx={{ fontWeight: 600 }}
                >
                  {analytics.customers.retention.retentionRate}%
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Customer Retention Rate
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    New Customers
                  </Typography>
                  <Typography variant='h6'>
                    {analytics.customers.retention.newCustomers}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Returning
                  </Typography>
                  <Typography variant='h6'>
                    {analytics.customers.retention.returningCustomers}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Avg Lifetime Value
                  </Typography>
                  <Typography variant='h6'>
                    ${analytics.customers.retention.avgLifetimeValue}
                  </Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Referral Rate
                  </Typography>
                  <Typography variant='h6'>
                    {analytics.customers.retention.referralRate}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant='h6'>Loading Analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box className={className} {...props}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            Business Intelligence
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Comprehensive analytics and performance insights
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              label='Time Range'
              onChange={e => setSelectedTimeRange(e.target.value)}
            >
              <MenuItem value='7d'>Last 7 days</MenuItem>
              <MenuItem value='30d'>Last 30 days</MenuItem>
              <MenuItem value='90d'>Last 90 days</MenuItem>
              <MenuItem value='1y'>Last year</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title='Download Report'>
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title='Share Dashboard'>
            <IconButton>
              <Share />
            </IconButton>
          </Tooltip>
          <Tooltip title='Refresh Data'>
            <IconButton onClick={() => window.location.reload()}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Metrics */}
      {renderOverviewMetrics()}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons='auto'
        >
          <Tab icon={<AttachMoney />} label='Revenue' />
          <Tab icon={<Analytics />} label='Production' />
          <Tab icon={<Groups />} label='Technicians' />
          <Tab icon={<Star />} label='Customers' />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ minHeight: 500 }}>
        {activeTab === 0 && renderRevenueAnalytics()}
        {activeTab === 1 && renderProductionAnalytics()}
        {activeTab === 2 && renderTechnicianPerformance()}
        {activeTab === 3 && renderCustomerAnalytics()}
      </Box>
    </Box>
  );
};

export default BusinessIntelligenceDashboard;
