
// CollisionOS Customer Portal
// React implementation for customer-facing features

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import {
  CalendarToday,
  DirectionsCar,
  Message,
  Payment,
  Photo,
  Schedule
} from '@mui/icons-material';

// Customer Portal Main Component
const CustomerPortal = ({ customerId }) => {
  const [customer, setCustomer] = useState(null);
  const [repairOrders, setRepairOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      const [customerRes, rosRes, appointmentsRes, messagesRes] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch(`/api/customers/${customerId}/repair-orders`),
        fetch(`/api/customers/${customerId}/appointments`),
        fetch(`/api/customers/${customerId}/messages`)
      ]);

      const [customerData, rosData, appointmentsData, messagesData] = await Promise.all([
        customerRes.json(),
        rosRes.json(),
        appointmentsRes.json(),
        messagesRes.json()
      ]);

      setCustomer(customerData.customer);
      setRepairOrders(rosData.repair_orders || []);
      setAppointments(appointmentsData.appointments || []);
      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {customer?.first_name} {customer?.last_name}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <RepairOrderStatus repairOrders={repairOrders} />
          <AppointmentBooking customerId={customerId} />
          <MessageCenter messages={messages} />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <QuickActions customerId={customerId} />
          <UpcomingAppointments appointments={appointments} />
        </Grid>
      </Grid>
    </Box>
  );
};

// Repair Order Status Component
const RepairOrderStatus = ({ repairOrders }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'estimate': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'delivered': return 'default';
      default: return 'default';
    }
  };

  const getStatusSteps = (status) => {
    const steps = ['estimate', 'in_progress', 'parts_pending', 'completed', 'delivered'];
    return steps.indexOf(status);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Repair Order Status
        </Typography>
        
        {repairOrders.length === 0 ? (
          <Typography color="textSecondary">
            No repair orders found
          </Typography>
        ) : (
          repairOrders.map((ro) => (
            <Box key={ro.id} sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">{ro.ro_number}</Typography>
                <Chip 
                  label={ro.status} 
                  color={getStatusColor(ro.status)}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {ro.vehicle_info}
              </Typography>
              
              <Stepper activeStep={getStatusSteps(ro.status)} alternativeLabel>
                <Step>
                  <StepLabel>Estimate</StepLabel>
                </Step>
                <Step>
                  <StepLabel>In Progress</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Parts Pending</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Completed</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Delivered</StepLabel>
                </Step>
              </Stepper>
              
              <Box mt={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<Photo />}
                  size="small"
                >
                  View Photos
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Message />}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  Message Shop
                </Button>
              </Box>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// Appointment Booking Component
const AppointmentBooking = ({ customerId }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    service_type: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          ...formData
        })
      });

      if (response.ok) {
        setOpen(false);
        setFormData({ date: '', time: '', service_type: '', notes: '' });
        // Refresh appointments
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Book Appointment
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<CalendarToday />}
          onClick={() => setOpen(true)}
        >
          Schedule Appointment
        </Button>
        
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Book New Appointment</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Service Type</InputLabel>
                    <Select
                      value={formData.service_type}
                      onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                    >
                      <MenuItem value="estimate">Estimate</MenuItem>
                      <MenuItem value="repair">Repair</MenuItem>
                      <MenuItem value="pickup">Pickup</MenuItem>
                      <MenuItem value="delivery">Delivery</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Book Appointment</Button>
            </DialogActions>
          </form>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Message Center Component
const MessageCenter = ({ messages }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          type: 'customer_to_shop'
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Refresh messages
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Message Center
        </Typography>
        
        <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
          {messages.map((message, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Box display="flex" justifyContent={message.sender === 'customer' ? 'flex-end' : 'flex-start'}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: message.sender === 'customer' ? '#e3f2fd' : '#f5f5f5',
                    maxWidth: '70%'
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(message.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
        
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            size="small"
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
          >
            Send
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerPortal;
