import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Assignment,
  Build,
  Schedule,
  Engineering,
  CheckCircle,
  CleaningServices,
  DirectionsCar,
  MoreVert,
  Person,
  Timer,
  Flag,
  Warning,
  Refresh,
  FilterList,
  Settings,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableItem } from '../Common/SortableItem';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * SimpleProductionBoard - 8-Stage Kanban Production Workflow
 * Simplified visual production management for collision repair shops
 */
const SimpleProductionBoard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    technician: 'all',
    dateRange: 'all',
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // 8 Production Stages Configuration
  const STAGES = [
    {
      id: 'estimating',
      name: 'Estimating',
      icon: Assignment,
      color: '#9E9E9E',
      description: 'Jobs being estimated',
    },
    {
      id: 'scheduled',
      name: 'Scheduled',
      icon: Schedule,
      color: '#2196F3',
      description: 'Jobs scheduled but not started',
    },
    {
      id: 'disassembly',
      name: 'Disassembly',
      icon: Build,
      color: '#795548',
      description: 'Taking vehicle apart',
    },
    {
      id: 'parts_pending',
      name: 'Parts Pending',
      icon: Schedule,
      color: '#FF9800',
      description: 'Waiting for parts',
    },
    {
      id: 'in_repair',
      name: 'In Repair',
      icon: Engineering,
      color: '#4CAF50',
      description: 'Active bodywork/paint',
    },
    {
      id: 'reassembly',
      name: 'Reassembly',
      icon: Settings,
      color: '#8BC34A',
      description: 'Putting vehicle back together',
    },
    {
      id: 'qc',
      name: 'QC',
      icon: CheckCircle,
      color: '#00BCD4',
      description: 'Quality control inspection',
    },
    {
      id: 'complete',
      name: 'Complete',
      icon: DirectionsCar,
      color: '#4CAF50',
      description: 'Ready for customer pickup',
    },
  ];

  // Load jobs from API
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/production/board');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error loading production board:', error);
      // Use mock data if API fails
      setJobs(getMockJobs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    // Real-time updates every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  // Mock data for development
  const getMockJobs = () => [
    {
      id: 'RO-2024-001',
      roNumber: 'RO-2024-001',
      customerName: 'John Smith',
      vehicle: '2023 Toyota Camry',
      vin: 'JT2BF28K0X0123456',
      stage: 'disassembly',
      priority: 'normal',
      technician: 'Mike Rodriguez',
      technicianId: 'TECH-001',
      daysInShop: 3,
      progress: 25,
      estimatedValue: 4250.0,
      photo: null,
    },
    {
      id: 'RO-2024-002',
      roNumber: 'RO-2024-002',
      customerName: 'Sarah Johnson',
      vehicle: '2022 Honda Civic',
      vin: 'JHMFK7J71NS001235',
      stage: 'parts_pending',
      priority: 'urgent',
      technician: null,
      technicianId: null,
      daysInShop: 7,
      progress: 15,
      estimatedValue: 2800.0,
      photo: null,
    },
    {
      id: 'RO-2024-003',
      roNumber: 'RO-2024-003',
      customerName: 'Mike Williams',
      vehicle: '2021 Ford F-150',
      vin: '1FTFW1E50MFA12345',
      stage: 'in_repair',
      priority: 'rush',
      technician: 'Lisa Chen',
      technicianId: 'TECH-002',
      daysInShop: 5,
      progress: 65,
      estimatedValue: 5150.0,
      photo: null,
    },
  ];

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalJobs = jobs.length;
    const avgCycleTime = Math.round(
      jobs.reduce((sum, job) => sum + job.daysInShop, 0) / (totalJobs || 1)
    );
    const completedThisWeek = jobs.filter(
      job => job.stage === 'complete'
    ).length;
    const revenueThisWeek = jobs
      .filter(job => job.stage === 'complete')
      .reduce((sum, job) => sum + (job.estimatedValue || 0), 0);

    return {
      totalJobs,
      avgCycleTime,
      completedThisWeek,
      revenueThisWeek,
    };
  }, [jobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    if (filters.priority !== 'all') {
      filtered = filtered.filter(job => job.priority === filters.priority);
    }
    if (filters.technician !== 'all') {
      filtered = filtered.filter(job => job.technicianId === filters.technician);
    }

    return filtered;
  }, [jobs, filters]);

  // Handle drag start
  const handleDragStart = event => {
    setActiveId(event.active.id);
  };

  // Handle job drag end
  const handleDragEnd = async event => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const jobId = active.id;
    const newStage = over.id;

    // Don't update if dropped in same column
    const job = jobs.find(j => j.id === jobId);
    if (job && job.stage === newStage) {
      return;
    }

    // Optimistic UI update
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId
          ? {
              ...job,
              stage: newStage,
            }
          : job
      )
    );

    // Update backend
    try {
      const response = await axios.put(`/api/production/board/${jobId}/status`, {
        status: newStage,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating job stage:', error);
      // Revert on error
      loadJobs();
    }
  };

  // Get priority color
  const getPriorityColor = priority => {
    switch (priority) {
      case 'rush':
        return theme.palette.error.main;
      case 'urgent':
        return theme.palette.warning.main;
      case 'normal':
        return theme.palette.primary.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Get days color (green <5, yellow 5-10, red >10)
  const getDaysColor = days => {
    if (days < 5) return theme.palette.success.main;
    if (days <= 10) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Handle job actions
  const handleJobAction = (action, job) => {
    switch (action) {
      case 'view':
        navigate(`/ro/${job.id}`);
        break;
      case 'assign':
        // Open assign technician dialog
        console.log('Assign technician to:', job);
        break;
      case 'priority':
        // Change priority
        console.log('Change priority for:', job);
        break;
      case 'note':
        // Add note
        console.log('Add note to:', job);
        break;
      default:
        console.log(`Action ${action} for job:`, job);
    }
    setMenuAnchor(null);
  };

  // Render job card
  const renderJobCard = job => (
    <Card
      sx={{
        mb: 1.5,
        cursor: 'move',
        border: 1,
        borderColor: 'divider',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
      onClick={() => navigate(`/ro/${job.id}`)}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header with RO Number */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {job.roNumber}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Priority indicator */}
            {(job.priority === 'urgent' || job.priority === 'rush') && (
              <Flag
                fontSize='small'
                sx={{ color: getPriorityColor(job.priority) }}
              />
            )}
            {/* Days in shop indicator */}
            <Chip
              label={`${job.daysInShop}d`}
              size='small'
              sx={{
                bgcolor: getDaysColor(job.daysInShop),
                color: 'white',
                fontWeight: 600,
              }}
            />
            {/* More menu */}
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
                setSelectedJob(job);
              }}
            >
              <MoreVert fontSize='small' />
            </IconButton>
          </Box>
        </Box>

        {/* Customer Name */}
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          {job.customerName}
        </Typography>

        {/* Vehicle */}
        <Typography variant='body1' sx={{ mb: 1.5, fontWeight: 500 }}>
          {job.vehicle}
        </Typography>

        {/* Progress Bar */}
        <Box sx={{ mb: 1.5 }}>
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
            <Typography variant='caption' sx={{ fontWeight: 600 }}>
              {job.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={job.progress}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Technician */}
        {job.technician ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>
              {job.technician.charAt(0)}
            </Avatar>
            <Typography variant='body2'>{job.technician}</Typography>
          </Box>
        ) : (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ fontStyle: 'italic', mb: 1 }}
          >
            Unassigned
          </Typography>
        )}

        {/* Priority Badge */}
        <Chip
          label={job.priority.toUpperCase()}
          size='small'
          sx={{
            bgcolor:
              job.priority === 'normal' ? 'default' : getPriorityColor(job.priority),
            color: job.priority === 'normal' ? 'text.primary' : 'white',
          }}
        />
      </CardContent>
    </Card>
  );

  // Droppable Stage Column Component
  const DroppableStageColumn = ({ stage }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: stage.id,
    });

    const stageJobs = filteredJobs.filter(job => job.stage === stage.id);

    return (
      <Paper
        ref={setNodeRef}
        key={stage.id}
        sx={{
          minWidth: 320,
          maxWidth: 320,
          height: 'calc(100vh - 350px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isOver ? `${stage.color}25` : 'background.paper',
          border: 2,
          borderColor: isOver ? stage.color : 'divider',
          borderStyle: isOver ? 'dashed' : 'solid',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {/* Stage Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: `${stage.color}15`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: stage.color,
                color: 'white',
              }}
            >
              <stage.icon fontSize='small' />
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                {stage.name}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {stage.description}
              </Typography>
            </Box>

            <Badge badgeContent={stageJobs.length} color='primary' />
          </Box>
        </Box>

        {/* Job Cards */}
        <SortableContext
          items={stageJobs.map(job => job.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              minHeight: 200,
            }}
          >
            {stageJobs.map(job => (
              <SortableItem key={job.id} id={job.id}>
                {renderJobCard(job)}
              </SortableItem>
            ))}

            {stageJobs.length === 0 && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic' }}
              >
                {isOver ? 'Drop job here' : 'No jobs'}
              </Typography>
            )}
          </Box>
        </SortableContext>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            Production Board
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Visual tracking for collision repair jobs
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <IconButton onClick={loadJobs}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Metrics Header */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='primary' sx={{ fontWeight: 600 }}>
                {metrics.totalJobs}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Jobs in Shop
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='info.main' sx={{ fontWeight: 600 }}>
                {metrics.avgCycleTime}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Avg Cycle Time (days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant='h4'
                color='success.main'
                sx={{ fontWeight: 600 }}
              >
                {metrics.completedThisWeek}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Completed This Week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant='h4'
                color='success.main'
                sx={{ fontWeight: 600 }}
              >
                ${metrics.revenueThisWeek.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Revenue This Week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Production Board */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography>Loading production board...</Typography>
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflow: 'auto',
              pb: 2,
            }}
          >
            {STAGES.map(stage => (
              <DroppableStageColumn key={stage.id} stage={stage} />
            ))}
          </Box>
          <DragOverlay>
            {activeId ? (
              <Card
                sx={{
                  width: 300,
                  opacity: 0.9,
                  transform: 'rotate(5deg)',
                  boxShadow: 6,
                }}
              >
                {(() => {
                  const job = jobs.find(j => j.id === activeId);
                  return job ? renderJobCard(job) : null;
                })()}
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleJobAction('view', selectedJob)}>
          <Assignment sx={{ mr: 1 }} fontSize='small' />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('assign', selectedJob)}>
          <Person sx={{ mr: 1 }} fontSize='small' />
          Assign Technician
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('priority', selectedJob)}>
          <Flag sx={{ mr: 1 }} fontSize='small' />
          Change Priority
        </MenuItem>
        <MenuItem onClick={() => handleJobAction('note', selectedJob)}>
          <Assignment sx={{ mr: 1 }} fontSize='small' />
          Add Note
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SimpleProductionBoard;
