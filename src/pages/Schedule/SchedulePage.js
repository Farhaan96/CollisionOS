import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  CalendarToday,
  Schedule,
  Person,
  DirectionsCar,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';

const SchedulePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTab, setSelectedTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Mock data for demonstration
  useEffect(() => {
    setAppointments([
      {
        id: 1,
        customer: 'Sarah Johnson',
        vehicle: '2020 Toyota Camry',
        type: 'Drop-off',
        scheduledTime: '2024-01-15T09:00:00',
        technician: 'Mike Wilson',
        status: 'scheduled',
        notes: 'Front end damage assessment',
      },
      {
        id: 2,
        customer: 'John Smith',
        vehicle: '2019 Honda Civic',
        type: 'Pickup',
        scheduledTime: '2024-01-15T14:00:00',
        technician: 'Lisa Chen',
        status: 'completed',
        notes: 'Paint job completed',
      },
      {
        id: 3,
        customer: 'Emily Davis',
        vehicle: '2021 Ford F-150',
        type: 'Inspection',
        scheduledTime: '2024-01-16T10:30:00',
        technician: 'Mike Wilson',
        status: 'scheduled',
        notes: 'Insurance inspection',
      },
    ]);

    setTechnicians([
      { id: 1, name: 'Mike Wilson', specialty: 'Body Work', availability: 'available' },
      { id: 2, name: 'Lisa Chen', specialty: 'Paint', availability: 'busy' },
      { id: 3, name: 'Tom Brown', specialty: 'Mechanical', availability: 'available' },
    ]);
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleCreateAppointment = () => {
    setSelectedAppointment(null);
    setDialogOpen(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Warning />;
      case 'in-progress': return <Schedule />;
      default: return <CalendarToday />;
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'off': return 'error';
      default: return 'default';
    }
  };

  const todayAppointments = appointments.filter(apt => 
    new Date(apt.scheduledTime).toDateString() === new Date().toDateString()
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.scheduledTime) > new Date()
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Schedule
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage appointments and technician schedules
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateAppointment}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            New Appointment
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <CalendarToday />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {todayAppointments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Today's Appointments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {appointments.filter(apt => apt.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Today
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {technicians.filter(tech => tech.availability === 'available').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available Technicians
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <DirectionsCar />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {upcomingAppointments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
          >
            <Tab label="Today's Schedule" />
            <Tab label="Technician Availability" />
            <Tab label="Upcoming Appointments" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {selectedTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Today's Appointments
              </Typography>
              {todayAppointments.length > 0 ? (
                <List>
                  {todayAppointments.map((appointment) => (
                    <ListItem key={appointment.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getStatusColor(appointment.status)}.main` }}>
                          {getStatusIcon(appointment.status)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${appointment.customer} - ${appointment.vehicle}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.type} • {new Date(appointment.scheduledTime).toLocaleTimeString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Technician: {appointment.technician}
                            </Typography>
                            {appointment.notes && (
                              <Typography variant="body2" color="text.secondary">
                                {appointment.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <Chip
                            label={appointment.status}
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                          <IconButton onClick={() => handleEditAppointment(appointment)}>
                            <Edit />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No appointments scheduled for today
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {selectedTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Technician Availability
              </Typography>
              <Grid container spacing={2}>
                {technicians.map((technician) => (
                  <Grid item xs={12} sm={6} md={4} key={technician.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Avatar sx={{ bgcolor: `${getAvailabilityColor(technician.availability)}.main` }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {technician.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {technician.specialty}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={technician.availability}
                          color={getAvailabilityColor(technician.availability)}
                          size="small"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {selectedTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Upcoming Appointments
              </Typography>
              {upcomingAppointments.length > 0 ? (
                <List>
                  {upcomingAppointments.map((appointment) => (
                    <ListItem key={appointment.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${getStatusColor(appointment.status)}.main` }}>
                          {getStatusIcon(appointment.status)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${appointment.customer} - ${appointment.vehicle}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.type} • {new Date(appointment.scheduledTime).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Technician: {appointment.technician}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <Chip
                            label={appointment.status}
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                          <IconButton onClick={() => handleEditAppointment(appointment)}>
                            <Edit />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No upcoming appointments
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Appointment Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer"
                    defaultValue={selectedAppointment?.customer || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vehicle"
                    defaultValue={selectedAppointment?.vehicle || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select defaultValue={selectedAppointment?.type || 'Drop-off'}>
                      <MenuItem value="Drop-off">Drop-off</MenuItem>
                      <MenuItem value="Pickup">Pickup</MenuItem>
                      <MenuItem value="Inspection">Inspection</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Scheduled Time"
                    type="datetime-local"
                    defaultValue={selectedAppointment?.scheduledTime?.slice(0, 16) || ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Technician</InputLabel>
                    <Select defaultValue={selectedAppointment?.technician || ''}>
                      {technicians.map((tech) => (
                        <MenuItem key={tech.id} value={tech.name}>
                          {tech.name} - {tech.specialty}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    defaultValue={selectedAppointment?.notes || ''}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">
              {selectedAppointment ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SchedulePage;
