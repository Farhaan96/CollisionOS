import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { getStatusColor } from '../../utils/statusUtils';

export const JobCard = ({ job, onClick }) => (
  <Card onClick={onClick} sx={{ cursor:'pointer' }}>
    <CardContent>
      <Typography variant="subtitle2">{job.jobNumber}</Typography>
      <Chip size="small" label={job.status} sx={{ mt:1, bgcolor: getStatusColor(job.status), color:'#000' }} />
    </CardContent>
  </Card>
);
