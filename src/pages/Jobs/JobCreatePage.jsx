import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person,
  DirectionsCar,
  Assignment,
  Business,
  Save,
  Cancel,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../../store/customerStore';

const JobCreatePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { customers, fetchCustomers, createCustomer } = useCustomerStore();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Customer info
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    
    // Vehicle info
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleVin: '',
    vehicleColor: '',
    vehicleMileage: '',
    
    // Job info
    jobType: 'repair',
    priority: 'normal',
    estimatedCompletion: '',
    description: '',
    
    // Insurance info
    insuranceCompany: '',
    claimNumber: '',
    policyNumber: '',
    adjusterName: '',
    adjusterPhone: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerSelect = (customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setIsNewCustomer(false);
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        customerAddress: customer.address || '',
      }));
    } else {
      setSelectedCustomer(null);
      setIsNewCustomer(true);
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
      }));
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let customerId = formData.customerId;

      // Create new customer if needed
      if (isNewCustomer && !customerId) {
        const newCustomer = await createCustomer({
          firstName: formData.customerName.split(' ')[0] || '',
          lastName: formData.customerName.split(' ').slice(1).join(' ') || '',
          phone: formData.customerPhone,
          email: formData.customerEmail,
          address: formData.customerAddress,
          customerType: 'individual',
          customerStatus: 'active',
        });
        customerId = newCustomer.id;
      }

      // Create job data
      const jobData = {
        customerId,
        vehicleYear: formData.vehicleYear,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleVin: formData.vehicleVin,
        vehicleColor: formData.vehicleColor,
        vehicleMileage: formData.vehicleMileage,
        jobType: formData.jobType,
        priority: formData.priority,
        estimatedCompletion: formData.estimatedCompletion,
        description: formData.description,
        insuranceCompany: formData.insuranceCompany,
        claimNumber: formData.claimNumber,
        policyNumber: formData.policyNumber,
        adjusterName: formData.adjusterName,
        adjusterPhone: formData.adjusterPhone,
        status: 'intake',
      };

      // Here you would call the job service to create the job
      console.log('Creating job with data:', jobData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard or job detail
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: 'Customer Information',
      icon: <Person />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select or Create Customer
            </Typography>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} - ${option.phone || option.email}`}
              value={selectedCustomer}
              onChange={(event, newValue) => handleCustomerSelect(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search existing customer"
                  placeholder="Type to search..."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="subtitle1">
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.phone} • {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Grid>
          
          {isNewCustomer && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="New Customer Details" />
                </Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.customerAddress}
                  onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                />
              </Grid>
            </>
          )}
        </Grid>
      )
    },
    {
      label: 'Vehicle Information',
      icon: <DirectionsCar />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={formData.vehicleYear}
              onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Make"
              value={formData.vehicleMake}
              onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Model"
              value={formData.vehicleModel}
              onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="VIN"
              value={formData.vehicleVin}
              onChange={(e) => handleInputChange('vehicleVin', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Color"
              value={formData.vehicleColor}
              onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mileage"
              type="number"
              value={formData.vehicleMileage}
              onChange={(e) => handleInputChange('vehicleMileage', e.target.value)}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Job Details',
      icon: <Assignment />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={formData.jobType}
                onChange={(e) => handleInputChange('jobType', e.target.value)}
              >
                <MenuItem value="repair">Repair</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Completion"
              type="date"
              value={formData.estimatedCompletion}
              onChange={(e) => handleInputChange('estimatedCompletion', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Description"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the work to be performed..."
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Insurance Information',
      icon: <Business />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Insurance Company"
              value={formData.insuranceCompany}
              onChange={(e) => handleInputChange('insuranceCompany', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Claim Number"
              value={formData.claimNumber}
              onChange={(e) => handleInputChange('claimNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Policy Number"
              value={formData.policyNumber}
              onChange={(e) => handleInputChange('policyNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Adjuster Name"
              value={formData.adjusterName}
              onChange={(e) => handleInputChange('adjusterName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adjuster Phone"
              value={formData.adjusterPhone}
              onChange={(e) => handleInputChange('adjusterPhone', e.target.value)}
            />
          </Grid>
        </Grid>
      )
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Create New Job
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Add a new repair order to the system
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stepper */}
        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel icon={step.icon}>
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step Content */}
            <Box sx={{ mt: 4 }}>
              {steps[activeStep]?.content}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{ ml: 1 }}
                  >
                    {loading ? 'Creating...' : 'Create Job'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    startIcon={<Add />}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default JobCreatePage;
