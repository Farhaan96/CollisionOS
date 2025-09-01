import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Tooltip,
  Badge,
  Fab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Assignment,
  PhotoCamera,
  Mic,
  VideoCall,
  Build,
  Settings,
  QrCode,
  Flag,
  Timer,
  TrendingUp,
  Person,
  DirectionsCar,
  ExpandMore,
  Add,
  Edit,
  Delete,
  Print,
  Share,
  Upload,
  Download,
  Refresh,
  Star,
  ThumbUp,
  Comment,
  Visibility,
  School,
  EmojiEvents,
  Assessment,
  Speed,
  Timeline,
  LocalShipping,
  Inventory,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { formatCurrency, formatTime } from '../../utils/formatters';

// Quality control checkpoints based on Instructions document
const QC_CHECKPOINTS = {
  pre_repair: {
    title: 'Pre-Repair Inspection',
    points: [
      'Vehicle condition documented',
      'Parts inventory verified',
      'Customer belongings secured',
      'Work area prepared',
    ],
  },
  teardown: {
    title: 'Teardown/Blueprint',
    points: [
      'Hidden damage identified',
      'Structural integrity assessed',
      'Additional parts needed documented',
      'Photos of all damage taken',
    ],
  },
  repair_progress: {
    title: 'Repair Progress',
    points: [
      'Work completed per estimate',
      'Quality standards maintained',
      'Safety procedures followed',
      'Progress photos taken',
    ],
  },
  paint_prep: {
    title: 'Paint Preparation',
    points: [
      'Surface properly prepared',
      'Primer applied correctly',
      'Masking completed',
      'Environment controlled',
    ],
  },
  paint_complete: {
    title: 'Paint Complete',
    points: [
      'Color match verified',
      'Finish quality acceptable',
      'No defects present',
      'Cure time documented',
    ],
  },
  reassembly: {
    title: 'Reassembly',
    points: [
      'All parts properly installed',
      'Torque specifications met',
      'Hardware replaced as needed',
      'Function tests completed',
    ],
  },
  pre_delivery: {
    title: 'Pre-Delivery Inspection',
    points: [
      'All work completed',
      'Vehicle cleaned and detailed',
      'Systems functioning properly',
      'Customer walkthrough prepared',
    ],
  },
  adas_calibration: {
    title: 'ADAS Calibration',
    points: [
      'Systems requiring calibration identified',
      'Proper equipment used',
      'Calibration completed successfully',
      'Documentation provided',
    ],
  },
};

// Training modules
const TRAINING_MODULES = [
  {
    id: '1',
    title: 'ADAS Calibration Fundamentals',
    duration: '45 min',
    type: 'certification',
    status: 'completed',
    score: 95,
  },
  {
    id: '2',
    title: 'Paint Mixing and Color Matching',
    duration: '30 min',
    type: 'skill',
    status: 'in_progress',
    progress: 60,
  },
  {
    id: '3',
    title: 'Structural Repair Techniques',
    duration: '60 min',
    type: 'certification',
    status: 'available',
    required: true,
  },
];

