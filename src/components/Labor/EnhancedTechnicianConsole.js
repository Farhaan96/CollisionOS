import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccessTime,
  Work,
  Assessment,
  Timeline,
  Speed,
  EmojiEvents,
} from '@mui/icons-material';
import LaborTimeClock from './LaborTimeClock';
import JobCostingDashboard from './JobCostingDashboard';
import laborService from '../../services/laborService';

const EnhancedTechnicianConsole = ({ technicianId, jobs = [], currentUser }) => {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProductivity();
    loadActiveSessions();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadActiveSessions();
    }, 30000);

    return () => clearInterval(interval);
  }, [technicianId]);

  const loadProductivity = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const data = await laborService.getProductivity(
        technicianId,
        startDate.toISOString(),
        new Date().toISOString()
      );
      setProductivity(data);
    } catch (err) {
      console.error('Error loading productivity:', err);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const data = await laborService.getActiveSessions();
      setActiveSessions(data.activeSessions || []);
    } catch (err) {
      console.error('Error loading active sessions:', err);
    }
  };

  const handleTimeClockUpdate = (response) => {
    // Refresh productivity data after time clock operations
    loadProductivity();
    loadActiveSessions();
  };

  // Technician stats card
  const TechnicianStats = () => {
    if (!productivity) return null;

    const { metrics, comparison } = productivity;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={currentUser?.avatar}
              sx={{ width: 64, height: 64, mr: 2 }}
            >
              {currentUser?.name?.charAt(0) || 'T'}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {currentUser?.name || 'Technician'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser?.email || ''}
              </Typography>
              {currentUser?.specialties && (
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {currentUser.specialties.map((specialty, idx) => (
                    <Chip key={idx} size="small" label={specialty} variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <AccessTime sx={{ mr: 0.5, color: theme.palette.primary.main }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Hours
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {metrics.totalHours.toFixed(1)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <Work sx={{ mr: 0.5, color: theme.palette.success.main }} />
                  <Typography variant="body2" color="text.secondary">
                    Billable Hours
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {metrics.billableHours.toFixed(1)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <Speed sx={{ mr: 0.5, color: theme.palette.info.main }} />
                  <Typography variant="body2" color="text.secondary">
                    Efficiency
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="info.main">
                  {metrics.efficiency.toFixed(0)}%
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <EmojiEvents sx={{ mr: 0.5, color: theme.palette.warning.main }} />
                  <Typography variant="body2" color="text.secondary">
                    Jobs Worked
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  {metrics.jobsWorked}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Performance comparison */}
          {comparison && (
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Performance vs Shop Average
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`Utilization: ${comparison.performance.utilizationVsShop > 0 ? '+' : ''}${comparison.performance.utilizationVsShop.toFixed(1)}%`}
                  color={comparison.performance.utilizationVsShop > 0 ? 'success' : 'error'}
                />
                <Chip
                  size="small"
                  label={`Efficiency: ${comparison.performance.efficiencyVsIndustry > 0 ? '+' : ''}${comparison.performance.efficiencyVsIndustry.toFixed(1)}%`}
                  color={comparison.performance.efficiencyVsIndustry > 0 ? 'success' : 'error'}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Active jobs list
  const ActiveJobsList = () => {
    if (jobs.length === 0) {
      return (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No active jobs assigned
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Grid container spacing={2}>
        {jobs.map((job) => (
          <Grid item xs={12} md={6} key={job.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedJob?.id === job.id ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                borderColor: selectedJob?.id === job.id ? theme.palette.primary.main : theme.palette.divider,
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              }}
              onClick={() => {
                setSelectedJob(job);
                setActiveTab(2); // Switch to job costing tab
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {job.jobNumber || `Job #${job.id}`}
                  </Typography>
                  <Chip
                    size="small"
                    label={job.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    color={
                      job.status === 'completed'
                        ? 'success'
                        : job.status === 'in_progress'
                        ? 'primary'
                        : 'default'
                    }
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {job.customer?.name || 'Unknown Customer'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {job.vehicle?.year || ''} {job.vehicle?.make || ''} {job.vehicle?.model || ''}
                </Typography>

                {job.priority === 'high' && (
                  <Chip size="small" label="HIGH PRIORITY" color="error" sx={{ mt: 1 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <TechnicianStats />

      {/* Main content */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2 }}
        >
          <Tab icon={<AccessTime />} iconPosition="start" label="Time Clock" />
          <Tab icon={<Work />} iconPosition="start" label="My Jobs" />
          <Tab icon={<Assessment />} iconPosition="start" label="Job Costing" disabled={!selectedJob} />
          <Tab icon={<Timeline />} iconPosition="start" label="Productivity" />
        </Tabs>

        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
          {/* Time Clock Tab */}
          {activeTab === 0 && (
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <LaborTimeClock
                technicianId={technicianId}
                jobs={jobs}
                onUpdate={handleTimeClockUpdate}
              />
            </Box>
          )}

          {/* My Jobs Tab */}
          {activeTab === 1 && <ActiveJobsList />}

          {/* Job Costing Tab */}
          {activeTab === 2 && selectedJob && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Job Costing: {selectedJob.jobNumber || `Job #${selectedJob.id}`}
              </Typography>
              <JobCostingDashboard
                jobId={selectedJob.id}
                userRole={currentUser?.role || 'technician'}
              />
            </Box>
          )}

          {/* Productivity Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                My Productivity
              </Typography>

              {productivity && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          This Week's Performance
                        </Typography>

                        <Box sx={{ my: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Utilization</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {productivity.metrics.utilization.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              position: 'relative',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${productivity.metrics.utilization}%`,
                                borderRadius: 4,
                                bgcolor: theme.palette.primary.main,
                              }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ my: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Efficiency</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {productivity.metrics.efficiency.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: alpha(theme.palette.success.main, 0.2),
                              position: 'relative',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${productivity.metrics.efficiency}%`,
                                borderRadius: 4,
                                bgcolor: theme.palette.success.main,
                              }}
                            />
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Average Hourly Rate: ${productivity.metrics.averageHourlyRate.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Earnings: ${productivity.metrics.totalEarnings.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recommendations
                        </Typography>

                        {productivity.recommendations && productivity.recommendations.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {productivity.recommendations.map((rec, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                                }}
                              >
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                  {rec.message}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {rec.action}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Great work! Keep up the excellent performance.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default EnhancedTechnicianConsole;
