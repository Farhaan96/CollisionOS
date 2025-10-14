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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import JobDetailModal from '../../components/Jobs/JobDetailModal';

/**
 * JobsListPageClean - Clean jobs list page matching reference design
 * Features:
 * - Simple table layout with clear columns
 * - Status badges and priority chips
 * - View button to open job modal
 * - Search and filter controls
 */
const JobsListPageClean = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');

  // Mock jobs data
  const [jobs, setJobs] = useState([
    {
      id: 1,
      roNumber: 'RO-2025-002',
      customer: 'Sarah Johnson',
      phone: '604-555-1212',
      vehicle: '2020 Toyota Camry',
      status: 'Awaiting Parts',
      priority: 'Medium',
      promiseDate: 'No due date',
      insurer: 'ICBC',
      estimator: 'Test Estimator',
      claimNumber: 'CLMwfU7QQ',
      rentalCoverage: false,
    },
    {
      id: 2,
      roNumber: 'RO-2025-001',
      customer: 'Sarah Johnson',
      phone: '604-555-1212',
      vehicle: '2020 Toyota Camry',
      status: 'Estimating',
      priority: 'Medium',
      promiseDate: 'No due date',
      insurer: 'ICBC',
      estimator: 'Test Estimator',
      claimNumber: 'CLMwfU7QQ',
      rentalCoverage: false,
    },
  ]);

  const getStatusColor = (status) => {
    const colors = {
      Intake: 'default',
      Estimating: 'warning',
      'Awaiting Parts': 'info',
      'In Production': 'primary',
      Ready: 'success',
      Delivered: 'success',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'success',
      Medium: 'info',
      High: 'warning',
      Urgent: 'error',
    };
    return colors[priority] || 'default';
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleJobModalClose = () => {
    setShowJobModal(false);
    setSelectedJob(null);
  };

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
                  {jobs.map((job) => (
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
                          label={job.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor:
                              job.status === 'Awaiting Parts'
                                ? '#000'
                                : 'default',
                            color:
                              job.status === 'Awaiting Parts'
                                ? '#fff'
                                : 'inherit',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.priority}
                          color={getPriorityColor(job.priority)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{job.promiseDate}</TableCell>
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
                  ))}
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
