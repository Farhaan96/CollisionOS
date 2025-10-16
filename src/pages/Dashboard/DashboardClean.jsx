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
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JobDetailModal from '../../components/Jobs/JobDetailModal';
import { useRealtimeJobs } from '../../hooks/useRealtimeData';
import { useJobStore } from '../../store/jobStore';
import { dashboardService } from '../../services/dashboardService';
import { toast } from 'react-hot-toast';

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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Dashboard stats - fetched from backend
  const [stats, setStats] = useState({
    activeJobs: 0,
    activeJobsTrend: 0,
    capacityToday: 0,
    avgCycleTime: 0,
    cycleTimeTrend: 0,
    revenueMTD: 0,
    revenueTrend: 0,
  });

  // Use real-time jobs data from the store
  const jobs = useJobStore(state => state.jobs);
  const fetchJobs = useJobStore(state => state.fetchJobs);
  const moveJob = useJobStore(state => state.moveJob);

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Listen for BMS import events
  useEffect(() => {
    const handleBMSImport = async (event) => {
      const { jobId } = event.detail;
      
      // Refresh jobs list
      await fetchJobs();
      
      // Find and open the newly created job
      if (jobId) {
        // Wait a bit for the job store to update
        setTimeout(() => {
          const newJob = jobs.find(j => j.id === jobId);
          if (newJob) {
            setSelectedJob(newJob);
            setShowJobModal(true);
          }
        }, 500);
      }
    };
    
    window.addEventListener('bmsImported', handleBMSImport);
    return () => window.removeEventListener('bmsImported', handleBMSImport);
  }, [fetchJobs, jobs]);

  // Organize jobs by status
  const jobBoard = {
    intake: jobs.filter(job => job.status === 'Intake' || job.status === 'intake'),
    estimating: jobs.filter(job => job.status === 'Estimating' || job.status === 'estimating'),
    awaitingParts: jobs.filter(job => job.status === 'Awaiting Parts' || job.status === 'awaiting_parts'),
    inProduction: jobs.filter(job => job.status === 'In Production' || job.status === 'in_production'),
    ready: jobs.filter(job => job.status === 'Ready' || job.status === 'ready'),
  };

  // Get filtered jobs based on notification type
  const getFilteredJobs = (filterKey) => {
    const allJobs = [
      ...jobBoard.intake,
      ...jobBoard.estimating,
      ...jobBoard.awaitingParts,
      ...jobBoard.inProduction,
      ...jobBoard.ready,
    ];

    switch (filterKey) {
      case 'lateJobs':
        // Filter jobs that are late (past due date)
        return allJobs.filter(
          (job) => job.dueDate && job.dueDate !== 'No due date' && new Date(job.dueDate) < new Date()
        );
      case 'awaitingParts':
        // Filter jobs in "Awaiting Parts" status
        return allJobs.filter((job) => job.status === 'Awaiting Parts');
      case 'rentalRequired':
        // Filter jobs that have rental coverage
        return allJobs.filter((job) => job.rentalCoverage === true);
      default:
        return [];
    }
  };

  // Job board status tabs with DYNAMIC counts calculated from actual filtered jobs
  const statusTabs = [
    {
      label: 'Late Jobs',
      count: getFilteredJobs('lateJobs').length,
      color: 'error',
      badgeColor: '#ef4444',
      filterKey: 'lateJobs',
    },
    {
      label: 'Awaiting Parts',
      count: getFilteredJobs('awaitingParts').length,
      color: 'warning',
      badgeColor: '#f59e0b',
      filterKey: 'awaitingParts',
    },
    {
      label: 'Rental Required',
      count: getFilteredJobs('rentalRequired').length,
      color: 'info',
      badgeColor: '#3b82f6',
      filterKey: 'rentalRequired',
    },
  ];

  // Status columns for job board - with dynamic counts
  const statusColumns = [
    { id: 'intake', label: 'Intake', count: jobBoard.intake.length, color: 'default' },
    { id: 'estimating', label: 'Estimating', count: jobBoard.estimating.length, color: 'warning' },
    { id: 'awaitingParts', label: 'Awaiting Parts', count: jobBoard.awaitingParts.length, color: 'info' },
    { id: 'inProduction', label: 'In Production', count: jobBoard.inProduction.length, color: 'primary' },
    { id: 'ready', label: 'Ready', count: jobBoard.ready.length, color: 'success' },
  ];

  // Load dashboard data from backend
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats from backend API
        const statsData = await dashboardService.getKPIs('month');

        if (statsData) {
          // Map backend response to dashboard stats
          setStats({
            activeJobs: statsData.totalJobs?.current || 0,
            activeJobsTrend: statsData.totalJobs?.change || 0,
            capacityToday: Math.min(100, Math.round((statsData.totalJobs?.inProgress || 0) / 30 * 100)), // Assume 30 is max capacity
            avgCycleTime: statsData.cycleTime?.current || 0,
            cycleTimeTrend: statsData.cycleTime?.change || 0,
            revenueMTD: statsData.revenue?.current || 0,
            revenueTrend: statsData.revenue?.change || 0,
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard statistics');
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

  // Handle job status change - move job between columns
  const handleJobStatusChange = async (jobId, newStatus) => {
    console.log('Dashboard: handleJobStatusChange called', { jobId, newStatus });

    try {
      const result = await moveJob(jobId, newStatus);

      if (result.success) {
        console.log(`Job ${jobId} moved to ${newStatus} successfully`);
        // The job store will handle the UI update automatically via Zustand reactivity
      } else {
        console.error('Failed to move job:', result.error);
        alert(`Failed to move job: ${result.error}`);
      }
    } catch (error) {
      console.error('Error moving job:', error);
      alert(`Error moving job: ${error.message}`);
    }
  };

  // Update status counts
  const updateStatusCounts = () => {
    // This would normally update the statusColumns state
    // For now, counts are recalculated in render
  };

  // Handle notification badge click
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  // Handle notification modal close
  const handleNotificationModalClose = () => {
    setShowNotificationModal(false);
    setSelectedNotification(null);
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
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
              }}
              onClick={() => navigate('/bms-import')}
            >
              Import Estimates
            </Button>
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
                    onClick={() => handleNotificationClick(tab)}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: tab.badgeColor,
                        bgcolor: alpha(tab.badgeColor, 0.08),
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Job Board Columns */}
            <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
              {statusColumns.map((column) => {
                const columnJobs = jobBoard[column.id] || [];
                return (
                  <Box
                    key={column.id}
                    sx={{
                      flex: 1,
                      bgcolor:
                        theme.palette.mode === 'light'
                          ? '#f8fafc'
                          : 'rgba(255,255,255,0.02)',
                      borderRadius: 2,
                      p: 2.5,
                      minHeight: 500,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor:
                          theme.palette.mode === 'light'
                            ? alpha(theme.palette.primary.main, 0.04)
                            : 'rgba(255,255,255,0.04)',
                      },
                    }}
                  >
                    {/* Column Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2.5,
                        pb: 2,
                        borderBottom: 2,
                        borderColor: 'divider',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, fontSize: '0.9rem' }}
                      >
                        {column.label}
                      </Typography>
                      <Chip
                        label={columnJobs.length}
                        size="small"
                        sx={{
                          height: 22,
                          minWidth: 22,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor:
                            theme.palette.mode === 'light'
                              ? 'white'
                              : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    </Box>

                    {/* Job Cards */}
                    <Box sx={{ flex: 1 }}>
                      {columnJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                      {columnJobs.length === 0 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: 'center', py: 6, mt: 4 }}
                        >
                          No jobs
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
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

      {/* Notification Modal - Shows filtered jobs */}
      <Dialog
        open={showNotificationModal}
        onClose={handleNotificationModalClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.default',
          },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedNotification?.label}
              </Typography>
              <Chip
                label={
                  selectedNotification
                    ? getFilteredJobs(selectedNotification.filterKey).length
                    : 0
                }
                size="small"
                sx={{
                  bgcolor: selectedNotification?.badgeColor,
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            </Box>
            <IconButton onClick={handleNotificationModalClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {selectedNotification &&
            getFilteredJobs(selectedNotification.filterKey).length > 0 ? (
              getFilteredJobs(selectedNotification.filterKey).map((job) => (
                <Card
                  key={job.id}
                  variant="outlined"
                  onClick={() => {
                    handleNotificationModalClose();
                    handleJobClick(job);
                  }}
                  sx={{
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="start"
                      mb={1.5}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {job.roNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {job.customer}
                        </Typography>
                      </Box>
                      <Chip
                        label={job.status}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      {job.vehicle}
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="body2" color="text.secondary">
                        <strong>Insurer:</strong> {job.insurer}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Priority:</strong> {job.priority}
                      </Typography>
                      {job.dueDate && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Due:</strong> {job.dueDate}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box py={4} textAlign="center">
                <Typography color="text.secondary">
                  No jobs found for this notification
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Job Detail Modal */}
      <JobDetailModal
        open={showJobModal}
        onClose={handleJobModalClose}
        job={selectedJob}
        onStatusChange={handleJobStatusChange}
      />
    </Box>
  );
};

export default DashboardClean;
