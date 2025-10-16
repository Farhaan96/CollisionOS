/**
 * Job Status Selector - CollisionOS
 *
 * Component for updating job status with workflow validation
 * Features:
 * - Shows current status
 * - Only displays valid next statuses based on workflow rules
 * - Optional notes field for status changes
 * - Confirmation dialog for critical transitions
 * - Real-time status update
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
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
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { jobService } from '../../services/jobService';

// Status display configuration
const STATUS_CONFIG = {
  estimate: { label: 'Estimate', color: 'default', icon: '📝' },
  estimating: { label: 'Estimating', color: 'info', icon: '🔍' },
  awaiting_approval: { label: 'Awaiting Approval', color: 'warning', icon: '⏳' },
  approved: { label: 'Approved', color: 'success', icon: '✅' },
  intake: { label: 'Intake', color: 'primary', icon: '📥' },
  awaiting_parts: { label: 'Awaiting Parts', color: 'warning', icon: '🔧' },
  in_production: { label: 'In Production', color: 'info', icon: '⚙️' },
  body_structure: { label: 'Body Structure', color: 'info', icon: '🔨' },
  paint_prep: { label: 'Paint Prep', color: 'info', icon: '🎨' },
  paint_booth: { label: 'Paint Booth', color: 'info', icon: '🖌️' },
  reassembly: { label: 'Reassembly', color: 'info', icon: '🔩' },
  quality_check: { label: 'Quality Check', color: 'secondary', icon: '✔️' },
  ready: { label: 'Ready for Pickup', color: 'success', icon: '🎉' },
  delivered: { label: 'Delivered', color: 'success', icon: '🚗' },
  cancelled: { label: 'Cancelled', color: 'error', icon: '❌' },
  closed: { label: 'Closed', color: 'default', icon: '📁' },
};

// Valid status transitions
const VALID_TRANSITIONS = {
  estimate: ['intake', 'estimating', 'cancelled'],
  estimating: ['awaiting_approval', 'cancelled'],
  awaiting_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['awaiting_parts', 'in_production', 'cancelled'],
  intake: ['estimating', 'awaiting_parts', 'in_production', 'cancelled'],
  awaiting_parts: ['in_production', 'cancelled'],
  in_production: [
    'body_structure',
    'paint_prep',
    'paint_booth',
    'reassembly',
    'quality_check',
    'ready',
    'cancelled',
  ],
  body_structure: ['paint_prep', 'quality_check', 'cancelled'],
  paint_prep: ['paint_booth', 'quality_check', 'cancelled'],
  paint_booth: ['reassembly', 'quality_check', 'cancelled'],
  reassembly: ['quality_check', 'ready', 'cancelled'],
  quality_check: ['ready', 'in_production', 'cancelled'],
  ready: ['delivered'],
  delivered: ['closed'],
  cancelled: [],
  closed: [],
};

// Statuses that require confirmation
const CONFIRM_REQUIRED = ['delivered', 'cancelled', 'closed'];

const JobStatusSelector = ({ jobId, currentStatus, onStatusChanged, compact = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Get valid next statuses
  const validNextStatuses = useMemo(() => {
    return VALID_TRANSITIONS[currentStatus] || [];
  }, [currentStatus]);

  // Get current status config
  const currentConfig = STATUS_CONFIG[currentStatus] || {
    label: currentStatus,
    color: 'default',
    icon: '•',
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSelectedStatus('');
    setNotes('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setShowConfirm(false);
    setSelectedStatus('');
    setNotes('');
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);

    // Show confirmation for critical statuses
    if (CONFIRM_REQUIRED.includes(status)) {
      setShowConfirm(true);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    // Require notes for certain transitions
    if (selectedStatus === 'cancelled' && !notes.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsLoading(true);

    try {
      const result = await jobService.updateStatus(jobId, selectedStatus, notes);

      if (result.success) {
        toast.success(result.message || 'Status updated successfully');

        // Notify parent component
        if (onStatusChanged) {
          onStatusChanged(result.job);
        }

        handleCloseDialog();
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  // Compact view - just the status chip with edit icon
  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              <span>{currentConfig.icon}</span>
              <span>{currentConfig.label}</span>
            </Box>
          }
          color={currentConfig.color}
          size="small"
        />
        {validNextStatuses.length > 0 && (
          <Tooltip title="Change status">
            <IconButton size="small" onClick={handleOpenDialog}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Full view
  return (
    <>
      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Current Status
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
          <Chip
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <span>{currentConfig.icon}</span>
                <span>{currentConfig.label}</span>
              </Box>
            }
            color={currentConfig.color}
          />
          {validNextStatuses.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleOpenDialog}
            >
              Update Status
            </Button>
          )}
        </Box>
      </Box>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Update Job Status</Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Current Status Display */}
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
            Current status: <strong>{currentConfig.label}</strong>
          </Alert>

          {/* Status Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => handleStatusSelect(e.target.value)}
              label="New Status"
            >
              {validNextStatuses.map((status) => {
                const config = STATUS_CONFIG[status] || { label: status, icon: '•' };
                return (
                  <MenuItem key={status} value={status}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Notes Field */}
          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this status change..."
            required={selectedStatus === 'cancelled'}
            helperText={
              selectedStatus === 'cancelled'
                ? 'Required: Please provide a cancellation reason'
                : 'Optional: Add context about this status change'
            }
          />

          {/* Confirmation Warning */}
          {showConfirm && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                {selectedStatus === 'delivered'
                  ? 'Mark as Delivered?'
                  : selectedStatus === 'cancelled'
                  ? 'Cancel this Job?'
                  : 'Confirm Status Change'}
              </Typography>
              <Typography variant="body2">
                {selectedStatus === 'delivered'
                  ? 'This will mark the job as completed and delivered to the customer.'
                  : selectedStatus === 'cancelled'
                  ? 'This action will cancel the job. This cannot be easily undone.'
                  : 'Please confirm this status change.'}
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={isLoading || !selectedStatus}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
            color={selectedStatus === 'cancelled' ? 'error' : 'primary'}
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JobStatusSelector;
