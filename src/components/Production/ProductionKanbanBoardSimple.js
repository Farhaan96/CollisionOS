import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  alpha,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Assignment,
  DirectionsCar,
  Build,
  Person,
  Add,
  Refresh,
  Edit,
  Print,
  Share,
} from '@mui/icons-material';

// Production workflow columns - simplified 4-stage collision repair workflow
const PRODUCTION_COLUMNS = [
  {
    id: 'estimate',
    title: 'Estimate',
    description: 'Initial damage assessment and cost estimation',
    color: '#2196F3',
    icon: <Assignment />,
    maxJobs: null,
  },
  {
    id: 'approved',
    title: 'Approved',
    description: 'Customer and insurance approved - ready for work',
    color: '#4CAF50',
    icon: <CheckCircle />,
    maxJobs: null,
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Active repair work (parts, bodywork, paint)',
    color: '#FF9800',
    icon: <Build />,
    maxJobs: null,
  },
  {
    id: 'completed',
    title: 'Complete',
    description: 'Finished and ready for customer pickup',
    color: '#4CAF50',
    icon: <CheckCircle />,
    maxJobs: null,
  },
];

const ProductionKanbanBoardSimple = ({
  jobs = [],
  onJobMove,
  onJobUpdate,
  onJobClick,
  onCustomerCreate,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();
  const [jobMenuAnchor, setJobMenuAnchor] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [movingJobs, setMovingJobs] = useState(new Set()); // Track which jobs are being moved

  // Group jobs by status
  const jobsByColumn = PRODUCTION_COLUMNS.reduce((acc, column) => {
    acc[column.id] = jobs.filter(job => job.status === column.id);
    return acc;
  }, {});

  // Handle job status change with better error handling and loading states
  const handleJobStatusChange = useCallback(
    async (job, newStatus) => {
      if (!onJobMove) {
        console.warn('No job move handler provided');
        return;
      }

      // Prevent moving to the same status
      if (job.status === newStatus) {
        return;
      }

      // Mark job as being moved
      setMovingJobs(prev => new Set(prev).add(job.id));

      try {
        const result = await onJobMove(job, newStatus);

        if (!result) {
          console.error('Job move failed: No result returned');
          return;
        }

        if (!result.success) {
          console.error('Job move failed:', result.error || 'Unknown error');
          return;
        }

        console.log(
          `Successfully moved job ${job.id} from ${job.status} to ${newStatus}`
        );
      } catch (error) {
        console.error('Error moving job:', error);
      } finally {
        // Remove job from moving state
        setMovingJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(job.id);
          return newSet;
        });
      }
    },
    [onJobMove]
  );

  // Job card component with dropdown-based stage selection
  const JobCard = ({ job, column }) => {
    const isMoving = movingJobs.has(job.id);

    return (
      <Card
        sx={{
          mb: 1,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          opacity: isMoving ? 0.7 : 1,
          '&:hover': {
            transform: isMoving ? 'none' : 'translateY(-2px)',
            boxShadow: isMoving ? 'none' : theme.shadows[4],
          },
          border: `1px solid ${alpha(column.color, 0.3)}`,
          borderLeft: `4px solid ${column.color}`,
          position: 'relative',
        }}
        onClick={() => !isMoving && onJobClick?.(job)}
      >
        {/* Loading overlay */}
        {isMoving && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
              borderRadius: 1,
            }}
          >
            <CircularProgress size={20} />
          </Box>
        )}

        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Job Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Box>
              <Typography variant='subtitle2' fontWeight='bold' color='primary'>
                {job.jobNumber || job.id}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {job.customer?.name || 'Unknown Customer'}
              </Typography>
            </Box>
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation();
                setSelectedJob(job);
                setJobMenuAnchor(e.currentTarget);
              }}
            >
              <MoreVert fontSize='small' />
            </IconButton>
          </Box>

          {/* Vehicle Info */}
          {job.vehicle && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DirectionsCar
                sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }}
              />
              <Typography variant='caption' color='text.secondary'>
                {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
              </Typography>
            </Box>
          )}

          {/* Insurance Info */}
          {job.insurance && (
            <Box sx={{ mb: 1 }}>
              <Chip
                label={`${job.insurance.company} - ${job.insurance.claimNumber}`}
                size='small'
                variant='outlined'
                sx={{ fontSize: '0.65rem' }}
              />
            </Box>
          )}

          {/* Stage Selector Dropdown */}
          <Box sx={{ mt: 1 }}>
            <FormControl size='small' fullWidth>
              <InputLabel>Change Stage</InputLabel>
              <Select
                value={job.status}
                onChange={e => {
                  e.stopPropagation();
                  if (e.target.value !== job.status && !isMoving) {
                    handleJobStatusChange(job, e.target.value);
                  }
                }}
                disabled={isMoving}
                label='Change Stage'
                sx={{
                  fontSize: '0.8rem',
                  height: 32,
                }}
              >
                {PRODUCTION_COLUMNS.map(stage => (
                  <MenuItem key={stage.id} value={stage.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stage.icon}
                      <Typography variant='body2'>{stage.title}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Job Details */}
          {job.estimateTotal && (
            <Box
              sx={{
                mt: 1,
                pt: 1,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Est: ${job.estimateTotal}
              </Typography>
              {job.daysInShop && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ ml: 2 }}
                >
                  Days: {job.daysInShop}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <Typography variant='h6' color='text.secondary'>
          Loading jobs...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Error Message */}
      {error && (
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
          <Typography variant='body2' color='error'>
            {error}
          </Typography>
        </Box>
      )}

      {/* Kanban Board */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gap: 2,
          p: 2,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {PRODUCTION_COLUMNS.map(column => {
          const columnJobs = jobsByColumn[column.id] || [];
          const isAtCapacity =
            column.maxJobs && columnJobs.length >= column.maxJobs;

          return (
            <Box
              key={column.id}
              sx={{
                minWidth: 280,
                maxWidth: 280,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: alpha(column.color, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(column.color, 0.2)}`,
              }}
            >
              {/* Column Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${alpha(column.color, 0.2)}`,
                  bgcolor: alpha(column.color, 0.1),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: column.color,
                      mr: 1,
                    }}
                  >
                    {column.icon}
                  </Box>
                  <Typography variant='subtitle2' fontWeight='bold'>
                    {column.title}
                  </Typography>
                  <Badge
                    badgeContent={columnJobs.length}
                    color={isAtCapacity ? 'error' : 'primary'}
                    sx={{ ml: 'auto' }}
                  />
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  {column.description}
                </Typography>
                {column.maxJobs && (
                  <Typography
                    variant='caption'
                    color={isAtCapacity ? 'error' : 'text.secondary'}
                    display='block'
                  >
                    Capacity: {columnJobs.length}/{column.maxJobs}
                  </Typography>
                )}
              </Box>

              {/* Column Content */}
              <Box
                sx={{
                  flex: 1,
                  p: 1,
                  overflowY: 'auto',
                  maxHeight: 'calc(100vh - 200px)',
                }}
              >
                {columnJobs.length === 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 100,
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant='body2'>
                      No jobs in {column.title.toLowerCase()}
                    </Typography>
                  </Box>
                ) : (
                  columnJobs.map(job => (
                    <JobCard key={job.id} job={job} column={column} />
                  ))
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Job Menu */}
      <Menu
        anchorEl={jobMenuAnchor}
        open={Boolean(jobMenuAnchor)}
        onClose={() => setJobMenuAnchor(null)}
      >
        <MenuItem onClick={() => setJobMenuAnchor(null)}>
          <Edit sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        <MenuItem onClick={() => setJobMenuAnchor(null)}>
          <Person sx={{ mr: 1 }} />
          Assign Technician
        </MenuItem>
        <MenuItem onClick={() => setJobMenuAnchor(null)}>
          <Print sx={{ mr: 1 }} />
          Print Details
        </MenuItem>
        <MenuItem onClick={() => setJobMenuAnchor(null)}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel='Production actions'
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 80,
          zIndex: 9999,
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Person />}
          tooltipTitle='New Customer'
          onClick={() => {
            if (onCustomerCreate) {
              onCustomerCreate();
            } else {
              console.warn('onCustomerCreate handler not provided');
            }
          }}
        />
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle='New Job'
          onClick={() => {}}
        />
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle='Refresh'
          onClick={() => window.location.reload()}
        />
      </SpeedDial>
    </Box>
  );
};

export default ProductionKanbanBoardSimple;