import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  LinearProgress,
  useTheme,
  alpha,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  DragIndicator,
  MoreVert,
  Schedule,
  Warning,
  CheckCircle,
  Error,
  Info,
  Assignment,
  DirectionsCar,
  Build,
  Palette,
  Settings,
  QrCode,
  LocalShipping,
  Person,
  Phone,
  Add,
  Refresh,
  FilterList,
  Sort,
  ViewModule,
  ViewList,
  Search,
  Edit,
  Delete,
  Print,
  Share
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

// Production workflow columns based on Instructions document
const PRODUCTION_COLUMNS = [
  {
    id: 'estimate',
    title: 'Estimate',
    color: '#ff9800',
    icon: Assignment,
    description: 'Initial damage assessment and estimate creation'
  },
  {
    id: 'intake',
    title: 'Intake/Check-in',
    color: '#2196f3',
    icon: DirectionsCar,
    description: 'Vehicle intake and initial documentation'
  },
  {
    id: 'teardown',
    title: 'Blueprint/Teardown',
    color: '#9c27b0',
    icon: Settings,
    description: 'Detailed teardown and hidden damage discovery'
  },
  {
    id: 'parts_ordering',
    title: 'Parts Ordering',
    color: '#f44336',
    icon: LocalShipping,
    description: 'Parts procurement and ordering'
  },
  {
    id: 'parts_receiving',
    title: 'Parts Receiving',
    color: '#ff5722',
    icon: QrCode,
    description: 'Parts delivery and inventory'
  },
  {
    id: 'body_structure',
    title: 'Body/Structure',
    color: '#607d8b',
    icon: Build,
    description: 'Structural and body repair work'
  },
  {
    id: 'paint_prep',
    title: 'Paint Prep',
    color: '#795548',
    icon: Palette,
    description: 'Surface preparation for painting'
  },
  {
    id: 'paint_booth',
    title: 'Paint Booth',
    color: '#e91e63',
    icon: Palette,
    description: 'Painting and color matching'
  },
  {
    id: 'reassembly',
    title: 'Reassembly',
    color: '#009688',
    icon: Build,
    description: 'Parts installation and reassembly'
  },
  {
    id: 'qc_calibration',
    title: 'QC & Calibration',
    color: '#673ab7',
    icon: CheckCircle,
    description: 'Quality control and ADAS calibration'
  },
  {
    id: 'detail',
    title: 'Detail',
    color: '#3f51b5',
    icon: Settings,
    description: 'Final detailing and cleanup'
  },
  {
    id: 'ready_pickup',
    title: 'Ready for Pickup',
    color: '#4caf50',
    icon: CheckCircle,
    description: 'Complete and ready for customer'
  },
  {
    id: 'delivered',
    title: 'Delivered',
    color: '#8bc34a',
    icon: DirectionsCar,
    description: 'Vehicle delivered to customer'
  }
];

// Priority levels
const PRIORITY_LEVELS = {
  low: { color: '#4caf50', label: 'Low' },
  normal: { color: '#2196f3', label: 'Normal' },
  high: { color: '#ff9800', label: 'High' },
  urgent: { color: '#f44336', label: 'Urgent' },
  rush: { color: '#e91e63', label: 'Rush' }
};

