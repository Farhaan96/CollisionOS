import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  Build,
  Palette,
  CheckCircle,
  DirectionsCar
} from '@mui/icons-material';

const ProductionBoard = () => {
  const theme = useTheme();
  
  // Sample job data
  const [jobs] = useState([
    {
      id: 'J-2024-001',
      customer: 'John Smith',
      vehicle: '2020 Honda Civic',
      stage: 'estimate',
      priority: 'high',
      progress: 100
    },
    {
      id: 'J-2024-002', 
      customer: 'Sarah Johnson',
      vehicle: '2019 Toyota Camry',
      stage: 'bodywork',
      priority: 'medium',
      progress: 60
    },
    {
      id: 'J-2024-003',
      customer: 'Mike Davis',
      vehicle: '2021 Ford F-150',
      stage: 'paint',
      priority: 'low',
      progress: 80
    }
  ]);

  const stages = {
    estimate: {
      title: 'Estimate',
      icon: DirectionsCar,
      color: '#2196F3'
    },
    bodywork: {
      title: 'Body Work', 
      icon: Build,
      color: '#FF9800'
    },
    paint: {
      title: 'Paint',
      icon: Palette,
      color: '#9C27B0'
    },
    complete: {
      title: 'Complete',
      icon: CheckCircle,
      color: '#4CAF50'
    }
  };

  const getJobsByStage = (stage) => {
    return jobs.filter(job => job.stage === stage);
  };

  const JobCard = ({ job }) => {
    const priorityColor = {
      high: '#f44336',
      medium: '#ff9800', 
      low: '#4caf50'
    };

    return (
      <Card 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" color="primary">
              {job.id}
            </Typography>
            <Chip 
              label={job.priority}
              size="small"
              sx={{ 
                bgcolor: priorityColor[job.priority],
                color: 'white'
              }}
            />
          </Box>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {job.customer}
          </Typography>
          
          <Typography variant="body1" gutterBottom>
            {job.vehicle}
          </Typography>
          
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption">Progress</Typography>
              <Typography variant="caption">{job.progress}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={job.progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const StageColumn = ({ stageKey, stage }) => {
    const stageJobs = getJobsByStage(stageKey);
    const IconComponent = stage.icon;

    return (
      <Card sx={{ 
        height: 'fit-content', 
        minHeight: 400,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary 
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <IconComponent 
              sx={{ 
                color: stage.color, 
                mr: 1,
                fontSize: '1.5rem'
              }} 
            />
            <Typography variant="h5" component="h2">
              {stage.title}
            </Typography>
            <Chip 
              label={stageJobs.length}
              size="small"
              sx={{ ml: 'auto', bgcolor: stage.color, color: 'white' }}
            />
          </Box>
          
          <Box>
            {stageJobs.length > 0 ? (
              stageJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ py: 4 }}
              >
                No jobs in this stage
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary 
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" color="primary">
          Production Board
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<Build />}
          sx={{ bgcolor: theme.palette.primary.main }}
        >
          New Job
        </Button>
      </Box>

      <Grid container spacing={3}>
        {Object.entries(stages).map(([key, stage]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <StageColumn stageKey={key} stage={stage} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProductionBoard;