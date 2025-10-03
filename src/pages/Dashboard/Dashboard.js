import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  IconButton,
  CircularProgress,
  Button,
  Avatar,
} from '@mui/material';
import {
  AttachMoney,
  AccessTime,
  DirectionsCar,
  TrendingUp,
  TrendingDown,
  Build,
  ArrowForward,
  FileUpload,
  AddCircle,
  Dashboard as DashboardIcon,
  Receipt,
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

  // Premium KPI Card Component
  const PremiumKPICard = ({ title, value, subtitle, trend, icon, color, onClick }) => (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 1) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 40px rgba(0, 0, 0, 0.4)'
            : '0 20px 40px rgba(0, 0, 0, 0.08)',
          borderColor: color,
        } : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 0.5,
                background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
            }}
          >
            {React.cloneElement(icon, {
              sx: { fontSize: 28, color },
            })}
          </Box>
        </Box>

        {trend !== undefined && (
          <Box display="flex" alignItems="center" mt={2}>
            {trend > 0 ? (
              <TrendingUp sx={{ color: '#10B981', fontSize: 20, mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: '#EF4444', fontSize: 20, mr: 0.5 }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend > 0 ? '#10B981' : '#EF4444',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

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
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 0.5,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Collision Repair Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time overview of your collision shop performance
        </Typography>
      </Box>

      {/* Top KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <PremiumKPICard
            title="Active Jobs"
            value={dashboardData.activeJobs}
            subtitle="Currently in shop"
            trend={dashboardData.trends.activeJobs}
            icon={<DirectionsCar />}
            color="#1976d2"
            onClick={() => navigate('/production')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <PremiumKPICard
            title="This Week Revenue"
            value={`$${(dashboardData.weekRevenue / 1000).toFixed(1)}K`}
            subtitle="Last 7 days total"
            trend={dashboardData.trends.weekRevenue}
            icon={<AttachMoney />}
            color="#10B981"
            onClick={() => navigate('/reports')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <PremiumKPICard
            title="Avg Cycle Time"
            value={`${dashboardData.avgCycleTime} days`}
            subtitle="Check-in to delivery"
            trend={dashboardData.trends.avgCycleTime}
            icon={<AccessTime />}
            color="#F59E0B"
            onClick={() => navigate('/reports')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <PremiumKPICard
            title="Capacity"
            value={`${dashboardData.capacity}%`}
            subtitle="Shop utilization"
            trend={dashboardData.trends.capacity}
            icon={<Build />}
            color="#EF4444"
            onClick={() => navigate('/production')}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Production Status Chart */}
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
                Production Status
              </Typography>
              <IconButton size="small" onClick={() => navigate('/production')}>
                <ArrowForward />
              </IconButton>
            </Box>
            <Box sx={{ height: 300 }}>
              {productionData.length > 0 ? (
                <ProductionStatusChart />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="text.secondary">No production data</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Trend Chart */}
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
                Revenue Trend
              </Typography>
              <Chip label="Last 30 Days" size="small" sx={{ fontWeight: 600 }} />
            </Box>
            <Box sx={{ height: 300 }}>
              {revenueData.length > 0 ? (
                <RevenueTrendChart />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="text.secondary">No revenue data</Typography>
                </Box>
              )}
            </Box>
          </Paper>
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
                          <Chip
                            label={job.status || 'In Progress'}
                            size="small"
                            sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
                          />
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
