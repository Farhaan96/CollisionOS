import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import { Add, Assignment, Person, DirectionsCar } from '@mui/icons-material';

export const QuickActions = () => {
  const handleNewJob = () => {
    console.log('New Job clicked');
    alert('New Job functionality');
  };

  const handleNewCustomer = () => {
    console.log('New Customer clicked');
    alert('New Customer functionality');
  };

  const handleNewEstimate = () => {
    console.log('New Estimate clicked');
    alert('New Estimate functionality');
  };

  const handleVehicleCheck = () => {
    console.log('Vehicle Check clicked');
    alert('Vehicle Check functionality');
  };

  return (
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={handleNewJob}
          fullWidth
          sx={{ mb: 1 }}
        >
          New Job
        </Button>
      </Grid>
      <Grid item xs={6}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Person />}
          onClick={handleNewCustomer}
          fullWidth
          sx={{ mb: 1 }}
        >
          New Customer
        </Button>
      </Grid>
      <Grid item xs={6}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Assignment />}
          onClick={handleNewEstimate}
          fullWidth
        >
          New Estimate
        </Button>
      </Grid>
      <Grid item xs={6}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DirectionsCar />}
          onClick={handleVehicleCheck}
          fullWidth
        >
          Vehicle Check
        </Button>
      </Grid>
    </Grid>
  );
};
