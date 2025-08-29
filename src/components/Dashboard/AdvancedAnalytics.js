import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  ButtonGroup,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  BarChart,
  PieChart,
  Timeline,
  Refresh,
  Fullscreen,
  Download
} from '@mui/icons-material';
import { KPIChart } from './KPIChart';
import { formatCurrency } from '../../utils/formatters';

const AdvancedAnalytics = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Sample data - in real app this would come from API
  const analyticsData = {
    revenue: {
      current: 125000,
      previous: 118000,
      trend: 'up',
      change: 5.9,
      chartData: [
        { label: 'Jan', value: 95000 },
        { label: 'Feb', value: 108000 },
        { label: 'Mar', value: 112000 },
        { label: 'Apr', value: 125000 },
        { label: 'May', value: 119000 },
        { label: 'Jun', value: 135000 }
      ]
    },
    jobs: {
      current: 47,
      previous: 52,
      trend: 'down',
      change: -9.6,
      chartData: [
        { label: 'Jan', value: 42 },
        { label: 'Feb', value: 45 },
        { label: 'Mar', value: 48 },
        { label: 'Apr', value: 47 },
        { label: 'May', value: 44 },
        { label: 'Jun', value: 52 }
      ]
    },
    efficiency: {
      current: 87.5,
      previous: 84.2,
      trend: 'up',
      change: 3.9,
      chartData: [
        { label: 'Jan', value: 82 },
        { label: 'Feb', value: 85 },
        { label: 'Mar', value: 84 },
        { label: 'Apr', value: 87.5 },
        { label: 'May', value: 89 },
        { label: 'Jun', value: 91 }
      ]
    },
    satisfaction: {
      current: 4.8,
      previous: 4.6,
      trend: 'up',
      change: 4.3,
      chartData: [
        { label: 'Jan', value: 4.4 },
        { label: 'Feb', value: 4.5 },
        { label: 'Mar', value: 4.7 },
        { label: 'Apr', value: 4.8 },
        { label: 'May', value: 4.6 },
        { label: 'Jun', value: 4.9 }
      ]
    }
  };

  const metrics = [
    { key: 'revenue', label: 'Revenue', icon: TrendingUp, color: theme.palette.success.main },
    { key: 'jobs', label: 'Jobs Completed', icon: BarChart, color: theme.palette.primary.main },
    { key: 'efficiency', label: 'Efficiency', icon: ShowChart, color: theme.palette.warning.main },
    { key: 'satisfaction', label: 'Satisfaction', icon: Timeline, color: theme.palette.info.main }
  ];

  const currentData = analyticsData[selectedMetric];
  const selectedMetricInfo = metrics.find(m => m.key === selectedMetric);

  // Department performance data
  const departmentData = [
    {
      name: 'Body Shop',
      efficiency: 92,
      revenue: 45000,
      jobs: 15,
      avgCycleTime: 4.2,
      trend: 'up'
    },
    {
      name: 'Paint Booth',
      efficiency: 88,
      revenue: 38000,
      jobs: 12,
      avgCycleTime: 3.8,
      trend: 'up'
    },
    {
      name: 'Parts',
      efficiency: 95,
      revenue: 28000,
      jobs: 47,
      avgCycleTime: 1.2,
      trend: 'stable'
    },
    {
      name: 'QC/Calibration',
      efficiency: 85,
      revenue: 14000,
      jobs: 8,
      avgCycleTime: 2.5,
      trend: 'down'
    }
  ];

  // Time comparison data
  const timeComparison = {
    thisWeek: { jobs: 12, revenue: 28500, efficiency: 89 },
    lastWeek: { jobs: 14, revenue: 26800, efficiency: 86 },
    thisMonth: { jobs: 47, revenue: 125000, efficiency: 87.5 },
    lastMonth: { jobs: 52, revenue: 118000, efficiency: 84.2 },
    thisYear: { jobs: 324, revenue: 890000, efficiency: 85.8 },
    lastYear: { jobs: 298, revenue: 750000, efficiency: 82.1 }
  };

  const MetricCard = ({ metric, data, selected, onClick }) => {
    const IconComponent = metric.icon;
    const isPositive = data.trend === 'up';
    
    return (
      <Card
        sx={{
          cursor: 'pointer',
          border: selected ? `2px solid ${metric.color}` : '1px solid',
          borderColor: selected ? metric.color : 'divider',
          backgroundColor: selected ? alpha(metric.color, 0.05) : 'background.paper',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <IconComponent sx={{ color: metric.color, fontSize: 28 }} />
            <Chip
              size="small"
              label={`${isPositive ? '+' : ''}${data.change.toFixed(1)}%`}
              color={isPositive ? 'success' : 'error'}
              icon={isPositive ? <TrendingUp /> : <TrendingDown />}
            />
          </Box>
          
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: metric.color }}>
            {metric.key === 'revenue' ? formatCurrency(data.current) : 
             metric.key === 'satisfaction' ? data.current.toFixed(1) :
             metric.key === 'efficiency' ? `${data.current}%` : data.current}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {metric.label}
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            vs previous period: {metric.key === 'revenue' ? formatCurrency(data.previous) : data.previous}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const DepartmentCard = ({ department }) => {
    const getTrendIcon = (trend) => {
      switch (trend) {
        case 'up':
          return <TrendingUp color="success" />;
        case 'down':
          return <TrendingDown color="error" />;
        default:
          return <ShowChart color="disabled" />;
      }
    };

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              {department.name}
            </Typography>
            {getTrendIcon(department.trend)}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Efficiency
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {department.efficiency}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Revenue
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(department.revenue)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Jobs
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {department.jobs}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Avg Cycle
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {department.avgCycleTime}d
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={department.efficiency}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: department.efficiency >= 90 ? theme.palette.success.main :
                                   department.efficiency >= 80 ? theme.palette.primary.main :
                                   theme.palette.warning.main
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Time Range Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Advanced Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ButtonGroup size="small" variant="outlined">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'contained' : 'outlined'}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </ButtonGroup>
          
          <Tooltip title="Refresh Data">
            <IconButton size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export Data">
            <IconButton size="small">
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.key}>
            <MetricCard
              metric={metric}
              data={analyticsData[metric.key]}
              selected={selectedMetric === metric.key}
              onClick={() => setSelectedMetric(metric.key)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Main Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {selectedMetricInfo?.label} Trend
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<BarChart />}>
                Bar Chart
              </Button>
              <Button size="small" variant="outlined" startIcon={<ShowChart />}>
                Line Chart
              </Button>
            </Box>
          </Box>
          
          <KPIChart
            data={currentData.chartData}
            type="line"
            height={300}
            title={selectedMetricInfo?.label}
            currency={selectedMetric === 'revenue'}
            animated={true}
            gradient={true}
            colors={[selectedMetricInfo?.color]}
          />
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Department Performance
          </Typography>
          
          <Grid container spacing={2}>
            {departmentData.map((department) => (
              <Grid item xs={12} sm={6} md={3} key={department.name}>
                <DepartmentCard department={department} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Time Comparison */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Comparison
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {timeComparison.thisWeek.jobs}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Jobs This Week
                </Typography>
                <Typography variant="caption" color={timeComparison.thisWeek.jobs > timeComparison.lastWeek.jobs ? 'success.main' : 'error.main'}>
                  {timeComparison.thisWeek.jobs > timeComparison.lastWeek.jobs ? '+' : ''}{timeComparison.thisWeek.jobs - timeComparison.lastWeek.jobs} vs last week
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(timeComparison.thisMonth.revenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenue This Month
                </Typography>
                <Typography variant="caption" color="success.main">
                  +{((timeComparison.thisMonth.revenue - timeComparison.lastMonth.revenue) / timeComparison.lastMonth.revenue * 100).toFixed(1)}% vs last month
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {timeComparison.thisYear.efficiency}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  YTD Efficiency
                </Typography>
                <Typography variant="caption" color="success.main">
                  +{(timeComparison.thisYear.efficiency - timeComparison.lastYear.efficiency).toFixed(1)}% vs last year
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedAnalytics;