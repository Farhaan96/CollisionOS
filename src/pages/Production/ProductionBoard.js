import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Person,
  Add,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProductionBoardTable from '../../components/Production/ProductionBoardTable';
import { CustomerForm } from '../../components/Customer/CustomerForm';
import useJobStore from '../../store/jobStore';

const ProductionBoard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { jobs, loading, error, fetchJobs, moveJob, createJob } = useJobStore();
  const [customerFormOpen, setCustomerFormOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove fetchJobs dependency to prevent infinite re-renders

  const handleJobMove = async (job, newStatus) => {
    try {
      const result = await moveJob(job.id, newStatus);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleJobUpdate = async _updatedJob => {
    // Handle job updates - could extend jobStore to support this
    // Could implement this later if needed
  };

  const handleJobClick = _job => {
    // Could navigate to job details page
    // Implementation can be added later
  };

  const handleCustomerSave = async customer => {
    try {
      // Create a new job with the customer data
      const newJobData = {
        customer: {
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          phone: customer.phone,
        },
        status: 'estimate',
        priority: 'normal',
      };

      await createJob(newJobData);
      setCustomerFormOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create job for customer:', error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant='h4' component='h1' color='primary'>
          Production Board
        </Typography>
        {error && (
          <Typography variant='body2' color='error' sx={{ mt: 1 }}>
            Warning: {error}
          </Typography>
        )}
      </Box>

      {/* Production Board Table */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <ProductionBoardTable
          jobs={jobs}
          onJobMove={handleJobMove}
          onJobUpdate={handleJobUpdate}
          onJobClick={handleJobClick}
          loading={loading}
          error={error}
        />
      </Box>

      {/* Customer Form Dialog */}
      <CustomerForm
        open={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        onSave={handleCustomerSave}
      />

      {/* Floating Action Button for Quick Actions */}
      <SpeedDial
        ariaLabel="Production actions"
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 9999,
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Person />}
          tooltipTitle="New Customer"
          onClick={() => setCustomerFormOpen(true)}
        />
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="New Job"
          onClick={() => navigate('/jobs/new')}
        />
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle="Refresh Jobs"
          onClick={() => fetchJobs()}
        />
      </SpeedDial>
    </Box>
  );
};

export default ProductionBoard;
