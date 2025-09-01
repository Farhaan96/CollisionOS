import React, { useState, useCallback } from 'react';
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
  SpeedDialIcon,
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
  Share,
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

// Production workflow columns based on Instructions document
const PRODUCTION_COLUMNS = [
  {
    id: 'estimate',
    title: 'Estimate',
    color: '#ff9800',
    icon: Assignment,
    description: 'Initial damage assessment and estimate creation',
  },
  {
    id: 'intake',
    title: 'Intake/Check-in',
    color: '#2196f3',
    icon: DirectionsCar,
    description: 'Vehicle intake and initial documentation',
  },
  {
    id: 'teardown',
    title: 'Blueprint/Teardown',
    color: '#9c27b0',
    icon: Settings,
    description: 'Detailed teardown and hidden damage discovery',
  },
  {
    id: 'parts_ordering',
    title: 'Parts Ordering',
    color: '#f44336',
    icon: LocalShipping,
    description: 'Parts procurement and ordering',
  },
  {
    id: 'parts_receiving',
    title: 'Parts Receiving',
    color: '#ff5722',
    icon: QrCode,
    description: 'Parts delivery and inventory',
  },
  {
    id: 'body_structure',
    title: 'Body/Structure',
    color: '#607d8b',
    icon: Build,
    description: 'Structural and body repair work',
  },
  {
    id: 'body_repair',
    title: 'Body Repair',
    color: '#795548',
    icon: Build,
    description: 'Body panel repair and preparation',
  },
  {
    id: 'paint_prep',
    title: 'Paint Prep',
    color: '#9e9e9e',
    icon: Palette,
    description: 'Surface preparation for painting',
  },
  {
    id: 'paint',
    title: 'Paint',
    color: '#4caf50',
    icon: Palette,
    description: 'Painting process',
  },
  {
    id: 'reassembly',
    title: 'Reassembly',
    color: '#00bcd4',
    icon: Settings,
    description: 'Final assembly and installation',
  },
  {
    id: 'qc',
    title: 'Quality Control',
    color: '#8bc34a',
    icon: CheckCircle,
    description: 'Final inspection and quality assurance',
  },
  {
    id: 'delivery',
    title: 'Delivery Ready',
    color: '#cddc39',
    icon: DirectionsCar,
    description: 'Ready for customer pickup',
  },
];

// Priority levels for jobs
const PRIORITY_LEVELS = {
  low: { level: 1, label: 'Low', color: '#4caf50', icon: <Info /> },
  normal: { level: 2, label: 'Normal', color: '#2196f3', icon: <Info /> },
  high: { level: 3, label: 'High', color: '#ff9800', icon: <Warning /> },
  urgent: { level: 4, label: 'Urgent', color: '#f44336', icon: <Error /> },
};

