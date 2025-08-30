import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Badge,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  Build,
  Palette,
  DirectionsCar,
  Engineering,
  SettingsApplications,
  Verified,
  CleaningServices,
  CheckCircle,
  Schedule,
  Warning,
  Error,
  Person,
  Group,
  Timer,
  TrendingUp,
  TrendingDown,
  Analytics,
  Refresh,
  FilterList,
  ViewColumn,
  Fullscreen,
  MoreVert,
  PlayArrow,
  Pause,
  Stop,
  Flag,
  Comment,
  Photo,
  Assignment,
  Speed,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../Common/SortableItem';
import { useNavigate } from 'react-router-dom';

/**
 * AdvancedProductionBoard - 18-Stage Production Workflow
 * Visual production management with bottleneck analysis
 */
const AdvancedProductionBoard = ({
  viewMode = 'kanban', // 'kanban' or 'timeline'
  showBottleneckAnalysis = true,
  showCapacityPlanning = true,
  className,
  ...props
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [jobs, setJobs] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showStageConfig, setShowStageConfig] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    technician: 'all',
    stage: 'all',
    holdStatus: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 18 Production Stages Configuration
  const defaultStages = [
    { id: 'intake', name: 'Intake', icon: Assignment, color: '#9E9E9E', capacity: 5, avgTime: 0.5 },
    { id: 'blueprint', name: 'Blueprint', icon: Engineering, color: '#2196F3', capacity: 3, avgTime: 2 },
    { id: 'parts_hold', name: 'Parts Hold', icon: Schedule, color: '#FF9800', capacity: 20, avgTime: 0 },
    { id: 'disassembly', name: 'Disassembly', icon: Build, color: '#795548', capacity: 4, avgTime: 4 },
    { id: 'body_rough', name: 'Body Rough', icon: Build, color: '#607D8B', capacity: 6, avgTime: 8 },
    { id: 'body_finish', name: 'Body Finish', icon: Build, color: '#607D8B', capacity: 4, avgTime: 6 },
    { id: 'paint_prep', name: 'Paint Prep', icon: Palette, color: '#9C27B0', capacity: 3, avgTime: 4 },
    { id: 'prime', name: 'Prime', icon: Palette, color: '#673AB7', capacity: 2, avgTime: 2 },
    { id: 'paint', name: 'Paint', icon: Palette, color: '#3F51B5', capacity: 2, avgTime: 3 },
    { id: 'denib', name: 'Denib', icon: Palette, color: '#2196F3', capacity: 2, avgTime: 2 },
    { id: 'polish', name: 'Polish', icon: Palette, color: '#00BCD4', capacity: 2, avgTime: 1 },
    { id: 'mechanical', name: 'Mechanical', icon: Engineering, color: '#009688', capacity: 4, avgTime: 6 },
    { id: 'assembly', name: 'Assembly', icon: Build, color: '#4CAF50', capacity: 6, avgTime: 8 },
    { id: 'adas_calib', name: 'ADAS Calib', icon: SettingsApplications, color: '#8BC34A', capacity: 2, avgTime: 3 },
    { id: 'qc_inspection', name: 'QC Inspection', icon: Verified, color: '#CDDC39', capacity: 3, avgTime: 1 },
    { id: 'detail', name: 'Detail', icon: CleaningServices, color: '#FFEB3B', capacity: 3, avgTime: 2 },
    { id: 'final_qc', name: 'Final QC', icon: CheckCircle, color: '#FFC107', capacity: 2, avgTime: 0.5 },
    { id: 'delivery', name: 'Delivery', icon: DirectionsCar, color: '#FF5722', capacity: 10, avgTime: 0.5 }
  ];

  // Mock job data with all stages
  const mockJobs = [
    {
      id: 'JOB-001',
      roNumber: 'RO-2024-001234',
      customerName: 'John Smith',
      vehicle: '2023 Toyota Camry',
      vin: 'JTNKARJE5P3001234',
      stage: 'body_rough',
      priority: 'normal',
      technician: 'Mike Rodriguez',
      technicianId: 'TECH-001',
      startedAt: '2024-08-15T08:00:00Z',
      stageStarted: '2024-08-19T09:00:00Z',
      estimatedCompletion: '2024-08-25T17:00:00Z',
      progress: 65,
      onHold: false,
      holdReason: null,
      laborHours: { estimated: 28.5, actual: 12.5 },
      parts: { needed: 8, received: 6, installed: 3 },
      value: 4250.00,
      bottleneck: false,
      notes: 'Frame damage repair in progress'
    },
    {
      id: 'JOB-002',
      roNumber: 'RO-2024-001235',
      customerName: 'Sarah Johnson',
      vehicle: '2022 Honda Civic',
      vin: 'JHMFK7J71NS001235',
      stage: 'parts_hold',
      priority: 'high',
      technician: null,
      technicianId: null,
      startedAt: '2024-08-18T10:00:00Z',
      stageStarted: '2024-08-18T14:00:00Z',
      estimatedCompletion: '2024-08-24T17:00:00Z',
      progress: 15,
      onHold: true,
      holdReason: 'Waiting for front bumper delivery',
      laborHours: { estimated: 16.0, actual: 2.5 },
      parts: { needed: 12, received: 8, installed: 0 },
      value: 2800.00,
      bottleneck: true,
      notes: 'Parts ETA: 2024-08-22'
    },
    {
      id: 'JOB-003',
      roNumber: 'RO-2024-001236',
      customerName: 'Mike Williams',
      vehicle: '2021 Ford F-150',
      vin: '1FTFW1E50MFA12345',
      stage: 'paint',
      priority: 'normal',
      technician: 'Lisa Chen',
      technicianId: 'TECH-002',
      startedAt: '2024-08-12T07:30:00Z',
      stageStarted: '2024-08-20T08:00:00Z',
      estimatedCompletion: '2024-08-23T16:00:00Z',
      progress: 80,
      onHold: false,
      holdReason: null,
      laborHours: { estimated: 32.0, actual: 26.5 },
      parts: { needed: 15, received: 15, installed: 12 },
      value: 5150.00,
      bottleneck: false,
      notes: 'Base coat applied, clear coat tomorrow'
    }
  ];

  // Load data
  useEffect(() => {
    setStages(defaultStages);
    setJobs(mockJobs);
  }, []);

  // Calculate stage statistics
  const stageStats = useMemo(() => {
    const stats = {};
    
    stages.forEach(stage => {
      const stageJobs = jobs.filter(job => job.stage === stage.id);
      const totalValue = stageJobs.reduce((sum, job) => sum + job.value, 0);
      const capacity = stage.capacity;
      const utilization = Math.min((stageJobs.length / capacity) * 100, 100);
      const avgCycleTime = stageJobs.length > 0 
        ? stageJobs.reduce((sum, job) => {
            const stageTime = new Date() - new Date(job.stageStarted);
            return sum + (stageTime / (1000 * 60 * 60)); // hours
          }, 0) / stageJobs.length
        : 0;
      
      stats[stage.id] = {
        jobCount: stageJobs.length,
        totalValue,
        capacity,
        utilization,
        avgCycleTime,
        isBottleneck: utilization > 85 || avgCycleTime > stage.avgTime * 1.5,
        jobs: stageJobs
      };
    });
    
    return stats;
  }, [jobs, stages]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    if (filters.priority !== 'all') {
      filtered = filtered.filter(job => job.priority === filters.priority);
    }
    if (filters.technician !== 'all') {
      filtered = filtered.filter(job => job.technicianId === filters.technician);
    }
    if (filters.stage !== 'all') {
      filtered = filtered.filter(job => job.stage === filters.stage);
    }
    if (filters.holdStatus !== 'all') {
      if (filters.holdStatus === 'on_hold') {
        filtered = filtered.filter(job => job.onHold);
      } else if (filters.holdStatus === 'active') {
        filtered = filtered.filter(job => !job.onHold);
      }
    }

    return filtered;
  }, [jobs, filters]);

  // Handle job drag
  const handleJobDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const jobId = active.id;
    const newStage = over.id;
    
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              stage: newStage,
              stageStarted: new Date().toISOString(),
              onHold: false
            }
          : job
      )
    );
  };

  // Handle job actions
  const handleJobAction = (action, job) => {
    switch (action) {
      case 'view':
        setSelectedJob(job);
        setShowJobDetails(true);
        break;
      case 'hold':
        setJobs(prevJobs => 
          prevJobs.map(j => 
            j.id === job.id 
              ? { ...j, onHold: true, holdReason: 'Manual hold' }
              : j
          )
        );
        break;
      case 'resume':
        setJobs(prevJobs => 
          prevJobs.map(j => 
            j.id === job.id 
              ? { ...j, onHold: false, holdReason: null }
              : j
          )
        );
        break;
      case 'assign':
        console.log('Assign technician to job:', job);
        break;
      case 'notes':
        console.log('Add notes to job:', job);
        break;
      default:
        console.log(`Action ${action} for job:`, job);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'normal': return theme.palette.primary.main;
      case 'low': return theme.palette.text.secondary;
      default: return theme.palette.text.secondary;
    }
  };

  // Get days in current stage
  const getDaysInStage = (stageStarted) => {
    const now = new Date();
    const started = new Date(stageStarted);
    const diffTime = Math.abs(now - started);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Render job card
  const renderJobCard = (job) => (
    <Card
      sx={{
        mb: 1,
        cursor: 'move',
        border: job.onHold ? 2 : 1,
        borderColor: job.onHold 
          ? theme.palette.warning.main 
          : job.bottleneck 
            ? theme.palette.error.main 
            : 'divider',
        '&:hover': { 
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {job.roNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {job.customerName}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {job.priority === 'high' && (
              <Flag fontSize="small" sx={{ color: getPriorityColor(job.priority) }} />
            )}
            {job.onHold && (
              <Tooltip title={job.holdReason}>
                <Pause fontSize="small" color="warning" />
              </Tooltip>
            )}
            {job.bottleneck && (
              <Warning fontSize="small" color="error" />
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
                setSelectedJob(job);
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Vehicle Info */}
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          {job.vehicle}
        </Typography>

        {/* Progress */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {job.progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={job.progress} 
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>

        {/* Details */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Timer fontSize="small" color="action" />
            <Typography variant="caption">
              {getDaysInStage(job.stageStarted)}d in stage
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            ${job.value.toLocaleString()}
          </Typography>
        </Box>

        {/* Technician */}
        {job.technician ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Avatar sx={{ width: 16, height: 16, fontSize: '0.75rem' }}>
              {job.technician.charAt(0)}
            </Avatar>
            <Typography variant="caption">
              {job.technician}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Unassigned
          </Typography>
        )}

        {/* Parts Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Parts: {job.parts.installed}/{job.parts.needed}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Labor: {job.laborHours.actual}/{job.laborHours.estimated}h
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // Render stage column
  const renderStageColumn = (stage) => {
    const stats = stageStats[stage.id] || {};
    const stageJobs = filteredJobs.filter(job => job.stage === stage.id);
    
    return (
      <Paper
        key={stage.id}
        sx={{
          minWidth: 280,
          maxWidth: 280,
          height: 'calc(100vh - 300px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: stats.isBottleneck ? `${theme.palette.error.main}08` : 'background.paper',
          border: stats.isBottleneck ? 2 : 1,
          borderColor: stats.isBottleneck ? theme.palette.error.main : 'divider'
        }}
      >
        {/* Stage Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                backgroundColor: stage.color,
                color: 'white'
              }}
            >
              <stage.icon fontSize="small" />
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {stage.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.jobCount || 0} / {stage.capacity}
              </Typography>
            </Box>
            
            <Badge
              badgeContent={stats.jobCount || 0}
              color={stats.utilization > 85 ? 'error' : 'primary'}
              sx={{ ml: 1 }}
            >
              <Box />
            </Badge>
          </Box>

          {/* Stage Stats */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Utilization
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.round(stats.utilization || 0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.utilization || 0}
              color={stats.utilization > 85 ? 'error' : 'primary'}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>

          {/* Bottleneck Indicator */}
          {stats.isBottleneck && (
            <Chip
              icon={<Warning />}
              label="Bottleneck"
              size="small"
              color="error"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
          
          {/* Value */}
          <Typography variant="caption" color="text.secondary">
            Total Value: ${(stats.totalValue || 0).toLocaleString()}
          </Typography>
        </Box>

        {/* Job Cards */}
        <SortableContext items={stageJobs.map(job => job.id)} strategy={horizontalListSortingStrategy}>
          <Box
            id={stage.id}
            sx={{ 
              flex: 1, 
              overflow: 'auto', 
              p: 1,
              minHeight: 100
            }}
          >
            {stageJobs.map(job => (
              <SortableItem key={job.id} id={job.id}>
                {renderJobCard(job)}
              </SortableItem>
            ))}
            
            {stageJobs.length === 0 && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic' }}
              >
                No jobs in this stage
              </Typography>
            )}
          </Box>
        </SortableContext>
      </Paper>
    );
  };

  return (
    <Box className={className} {...props}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Advanced Production Board
          </Typography>
          <Typography variant="body2" color="text.secondary">
            18-Stage Workflow Management • {jobs.length} Active Jobs
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={() => console.log('Show analytics')}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<ViewColumn />}
            onClick={() => setShowStageConfig(true)}
          >
            Configure Stages
          </Button>
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {jobs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {jobs.filter(job => job.onHold).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                On Hold
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                {Object.values(stageStats).filter(stat => stat.isBottleneck).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bottlenecks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                ${jobs.reduce((sum, job) => sum + job.value, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Production Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleJobDragEnd}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflow: 'auto',
            pb: 2,
            minHeight: 'calc(100vh - 400px)'
          }}
        >
          {stages.map(stage => renderStageColumn(stage))}
        </Box>
      </DndContext>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleJobAction('view', selectedJob)}>
          <Assignment sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem 
          onClick={() => handleJobAction(selectedJob?.onHold ? 'resume' : 'hold', selectedJob)}
        >
          {selectedJob?.onHold ? <PlayArrow sx={{ mr: 1 }} fontSize="small" /> : <Pause sx={{ mr: 1 }} fontSize="small" />}
          {selectedJob?.onHold ? 'Resume Job' : 'Hold Job'}
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('assign', selectedJob)}>
          <Person sx={{ mr: 1 }} fontSize="small" />
          Assign Technician
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('notes', selectedJob)}>
          <Comment sx={{ mr: 1 }} fontSize="small" />
          Add Notes
        </MenuItem>
      </Menu>

      {/* Job Details Dialog */}
      <Dialog
        open={showJobDetails}
        onClose={() => setShowJobDetails(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Job Details - {selectedJob?.roNumber}</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Customer</Typography>
                <Typography variant="body2">{selectedJob.customerName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Vehicle</Typography>
                <Typography variant="body2">{selectedJob.vehicle}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Current Stage</Typography>
                <Typography variant="body2">{selectedJob.stage.replace('_', ' ')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Progress</Typography>
                <Typography variant="body2">{selectedJob.progress}%</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                <Typography variant="body2">{selectedJob.notes || 'No notes'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJobDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Stage Configuration Dialog */}
      <Dialog
        open={showStageConfig}
        onClose={() => setShowStageConfig(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Stage Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Configure production stages, capacity, and workflow rules.
          </Typography>
          {/* Stage configuration interface would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStageConfig(false)}>Cancel</Button>
          <Button variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedProductionBoard;