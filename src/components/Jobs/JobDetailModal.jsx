import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
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
  Edit,
  Phone,
  Email,
  Save,
  Cancel,
} from '@mui/icons-material';

/**
 * JobDetailModal - Clean modal for viewing and editing job details
 * Matches the reference design with tabbed interface and quick actions
 */
const JobDetailModal = ({ open, onClose, job, onStatusChange }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [editingCard, setEditingCard] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!job) return null;

  // Handle status change - move job to new column and close modal
  const handleStatusChange = (newStatus) => {
    console.log('Status change requested:', newStatus, 'for job:', job.id);
    if (onStatusChange && job) {
      onStatusChange(job.id, newStatus);
      // Don't close modal immediately - let user see the change
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      console.error('onStatusChange is not defined or job is missing');
    }
  };

  const handleEdit = (cardName) => {
    console.log('Edit clicked for:', cardName);
    // Toggle edit mode for the card
    setEditingCard(editingCard === cardName ? null : cardName);
  };

  const handleSaveEdit = (cardName) => {
    console.log('Saving changes for:', cardName);
    // TODO: Implement save to backend
    setEditingCard(null);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      console.log('Adding note:', noteText);
      // TODO: Implement note saving to backend
      alert(`Note added: ${noteText}`);
      setNoteText('');
      setShowNoteInput(false);
    } else {
      setShowNoteInput(true);
    }
  };

  const handleCancelNote = () => {
    setNoteText('');
    setShowNoteInput(false);
  };

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
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="action" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Customer Information
                          </Typography>
                        </Box>
                        {editingCard === 'customer' ? (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit('customer')}
                            >
                              <Save fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit('customer')}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Name:
                          </Typography>
                          {editingCard === 'customer' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue={job.customer}
                            />
                          ) : (
                            <Typography variant="body1">
                              {job.customer}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Phone:
                          </Typography>
                          {editingCard === 'customer' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="(555) 123-4567"
                            />
                          ) : (
                            <Typography variant="body1">
                              (555) 123-4567
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Email:
                          </Typography>
                          {editingCard === 'customer' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="customer@example.com"
                            />
                          ) : (
                            <Typography variant="body1">
                              customer@example.com
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Address:
                          </Typography>
                          {editingCard === 'customer' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="123 Main St, City, State"
                            />
                          ) : (
                            <Typography variant="body1">
                              123 Main St, City, State
                            </Typography>
                          )}
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
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsCar color="action" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Vehicle Information
                          </Typography>
                        </Box>
                        {editingCard === 'vehicle' ? (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit('vehicle')}
                            >
                              <Save fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit('vehicle')}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Year/Make/Model:
                          </Typography>
                          {editingCard === 'vehicle' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue={job.vehicle}
                            />
                          ) : (
                            <Typography variant="body1">{job.vehicle}</Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            VIN:
                          </Typography>
                          {editingCard === 'vehicle' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="1HGBH41JXMN109186"
                            />
                          ) : (
                            <Typography variant="body1">1HGBH41JXMN109186</Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Color:
                          </Typography>
                          {editingCard === 'vehicle' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="Silver Metallic"
                            />
                          ) : (
                            <Typography variant="body1">Silver Metallic</Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            License Plate:
                          </Typography>
                          {editingCard === 'vehicle' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="ABC-1234"
                            />
                          ) : (
                            <Typography variant="body1">ABC-1234</Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Mileage:
                          </Typography>
                          {editingCard === 'vehicle' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="45,320 km"
                            />
                          ) : (
                            <Typography variant="body1">45,320 km</Typography>
                          )}
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
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Description color="action" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Job Details
                          </Typography>
                        </Box>
                        {editingCard === 'job' ? (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit('job')}
                            >
                              <Save fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit('job')}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            RO Number:
                          </Typography>
                          {editingCard === 'job' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue={job.roNumber}
                            />
                          ) : (
                            <Typography variant="body1">
                              {job.roNumber}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Status:
                          </Typography>
                          {editingCard === 'job' ? (
                            <TextField
                              fullWidth
                              size="small"
                              select
                              defaultValue={job.status}
                              SelectProps={{ native: true }}
                            >
                              <option value="Intake">Intake</option>
                              <option value="Estimating">Estimating</option>
                              <option value="Awaiting Parts">Awaiting Parts</option>
                              <option value="In Production">In Production</option>
                              <option value="Ready">Ready</option>
                            </TextField>
                          ) : (
                            <Chip
                              label={job.status}
                              color={getStatusColor(job.status)}
                              size="small"
                            />
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Priority:
                          </Typography>
                          {editingCard === 'job' ? (
                            <TextField
                              fullWidth
                              size="small"
                              select
                              defaultValue={job.priority}
                              SelectProps={{ native: true }}
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Urgent">Urgent</option>
                            </TextField>
                          ) : (
                            <Chip
                              label={job.priority}
                              color={getPriorityColor(job.priority)}
                              size="small"
                            />
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Estimator:
                          </Typography>
                          {editingCard === 'job' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue={job.estimator || 'Not assigned'}
                            />
                          ) : (
                            <Typography variant="body1">
                              {job.estimator || 'Not assigned'}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Date In:
                          </Typography>
                          {editingCard === 'job' ? (
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              defaultValue="2025-10-15"
                            />
                          ) : (
                            <Typography variant="body1">
                              Oct 15, 2025
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Promised Date:
                          </Typography>
                          {editingCard === 'job' ? (
                            <TextField
                              fullWidth
                              size="small"
                              type="date"
                              defaultValue="2025-10-25"
                            />
                          ) : (
                            <Typography variant="body1">
                              Oct 25, 2025
                            </Typography>
                          )}
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
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business color="action" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Insurance Claim
                          </Typography>
                        </Box>
                        {editingCard === 'insurance' ? (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSaveEdit('insurance')}
                            >
                              <Save fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit('insurance')}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Insurer:
                          </Typography>
                          {editingCard === 'insurance' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue={job.insurer}
                            />
                          ) : (
                            <Typography variant="body1">{job.insurer}</Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Claim #:
                          </Typography>
                          {editingCard === 'insurance' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue={job.claimNumber}
                            />
                          ) : (
                            <Typography variant="body1">
                              {job.claimNumber}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Rental Coverage:
                          </Typography>
                          {editingCard === 'insurance' ? (
                            <TextField
                              fullWidth
                              size="small"
                              select
                              defaultValue={job.rentalCoverage ? 'Yes' : 'No'}
                              SelectProps={{ native: true }}
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </TextField>
                          ) : (
                            <Chip
                              label={job.rentalCoverage ? 'Yes' : 'No'}
                              color={job.rentalCoverage ? 'success' : 'default'}
                              size="small"
                            />
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Adjuster:
                          </Typography>
                          {editingCard === 'insurance' ? (
                            <TextField
                              fullWidth
                              size="small"
                              defaultValue="John Smith"
                            />
                          ) : (
                            <Typography variant="body1">
                              John Smith
                            </Typography>
                          )}
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
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                        onClick={() => handleStatusChange('Intake')}
                      >
                        Move to Intake
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                        onClick={() => handleStatusChange('Estimating')}
                      >
                        Move to Estimating
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                        onClick={() => handleStatusChange('Awaiting Parts')}
                      >
                        Move to Awaiting Parts
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                        onClick={() => handleStatusChange('In Production')}
                      >
                        Move to In Production
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                        onClick={() => handleStatusChange('Ready')}
                      >
                        Move to Ready
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
                    {showNoteInput ? (
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Enter your note here..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          variant="outlined"
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={handleAddNote}
                            startIcon={<Save />}
                          >
                            Save Note
                          </Button>
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleCancelNote}
                            startIcon={<Cancel />}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          No notes yet
                        </Typography>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleAddNote}
                        >
                          Add Note
                        </Button>
                      </>
                    )}
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
