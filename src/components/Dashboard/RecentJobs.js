import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Assignment,
  DirectionsCar,
  Build,
  CheckCircle,
} from '@mui/icons-material';

// Memoized status icon and color mappers for better performance
const STATUS_ICON_MAP = {
  estimate: Assignment,
  in_progress: Build,
  ready_pickup: CheckCircle,
  delivered: DirectionsCar,
  default: Assignment,
};

const STATUS_COLOR_MAP = {
  estimate: 'warning',
  in_progress: 'info',
  ready_pickup: 'success',
  delivered: 'default',
  default: 'default',
};

export const RecentJobs = React.memo(({ jobs = [] }) => {
  // Memoize status functions to prevent recreation on each render
  const getStatusIcon = useCallback(status => {
    const IconComponent = STATUS_ICON_MAP[status] || STATUS_ICON_MAP.default;
    return <IconComponent />;
  }, []);

  const getStatusColor = useCallback(status => {
    return STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP.default;
  }, []);

  // Memoize the job display data to prevent unnecessary recalculations
  const displayJobs = useMemo(() => jobs.slice(0, 5), [jobs]);

  if (!jobs || jobs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          No recent jobs
        </Typography>
      </Box>
    );
  }

  // Memoized list item component for better performance
  const JobListItem = useCallback(
    ({ job, index }) => (
      <ListItem key={job.id || index} sx={{ px: 0, py: 1 }}>
        <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
          {getStatusIcon(job.status)}
        </Avatar>
        <ListItemText
          primary={job.jobNumber || `JOB-${String(index + 1).padStart(4, '0')}`}
          secondary={job.customerName || `Customer ${index + 1}`}
          primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
        <Chip
          label={job.status || 'estimate'}
          size='small'
          color={getStatusColor(job.status)}
          variant='outlined'
        />
      </ListItem>
    ),
    [getStatusIcon, getStatusColor]
  );

  return (
    <List sx={{ p: 0 }}>
      {displayJobs.map((job, index) => (
        <JobListItem key={job.id || `job-${index}`} job={job} index={index} />
      ))}
    </List>
  );
});
