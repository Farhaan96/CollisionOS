import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JobDetailModal from '../../components/Jobs/JobDetailModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

/**
 * DashboardClean - Clean, modern dashboard matching reference design
 * Features:
 * - Simple KPI cards at top
 * - Job Board with horizontal status columns
 * - Click cards to open job modal (not draggable)
 * - Clean typography and spacing
 */
const DashboardClean = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    activeJobs: 2,
    activeJobsTrend: 12,
    capacityToday: 26,
    avgCycleTime: 8.5,
    cycleTimeTrend: 5,
    revenueMTD: 89200,
    revenueTrend: 18,
  });

  // Job board data by status
  const [jobBoard, setJobBoard] = useState({
    intake: [],
    estimating: [
      {
        id: 1,
        roNumber: 'RO-2025-001',
        customer: 'Sarah Johnson',
        vehicle: '2020 Toyota Camry',
        insurer: 'ICBC',
        status: 'Estimating',
        priority: 'Medium',
        dueDate: 'No due date',
        estimator: 'Test Estimator',
        claimNumber: 'CLMwfU7QQ',
        rentalCoverage: false,
      },
    ],
    awaitingParts: [
      {
        id: 2,
        roNumber: 'RO-2025-002',
        customer: 'Sarah Johnson',
        phone: '604-555-1212',
        vehicle: '2020 Toyota Camry',
        insurer: 'ICBC',
        status: 'Awaiting Parts',
        priority: 'Medium',
        dueDate: 'No due date',
        estimator: 'Test Estimator',
        claimNumber: 'CLMwfU7QQ',
        rentalCoverage: false,
      },
    ],
    inProduction: [],
    ready: [],
  });

  // Job board status tabs with counts
  const statusTabs = [
    { label: 'Late Jobs', count: 2, color: 'error', badgeColor: '#ef4444' },
    { label: 'Awaiting Parts', count: 1, color: 'warning', badgeColor: '#f59e0b' },
    { label: 'Rental Required', count: 2, color: 'info', badgeColor: '#3b82f6' },
  ];

  // Status columns for job board
  const statusColumns = [
    { id: 'intake', label: 'Intake', count: 0, color: 'default' },
    { id: 'estimating', label: 'Estimating', count: 1, color: 'warning' },
    { id: 'awaitingParts', label: 'Awaiting Parts', count: 1, color: 'info' },
    { id: 'inProduction', label: 'In Production', count: 0, color: 'primary' },
    { id: 'ready', label: 'Ready', count: 0, color: 'success' },
  ];

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // API calls would go here
        // For now using mock data
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Handle job card click
  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  // Handle job modal close
  const handleJobModalClose = () => {
    setShowJobModal(false);
    setSelectedJob(null);
  };

  // Simple KPI Card Component
  const KPICard = ({ title, value, trend, subtitle }) => (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        height: '100%',
      }}
    >
      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, fontWeight: 500 }}
        >
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value}
        </Typography>
        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5}>
            {trend > 0 ? (
              <TrendingUp sx={{ fontSize: 16, color: '#10b981' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: '#ef4444' }} />
            )}
            <Typography
              variant="body2"
              sx={{ color: trend > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}
            >
              {Math.abs(trend)}% from last month
            </Typography>
          </Box>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Job Card Component
  const JobCard = ({ job }) => (
    <Card
      variant="outlined"
      onClick={() => handleJobClick(job)}
      sx={{
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main',
        },
        mb: 1.5,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {job.roNumber}
          </Typography>
          <Chip
            label={job.status}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {job.vehicle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {job.customer}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {job.insurer}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {job.dueDate}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : 'background.default',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, Farhaan
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
            onClick={() => navigate('/jobs/new')}
          >
            New Job
          </Button>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Active Jobs"
              value={stats.activeJobs}
              trend={stats.activeJobsTrend}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Capacity Today"
              value={`${stats.capacityToday}%`}
              subtitle="Shop utilization"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Avg. Cycle Time"
              value={`${stats.avgCycleTime}d`}
              trend={stats.cycleTimeTrend}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Revenue MTD"
              value={`$${(stats.revenueMTD / 1000).toFixed(1)}k`}
              trend={stats.revenueTrend}
            />
          </Grid>
        </Grid>

        {/* Job Board */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Job Board Header */}
            <Box
              sx={{
                p: 3,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Job Board
              </Typography>
              <Box display="flex" gap={1}>
                {statusTabs.map((tab) => (
                  <Chip
                    key={tab.label}
                    label={
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {tab.label}
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 20,
                            height: 20,
                            borderRadius: '10px',
                            bgcolor: tab.badgeColor,
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            px: 0.75,
                          }}
                        >
                          {tab.count}
                        </Box>
                      </Box>
                    }
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Box>

            {/* Job Board Columns */}
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {statusColumns.map((column) => (
                  <Grid item xs={12} sm={6} md={2.4} key={column.id}>
                    <Box>
                      {/* Column Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {column.label}
                        </Typography>
                        <Chip
                          label={column.count}
                          size="small"
                          sx={{
                            height: 20,
                            minWidth: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        />
                      </Box>

                      {/* Job Cards */}
                      <Box sx={{ minHeight: 300 }}>
                        {jobBoard[column.id]?.map((job) => (
                          <JobCard key={job.id} job={job} />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Tech Capacity Overview */}
        <Box mt={4}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Tech Capacity Overview
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 2, p: 3 }}>
            <Typography color="text.secondary">
              Technician capacity and workload coming soon...
            </Typography>
          </Card>
        </Box>
      </Container>

      {/* Job Detail Modal */}
      <JobDetailModal
        open={showJobModal}
        onClose={handleJobModalClose}
        job={selectedJob}
      />
    </Box>
  );
};

export default DashboardClean;
