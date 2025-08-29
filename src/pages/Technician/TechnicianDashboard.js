import React from 'react';
import { Box } from '@mui/material';
import TechnicianConsole from '../../components/Production/TechnicianConsole';
import { useAuth } from '../../hooks/useAuth';

const TechnicianDashboard = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <TechnicianConsole technicianId={user?.id} currentUser={user} />
    </Box>
  );
};

export default TechnicianDashboard;