import React from 'react';
import { Box, Typography } from '@mui/material';
import QualityControlSystem from '../../components/QualityControl/QualityControlSystem';
import { useAuth } from '../../contexts/AuthContext';

const QualityControlDashboard = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3, pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Quality Control
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Ensure the highest quality standards in every repair with
          comprehensive inspection and calibration systems
        </Typography>
      </Box>

      {/* QC System */}
      <QualityControlSystem />
    </Box>
  );
};

export default QualityControlDashboard;
