import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  CalendarToday,
  Schedule as ScheduleIcon,
  Person,
  DirectionsCar,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import CalendarView from '../../components/Calendar/CalendarView';
import AppointmentDialog from '../../components/Calendar/AppointmentDialog';
import { schedulingService } from '../../services/schedulingService';
import { customerService } from '../../services/customerService';
import { vehicleService } from '../../services/vehicleService';

const SchedulePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTab, setSelectedTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [calendarView, setCalendarView] = useState('week');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch appointments for the current month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      const [appointmentsData, techniciansData, customersData, vehiclesData] = await Promise.all([
        schedulingService.getAppointments({ startDate, endDate }).catch(() => []),
        schedulingService.getTechnicians().catch(() => []),
        customerService.getCustomers().catch(() => []),
        vehicleService.getVehicles().catch(() => []),
      ]);

      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setTechnicians(Array.isArray(techniciansData) ? techniciansData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      showSnackbar('Error loading schedule data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

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

  // Handle appointment selection from calendar
  const handleSelectAppointment = useCallback((appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  }, []);

  // Handle time slot selection on calendar
  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedAppointment({
      scheduledTime: slotInfo.start,
      endTime: slotInfo.end,
    });
    setDialogOpen(true);
  }, []);

  // Handle drag-and-drop rescheduling
  const handleEventDrop = useCallback(async ({ appointmentId, newStartDate, newEndDate, appointment }) => {
    try {
      await schedulingService.rescheduleAppointment(appointmentId, {
        newStartDate: newStartDate.toISOString(),
        newEndDate: newEndDate.toISOString(),
      });

      // Update local state
      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentId
          ? { ...apt, scheduledTime: newStartDate, endTime: newEndDate }
          : apt
      ));

      showSnackbar('Appointment rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      showSnackbar('Error rescheduling appointment', 'error');
      // Reload data to revert
      loadData();
    }
  }, []);

  // Save appointment (create or update)
  const handleSaveAppointment = async (appointmentData, appointmentId) => {
    setLoading(true);
    try {
      if (appointmentId) {
        // Update existing appointment
        const updated = await schedulingService.updateAppointment(appointmentId, appointmentData);
        setAppointments(prev => prev.map(apt => apt.id === appointmentId ? updated : apt));
        showSnackbar('Appointment updated successfully');
      } else {
        // Create new appointment
        const created = await schedulingService.bookAppointment(appointmentData);
        setAppointments(prev => [...prev, created]);
        showSnackbar('Appointment created successfully');
      }
      setDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error saving appointment:', error);
      showSnackbar(error.response?.data?.error || 'Error saving appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await schedulingService.deleteAppointment(appointmentId);
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      showSnackbar('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showSnackbar('Error deleting appointment', 'error');
    }
  };

  // Check for scheduling conflicts
  const handleCheckConflicts = async (appointmentData) => {
    try {
      const result = await schedulingService.checkConflicts(appointmentData);
      return result;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return { conflicts: [], capacityWarning: null };
    }
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
            <Tab label="Calendar View" />
            <Tab label="Today's Schedule" />
            <Tab label="Technician Availability" />
            <Tab label="Upcoming Appointments" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {selectedTab === 0 && (
          <CalendarView
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            loading={loading}
            view={calendarView}
            onViewChange={setCalendarView}
          />
        )}

        {selectedTab === 1 && (
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

        {selectedTab === 2 && (
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

        {selectedTab === 3 && (
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
        <AppointmentDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveAppointment}
          appointment={selectedAppointment}
          technicians={technicians}
          customers={customers}
          vehicles={vehicles}
          onCheckConflicts={handleCheckConflicts}
          loading={loading}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          message={snackbar.message}
        />
      </Container>
    </Box>
  );
};

export default SchedulePage;
