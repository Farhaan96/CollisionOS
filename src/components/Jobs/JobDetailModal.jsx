import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  TextField,
  Stack,
} from '@mui/material';
import {
  Close,
  Person,
  DirectionsCar,
  Description,
  Business,
} from '@mui/icons-material';

/**
 * JobDetailModal - Clean modal for viewing and editing job details
 * Matches the reference design with tabbed interface and quick actions
 */
const JobDetailModal = ({ open, onClose, job }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  if (!job) return null;

  const tabs = [
    'Overview',
    'Estimate',
    'Parts',
    'Labor',
    'Schedule',
    'Documents',
    'Timeline',
  ];

  const getStatusColor = (status) => {
    const colors = {
      Intake: 'default',
      Estimating: 'warning',
      'Awaiting Parts': 'info',
      'In Production': 'primary',
      Ready: 'success',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'success',
      Medium: 'info',
      High: 'warning',
      Urgent: 'error',
    };
    return colors[priority] || 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.default',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {job.roNumber} - {job.vehicle}
              </Typography>
              <Chip
                label={job.priority}
                color={getPriorityColor(job.priority)}
                size="small"
              />
              <Chip
                label={job.status}
                variant="outlined"
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {job.customer} • {job.insurer} Claim: {job.claimNumber}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 3,
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab}
              label={tab}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          ))}
        </Tabs>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Left Column - Main Content */}
            <Grid item xs={12} md={8}>
              {selectedTab === 0 && (
                <Stack spacing={3}>
                  {/* Customer Information */}
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Person color="action" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Customer Information
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Name:
                          </Typography>
                          <Typography variant="body1">
                            {job.customer}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Vehicle Information */}
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <DirectionsCar color="action" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Vehicle Information
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Year/Make/Model:
                          </Typography>
                          <Typography variant="body1">{job.vehicle}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Job Details */}
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Description color="action" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Job Details
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            RO Number:
                          </Typography>
                          <Typography variant="body1">
                            {job.roNumber}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Status:
                          </Typography>
                          <Chip
                            label={job.status}
                            color={getStatusColor(job.status)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Priority:
                          </Typography>
                          <Chip
                            label={job.priority}
                            color={getPriorityColor(job.priority)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Estimator:
                          </Typography>
                          <Typography variant="body1">
                            {job.estimator || 'Not assigned'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Insurance Claim */}
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Business color="action" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Insurance Claim
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Insurer:
                          </Typography>
                          <Typography variant="body1">{job.insurer}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Claim #:
                          </Typography>
                          <Typography variant="body1">
                            {job.claimNumber}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Rental Coverage:
                          </Typography>
                          <Chip
                            label={job.rentalCoverage ? 'Yes' : 'No'}
                            color={job.rentalCoverage ? 'success' : 'default'}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              )}

              {selectedTab === 1 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Estimate Details
                    </Typography>
                    <Typography color="text.secondary">
                      Estimate content coming soon...
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {selectedTab === 2 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Parts List
                    </Typography>
                    <Typography color="text.secondary">
                      Parts content coming soon...
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Right Column - Quick Actions & Notes */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Quick Actions */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      Quick Actions
                    </Typography>
                    <Stack spacing={1}>
                      <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }}>
                        Move to Intake
                      </Button>
                      <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }}>
                        Move to Teardown
                      </Button>
                      <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }}>
                        Move to Awaiting Parts
                      </Button>
                      <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }}>
                        Move to Body Work
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Recent Notes */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      Recent Notes
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      No notes yet
                    </Typography>
                    <Button variant="contained" fullWidth>
                      Add Note
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailModal;
