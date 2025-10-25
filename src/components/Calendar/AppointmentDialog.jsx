import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  Person,
  DirectionsCar,
  Build,
  Warning,
} from '@mui/icons-material';

/**
 * AppointmentDialog Component
 * Form for creating and editing appointments
 * Includes conflict checking and capacity warnings
 */
const AppointmentDialog = ({
  open,
  onClose,
  onSave,
  appointment = null,
  technicians = [],
  customers = [],
  vehicles = [],
  onCheckConflicts,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleInfo: '',
    type: 'drop-off',
    scheduledTime: dayjs(),
    endTime: null,
    technicianId: '',
    technicianName: '',
    duration: 60,
    status: 'scheduled',
    notes: '',
    priority: 'normal',
  });

  const [conflicts, setConflicts] = useState([]);
  const [capacityWarning, setCapacityWarning] = useState(null);
  const [errors, setErrors] = useState({});
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Appointment types for auto body shops
  const appointmentTypes = [
    { value: 'drop-off', label: 'Drop-off', icon: <DirectionsCar /> },
    { value: 'pickup', label: 'Pickup', icon: <DirectionsCar /> },
    { value: 'inspection', label: 'Inspection', icon: <Person /> },
    { value: 'estimate', label: 'Estimate', icon: <Build /> },
    { value: 'delivery', label: 'Delivery', icon: <DirectionsCar /> },
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  // Load appointment data when editing
  useEffect(() => {
    if (appointment) {
      const scheduledTime = dayjs(appointment.scheduledTime || appointment.startDate);
      const endTime = appointment.endTime ? dayjs(appointment.endTime) : scheduledTime.add(appointment.duration || 60, 'minute');

      setFormData({
        customerId: appointment.customerId || '',
        customerName: appointment.customer || appointment.customerName || '',
        vehicleId: appointment.vehicleId || '',
        vehicleInfo: appointment.vehicle || appointment.vehicleInfo || '',
        type: appointment.type || 'drop-off',
        scheduledTime,
        endTime,
        technicianId: appointment.technicianId || '',
        technicianName: appointment.technician || appointment.technicianName || '',
        duration: appointment.duration || 60,
        status: appointment.status || 'scheduled',
        notes: appointment.notes || '',
        priority: appointment.priority || 'normal',
      });
    } else {
      // Reset form for new appointment
      setFormData({
        customerId: '',
        customerName: '',
        vehicleId: '',
        vehicleInfo: '',
        type: 'drop-off',
        scheduledTime: dayjs(),
        endTime: null,
        technicianId: '',
        technicianName: '',
        duration: 60,
        status: 'scheduled',
        notes: '',
        priority: 'normal',
      });
    }
    setConflicts([]);
    setCapacityWarning(null);
    setErrors({});
  }, [appointment, open]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-calculate end time when duration or start time changes
    if (field === 'duration' || field === 'scheduledTime') {
      const startTime = field === 'scheduledTime' ? value : formData.scheduledTime;
      const duration = field === 'duration' ? value : formData.duration;
      if (startTime && duration) {
        setFormData(prev => ({
          ...prev,
          endTime: dayjs(startTime).add(duration, 'minute'),
        }));
      }
    }
  };

  // Check for conflicts when date/time or technician changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (formData.scheduledTime && formData.technicianId && onCheckConflicts) {
        setCheckingConflicts(true);
        try {
          const result = await onCheckConflicts({
            scheduledTime: formData.scheduledTime.toISOString(),
            endTime: formData.endTime?.toISOString(),
            technicianId: formData.technicianId,
            appointmentId: appointment?.id, // Exclude current appointment when editing
          });

          if (result?.conflicts) {
            setConflicts(result.conflicts);
          }
          if (result?.capacityWarning) {
            setCapacityWarning(result.capacityWarning);
          }
        } catch (error) {
          console.error('Error checking conflicts:', error);
        } finally {
          setCheckingConflicts(false);
        }
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.scheduledTime, formData.endTime, formData.technicianId, onCheckConflicts, appointment]);

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.customerName && !formData.customerId) {
      newErrors.customer = 'Customer is required';
    }
    if (!formData.vehicleInfo && !formData.vehicleId) {
      newErrors.vehicle = 'Vehicle is required';
    }
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required';
    }
    if (!formData.type) {
      newErrors.type = 'Appointment type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const appointmentData = {
      ...formData,
      scheduledTime: formData.scheduledTime.toISOString(),
      endTime: formData.endTime?.toISOString(),
      customer: formData.customerName,
      vehicle: formData.vehicleInfo,
      technician: formData.technicianName,
    };

    onSave(appointmentData, appointment?.id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {appointment ? 'Edit Appointment' : 'New Appointment'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* Customer */}
            <Grid item xs={12} sm={6}>
              {customers.length > 0 ? (
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.name || `${option.firstName} ${option.lastName}`}
                  value={customers.find(c => c.id === formData.customerId) || null}
                  onChange={(e, newValue) => {
                    handleChange('customerId', newValue?.id || '');
                    handleChange('customerName', newValue ? (newValue.name || `${newValue.firstName} ${newValue.lastName}`) : '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer"
                      error={!!errors.customer}
                      helperText={errors.customer}
                      required
                    />
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Customer"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  error={!!errors.customer}
                  helperText={errors.customer}
                  required
                />
              )}
            </Grid>

            {/* Vehicle */}
            <Grid item xs={12} sm={6}>
              {vehicles.length > 0 ? (
                <Autocomplete
                  options={vehicles}
                  getOptionLabel={(option) => `${option.year} ${option.make} ${option.model}`}
                  value={vehicles.find(v => v.id === formData.vehicleId) || null}
                  onChange={(e, newValue) => {
                    handleChange('vehicleId', newValue?.id || '');
                    handleChange('vehicleInfo', newValue ? `${newValue.year} ${newValue.make} ${newValue.model}` : '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vehicle"
                      error={!!errors.vehicle}
                      helperText={errors.vehicle}
                      required
                    />
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Vehicle"
                  value={formData.vehicleInfo}
                  onChange={(e) => handleChange('vehicleInfo', e.target.value)}
                  error={!!errors.vehicle}
                  helperText={errors.vehicle}
                  placeholder="e.g., 2020 Toyota Camry"
                  required
                />
              )}
            </Grid>

            {/* Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.type} required>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  label="Appointment Type"
                >
                  {appointmentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  label="Priority"
                >
                  {priorityLevels.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Scheduled Time */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Scheduled Time"
                  value={formData.scheduledTime}
                  onChange={(newValue) => handleChange('scheduledTime', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.scheduledTime,
                      helperText: errors.scheduledTime,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Duration */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value) || 60)}
                inputProps={{ min: 15, step: 15 }}
              />
            </Grid>

            {/* Technician */}
            <Grid item xs={12}>
              {technicians.length > 0 ? (
                <Autocomplete
                  options={technicians}
                  getOptionLabel={(option) => `${option.name} - ${option.specialty || option.department || ''}`}
                  value={technicians.find(t => t.id === formData.technicianId) || null}
                  onChange={(e, newValue) => {
                    handleChange('technicianId', newValue?.id || '');
                    handleChange('technicianName', newValue?.name || '');
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" />
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.specialty || option.department}
                          </Typography>
                        </Box>
                        {option.availability && (
                          <Chip
                            label={option.availability}
                            size="small"
                            color={option.availability === 'available' ? 'success' : 'warning'}
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Technician (Optional)"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {checkingConflicts && <CircularProgress size={20} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Technician (Optional)"
                  value={formData.technicianName}
                  onChange={(e) => handleChange('technicianName', e.target.value)}
                />
              )}
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes or special instructions..."
              />
            </Grid>

            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning" icon={<Warning />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Scheduling Conflicts Detected:
                  </Typography>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        <Typography variant="body2">
                          {conflict.message || `Conflict with ${conflict.customer} at ${conflict.time}`}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              </Grid>
            )}

            {/* Capacity Warning */}
            {capacityWarning && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">{capacityWarning}</Typography>
                </Alert>
              </Grid>
            )}

            {/* End Time Display */}
            {formData.endTime && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Estimated completion: {formData.endTime.format('h:mm A on MMM D, YYYY')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || Object.keys(errors).length > 0}
        >
          {loading ? <CircularProgress size={20} /> : (appointment ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentDialog;
