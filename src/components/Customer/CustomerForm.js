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
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
  Star,
  Save,
  Cancel,
  Add,
  DirectionsCar
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Services
import { customerService } from '../../services/customerService';

const CustomerForm = ({ open, customer, onClose, onSave }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Canada',
    dateOfBirth: '',
    driverLicense: '',
    preferredContact: 'phone',
    smsOptIn: false,
    emailOptIn: true,
    marketingOptIn: false,
    customerType: 'individual',
    customerStatus: 'active',
    companyName: '',
    taxId: '',
    creditLimit: '',
    paymentTerms: 'immediate',
    loyaltyPoints: 0,
    referralSource: '',
    notes: ''
  });

  // Reset form when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: customer.country || 'Canada',
        dateOfBirth: customer.dateOfBirth || '',
        driverLicense: customer.driverLicense || '',
        preferredContact: customer.preferredContact || 'phone',
        smsOptIn: customer.smsOptIn || false,
        emailOptIn: customer.emailOptIn !== false,
        marketingOptIn: customer.marketingOptIn || false,
        customerType: customer.customerType || 'individual',
        customerStatus: customer.customerStatus || 'active',
        companyName: customer.companyName || '',
        taxId: customer.taxId || '',
        creditLimit: customer.creditLimit || '',
        paymentTerms: customer.paymentTerms || 'immediate',
        loyaltyPoints: customer.loyaltyPoints || 0,
        referralSource: customer.referralSource || '',
        notes: customer.notes || ''
      });
    } else {
      // Reset form for new customer
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Canada',
        dateOfBirth: '',
        driverLicense: '',
        preferredContact: 'phone',
        smsOptIn: false,
        emailOptIn: true,
        marketingOptIn: false,
        customerType: 'individual',
        customerStatus: 'active',
        companyName: '',
        taxId: '',
        creditLimit: '',
        paymentTerms: 'immediate',
        loyaltyPoints: 0,
        referralSource: '',
        notes: ''
      });
    }
    setErrors({});
  }, [customer, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone && !formData.mobile) {
      newErrors.phone = 'At least one phone number is required';
    }

    if (formData.customerType === 'business' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required for business customers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const customerData = {
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        loyaltyPoints: parseInt(formData.loyaltyPoints) || 0
      };

      if (customer) {
        await customerService.updateCustomer(customer.id, customerData);
      } else {
        await customerService.createCustomer(customerData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving customer:', error);
      setErrors({ submit: 'Failed to save customer. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getCustomerTypeIcon = () => {
    switch (formData.customerType) {
      case 'individual': return <Person />;
      case 'business': return <Business />;
      case 'insurance': return <Star />;
      case 'fleet': return <DirectionsCar />;
      default: return <Person />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {getCustomerTypeIcon()}
          </Avatar>
          <Typography variant="h6">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name *"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name *"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mobile"
              value={formData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Driver License"
              value={formData.driverLicense}
              onChange={(e) => handleInputChange('driverLicense', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Preferred Contact</InputLabel>
              <Select
                value={formData.preferredContact}
                onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                label="Preferred Contact"
              >
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="mail">Mail</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Address Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn />
              Address Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ZIP/Postal Code"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
            />
          </Grid>

          {/* Customer Classification */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business />
              Customer Classification
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={formData.customerType}
                onChange={(e) => handleInputChange('customerType', e.target.value)}
                label="Customer Type"
              >
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="business">Business</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="fleet">Fleet</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Customer Status</InputLabel>
              <Select
                value={formData.customerStatus}
                onChange={(e) => handleInputChange('customerStatus', e.target.value)}
                label="Customer Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="prospect">Prospect</MenuItem>
                <MenuItem value="vip">VIP</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Business Information (conditional) */}
          {formData.customerType === 'business' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name *"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax ID"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                />
              </Grid>
            </>
          )}

          {/* Financial Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star />
              Financial Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Credit Limit"
              type="number"
              value={formData.creditLimit}
              onChange={(e) => handleInputChange('creditLimit', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Terms</InputLabel>
              <Select
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                label="Payment Terms"
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="net_15">Net 15</MenuItem>
                <MenuItem value="net_30">Net 30</MenuItem>
                <MenuItem value="net_60">Net 60</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Loyalty Points"
              type="number"
              value={formData.loyaltyPoints}
              onChange={(e) => handleInputChange('loyaltyPoints', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Referral Source"
              value={formData.referralSource}
              onChange={(e) => handleInputChange('referralSource', e.target.value)}
            />
          </Grid>

          {/* Communication Preferences */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Communication Preferences
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.smsOptIn}
                  onChange={(e) => handleInputChange('smsOptIn', e.target.checked)}
                />
              }
              label="SMS Opt-in"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.emailOptIn}
                  onChange={(e) => handleInputChange('emailOptIn', e.target.checked)}
                />
              }
              label="Email Opt-in"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.marketingOptIn}
                  onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
                />
              }
              label="Marketing Opt-in"
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Notes
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
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
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading}
        >
          {loading ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { CustomerForm };
