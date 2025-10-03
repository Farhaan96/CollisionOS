import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { EnhancedTechnicianConsole } from '../../components/Labor';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/jobService';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, [user]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      // Load jobs assigned to this technician
      const response = await jobService.getAllJobs({
        assignedTo: user?.id,
        status: ['pending', 'in_progress', 'ready_for_work'],
      });
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <EnhancedTechnicianConsole
        technicianId={user?.id}
        jobs={jobs}
        currentUser={user}
      />
    </Box>
  );
};

export default TechnicianDashboard;