const ProductionKanbanBoard = ({ 
  jobs = [], 
  onJobUpdate, 
  onJobMove, 
  onJobClick,
  viewMode = 'kanban',
  filterOptions = {},
  sortBy = 'priority'
}) => {
  const theme = useTheme();
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobMenuAnchor, setJobMenuAnchor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggedJob, setDraggedJob] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [isCompactView, setIsCompactView] = useState(false);

  // Group jobs by status/column
  const jobsByColumn = PRODUCTION_COLUMNS.reduce((acc, column) => {
    acc[column.id] = jobs.filter(job => job.status === column.id);
    return acc;
  }, {});

  // Calculate column statistics
  const getColumnStats = (columnId) => {
    const columnJobs = jobsByColumn[columnId] || [];
    const total = columnJobs.length;
    const overdue = columnJobs.filter(job => new Date(job.targetDate) < new Date()).length;
    const urgent = columnJobs.filter(job => job.priority === 'urgent' || job.priority === 'rush').length;
    const avgDaysInColumn = columnJobs.reduce((sum, job) => {
      const daysInColumn = job.daysInCurrentStatus || 0;
      return sum + daysInColumn;
    }, 0) / (total || 1);

    return { total, overdue, urgent, avgDaysInColumn };
  };

  // Handle drag and drop
  const onDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      setDraggedJob(null);
      return;
    }

    // No change if dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      setDraggedJob(null);
      return;
    }

    const job = jobs.find(j => j.id === draggableId);
    if (!job) {
      setDraggedJob(null);
      return;
    }

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Validate status transition if job has validation function
    if (job.canMoveToNextStatus && typeof job.canMoveToNextStatus === 'function') {
      const validStatuses = job.canMoveToNextStatus();
      if (!validStatuses.includes(newStatus)) {
        console.warn(`Invalid status transition from ${oldStatus} to ${newStatus}`);
        setDraggedJob(null);
        return;
      }
    }

    // Call the move handler if provided
    if (onJobMove && typeof onJobMove === 'function') {
      onJobMove(job, newStatus, destination.index, `Moved from ${oldStatus} to ${newStatus}`);
    } else {
      console.warn('onJobMove handler not provided or not a function');
    }

    setDraggedJob(null);
  }, [jobs, onJobMove]);

  const onDragStart = useCallback((start) => {
    const job = jobs.find(j => j.id === start.draggableId);
    setDraggedJob(job);
  }, [jobs]);

  // Job Card Component
  const JobCard = ({ job, index, columnId }) => {
    const priority = PRIORITY_LEVELS[job.priority] || PRIORITY_LEVELS.normal;
    const isOverdue = new Date(job.targetDate) < new Date();
    const daysInShop = job.daysInShop || 0;
    const progressPercentage = job.progressPercentage || 0;

    const handleMenuClick = (event) => {
      event.stopPropagation();
      setJobMenuAnchor(event.currentTarget);
      setSelectedJob(job);
    };

    const handleCardClick = () => {
      if (onJobClick) {
        onJobClick(job);
      }
    };

    return (
      <Draggable draggableId={job.id} index={index}>
        {(provided, snapshot) => (
          <motion.div
            ref={provided.innerRef}
            {...provided.draggableProps}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            whileTap={{ scale: 0.98 }}
            style={{
              ...provided.draggableProps.style,
              marginBottom: theme.spacing(1)
            }}
          >
            <Card
              sx={{
                cursor: 'pointer',
                border: '1px solid',
                borderColor: snapshot.isDragging ? priority.color : 'divider',
                borderLeftWidth: 4,
                borderLeftColor: priority.color,
                backgroundColor: snapshot.isDragging ? alpha(priority.color, 0.1) : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  borderColor: priority.color
                }
              }}
              onClick={handleCardClick}
            >
              <CardContent sx={{ p: isCompactView ? 1 : 2, '&:last-child': { pb: isCompactView ? 1 : 2 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap>
                      {job.jobNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {job.customer?.name || 'Unknown Customer'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Priority badge */}
                    <Chip
                      size="small"
                      label={priority.label}
                      sx={{
                        backgroundColor: alpha(priority.color, 0.1),
                        color: priority.color,
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                    
                    {/* Menu button */}
                    <IconButton
                      size="small"
                      onClick={handleMenuClick}
                      {...provided.dragHandleProps}
                    >
                      <DragIndicator fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Vehicle info */}
                {!isCompactView && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {job.vehicle?.year || ''} {job.vehicle?.make || ''} {job.vehicle?.model || 'Unknown Vehicle'}
                    </Typography>
                    {job.insurance?.company && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {job.insurance.company} - Claim #{job.insurance.claimNumber}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Status indicators */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {/* Days in shop */}
                  <Chip
                    size="small"
                    icon={<Schedule />}
                    label={`${daysInShop}d`}
                    color={daysInShop > 14 ? 'error' : daysInShop > 10 ? 'warning' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />

                  {/* Overdue indicator */}
                  {isOverdue && (
                    <Chip
                      size="small"
                      icon={<Warning />}
                      label="Overdue"
                      color="error"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}

                  {/* Parts status */}
                  {job.partsStatus && (
                    <Chip
                      size="small"
                      icon={<LocalShipping />}
                      label={job.partsStatus}
                      color={job.partsStatus === 'all_received' ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>

                {/* Progress bar */}
                {!isCompactView && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progressPercentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: alpha(priority.color, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: priority.color,
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Target date */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Target: {format(new Date(job.targetDate), 'MMM dd')}
                  </Typography>
                  
                  {/* Technician avatar */}
                  {job.assignedTechnician && (
                    <Tooltip title={job.assignedTechnician.name}>
                      <Avatar
                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                        src={job.assignedTechnician.avatar}
                      >
                        {job.assignedTechnician.name?.charAt(0)}
                      </Avatar>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Draggable>
    );
  };

  // Column Component
  const Column = ({ column, jobs }) => {
    const stats = getColumnStats(column.id);
    const IconComponent = column.icon;

    return (
      <Box sx={{ width: 300, minWidth: 300, mr: 2 }}>
        {/* Column Header */}
        <Card sx={{ mb: 1, backgroundColor: alpha(column.color, 0.1) }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: column.color,
                    width: 32,
                    height: 32,
                    mr: 1
                  }}
                >
                  <IconComponent sx={{ fontSize: 16 }} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold">
                  {column.title}
                </Typography>
              </Box>
              
              <Badge badgeContent={stats.total} color="primary">
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Badge>
            </Box>
            
            {/* Column stats */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {stats.overdue > 0 && (
                <Chip
                  size="small"
                  icon={<Warning />}
                  label={`${stats.overdue} overdue`}
                  color="error"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
              {stats.urgent > 0 && (
                <Chip
                  size="small"
                  icon={<Error />}
                  label={`${stats.urgent} urgent`}
                  color="warning"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
              <Chip
                size="small"
                label={`${stats.avgDaysInColumn.toFixed(1)}d avg`}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Droppable area */}
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                minHeight: 400,
                maxHeight: 'calc(100vh - 300px)',
                overflowY: 'auto',
                p: 1,
                borderRadius: 1,
                backgroundColor: snapshot.isDraggingOver ? alpha(column.color, 0.1) : 'transparent',
                border: snapshot.isDraggingOver ? `2px dashed ${column.color}` : '2px solid transparent',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <AnimatePresence>
                {jobs.map((job, index) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    index={index}
                    columnId={column.id}
                  />
                ))}
              </AnimatePresence>
              {provided.placeholder}
              
              {jobs.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  No jobs in this stage
                </Box>
              )}
            </Box>
          )}
        </Droppable>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
        <Typography variant="h6">
          Production Board
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Compact view">
            <IconButton
              color={isCompactView ? 'primary' : 'default'}
              onClick={() => setIsCompactView(!isCompactView)}
            >
              <ViewModule />
            </IconButton>
          </Tooltip>
          <Button
            startIcon={<Refresh />}
            size="small"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            height: 'calc(100vh - 200px)',
            pb: 2,
            px: 1
          }}
        >
          {PRODUCTION_COLUMNS.map(column => (
            <Column
              key={column.id}
              column={column}
              jobs={jobsByColumn[column.id] || []}
            />
          ))}
        </Box>
      </DragDropContext>

      {/* Job context menu */}
      <Menu
        anchorEl={jobMenuAnchor}
        open={Boolean(jobMenuAnchor)}
        onClose={() => setJobMenuAnchor(null)}
      >
        <MenuItem onClick={() => {}}>
          <Edit sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <Person sx={{ mr: 1 }} />
          Assign Technician
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <Print sx={{ mr: 1 }} />
          Print Work Order
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <Phone sx={{ mr: 1 }} />
          Contact Customer
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel="Production actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="New Job"
          onClick={() => {}}
        />
        <SpeedDialAction
          icon={<FilterList />}
          tooltipTitle="Filter Jobs"
          onClick={() => {}}
        />
        <SpeedDialAction
          icon={<Sort />}
          tooltipTitle="Sort Jobs"
          onClick={() => {}}
        />
      </SpeedDial>
    </Box>
  );
};

export default ProductionKanbanBoard;
