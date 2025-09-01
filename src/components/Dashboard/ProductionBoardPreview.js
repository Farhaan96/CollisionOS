import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

export const ProductionBoardPreview = ({ jobs }) => {
  const handleJobClick = job => {
    console.log('Job clicked:', job);
    alert(`Job ${job.jobNumber} clicked!`);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'estimate':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'ready_pickup':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}
    >
      {(jobs || []).slice(0, 6).map((job, index) => (
        <Box
          key={job.id || index}
          sx={{
            border: '1px solid #ddd',
            borderRadius: 1,
            padding: 2,
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease-in-out',
            },
          }}
          onClick={() => handleJobClick(job)}
        >
          <Typography variant='body2' fontWeight='bold' gutterBottom>
            {job.jobNumber || `JOB-${String(index + 1).padStart(3, '0')}`}
          </Typography>
          <Typography variant='caption' color='text.secondary' display='block'>
            {job.customerName || `Customer ${index + 1}`}
          </Typography>
          <Chip
            label={job.status || 'estimate'}
            size='small'
            color={getStatusColor(job.status)}
            variant='outlined'
            sx={{ mt: 1 }}
          />
        </Box>
      ))}
    </Box>
  );
};
