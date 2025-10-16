import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { jobService } from '../../services/jobService';
import JobDetailModal from '../../components/Jobs/JobDetailModal';

/**
 * JobsListPageClean - Clean jobs list page matching reference design
 * Features:
 * - Simple table layout with clear columns
 * - Status badges and priority chips
 * - View button to open job modal
 * - Search and filter controls
 * - Real-time API integration
 */
const JobsListPageClean = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load jobs from API
  useEffect(() => {
    loadJobs();
  }, []);

  // Debounced search and filter
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, priorityFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filter options
      const options = {
        search: searchTerm || undefined,
        filters: {}
      };

      // Add status filter if not "All Statuses"
      if (statusFilter && statusFilter !== 'All Statuses') {
        // Convert UI status to backend status format
        const statusMap = {
          'Intake': 'intake',
          'Estimating': 'estimate',
          'Awaiting Parts': 'parts_ordering',
          'In Production': 'body_structure',
          'Ready': 'ready_pickup',
          'Delivered': 'delivered'
        };
        options.filters.status = statusMap[statusFilter] || statusFilter.toLowerCase();
      }

      // Add priority filter if not "All Priorities"
      if (priorityFilter && priorityFilter !== 'All Priorities') {
        options.filters.priority = priorityFilter.toLowerCase();
      }

      const fetchedJobs = await jobService.getJobs(options);
      setJobs(fetchedJobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError(err.message || 'Failed to load jobs');
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';

    const statusLabels = {
      'estimate': 'Estimating',
      'intake': 'Intake',
      'teardown': 'Teardown',
      'parts_ordering': 'Awaiting Parts',
      'parts_receiving': 'Parts Receiving',
      'body_structure': 'In Production',
      'paint_prep': 'Paint Prep',
      'paint_booth': 'Painting',
      'reassembly': 'Reassembly',
      'qc_calibration': 'QC/Calibration',
      'detail': 'Detailing',
      'ready_pickup': 'Ready',
      'delivered': 'Delivered',
    };

    return statusLabels[status] || status;
  };

  // Format due date for display
  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';

    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (err) {
      return 'No due date';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'estimate': 'warning',
      'intake': 'default',
      'teardown': 'info',
      'parts_ordering': 'info',
      'parts_receiving': 'info',
      'body_structure': 'primary',
      'paint_prep': 'primary',
      'paint_booth': 'primary',
      'reassembly': 'primary',
      'qc_calibration': 'secondary',
      'detail': 'secondary',
      'ready_pickup': 'success',
      'delivered': 'success',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'default';

    const colors = {
      'low': 'success',
      'normal': 'info',
      'medium': 'info',
      'high': 'warning',
      'urgent': 'error',
      'rush': 'error',
    };
    return colors[priority.toLowerCase()] || 'default';
  };

  const handleJobClick = (job) => {
    // Navigate to RO detail page instead of showing modal
    navigate(`/ro/${job.id}`);
  };

  const handleJobModalClose = () => {
    setShowJobModal(false);
    setSelectedJob(null);
  };

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : 'background.default',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : 'background.default',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadJobs}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

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
              Jobs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all repair orders and job tracking
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

        {/* Job Management Card */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Header with Filters */}
            <Box
              sx={{
                p: 3,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Job Management
              </Typography>

              {/* Search and Filters */}
              <Stack direction="row" spacing={2}>
                <TextField
                  placeholder="Search jobs, customers, vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1, maxWidth: 400 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>All Statuses</InputLabel>
                  <Select
                    value={statusFilter}
                    label="All Statuses"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="All Statuses">All Statuses</MenuItem>
                    <MenuItem value="Intake">Intake</MenuItem>
                    <MenuItem value="Estimating">Estimating</MenuItem>
                    <MenuItem value="Awaiting Parts">Awaiting Parts</MenuItem>
                    <MenuItem value="In Production">In Production</MenuItem>
                    <MenuItem value="Ready">Ready</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>All Priorities</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="All Priorities"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="All Priorities">All Priorities</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Jobs Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>RO Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Promise Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Insurer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          No jobs found
                        </Typography>
                        {(searchTerm || statusFilter !== 'All Statuses' || priorityFilter !== 'All Priorities') && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Try adjusting your search or filters
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => handleJobClick(job)}
                    >
                      <TableCell>{job.roNumber}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {job.customer}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {job.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{job.vehicle}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatStatus(job.status)}
                          color={getStatusColor(job.status)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.priority ? job.priority.charAt(0).toUpperCase() + job.priority.slice(1) : 'Normal'}
                          color={getPriorityColor(job.priority)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{formatDueDate(job.dueDate)}</TableCell>
                      <TableCell>{job.insurer}</TableCell>
                      <TableCell>
                        <Button
                          variant="text"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJobClick(job);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
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

export default JobsListPageClean;
