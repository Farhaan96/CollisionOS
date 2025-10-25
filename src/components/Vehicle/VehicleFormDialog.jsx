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
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DirectionsCar,
  Save,
  Search as SearchIcon,
  Clear,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Services
import { vehicleService } from '../../services/vehicleService';

// Components
import CustomerAutocomplete from '../Common/CustomerAutocomplete';

const VehicleFormDialog = ({ open, vehicle, onClose, onSave, customerId = null }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [errors, setErrors] = useState({});
  const [vinDecoded, setVinDecoded] = useState(false);
  const [formData, setFormData] = useState({
    customerId: customerId || '',
    vin: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    color: '',
    paintCode: '',
    licensePlate: '',
    licensePlateState: '',
    mileage: '',
    engineSize: '',
    transmission: '',
    drivetrain: '',
    bodyStyle: '',
    fuelType: '',
    insuranceCompany: '',
    policyNumber: '',
    notes: '',
  });

  // Reset form when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        customerId: vehicle.customerId || customerId || '',
        vin: vehicle.vin || '',
        year: vehicle.year || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        trim: vehicle.trim || '',
        color: vehicle.color || '',
        paintCode: vehicle.paintCode || '',
        licensePlate: vehicle.licensePlate || '',
        licensePlateState: vehicle.licensePlateState || '',
        mileage: vehicle.mileage || '',
        engineSize: vehicle.engineSize || '',
        transmission: vehicle.transmission || '',
        drivetrain: vehicle.drivetrain || '',
        bodyStyle: vehicle.bodyStyle || '',
        fuelType: vehicle.fuelType || '',
        insuranceCompany: vehicle.insuranceCompany || '',
        policyNumber: vehicle.policyNumber || '',
        notes: vehicle.notes || '',
      });
      setVinDecoded(!!vehicle.vin);
    } else {
      // Reset form for new vehicle
      setFormData({
        customerId: customerId || '',
        vin: '',
        year: '',
        make: '',
        model: '',
        trim: '',
        color: '',
        paintCode: '',
        licensePlate: '',
        licensePlateState: '',
        mileage: '',
        engineSize: '',
        transmission: '',
        drivetrain: '',
        bodyStyle: '',
        fuelType: '',
        insuranceCompany: '',
        policyNumber: '',
        notes: '',
      });
      setVinDecoded(false);
    }
    setErrors({});
  }, [vehicle, open, customerId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleVINDecode = async () => {
    if (!formData.vin || formData.vin.length !== 17) {
      setErrors(prev => ({
        ...prev,
        vin: 'VIN must be exactly 17 characters',
      }));
      return;
    }

    setVinDecoding(true);
    try {
      const result = await vehicleService.decodeVIN(formData.vin);

      if (result.success && result.vehicle) {
        const decoded = result.vehicle;

        setFormData(prev => ({
          ...prev,
          year: decoded.year || prev.year,
          make: decoded.make || prev.make,
          model: decoded.model || prev.model,
          trim: decoded.trim || prev.trim,
          engineSize: decoded.engine || prev.engineSize,
          transmission: decoded.transmission || prev.transmission,
          drivetrain: decoded.drivetrain || prev.drivetrain,
          bodyStyle: decoded.body_type || prev.bodyStyle,
          fuelType: decoded.fuel_type || prev.fuelType,
        }));

        setVinDecoded(true);
        setErrors(prev => ({
          ...prev,
          vin: null,
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          vin: 'Could not decode VIN. Please enter vehicle details manually.',
        }));
      }
    } catch (error) {
      console.error('VIN decode error:', error);
      setErrors(prev => ({
        ...prev,
        vin: 'VIN decode failed. Please enter vehicle details manually.',
      }));
    } finally {
      setVinDecoding(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.vin || formData.vin.length !== 17) {
      newErrors.vin = 'Valid 17-character VIN is required';
    }

    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required';
    }

    if (!formData.make || !formData.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!formData.model || !formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const vehicleData = {
        ...formData,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage) || 0,
      };

      let savedVehicle;
      if (vehicle) {
        savedVehicle = await vehicleService.updateVehicle(vehicle.id, vehicleData);
      } else {
        savedVehicle = await vehicleService.createVehicle(vehicleData);
      }

      onSave(savedVehicle || vehicleData);
    } catch (error) {
      setErrors({ submit: 'Failed to save vehicle. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const stateOptions = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', // Canadian provinces
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <DirectionsCar />
          </Avatar>
          <Typography variant='h6'>
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errors.submit && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Customer Selection */}
          <Grid item xs={12}>
            <Typography
              variant='h6'
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              Customer Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <CustomerAutocomplete
              value={formData.customerId ? { id: formData.customerId } : null}
              onChange={(customer) => handleInputChange('customerId', customer?.id || '')}
              required
              error={!!errors.customerId}
              helperText={errors.customerId}
              disabled={!!customerId || !!vehicle}
            />
          </Grid>

          {/* VIN and Decode */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant='h6'
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <DirectionsCar />
              Vehicle Identification
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label='VIN (Vehicle Identification Number) *'
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                error={!!errors.vin}
                helperText={errors.vin || '17-character VIN'}
                inputProps={{ maxLength: 17 }}
              />
              <Tooltip title="Decode VIN">
                <IconButton
                  onClick={handleVINDecode}
                  disabled={vinDecoding || !formData.vin || formData.vin.length !== 17}
                  color="primary"
                >
                  {vinDecoding ? <CircularProgress size={24} /> : <SearchIcon />}
                </IconButton>
              </Tooltip>
              {vinDecoded && (
                <Tooltip title="Clear decoded data">
                  <IconButton onClick={() => setVinDecoded(false)} color="default">
                    <Clear />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {vinDecoded && (
              <Alert severity="success" sx={{ mt: 1 }}>
                VIN decoded successfully! Review and update fields as needed.
              </Alert>
            )}
          </Grid>

          {/* Vehicle Details */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>
              Vehicle Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label='Year *'
              type='number'
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              error={!!errors.year}
              helperText={errors.year}
              inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label='Make *'
              value={formData.make}
              onChange={(e) => handleInputChange('make', e.target.value)}
              error={!!errors.make}
              helperText={errors.make}
            />
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label='Model *'
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              error={!!errors.model}
              helperText={errors.model}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Trim'
              value={formData.trim}
              onChange={(e) => handleInputChange('trim', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Body Style</InputLabel>
              <Select
                value={formData.bodyStyle}
                onChange={(e) => handleInputChange('bodyStyle', e.target.value)}
                label='Body Style'
              >
                <MenuItem value='sedan'>Sedan</MenuItem>
                <MenuItem value='coupe'>Coupe</MenuItem>
                <MenuItem value='suv'>SUV</MenuItem>
                <MenuItem value='truck'>Truck</MenuItem>
                <MenuItem value='van'>Van</MenuItem>
                <MenuItem value='wagon'>Wagon</MenuItem>
                <MenuItem value='convertible'>Convertible</MenuItem>
                <MenuItem value='hatchback'>Hatchback</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Color'
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Paint Code'
              value={formData.paintCode}
              onChange={(e) => handleInputChange('paintCode', e.target.value)}
              placeholder='e.g., NH-883M'
            />
          </Grid>

          {/* Mechanical Specifications */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>
              Mechanical Specifications
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label='Engine Size'
              value={formData.engineSize}
              onChange={(e) => handleInputChange('engineSize', e.target.value)}
              placeholder='e.g., 2.0L 4cyl'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Transmission</InputLabel>
              <Select
                value={formData.transmission}
                onChange={(e) => handleInputChange('transmission', e.target.value)}
                label='Transmission'
              >
                <MenuItem value='automatic'>Automatic</MenuItem>
                <MenuItem value='manual'>Manual</MenuItem>
                <MenuItem value='cvt'>CVT</MenuItem>
                <MenuItem value='dual-clutch'>Dual Clutch</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Drivetrain</InputLabel>
              <Select
                value={formData.drivetrain}
                onChange={(e) => handleInputChange('drivetrain', e.target.value)}
                label='Drivetrain'
              >
                <MenuItem value='fwd'>Front-Wheel Drive (FWD)</MenuItem>
                <MenuItem value='rwd'>Rear-Wheel Drive (RWD)</MenuItem>
                <MenuItem value='awd'>All-Wheel Drive (AWD)</MenuItem>
                <MenuItem value='4wd'>Four-Wheel Drive (4WD)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Fuel Type</InputLabel>
              <Select
                value={formData.fuelType}
                onChange={(e) => handleInputChange('fuelType', e.target.value)}
                label='Fuel Type'
              >
                <MenuItem value='gasoline'>Gasoline</MenuItem>
                <MenuItem value='diesel'>Diesel</MenuItem>
                <MenuItem value='electric'>Electric</MenuItem>
                <MenuItem value='hybrid'>Hybrid</MenuItem>
                <MenuItem value='plugin-hybrid'>Plug-in Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Mileage'
              type='number'
              value={formData.mileage}
              onChange={(e) => handleInputChange('mileage', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>

          {/* Registration Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>
              Registration Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='License Plate'
              value={formData.licensePlate}
              onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>State/Province</InputLabel>
              <Select
                value={formData.licensePlateState}
                onChange={(e) => handleInputChange('licensePlateState', e.target.value)}
                label='State/Province'
              >
                {stateOptions.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Insurance Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>
              Insurance Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Insurance Company'
              value={formData.insuranceCompany}
              onChange={(e) => handleInputChange('insuranceCompany', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Policy Number'
              value={formData.policyNumber}
              onChange={(e) => handleInputChange('policyNumber', e.target.value)}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>
              Additional Notes
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Notes'
              multiline
              rows={4}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading}
        >
          {loading
            ? 'Saving...'
            : vehicle
              ? 'Update Vehicle'
              : 'Create Vehicle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleFormDialog;
