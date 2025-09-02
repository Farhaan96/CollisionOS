import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Select,
  FormControl,
  MenuItem,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Menu,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  DirectionsCar,
  Person,
  Assignment,
  CheckCircle,
  Build,
  ColorLens,
  Construction,
  VisibilityOutlined,
  LocalShipping,
  Done,
  Edit,
  Print,
  Phone,
  Email,
} from '@mui/icons-material';

// Enhanced collision repair workflow stages
const WORKFLOW_STAGES = [
  {
    id: 'estimate',
    label: 'Estimate',
    description: 'Initial damage assessment and cost estimation',
    color: '#1976d2',
    icon: <Assignment />,
    order: 1,
  },
  {
    id: 'approved',
    label: 'Approved',
    description: 'Customer and insurance approved',
    color: '#2e7d32',
    icon: <CheckCircle />,
    order: 2,
  },
  {
    id: 'parts_ordered',
    label: 'Parts Ordered',
    description: 'Parts sourcing and ordering',
    color: '#ed6c02',
    icon: <LocalShipping />,
    order: 3,
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    description: 'Active repair work and disassembly',
    color: '#d32f2f',
    icon: <Build />,
    order: 4,
  },
  {
    id: 'paint',
    label: 'Paint',
    description: 'Body prep and paint application',
    color: '#7b1fa2',
    icon: <ColorLens />,
    order: 5,
  },
  {
    id: 'assembly',
    label: 'Assembly',
    description: 'Final assembly and installation',
    color: '#1565c0',
    icon: <Construction />,
    order: 6,
  },
  {
    id: 'quality_check',
    label: 'Quality Check',
    description: 'Final inspection and quality control',
    color: '#f57c00',
    icon: <VisibilityOutlined />,
    order: 7,
  },
  {
    id: 'ready_pickup',
    label: 'Ready for Pickup',
    description: 'Complete and awaiting customer',
    color: '#388e3c',
    icon: <Done />,
    order: 8,
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Job delivered to customer',
    color: '#4caf50',
    icon: <CheckCircle />,
    order: 9,
  },
];