const ProductionKanbanBoardNew = ({
  jobs = [],
  onJobUpdate,
  onJobMove,
  onJobClick,
  onCustomerCreate,
  viewMode = 'kanban',
  filterOptions = {},
  sortBy = 'priority',
}) => {
  const theme = useTheme();
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobMenuAnchor, setJobMenuAnchor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggedJob, setDraggedJob] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [isCompactView, setIsCompactView] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group jobs by status/column
  const jobsByColumn = PRODUCTION_COLUMNS.reduce((acc, column) => {
    acc[column.id] = jobs.filter(job => job.status === column.id);
    return acc;
  }, {});

  // Calculate column statistics
  const getColumnStats = columnId => {
    const columnJobs = jobsByColumn[columnId] || [];
    const total = columnJobs.length;
    const overdue = columnJobs.filter(
      job => new Date(job.targetDate) < new Date()
    ).length;
    const urgent = columnJobs.filter(job => job.priority === 'urgent').length;
    const avgDaysInColumn =
      columnJobs.length > 0
        ? Math.round(
            columnJobs.reduce((sum, job) => sum + (job.daysInShop || 0), 0) /
              columnJobs.length
          )
        : 0;

    return { total, overdue, urgent, avgDaysInColumn };
  };

  // Handle drag and drop
  const handleDragStart = useCallback(
    event => {
      const { active } = event;
      setActiveId(active.id);
      const job = jobs.find(j => j.id === active.id);
      setDraggedJob(job);
    },
    [jobs]
  );

  const handleDragEnd = useCallback(
    event => {
      const { active, over } = event;

      setActiveId(null);
      setDraggedJob(null);

      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      const activeJob = jobs.find(j => j.id === activeId);
      if (!activeJob) return;

      // Determine the target status
      let targetStatus;
      const isOverAColumn = PRODUCTION_COLUMNS.some(col => col.id === overId);

      if (isOverAColumn) {
        targetStatus = overId;
      } else {
        // Dragged over another job, find its column
        const targetJob = jobs.find(j => j.id === overId);
        if (targetJob) {
          targetStatus = targetJob.status;
        }
      }

      if (targetStatus && activeJob.status !== targetStatus) {
        // Call the move handler - remove complex validation that breaks drag-drop
        if (onJobMove && typeof onJobMove === 'function') {
          onJobMove(activeJob, targetStatus); // Fix: Remove the third parameter
        } else {
          console.warn(`No job move handler available for job ${activeJob.id}`);
        }
      }
    },
    [jobs, onJobMove, onJobUpdate]
  );

  // Sortable Job Card Component for @dnd-kit
  const SortableJobCard = ({ job, columnId }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: job.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 'auto',
    };

    const priority = PRIORITY_LEVELS[job.priority] || PRIORITY_LEVELS.normal;
    const isOverdue = new Date(job.targetDate) < new Date();
    const daysInShop = job.daysInShop || 0;
    const progressPercentage = job.progressPercentage || 0;

    const handleMenuClick = event => {
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
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            mb: 2,
            cursor: 'pointer',
            position: 'relative',
            transform: isDragging ? 'rotate(5deg)' : 'none',
            boxShadow: isDragging ? theme.shadows[8] : theme.shadows[2],
            '&:hover': {
              boxShadow: theme.shadows[4],
              transform: isDragging ? 'none' : 'translateY(-2px)',
            },
            transition: 'all 0.2s ease-in-out',
            border: `2px solid ${priority.color}`,
            borderLeft: `6px solid ${priority.color}`,
          }}
          onClick={handleCardClick}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {/* Drag Handle */}
            <Box
              {...listeners}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                cursor: 'grab',
                color: theme.palette.text.secondary,
                '&:active': {
                  cursor: 'grabbing',
                },
                touchAction: 'none',
              }}
            >
              <DragIndicator fontSize='small' />
            </Box>

            {/* Job menu */}
            <IconButton
              size='small'
              onClick={handleMenuClick}
              sx={{
                position: 'absolute',
                top: 8,
                right: 40,
              }}
            >
              <MoreVert fontSize='small' />
            </IconButton>

            {/* Job header */}
            <Box sx={{ pr: 5, mb: 1 }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                {job.jobNumber || job.id}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {job.customer?.name || 'No Customer'}
              </Typography>
            </Box>

            {/* Priority and status chips */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                size='small'
                icon={priority.icon}
                label={priority.label}
                color={
                  priority.level >= 3
                    ? 'error'
                    : priority.level >= 2
                      ? 'warning'
                      : 'default'
                }
                variant='outlined'
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-icon': { fontSize: '0.8rem' },
                }}
              />

              {isOverdue && (
                <Chip
                  size='small'
                  icon={<Warning />}
                  label='Overdue'
                  color='error'
                  variant='filled'
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}

              {daysInShop > 7 && (
                <Chip
                  size='small'
                  icon={<Schedule />}
                  label={`${daysInShop}d`}
                  color='warning'
                  variant='outlined'
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>

            {/* Vehicle info */}
            {job.vehicle && (
              <Box sx={{ mb: 1 }}>
                <Typography variant='caption' color='text.secondary'>
                  {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                </Typography>
              </Box>
            )}

            {/* Progress bar */}
            {!isCompactView && (
              <Box sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    Progress
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {progressPercentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={progressPercentage}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: alpha(priority.color, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: priority.color,
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}

            {/* Target date */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='caption' color='text.secondary'>
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
    );
  };

  // Droppable Column Component
  const DroppableColumn = ({ column, jobs }) => {
    const stats = getColumnStats(column.id);
    const IconComponent = column.icon;

    return (
      <Box key={column.id} sx={{ minWidth: 350, width: 350, mx: 1 }}>
        <Card
          elevation={2}
          sx={{
            height: '100%',
            backgroundColor: theme.palette.background.paper,
            border: `2px solid ${alpha(column.color, 0.3)}`,
          }}
        >
          <CardContent sx={{ p: 2, pb: 1 }}>
            {/* Column Header */}
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: alpha(column.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: column.color,
                  }}
                >
                  <IconComponent fontSize='small' />
                </Box>
                <Box>
                  <Typography
                    variant='h6'
                    sx={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    {column.title}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {stats.total} jobs
                  </Typography>
                </Box>
              </Box>

              {/* Column stats */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {stats.overdue > 0 && (
                  <Badge badgeContent={stats.overdue} color='error'>
                    <Chip
                      size='small'
                      icon={<Warning />}
                      label=''
                      sx={{ minWidth: 'auto', width: 24 }}
                    />
                  </Badge>
                )}
                {stats.urgent > 0 && (
                  <Badge badgeContent={stats.urgent} color='warning'>
                    <Chip
                      size='small'
                      icon={<Error />}
                      label=''
                      sx={{ minWidth: 'auto', width: 24 }}
                    />
                  </Badge>
                )}
              </Box>
            </Box>
          </CardContent>

          {/* Droppable area with SortableContext */}
          <Box
            id={column.id}
            sx={{
              minHeight: 500,
              p: 2,
              pt: 0,
              backgroundColor: alpha(column.color, 0.02),
            }}
          >
            <SortableContext
              items={jobs.map(job => job.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {jobs.map(job => (
                  <SortableJobCard
                    key={job.id}
                    job={job}
                    columnId={column.id}
                  />
                ))}
              </AnimatePresence>
              {jobs.length === 0 && (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary',
                  }}
                >
                  No jobs in this stage
                </Box>
              )}
            </SortableContext>
          </Box>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Kanban Board */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            height: 'calc(100vh - 140px)',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.background.default,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: 4,
            },
          }}
        >
          {PRODUCTION_COLUMNS.map(column => (
            <DroppableColumn
              key={column.id}
              column={column}
              jobs={jobsByColumn[column.id] || []}
            />
          ))}
        </Box>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && draggedJob ? (
            <SortableJobCard job={draggedJob} columnId={draggedJob.status} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Job Menu */}
      <Menu
        anchorEl={jobMenuAnchor}
        open={Boolean(jobMenuAnchor)}
        onClose={() => setJobMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
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
          right: 80, // Move left to avoid AI chat button
          zIndex: 9999, // Ensure it's above all other elements
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
          icon={<FilterList />}
          tooltipTitle='Filter Jobs'
          onClick={() => {}}
        />
        <SpeedDialAction
          icon={<Sort />}
          tooltipTitle='Sort Jobs'
          onClick={() => {}}
        />
      </SpeedDial>
    </Box>
  );
};

export default ProductionKanbanBoardNew;
