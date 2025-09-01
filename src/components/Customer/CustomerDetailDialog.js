import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
  DirectionsCar,
  Assignment,
  AttachMoney,
  Star,
  Close,
  Edit,
  History,
  Note,
  Loyalty,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Services
import { customerService } from '../../services/customerService';

const CustomerDetailDialog = ({ open, customer, onClose, onEdit }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      loadCustomerDetails();
    }
  }, [open, customer]);

  const loadCustomerDetails = async () => {
    if (!customer?.id) return;

    setLoading(true);
    try {
      const [vehiclesData, jobsData] = await Promise.all([
        customerService.getCustomerVehicles(customer.id),
        customerService.getCustomerJobs(customer.id),
      ]);
      setVehicles(vehiclesData || []);
      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error loading customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getCustomerTypeIcon = () => {
    switch (customer?.customerType) {
      case 'individual':
        return <Person />;
      case 'business':
        return <Business />;
      case 'insurance':
        return <AttachMoney />;
      case 'fleet':
        return <DirectionsCar />;
      default:
        return <Person />;
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'prospect':
        return 'warning';
      case 'vip':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = date => {
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  };

  const formatCurrency = amount => {
    return amount ? `$${amount.toLocaleString()}` : '$0';
  };

  if (!customer) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 56,
                height: 56,
              }}
            >
              {getCustomerTypeIcon()}
            </Avatar>
            <Box>
              <Typography variant='h5'>
                {customer.firstName} {customer.lastName}
              </Typography>
              <Typography variant='subtitle1' color='text.secondary'>
                {customer.customerNumber}
              </Typography>
              {customer.companyName && (
                <Typography variant='subtitle2' color='text.secondary'>
                  {customer.companyName}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={customer.customerStatus}
              color={getStatusColor(customer.customerStatus)}
              size='small'
            />
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label='Overview' />
            <Tab label='Vehicles' />
            <Tab label='Service History' />
            <Tab label='Financial' />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Phone />
                    Contact Information
                  </Typography>
                  <List dense>
                    {customer.phone && (
                      <ListItem>
                        <ListItemIcon>
                          <Phone />
                        </ListItemIcon>
                        <ListItemText
                          primary='Phone'
                          secondary={customer.phone}
                        />
                      </ListItem>
                    )}
                    {customer.mobile && (
                      <ListItem>
                        <ListItemIcon>
                          <Phone />
                        </ListItemIcon>
                        <ListItemText
                          primary='Mobile'
                          secondary={customer.mobile}
                        />
                      </ListItem>
                    )}
                    {customer.email && (
                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText
                          primary='Email'
                          secondary={customer.email}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn />
                      </ListItemIcon>
                      <ListItemText
                        primary='Address'
                        secondary={`${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zipCode || ''}`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Customer Details */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Person />
                    Customer Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Type
                      </Typography>
                      <Typography variant='body1'>
                        {customer.customerType}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Status
                      </Typography>
                      <Chip
                        label={customer.customerStatus}
                        color={getStatusColor(customer.customerStatus)}
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        First Visit
                      </Typography>
                      <Typography variant='body1'>
                        {formatDate(customer.firstVisitDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Last Visit
                      </Typography>
                      <Typography variant='body1'>
                        {formatDate(customer.lastVisitDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Preferred Contact
                      </Typography>
                      <Typography variant='body1'>
                        {customer.preferredContact}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Referral Source
                      </Typography>
                      <Typography variant='body1'>
                        {customer.referralSource || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Communication Preferences */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    Communication Preferences
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        SMS
                      </Typography>
                      <Chip
                        label={customer.smsOptIn ? 'Enabled' : 'Disabled'}
                        color={customer.smsOptIn ? 'success' : 'default'}
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Email
                      </Typography>
                      <Chip
                        label={customer.emailOptIn ? 'Enabled' : 'Disabled'}
                        color={customer.emailOptIn ? 'success' : 'default'}
                        size='small'
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant='body2' color='text.secondary'>
                        Marketing
                      </Typography>
                      <Chip
                        label={customer.marketingOptIn ? 'Enabled' : 'Disabled'}
                        color={customer.marketingOptIn ? 'success' : 'default'}
                        size='small'
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Loyalty Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Loyalty />
                    Loyalty Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Loyalty Points
                      </Typography>
                      <Typography variant='h5' color='primary'>
                        {customer.loyaltyPoints || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Credit Limit
                      </Typography>
                      <Typography variant='h6'>
                        {formatCurrency(customer.creditLimit)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Notes */}
            {customer.notes && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography
                      variant='h6'
                      sx={{
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Note />
                      Notes
                    </Typography>
                    <Typography variant='body1'>{customer.notes}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* Vehicles Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Customer Vehicles ({vehicles.length})
            </Typography>
            {vehicles.length > 0 ? (
              <Grid container spacing={2}>
                {vehicles.map(vehicle => (
                  <Grid item xs={12} md={6} key={vehicle.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Avatar
                            sx={{ bgcolor: theme.palette.secondary.main }}
                          >
                            <DirectionsCar />
                          </Avatar>
                          <Box>
                            <Typography variant='h6'>
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              VIN: {vehicle.vin}
                            </Typography>
                          </Box>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              License Plate
                            </Typography>
                            <Typography variant='body2'>
                              {vehicle.licensePlate || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Color
                            </Typography>
                            <Typography variant='body2'>
                              {vehicle.color || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Mileage
                            </Typography>
                            <Typography variant='body2'>
                              {vehicle.mileage?.toLocaleString() || 'N/A'} km
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant='body2' color='text.secondary'>
                              Insurance
                            </Typography>
                            <Typography variant='body2'>
                              {vehicle.insuranceCompany || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography
                variant='body1'
                color='text.secondary'
                sx={{ textAlign: 'center', py: 4 }}
              >
                No vehicles found for this customer
              </Typography>
            )}
          </Box>
        )}

        {/* Service History Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Service History ({jobs.length})
            </Typography>
            {jobs.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Job Number</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell>{job.jobNumber}</TableCell>
                        <TableCell>
                          {job.vehicle
                            ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(job.createdAt)}</TableCell>
                        <TableCell>
                          <Chip label={job.status} size='small' />
                        </TableCell>
                        <TableCell>{formatCurrency(job.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography
                variant='body1'
                color='text.secondary'
                sx={{ textAlign: 'center', py: 4 }}
              >
                No service history found for this customer
              </Typography>
            )}
          </Box>
        )}

        {/* Financial Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant='h6'
                    sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <AttachMoney />
                    Financial Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant='body2' color='text.secondary'>
                        Credit Limit
                      </Typography>
                      <Typography variant='h5'>
                        {formatCurrency(customer.creditLimit)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Payment Terms
                      </Typography>
                      <Typography variant='body1'>
                        {customer.paymentTerms || 'Immediate'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Total Jobs
                      </Typography>
                      <Typography variant='body1'>{jobs.length}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    Recent Activity
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Revenue:{' '}
                    {formatCurrency(
                      jobs.reduce((sum, job) => sum + (job.totalAmount || 0), 0)
                    )}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Average Job Value:{' '}
                    {formatCurrency(
                      jobs.length > 0
                        ? jobs.reduce(
                            (sum, job) => sum + (job.totalAmount || 0),
                            0
                          ) / jobs.length
                        : 0
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Close</Button>
        {onEdit && (
          <Button
            onClick={() => onEdit(customer)}
            variant='contained'
            startIcon={<Edit />}
          >
            Edit Customer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export { CustomerDetailDialog };
