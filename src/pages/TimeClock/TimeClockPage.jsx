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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Avatar,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  AccessTime,
  Work,
  Coffee,
  CheckCircle,
  Warning,
  Timer,
  Refresh,
  Assignment,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import axios from 'axios';

/**
 * TimeClockPage - Full-featured time clock system for technicians
 * Connects to /api/timeclock endpoints
 */
const TimeClockPage = () => {
  const theme = useTheme();
  
  // Get current user from localStorage or context
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const technicianId = currentUser.id || currentUser.userId;

  const [currentClock, setCurrentClock] = useState(null);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [jobSelectDialog, setJobSelectDialog] = useState(false);
  const [notesDialog, setNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [laborType, setLaborType] = useState('body');

  // Timer for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentClock && currentClock.status === 'clocked_in') {
        const start = new Date(currentClock.clockIn);
        const now = new Date();
        setElapsedTime(Math.floor((now - start) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentClock]);

  // Load current status on mount
  useEffect(() => {
    if (technicianId) {
      loadCurrentStatus();
      loadAvailableJobs();
    }
  }, [technicianId]);

  const loadCurrentStatus = async () => {
    if (!technicianId) {
      setError('Technician ID not found. Please log in.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/timeclock/technician/${technicianId}/current`);
      
      if (response.data.success) {
        setCurrentClock(response.data.currentClock);
        setShiftSummary(response.data.shiftSummary);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading status:', err);
      setError(err.response?.data?.error || 'Failed to load time clock status');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableJobs = async () => {
    try {
      const response = await axios.get('/api/jobs?status=in_progress');
      if (response.data.success) {
        setAvailableJobs(response.data.jobs || []);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  };

  const handlePunchIn = async (roId = null) => {
    if (!technicianId) {
      setError('Technician ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/timeclock/punch-in', {
        technicianId,
        roId: roId || null,
        laborType: roId ? laborType : null,
        entryMethod: 'web_app',
      });

      if (response.data.success) {
        setCurrentClock(response.data.clockEntry);
        setSuccess('Clocked in successfully');
        setTimeout(() => setSuccess(null), 3000);
        await loadCurrentStatus();
      }
    } catch (err) {
      console.error('Error punching in:', err);
      setError(err.response?.data?.error || 'Failed to clock in');
    } finally {
      setLoading(false);
      setJobSelectDialog(false);
    }
  };

  const handlePunchOut = async () => {
    if (!technicianId) {
      setError('Technician ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/timeclock/punch-out', {
        technicianId,
        notes: notes || null,
      });

      if (response.data.success) {
        setCurrentClock(null);
        setSuccess('Clocked out successfully');
        setTimeout(() => setSuccess(null), 3000);
        setNotes('');
        await loadCurrentStatus();
      }
    } catch (err) {
      console.error('Error punching out:', err);
      setError(err.response?.data?.error || 'Failed to clock out');
    } finally {
      setLoading(false);
      setNotesDialog(false);
    }
  };

  const handleBreakStart = async () => {
    if (!technicianId) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/timeclock/break-start', {
        technicianId,
      });

      if (response.data.success) {
        await loadCurrentStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    if (!technicianId) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/timeclock/break-end', {
        technicianId,
      });

      if (response.data.success) {
        await loadCurrentStatus();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isClockedIn = currentClock && currentClock.status === 'clocked_in';
  const isOnBreak = currentClock && currentClock.status === 'on_break';

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
          Time Clock
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Track your work hours and job time
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Time Clock Card */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              background: isClockedIn
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.grey[300], 0.1)} 0%, ${alpha(theme.palette.grey[300], 0.05)} 100%)`,
              border: 2,
              borderColor: isClockedIn ? theme.palette.primary.main : 'divider',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Clock Status */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: isClockedIn
                      ? theme.palette.primary.main
                      : theme.palette.grey[400],
                    animation: isClockedIn ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }}
                >
                  {isClockedIn ? <Work sx={{ fontSize: 40 }} /> : <AccessTime sx={{ fontSize: 40 }} />}
                </Avatar>

                <Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
                  {isOnBreak
                    ? 'On Break'
                    : isClockedIn
                    ? 'Clocked In'
                    : 'Not Clocked In'}
                </Typography>

                {isClockedIn && (
                  <>
                    <Typography variant='h3' sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      {formatElapsedTime(elapsedTime)}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Started {currentClock?.clockIn ? formatDistanceToNow(new Date(currentClock.clockIn)) : ''} ago
                    </Typography>
                    {currentClock?.ro && (
                      <Chip
                        label={`RO: ${currentClock.ro.jobNumber || currentClock.roId}`}
                        color='primary'
                        sx={{ mt: 1 }}
                      />
                    )}
                  </>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {!isClockedIn ? (
                  <>
                    <Button
                      variant='contained'
                      size='large'
                      startIcon={<PlayArrow />}
                      onClick={() => handlePunchIn()}
                      disabled={loading || !technicianId}
                      sx={{
                        flex: 1,
                        minWidth: 200,
                        height: 60,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      }}
                    >
                      Clock In
                    </Button>
                    <Button
                      variant='outlined'
                      size='large'
                      startIcon={<Work />}
                      onClick={() => setJobSelectDialog(true)}
                      disabled={loading || !technicianId}
                      sx={{
                        flex: 1,
                        minWidth: 200,
                        height: 60,
                        fontSize: '1.1rem',
                      }}
                    >
                      Clock In on Job
                    </Button>
                  </>
                ) : (
                  <>
                    {!isOnBreak && (
                      <>
                        <Button
                          variant='outlined'
                          size='large'
                          startIcon={<Coffee />}
                          onClick={handleBreakStart}
                          disabled={loading}
                          sx={{ flex: 1, minWidth: 150 }}
                        >
                          Start Break
                        </Button>
                        <Button
                          variant='outlined'
                          size='large'
                          startIcon={<Work />}
                          onClick={() => setJobSelectDialog(true)}
                          disabled={loading}
                          sx={{ flex: 1, minWidth: 150 }}
                        >
                          Switch Job
                        </Button>
                      </>
                    )}
                    {isOnBreak && (
                      <Button
                        variant='contained'
                        size='large'
                        startIcon={<PlayArrow />}
                        onClick={handleBreakEnd}
                        disabled={loading}
                        color='success'
                        sx={{ flex: 1, minWidth: 200 }}
                      >
                        End Break
                      </Button>
                    )}
                    <Button
                      variant='contained'
                      size='large'
                      startIcon={<Stop />}
                      onClick={() => setNotesDialog(true)}
                      disabled={loading}
                      color='error'
                      sx={{
                        flex: 1,
                        minWidth: 200,
                        height: 60,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                      }}
                    >
                      Clock Out
                    </Button>
                  </>
                )}
              </Box>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Shift Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Today's Summary
                </Typography>
                <IconButton size='small' onClick={loadCurrentStatus}>
                  <Refresh fontSize='small' />
                </IconButton>
              </Box>

              {shiftSummary ? (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='h4' color='primary' sx={{ fontWeight: 700 }}>
                          {shiftSummary.totalHours?.toFixed(1) || '0.0'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Total Hours
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='h4' color='success.main' sx={{ fontWeight: 700 }}>
                          {shiftSummary.netHours?.toFixed(1) || '0.0'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Net Hours
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='h4' color='warning.main' sx={{ fontWeight: 700 }}>
                          {shiftSummary.breakHours?.toFixed(1) || '0.0'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Break Hours
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='h4' color='info.main' sx={{ fontWeight: 700 }}>
                          ${shiftSummary.laborCost?.toFixed(2) || '0.00'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Labor Cost
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>
                      Entries Today
                    </Typography>
                    <Typography variant='h5' sx={{ fontWeight: 600 }}>
                      {shiftSummary.entries || 0}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  No activity today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Job Selection Dialog */}
      <Dialog
        open={jobSelectDialog}
        onClose={() => setJobSelectDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Select Job to Clock In</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Labor Type</InputLabel>
            <Select
              value={laborType}
              onChange={(e) => setLaborType(e.target.value)}
              label='Labor Type'
            >
              <MenuItem value='body'>Body</MenuItem>
              <MenuItem value='paint'>Paint</MenuItem>
              <MenuItem value='frame'>Frame</MenuItem>
              <MenuItem value='mechanical'>Mechanical</MenuItem>
              <MenuItem value='electrical'>Electrical</MenuItem>
              <MenuItem value='glass'>Glass</MenuItem>
              <MenuItem value='detail'>Detail</MenuItem>
              <MenuItem value='prep'>Prep</MenuItem>
              <MenuItem value='quality_control'>Quality Control</MenuItem>
              <MenuItem value='other'>Other</MenuItem>
            </Select>
          </FormControl>

          <List>
            {availableJobs.map((job) => (
              <ListItem
                key={job.id}
                button
                onClick={() => {
                  setSelectedJobId(job.id);
                  handlePunchIn(job.id);
                }}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  <Assignment color='primary' />
                </ListItemIcon>
                <ListItemText
                  primary={job.jobNumber || `RO-${job.id}`}
                  secondary={`${job.customer?.firstName || ''} ${job.customer?.lastName || ''} - ${job.vehicle?.year || ''} ${job.vehicle?.make || ''} ${job.vehicle?.model || ''}`}
                />
              </ListItem>
            ))}
          </List>

          {availableJobs.length === 0 && (
            <Alert severity='info' sx={{ mt: 2 }}>
              No active jobs available. Clock in without a job assignment.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobSelectDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={() => handlePunchIn(null)}
            disabled={loading}
          >
            Clock In Without Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog for Clock Out */}
      <Dialog
        open={notesDialog}
        onClose={() => setNotesDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Clock Out</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label='Notes (optional)'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='Add any notes about your work...'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialog(false)}>Cancel</Button>
          <Button variant='contained' onClick={handlePunchOut} disabled={loading}>
            Clock Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeClockPage;

