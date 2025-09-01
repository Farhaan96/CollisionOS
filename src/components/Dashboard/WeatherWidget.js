import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { WbSunny, Cloud, Opacity } from '@mui/icons-material';

export const WeatherWidget = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Avatar
        sx={{
          width: 48,
          height: 48,
          mx: 'auto',
          mb: 1,
          bgcolor: 'warning.main',
        }}
      >
        <WbSunny />
      </Avatar>
      <Typography variant='h6' gutterBottom>
        72°F
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Sunny
      </Typography>
      <Typography variant='caption' color='text.secondary'>
        Humidity: 45%
      </Typography>
    </Box>
  );
};
