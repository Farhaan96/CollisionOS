import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

export const JobDetailDialog = ({ open, job, onClose }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
    <DialogTitle>Job Details</DialogTitle>
    <DialogContent dividers>
      {job ? (
        <>
          <Typography variant='subtitle1'>{job.jobNumber}</Typography>
          <Typography variant='body2'>Status: {job.status}</Typography>
        </>
      ) : (
        'No job selected.'
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);
