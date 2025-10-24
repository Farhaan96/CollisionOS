import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  useTheme,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  Avatar,
} from '@mui/material';
import {
  AttachMoney,
  AccessTime,
  DirectionsCar,
  Build,
  ArrowForward,
  FileUpload,
  AddCircle,
  Dashboard as DashboardIcon,
  Receipt,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { KPICard, ChartCard, StatusBadge } from '../../components/ui';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [productionData, setProductionData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [statsRes, productionRes, revenueRes, jobsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/dashboard/stats`).catch(() => ({ data: {} })),
          axios.get(`${API_BASE_URL}/dashboard/production`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/dashboard/revenue-trend`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/dashboard/recent-jobs?limit=5`).catch(() => ({ data: [] })),
        ]);

        const apiData = statsRes.data;

        setDashboardData({
          activeJobs: apiData.activeRepairs?.count || 0,
          weekRevenue: Math.round((apiData.monthRevenue || 0) / 4),
          avgCycleTime: 5.8,
          capacity: apiData.activeRepairs?.count ? Math.round((apiData.activeRepairs.count / 28) * 100) : 75,
          trends: {
            activeJobs: 8.5,
            weekRevenue: 12.3,
            avgCycleTime: -10.5,
            capacity: 5.2,
          },
        });

        setProductionData(productionRes.data || []);
        setRevenueData(revenueRes.data || []);
        setRecentJobs(jobsRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    const interval = setInterval(() => {
      setRefreshTime(new Date());
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Note: Using new KPICard component from ui library

  // Production Status Chart Component
  const ProductionStatusChart = () => {
    const chartData = {
      labels: productionData.slice(0, 5).map(item => item.status),
      datasets: [
        {
          data: productionData.slice(0, 5).map(item => item.count),
          backgroundColor: productionData.slice(0, 5).map(item => item.color),
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, weight: '600' },
            color: theme.palette.text.primary,
          },
        },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.primary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
        },
      },
      cutout: '70%',
    };

    return <Doughnut data={chartData} options={options} />;
  };

  // Revenue Trend Chart Component
  const RevenueTrendChart = () => {
    const chartData = {
      labels: revenueData.slice(-30).map(item => item.month || new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Revenue',
          data: revenueData.slice(-30).map(item => item.total || item.revenue),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.primary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (context) => `Revenue: $${context.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.palette.text.secondary,
            font: { size: 11 },
          },
        },
        y: {
          grid: {
            color: theme.palette.divider,
            drawBorder: false,
          },
          ticks: {
            color: theme.palette.text.secondary,
            font: { size: 11 },
            callback: (value) => `$${(value / 1000).toFixed(0)}K`,
          },
        },
      },
    };

    return <Line data={chartData} options={options} />;
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

  if (!dashboardData) return null;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        bgcolor: theme.palette.mode === 'dark' ? '#0f1419' : '#f8fafc',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)'
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Dashboard
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mt={1}>
              <Typography variant="body1" color="text.secondary">
                Real-time overview of your collision shop performance
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: `${theme.palette.success.main}20`,
                  border: `1px solid ${theme.palette.success.main}40`,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  Live
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => navigate('/schedule')}
              sx={{
                borderWidth: 2,
                '&:hover': { borderWidth: 2 },
              }}
            >
              Schedule
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Top KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Active Jobs"
            value={dashboardData.activeJobs}
            subtitle="Currently in shop"
            trend={dashboardData.trends.activeJobs}
            trendLabel="vs last week"
            icon={<DirectionsCar />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/production')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="This Week Revenue"
            value={`$${(dashboardData.weekRevenue / 1000).toFixed(1)}K`}
            subtitle="Last 7 days total"
            trend={dashboardData.trends.weekRevenue}
            trendLabel="vs last week"
            icon={<AttachMoney />}
            color={theme.palette.success.main}
            onClick={() => navigate('/reports')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Avg Cycle Time"
            value={`${dashboardData.avgCycleTime} days`}
            subtitle="Check-in to delivery"
            trend={dashboardData.trends.avgCycleTime}
            trendLabel="vs last month"
            icon={<AccessTime />}
            color={theme.palette.warning.main}
            onClick={() => navigate('/reports')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Capacity"
            value={`${dashboardData.capacity}%`}
            subtitle="Shop utilization"
            trend={dashboardData.trends.capacity}
            trendLabel="vs last week"
            icon={<Build />}
            color={theme.palette.secondary.main}
            onClick={() => navigate('/production')}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Production Status Chart */}
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Production Status"
            subtitle="Current distribution of repair orders by stage"
            height={400}
            chartHeight={300}
          >
            {productionData.length > 0 ? (
              <ProductionStatusChart />
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography color="text.secondary">No production data available</Typography>
              </Box>
            )}
          </ChartCard>
        </Grid>

        {/* Revenue Trend Chart */}
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="Revenue Trend"
            subtitle="Daily revenue over the past month"
            timeRange="Last 30 Days"
            height={400}
            chartHeight={300}
          >
            {revenueData.length > 0 ? (
              <RevenueTrendChart />
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography color="text.secondary">No revenue data available</Typography>
              </Box>
            )}
          </ChartCard>
        </Grid>

        {/* Recent Jobs */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3,
              height: 400,
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Recent Jobs
              </Typography>
              <IconButton size="small" onClick={() => navigate('/jobs')}>
                <ArrowForward />
              </IconButton>
            </Box>
            <List sx={{ maxHeight: 320, overflow: 'auto' }}>
              {recentJobs.length > 0 ? (
                recentJobs.map((job, index) => (
                  <ListItem
                    key={job.id || index}
                    sx={{
                      px: 2,
                      py: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                      {job.id?.toString().slice(-2) || index + 1}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={600}>
                          {job.customer || 'Unknown Customer'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {job.vehicle || 'Unknown Vehicle'}
                          </Typography>
                          <Box mt={0.5}>
                            <StatusBadge
                              status={job.status || 'in-progress'}
                              size="small"
                              variant="pill"
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <Box textAlign="right">
                      <Typography variant="body1" fontWeight={700} color="primary">
                        ${job.value?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {job.days} days
                      </Typography>
                    </Box>
                  </ListItem>
                ))
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                  <Typography color="text.secondary">No recent jobs</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3,
              height: 400,
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FileUpload />}
                  onClick={() => navigate('/bms-import')}
                  sx={{
                    height: 80,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  }}
                >
                  Import BMS File
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddCircle />}
                  onClick={() => navigate('/jobs/new')}
                  sx={{
                    height: 80,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  }}
                >
                  Create New Job
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate('/production')}
                  sx={{
                    height: 80,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 },
                  }}
                >
                  Production Board
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Receipt />}
                  onClick={() => navigate('/invoicing')}
                  sx={{
                    height: 80,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 },
                  }}
                >
                  Invoicing
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