const TechnicianConsole = ({ technicianId, currentUser }) => {
  const theme = useTheme();

  const [activeJobs, setActiveJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [timeEntry, setTimeEntry] = useState(null);
  const [qcDialog, setQcDialog] = useState(false);
  const [trainingDialog, setTrainingDialog] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Sample technician data
  const technicianData = {
    id: technicianId || '1',
    name: currentUser?.name || 'John Smith',
    avatar: currentUser?.avatar,
    specialties: ['Body Repair', 'Paint', 'ADAS'],
    efficiency: 92,
    qualityScore: 4.8,
    certifications: ['I-CAR Gold', 'ASE Certified', 'ADAS Specialist'],
    hoursToday: 6.5,
    targetHours: 8.0,
    flagHours: 7.2,
    completedJobs: 3,
  };

  // Sample job data
  const sampleJobs = [
    {
      id: '1',
      jobNumber: 'JOB-2024-001',
      customer: { name: 'John Smith', phone: '(555) 123-4567' },
      vehicle: { year: 2022, make: 'Toyota', model: 'Camry', color: 'White' },
      status: 'in_progress',
      priority: 'high',
      assignedTasks: [
        {
          id: '1',
          name: 'Replace front bumper',
          status: 'completed',
          hours: 2.5,
        },
        {
          id: '2',
          name: 'Paint front bumper',
          status: 'in_progress',
          hours: 1.5,
        },
        { id: '3', name: 'Install bumper', status: 'pending', hours: 1.0 },
      ],
      totalHours: 5.0,
      completedHours: 2.5,
      targetCompletion: '2024-01-20',
      lastUpdate: '2024-01-16T10:30:00Z',
    },
    {
      id: '2',
      jobNumber: 'JOB-2024-002',
      customer: { name: 'Sarah Wilson', phone: '(555) 987-6543' },
      vehicle: { year: 2021, make: 'Honda', model: 'Civic', color: 'Blue' },
      status: 'pending',
      priority: 'normal',
      assignedTasks: [
        {
          id: '4',
          name: 'Repair quarter panel',
          status: 'pending',
          hours: 4.0,
        },
        { id: '5', name: 'Paint quarter panel', status: 'pending', hours: 2.0 },
      ],
      totalHours: 6.0,
      completedHours: 0,
      targetCompletion: '2024-01-22',
      lastUpdate: '2024-01-16T08:00:00Z',
    },
  ];

  useEffect(() => {
    setActiveJobs(sampleJobs);
  }, []);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startTimer = (job, task) => {
    setSelectedJob(job);
    setActiveTask(task);
    setIsTimerRunning(true);
    setElapsedTime(0);

    // Create time entry
    setTimeEntry({
      jobId: job.id,
      taskId: task.id,
      startTime: new Date(),
      technicianId: technicianData.id,
    });
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timeEntry) {
      // Save time entry
      const completedEntry = {
        ...timeEntry,
        endTime: new Date(),
        duration: elapsedTime,
        flagHours: activeTask?.hours || 0,
      };
      console.log('Time entry completed:', completedEntry);
    }
    setTimeEntry(null);
    setActiveTask(null);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  // Quality control component
  const QualityControlCheckpoint = ({ checkpoint, onComplete }) => {
    const [checkedItems, setCheckedItems] = useState({});
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState([]);

    const handleItemCheck = (index, checked) => {
      setCheckedItems(prev => ({ ...prev, [index]: checked }));
    };

    const allItemsChecked = checkpoint.points.every(
      (_, index) => checkedItems[index]
    );

    return (
      <Box>
        <Typography variant='h6' gutterBottom>
          {checkpoint.title}
        </Typography>

        <List>
          {checkpoint.points.map((point, index) => (
            <ListItem key={index} disablePadding>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checkedItems[index] || false}
                    onChange={e => handleItemCheck(index, e.target.checked)}
                  />
                }
                label={point}
                sx={{ width: '100%' }}
              />
            </ListItem>
          ))}
        </List>

        <TextField
          fullWidth
          multiline
          rows={3}
          label='Notes (optional)'
          value={notes}
          onChange={e => setNotes(e.target.value)}
          sx={{ mt: 2, mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            startIcon={<PhotoCamera />}
            variant='outlined'
            onClick={() => setPhotoDialog(true)}
          >
            Add Photos ({photos.length})
          </Button>
        </Box>

        <Button
          fullWidth
          variant='contained'
          disabled={!allItemsChecked}
          onClick={() => onComplete({ checkedItems, notes, photos })}
        >
          Complete Checkpoint
        </Button>
      </Box>
    );
  };

  // Job card component
  const JobCard = ({ job, isActive = false }) => {
    const progress = (job.completedHours / job.totalHours) * 100;
    const isOverdue = new Date(job.targetCompletion) < new Date();

    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card
          sx={{
            border: isActive
              ? `2px solid ${theme.palette.primary.main}`
              : '1px solid',
            borderColor: isActive ? theme.palette.primary.main : 'divider',
            cursor: 'pointer',
            mb: 2,
          }}
          onClick={() => setSelectedJob(job)}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Box>
                <Typography variant='h6' fontWeight='bold'>
                  {job.jobNumber}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {job.customer.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 0.5,
                }}
              >
                <Chip
                  size='small'
                  label={job.priority.toUpperCase()}
                  color={
                    job.priority === 'high'
                      ? 'error'
                      : job.priority === 'normal'
                        ? 'primary'
                        : 'default'
                  }
                />
                {isOverdue && (
                  <Chip
                    size='small'
                    icon={<Warning />}
                    label='OVERDUE'
                    color='error'
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  Progress
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {job.completedHours}h / {job.totalHours}h
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Target: {format(new Date(job.targetCompletion), 'MMM dd, yyyy')}
            </Typography>

            <Typography variant='body2' color='text.secondary'>
              Last update: {formatDistanceToNow(new Date(job.lastUpdate))} ago
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Task list component
  const TaskList = ({ job }) => {
    if (!job) return null;

    return (
      <Box>
        <Typography variant='h6' gutterBottom>
          Tasks for {job.jobNumber}
        </Typography>

        <List>
          {job.assignedTasks.map(task => (
            <ListItem
              key={task.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                backgroundColor:
                  activeTask?.id === task.id
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'background.paper',
              }}
            >
              <ListItemIcon>
                {task.status === 'completed' ? (
                  <CheckCircle color='success' />
                ) : task.status === 'in_progress' ? (
                  <PlayArrow color='primary' />
                ) : (
                  <Schedule color='disabled' />
                )}
              </ListItemIcon>

              <ListItemText
                primary={task.name}
                secondary={`${task.hours} flag hours • ${task.status}`}
              />

              <ListItemSecondaryAction>
                {task.status === 'pending' && (
                  <Button
                    size='small'
                    variant='contained'
                    startIcon={<PlayArrow />}
                    onClick={() => startTimer(job, task)}
                  >
                    Start
                  </Button>
                )}
                {task.status === 'in_progress' &&
                  activeTask?.id === task.id && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant='body2' fontWeight='bold'>
                        {formatTime(elapsedTime)}
                      </Typography>
                      <IconButton
                        size='small'
                        onClick={pauseTimer}
                        disabled={!isTimerRunning}
                      >
                        <Pause />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='success'
                        onClick={stopTimer}
                      >
                        <Stop />
                      </IconButton>
                    </Box>
                  )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  // Training component
  const TrainingCenter = () => (
    <Box>
      <Typography variant='h6' gutterBottom>
        Training & Certifications
      </Typography>

      <Grid container spacing={2}>
        {TRAINING_MODULES.map(module => (
          <Grid item xs={12} sm={6} md={4} key={module.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor:
                        module.status === 'completed'
                          ? 'success.main'
                          : module.status === 'in_progress'
                            ? 'primary.main'
                            : 'grey.500',
                      mr: 2,
                    }}
                  >
                    {module.type === 'certification' ? (
                      <EmojiEvents />
                    ) : (
                      <School />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant='subtitle1' fontWeight='bold'>
                      {module.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {module.duration} • {module.type}
                    </Typography>
                  </Box>
                </Box>

                {module.status === 'completed' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Star sx={{ color: '#ffc107', mr: 0.5 }} />
                    <Typography variant='body2'>
                      Score: {module.score}%
                    </Typography>
                  </Box>
                )}

                {module.status === 'in_progress' && (
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress
                      variant='determinate'
                      value={module.progress}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant='body2' color='text.secondary'>
                      {module.progress}% complete
                    </Typography>
                  </Box>
                )}

                <Button
                  fullWidth
                  variant={module.required ? 'contained' : 'outlined'}
                  color={module.status === 'completed' ? 'success' : 'primary'}
                  disabled={module.status === 'completed'}
                >
                  {module.status === 'completed'
                    ? 'Completed'
                    : module.status === 'in_progress'
                      ? 'Continue'
                      : 'Start'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={technicianData.avatar}
              sx={{ mr: 2, width: 56, height: 56 }}
            >
              {technicianData.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant='h5' fontWeight='bold'>
                {technicianData.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {technicianData.specialties.join(' • ')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {technicianData.certifications.map((cert, index) => (
                  <Chip
                    key={index}
                    size='small'
                    label={cert}
                    variant='outlined'
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Daily metrics */}
          <Grid container spacing={2} sx={{ maxWidth: 400 }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='primary' fontWeight='bold'>
                  {technicianData.hoursToday}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Hours Today
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='success.main' fontWeight='bold'>
                  {technicianData.efficiency}%
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Efficiency
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Active timer */}
        {isTimerRunning && activeTask && (
          <Alert
            severity='info'
            sx={{ mt: 2 }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='h6' fontWeight='bold'>
                  {formatTime(elapsedTime)}
                </Typography>
                <IconButton color='inherit' onClick={pauseTimer}>
                  <Pause />
                </IconButton>
                <IconButton color='inherit' onClick={stopTimer}>
                  <Stop />
                </IconButton>
              </Box>
            }
          >
            Working on: {activeTask.name} ({selectedJob?.jobNumber})
          </Alert>
        )}
      </Paper>

      {/* Main content */}
      <Box sx={{ display: 'flex', flex: 1, gap: 2 }}>
        {/* Left panel - Jobs */}
        <Paper sx={{ width: 400, p: 2, overflowY: 'auto' }}>
          <Typography variant='h6' gutterBottom>
            My Jobs ({activeJobs.length})
          </Typography>

          {activeJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isActive={selectedJob?.id === job.id}
            />
          ))}
        </Paper>

        {/* Center panel - Tasks */}
        <Paper sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
          {selectedJob ? (
            <TaskList job={selectedJob} />
          ) : (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant='h6' color='text.secondary'>
                Select a job to view tasks
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Right panel - Tools & Training */}
        <Paper sx={{ width: 350, p: 2, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              fullWidth
              variant={activeTab === 'tools' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('tools')}
            >
              Tools
            </Button>
            <Button
              fullWidth
              variant={activeTab === 'training' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('training')}
            >
              Training
            </Button>
          </Box>

          {activeTab === 'tools' && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Quick Actions
              </Typography>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant='outlined'
                    startIcon={<CheckCircle />}
                    onClick={() => setQcDialog(true)}
                  >
                    QC Check
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant='outlined'
                    startIcon={<PhotoCamera />}
                    onClick={() => setPhotoDialog(true)}
                  >
                    Add Photos
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button fullWidth variant='outlined' startIcon={<QrCode />}>
                    Scan Part
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button fullWidth variant='outlined' startIcon={<Flag />}>
                    Flag Issue
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 'training' && <TrainingCenter />}
        </Paper>
      </Box>

      {/* Quality Control Dialog */}
      <Dialog
        open={qcDialog}
        onClose={() => setQcDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Quality Control Checkpoint</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Checkpoint</InputLabel>
            <Select defaultValue=''>
              {Object.entries(QC_CHECKPOINTS).map(([key, checkpoint]) => (
                <MenuItem key={key} value={key}>
                  {checkpoint.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* QC content would be rendered here based on selection */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQcDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TechnicianConsole;
