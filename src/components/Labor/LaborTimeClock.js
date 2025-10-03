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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  AccessTime,
  Work,
  Coffee,
  Restaurant,
  CheckCircle,
  Warning,
  Timer,
  TrendingUp,
  Assessment,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import laborService from '../../services/laborService';

const LABOR_OPERATIONS = {
  CLOCK_IN: 'clock_in',
  CLOCK_OUT: 'clock_out',
  START_JOB: 'start_job',
  STOP_JOB: 'stop_job',
  BREAK_START: 'break_start',
  BREAK_END: 'break_end',
  LUNCH_START: 'lunch_start',
  LUNCH_END: 'lunch_end',
};

const LaborTimeClock = ({ technicianId, jobs = [], onUpdate }) => {
  const theme = useTheme();

  const [currentSession, setCurrentSession] = useState(null);
  const [activeJobWork, setActiveJobWork] = useState(null);
  const [activeBreak, setActiveBreak] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobSelectDialog, setJobSelectDialog] = useState(false);
  const [notesDialog, setNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [pendingOperation, setPendingOperation] = useState(null);

  // Timer for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSession) {
        const start = new Date(currentSession.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now - start) / 1000));
      } else if (activeJobWork) {
        const start = new Date(activeJobWork.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now - start) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, activeJobWork]);

  // Load current status on mount
  useEffect(() => {
    loadCurrentStatus();
  }, [technicianId]);

  const loadCurrentStatus = async () => {
    try {
      setLoading(true);
      const status = await laborService.getCurrentStatus(technicianId);

      if (status.clockedIn) {
        setCurrentSession(status.session);
      }

      if (status.activeJob) {
        setActiveJobWork(status.activeJob);
      }

      if (status.activeBreak) {
        setActiveBreak(status.activeBreak);
      }

      if (status.shiftSummary) {
        setShiftSummary(status.shiftSummary);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOperation = async (operation, jobId = null, additionalNotes = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await laborService.clockOperation({
        operation,
        jobId,
        notes: additionalNotes || notes || null,
      });

      if (response.success) {
        // Update local state based on operation
        switch (operation) {
          case LABOR_OPERATIONS.CLOCK_IN:
            setCurrentSession(response.entry);
            break;
          case LABOR_OPERATIONS.CLOCK_OUT:
            setCurrentSession(null);
            setActiveJobWork(null);
            setActiveBreak(null);
            break;
          case LABOR_OPERATIONS.START_JOB:
            setActiveJobWork(response.entry);
            setActiveBreak(null);
            break;
          case LABOR_OPERATIONS.STOP_JOB:
            setActiveJobWork(null);
            break;
          case LABOR_OPERATIONS.BREAK_START:
          case LABOR_OPERATIONS.LUNCH_START:
            setActiveBreak(response.entry);
            break;
          case LABOR_OPERATIONS.BREAK_END:
          case LABOR_OPERATIONS.LUNCH_END:
            setActiveBreak(null);
            break;
        }

        setShiftSummary(response.shiftSummary);
        setNotes('');
        setJobSelectDialog(false);
        setNotesDialog(false);

        if (onUpdate) {
          onUpdate(response);
        }
      }
    } catch (err) {
      console.error('Error processing operation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = (job) => {
    handleClockOperation(LABOR_OPERATIONS.START_JOB, job.id);
  };

  const handleStopJob = () => {
    if (activeJobWork) {
      setPendingOperation(LABOR_OPERATIONS.STOP_JOB);
      setNotesDialog(true);
    }
  };

  const handleClockOut = () => {
    setPendingOperation(LABOR_OPERATIONS.CLOCK_OUT);
    setNotesDialog(true);
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clock in/out button
  const ClockButton = () => {
    if (!currentSession) {
      return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={() => handleClockOperation(LABOR_OPERATIONS.CLOCK_IN)}
            disabled={loading}
            sx={{
              height: 80,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.4)}`,
            }}
          >
            Clock In
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<Stop />}
          onClick={handleClockOut}
          disabled={loading}
          sx={{
            height: 80,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.4)}`,
          }}
        >
          Clock Out
        </Button>
      </motion.div>
    );
  };

  // Active timer display
  const ActiveTimer = () => {
    if (!currentSession && !activeJobWork) return null;

    const isWorking = activeJobWork && !activeBreak;
    const isOnBreak = activeBreak;

    return (
      <Card
        sx={{
          background: isOnBreak
            ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`
            : isWorking
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
          border: `2px solid ${
            isOnBreak
              ? theme.palette.warning.main
              : isWorking
              ? theme.palette.primary.main
              : theme.palette.info.main
          }`,
          mb: 2,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: isOnBreak
                    ? theme.palette.warning.main
                    : isWorking
                    ? theme.palette.primary.main
                    : theme.palette.info.main,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                  },
                }}
              >
                {isOnBreak ? <Coffee /> : isWorking ? <Work /> : <AccessTime />}
              </Avatar>

              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {isOnBreak
                    ? activeBreak.operation === LABOR_OPERATIONS.LUNCH_START ? 'On Lunch Break' : 'On Break'
                    : isWorking
                    ? `Working on Job ${activeJobWork.jobNumber || ''}`
                    : 'Clocked In'
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isWorking && activeJobWork.taskName
                    ? activeJobWork.taskName
                    : currentSession
                    ? `Started ${formatDistanceToNow(new Date(currentSession.startTime))} ago`
                    : ''
                  }
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {formatElapsedTime(elapsedTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elapsed Time
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {!isOnBreak && !isWorking && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Work />}
                  onClick={() => setJobSelectDialog(true)}
                  fullWidth
                >
                  Start Job
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Coffee />}
                  onClick={() => handleClockOperation(LABOR_OPERATIONS.BREAK_START)}
                  fullWidth
                >
                  Break
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Restaurant />}
                  onClick={() => handleClockOperation(LABOR_OPERATIONS.LUNCH_START)}
                  fullWidth
                >
                  Lunch
                </Button>
              </>
            )}

            {isWorking && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={handleStopJob}
                fullWidth
              >
                Stop Job
              </Button>
            )}

            {isOnBreak && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrow />}
                onClick={() => handleClockOperation(
                  activeBreak.operation === LABOR_OPERATIONS.LUNCH_START
                    ? LABOR_OPERATIONS.LUNCH_END
                    : LABOR_OPERATIONS.BREAK_END
                )}
                fullWidth
              >
                End {activeBreak.operation === LABOR_OPERATIONS.LUNCH_START ? 'Lunch' : 'Break'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Shift summary display
  const ShiftSummary = () => {
    if (!shiftSummary) return null;

    const utilizationPercent = shiftSummary.totalHours > 0
      ? (shiftSummary.billableHours / shiftSummary.totalHours) * 100
      : 0;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today's Summary
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {shiftSummary.totalHours?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hours
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {shiftSummary.billableHours?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Billable Hours
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {shiftSummary.breakTime?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Break Time
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {shiftSummary.jobsWorked || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Jobs Worked
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Utilization
            </Typography>
            <Chip
              label={`${utilizationPercent.toFixed(0)}%`}
              color={utilizationPercent >= 75 ? 'success' : utilizationPercent >= 50 ? 'warning' : 'error'}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Earnings (Estimated)
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              ${shiftSummary.earnings?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ClockButton />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      <AnimatePresence>
        {(currentSession || activeJobWork) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ActiveTimer />
          </motion.div>
        )}
      </AnimatePresence>

      {shiftSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShiftSummary />
        </motion.div>
      )}

      {/* Job Selection Dialog */}
      <Dialog
        open={jobSelectDialog}
        onClose={() => setJobSelectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Job to Work On</DialogTitle>
        <DialogContent>
          <List>
            {jobs.map((job) => (
              <ListItem
                key={job.id}
                button
                onClick={() => handleStartJob(job)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  <Work color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={job.jobNumber || `Job #${job.id}`}
                  secondary={`${job.customer?.name || 'Unknown'} - ${job.vehicle?.year || ''} ${job.vehicle?.make || ''} ${job.vehicle?.model || ''}`}
                />
              </ListItem>
            ))}
          </List>

          {jobs.length === 0 && (
            <Alert severity="info">
              No jobs available to work on. Please contact your supervisor.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobSelectDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialog}
        onClose={() => setNotesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {pendingOperation === LABOR_OPERATIONS.CLOCK_OUT ? 'Clock Out' : 'Stop Job'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about your work..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (pendingOperation === LABOR_OPERATIONS.CLOCK_OUT) {
                handleClockOperation(LABOR_OPERATIONS.CLOCK_OUT, null, notes);
              } else if (pendingOperation === LABOR_OPERATIONS.STOP_JOB) {
                handleClockOperation(LABOR_OPERATIONS.STOP_JOB, activeJobWork.jobId, notes);
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LaborTimeClock;