const ProductionBoardTable = ({
  jobs = [],
  onJobMove,
  onJobUpdate,
  onJobClick,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [updatingJobs, setUpdatingJobs] = useState(new Set());
  const [jobMenuAnchor, setJobMenuAnchor] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Get stage configuration by ID
  const getStageConfig = (stageId) => {
    return WORKFLOW_STAGES.find(stage => stage.id === stageId) || WORKFLOW_STAGES[0];
  };

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        (job.jobNumber && job.jobNumber.toLowerCase().includes(search)) ||
        (job.customer?.name && job.customer.name.toLowerCase().includes(search)) ||
        (job.vehicle?.make && job.vehicle.make.toLowerCase().includes(search)) ||
        (job.vehicle?.model && job.vehicle.model.toLowerCase().includes(search)) ||
        (job.vehicle?.vin && job.vehicle.vin.toLowerCase().includes(search)) ||
        (job.vehicle?.licensePlate && job.vehicle.licensePlate.toLowerCase().includes(search)) ||
        (job.insurance?.claimNumber && job.insurance.claimNumber.toLowerCase().includes(search))
      );
    }

    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(job => job.status === stageFilter);
    }

    // Sort by stage order, then by creation date
    return filtered.sort((a, b) => {
      const stageA = getStageConfig(a.status);
      const stageB = getStageConfig(b.status);
      
      if (stageA.order !== stageB.order) {
        return stageA.order - stageB.order;
      }
      
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [jobs, searchTerm, stageFilter]);

  // Handle stage change with error handling and optimistic updates
  const handleStageChange = async (job, newStage) => {
    if (!onJobMove || job.status === newStage) return;

    const jobId = job.id;
    setUpdatingJobs(prev => new Set(prev).add(jobId));

    try {
      const result = await onJobMove(job, newStage);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to update job stage');
      }
      
      console.log(`Successfully moved job ${jobId} to ${newStage}`);
    } catch (error) {
      console.error(`Error updating job ${jobId}:`, error);
      // Could show a toast notification here
    } finally {
      setUpdatingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  // Get stage statistics
  const stageStats = useMemo(() => {
    const stats = {};
    WORKFLOW_STAGES.forEach(stage => {
      stats[stage.id] = jobs.filter(job => job.status === stage.id).length;
    });
    return stats;
  }, [jobs]);

  const handleJobMenuClick = (event, job) => {
    event.stopPropagation();
    setSelectedJob(job);
    setJobMenuAnchor(event.currentTarget);
  };

  const handleJobMenuClose = () => {
    setJobMenuAnchor(null);
    setSelectedJob(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }} color="text.secondary">
          Loading production board...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Field */}
          <TextField
            placeholder="Search by job #, customer, vehicle, VIN, plate, or claim #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {/* Stage Filter */}
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              displayEmpty
              startAdornment={<FilterList sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">
                All Stages ({jobs.length})
              </MenuItem>
              {WORKFLOW_STAGES.map(stage => (
                <MenuItem key={stage.id} value={stage.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {stage.icon}
                    {stage.label}
                    <Badge 
                      badgeContent={stageStats[stage.id]} 
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Quick Stats */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {WORKFLOW_STAGES.slice(0, 5).map(stage => (
            <Chip
              key={stage.id}
              label={`${stage.label}: ${stageStats[stage.id]}`}
              size="small"
              sx={{
                bgcolor: alpha(stage.color, 0.1),
                color: stage.color,
                border: `1px solid ${alpha(stage.color, 0.3)}`,
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Production Table */}
      <TableContainer component={Paper} sx={{ flex: 1 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width="120px">Job #</TableCell>
              <TableCell width="180px">Customer</TableCell>
              <TableCell width="200px">Vehicle</TableCell>
              <TableCell width="180px">Current Stage</TableCell>
              <TableCell width="120px">Days in Shop</TableCell>
              <TableCell width="100px">Estimate</TableCell>
              <TableCell width="180px">Insurance</TableCell>
              <TableCell width="80px" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    {searchTerm || stageFilter !== 'all' 
                      ? 'No jobs match your current filters' 
                      : 'No jobs in production'
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => {
                const stage = getStageConfig(job.status);
                const isUpdating = updatingJobs.has(job.id);
                const daysInShop = job.daysInShop || 
                  (job.startDate ? Math.ceil((new Date() - new Date(job.startDate)) / (1000 * 60 * 60 * 24)) : '-');

                return (
                  <TableRow
                    key={job.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      opacity: isUpdating ? 0.7 : 1,
                      '&:hover': {
                        bgcolor: alpha(stage.color, 0.05),
                      },
                    }}
                    onClick={() => onJobClick?.(job)}
                  >
                    {/* Job Number */}
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        {job.jobNumber || job.id}
                      </Typography>
                      {isUpdating && <LinearProgress sx={{ mt: 0.5 }} />}
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {job.customer?.name || 'Unknown'}
                        </Typography>
                        {job.customer?.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Phone sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {job.customer.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    {/* Vehicle */}
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <DirectionsCar sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {job.vehicle ? 
                              `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}` : 
                              'No vehicle info'
                            }
                          </Typography>
                        </Box>
                        {job.vehicle?.licensePlate && (
                          <Typography variant="caption" color="text.secondary">
                            Plate: {job.vehicle.licensePlate}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Stage Selector */}
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={job.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStageChange(job, e.target.value);
                          }}
                          disabled={isUpdating}
                          sx={{
                            '& .MuiSelect-select': {
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: stage.color,
                              fontWeight: 'medium',
                            },
                          }}
                        >
                          {WORKFLOW_STAGES.map(workflowStage => (
                            <MenuItem key={workflowStage.id} value={workflowStage.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {workflowStage.icon}
                                <Typography variant="body2">
                                  {workflowStage.label}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Days in Shop */}
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={daysInShop > 10 ? 'error' : daysInShop > 5 ? 'warning.main' : 'text.primary'}
                        fontWeight="medium"
                      >
                        {daysInShop}
                      </Typography>
                    </TableCell>

                    {/* Estimate */}
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {job.estimateTotal ? `$${job.estimateTotal.toLocaleString()}` : '-'}
                      </Typography>
                    </TableCell>

                    {/* Insurance */}
                    <TableCell>
                      {job.insurance ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {job.insurance.company}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {job.insurance.claimNumber}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Tooltip title="More actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleJobMenuClick(e, job)}
                          disabled={isUpdating}
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Job Actions Menu */}
      <Menu
        anchorEl={jobMenuAnchor}
        open={Boolean(jobMenuAnchor)}
        onClose={handleJobMenuClose}
      >
        <MenuItem onClick={handleJobMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit Job Details
        </MenuItem>
        <MenuItem onClick={handleJobMenuClose}>
          <Person sx={{ mr: 1 }} />
          Assign Technician
        </MenuItem>
        <MenuItem onClick={handleJobMenuClose}>
          <Print sx={{ mr: 1 }} />
          Print Work Order
        </MenuItem>
        {selectedJob?.customer?.phone && (
          <MenuItem onClick={handleJobMenuClose}>
            <Phone sx={{ mr: 1 }} />
            Call Customer
          </MenuItem>
        )}
        {selectedJob?.customer?.email && (
          <MenuItem onClick={handleJobMenuClose}>
            <Email sx={{ mr: 1 }} />
            Email Customer
          </MenuItem>
        )}
      </Menu>

      {/* Summary Footer */}
      <Paper sx={{ p: 1, mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Showing {filteredJobs.length} of {jobs.length} jobs
          {searchTerm && ` matching "${searchTerm}"`}
          {stageFilter !== 'all' && ` in ${getStageConfig(stageFilter).label}`}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProductionBoardTable;