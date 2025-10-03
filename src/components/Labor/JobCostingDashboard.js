import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccessTime,
  AttachMoney,
  Warning,
  CheckCircle,
  Error,
  Edit,
  Delete,
  Timeline,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import laborService from '../../services/laborService';
import { formatCurrency } from '../../utils/formatters';

const JobCostingDashboard = ({ jobId, userRole = 'technician' }) => {
  const theme = useTheme();

  const [costing, setCosting] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadJobCosting();
    loadTimeEntries();
  }, [jobId]);

  const loadJobCosting = async () => {
    try {
      const data = await laborService.getJobCosting(jobId);
      setCosting(data);
    } catch (err) {
      console.error('Error loading job costing:', err);
      setError(err.message);
    }
  };

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      const data = await laborService.getJobTimeEntries(jobId);
      setTimeEntries(data.entries || []);
    } catch (err) {
      console.error('Error loading time entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = async (entryId) => {
    // Open edit dialog - implement based on your UI framework
    console.log('Edit entry:', entryId);
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await laborService.deleteTimeEntry(entryId);
        await loadTimeEntries();
        await loadJobCosting();
      } catch (err) {
        alert('Failed to delete entry: ' + err.message);
      }
    }
  };

  if (loading && !costing) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading job costing data...</Typography>
      </Box>
    );
  }

  if (error && !costing) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const estimatedHours = costing?.estimatedHours || 0;
  const actualHours = costing?.actualHours || 0;
  const variance = actualHours - estimatedHours;
  const variancePercent = estimatedHours > 0 ? (variance / estimatedHours) * 100 : 0;
  const isOverBudget = variance > 0;

  const estimatedCost = costing?.estimatedCost || 0;
  const actualCost = costing?.actualCost || 0;
  const costVariance = actualCost - estimatedCost;
  const isProfitable = costVariance <= 0;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2" color="text.secondary">
                  Estimated Hours
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {estimatedHours.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timeline sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="body2" color="text.secondary">
                  Actual Hours
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {actualHours.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card
            sx={{
              background: isOverBudget
                ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
              border: `1px solid ${isOverBudget ? theme.palette.error.main : theme.palette.success.main}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {isOverBudget ? (
                  <TrendingUp sx={{ mr: 1, color: theme.palette.error.main }} />
                ) : (
                  <TrendingDown sx={{ mr: 1, color: theme.palette.success.main }} />
                )}
                <Typography variant="body2" color="text.secondary">
                  Variance
                </Typography>
              </Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={isOverBudget ? 'error.main' : 'success.main'}
              >
                {variance > 0 ? '+' : ''}{variance.toFixed(1)}h
              </Typography>
              <Chip
                size="small"
                label={`${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(0)}%`}
                color={isOverBudget ? 'error' : 'success'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ mr: 1, color: theme.palette.secondary.main }} />
                <Typography variant="body2" color="text.secondary">
                  Labor Cost
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(actualCost)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Est: {formatCurrency(estimatedCost)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Hours Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {actualHours.toFixed(1)}h / {estimatedHours.toFixed(1)}h
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((actualHours / estimatedHours) * 100, 100)}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: alpha(
                isOverBudget ? theme.palette.error.main : theme.palette.primary.main,
                0.2
              ),
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                backgroundColor: isOverBudget ? theme.palette.error.main : theme.palette.primary.main,
              },
            }}
          />

          {isOverBudget && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                This job is currently <strong>{variance.toFixed(1)} hours</strong> over budget.
                Additional labor costs: {formatCurrency(costVariance)}
              </Typography>
            </Alert>
          )}

          {!isOverBudget && actualHours > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Job is on track! Currently <strong>{Math.abs(variance).toFixed(1)} hours</strong> under
                budget.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Time Entries
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Technician</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell align="right">Duration</TableCell>
                  <TableCell align="right">Labor Cost</TableCell>
                  <TableCell>Notes</TableCell>
                  {(userRole === 'supervisor' || userRole === 'admin') && (
                    <TableCell align="center">Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.technician?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={entry.operation.replace('_', ' ').toUpperCase()}
                        color={
                          entry.operation === 'start_job'
                            ? 'primary'
                            : entry.operation === 'break_start' || entry.operation === 'lunch_start'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {entry.startTime
                        ? format(new Date(entry.startTime), 'MMM dd, hh:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {entry.endTime ? format(new Date(entry.endTime), 'MMM dd, hh:mm a') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {entry.duration ? `${(entry.duration / 60).toFixed(2)}h` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {entry.laborCost ? formatCurrency(entry.laborCost) : '-'}
                    </TableCell>
                    <TableCell>
                      {entry.notes && (
                        <Tooltip title={entry.notes}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {entry.notes}
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    {(userRole === 'supervisor' || userRole === 'admin') && (
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditEntry(entry.id)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

                {timeEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No time entries recorded for this job yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobCostingDashboard;
