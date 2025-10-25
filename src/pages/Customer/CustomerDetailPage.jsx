import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
  Star,
  DirectionsCar,
  Assignment,
  Message,
  Payment,
  History,
  Add,
  Visibility,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Components
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { CustomerForm } from '../../components/Customer/CustomerForm';
import VehicleFormDialog from '../../components/Vehicle/VehicleFormDialog';
import CommunicationsTab from '../../components/Customer/CommunicationsTab';
import HistoryTab from '../../components/Customer/HistoryTab';

// Services
import { customerService } from '../../services/customerService';

// Utils
import { getCustomerFullName } from '../../utils/fieldTransformers';

const CustomerDetailPage = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [customerData, vehiclesData, jobsData] = await Promise.all([
        customerService.getCustomerById(id),
        customerService.getCustomerVehicles(id),
        customerService.getCustomerJobs(id),
      ]);

      setCustomer(customerData);
      setVehicles(vehiclesData || []);
      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleAddVehicle = () => {
    setVehicleFormOpen(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'business':
        return <Business />;
      case 'insurance':
        return <Star />;
      case 'fleet':
        return <DirectionsCar />;
      default:
        return <Person />;
    }
  };

  const getStatusColor = (status) => {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Customer not found</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Customers
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant='h4' component='h1' sx={{ flexGrow: 1 }}>
          Customer Details
        </Typography>
        <Button variant='outlined' startIcon={<Edit />} onClick={handleEdit}>
          Edit
        </Button>
        <Button variant='outlined' color='error' startIcon={<Delete />}>
          Delete
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Info Card */}
        <Grid item xs={12} md={4}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: theme.palette.primary.main,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {getTypeIcon(customer.customerType)}
                </Avatar>
                <Typography variant='h5' gutterBottom>
                  {getCustomerFullName(customer)}
                </Typography>
                {customer.companyName && (
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    {customer.companyName}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                  <Chip
                    label={customer.customerType || 'individual'}
                    size='small'
                    variant='outlined'
                  />
                  <Chip
                    label={customer.customerStatus || 'active'}
                    color={getStatusColor(customer.customerStatus)}
                    size='small'
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Contact Information */}
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
                {customer.address && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary='Address'
                      secondary={
                        <>
                          {customer.address}
                          {customer.city && customer.state && (
                            <>
                              <br />
                              {customer.city}, {customer.state} {customer.zipCode}
                            </>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* Additional Info */}
              <Typography variant='caption' color='text.secondary'>
                Customer Number: {customer.customerNumber}
              </Typography>
              <br />
              <Typography variant='caption' color='text.secondary'>
                Created: {new Date(customer.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<DirectionsCar />} label='Vehicles' iconPosition='start' />
              <Tab icon={<Assignment />} label='Jobs & ROs' iconPosition='start' />
              <Tab icon={<Message />} label='Communications' iconPosition='start' />
              <Tab icon={<History />} label='History' iconPosition='start' />
            </Tabs>

            <CardContent>
              {/* Vehicles Tab */}
              {tabValue === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant='h6'>Vehicles ({vehicles.length})</Typography>
                    <Button
                      variant='contained'
                      size='small'
                      startIcon={<Add />}
                      onClick={handleAddVehicle}
                    >
                      Add Vehicle
                    </Button>
                  </Box>

                  {vehicles.length > 0 ? (
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>VIN</TableCell>
                            <TableCell>Plate</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id} hover>
                              <TableCell>
                                <Typography variant='body2'>
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </Typography>
                                {vehicle.trim && (
                                  <Typography variant='caption' color='text.secondary'>
                                    {vehicle.trim}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
                                  {vehicle.vin}
                                </Typography>
                              </TableCell>
                              <TableCell>{vehicle.licensePlate || '-'}</TableCell>
                              <TableCell>
                                <Tooltip title='View Details'>
                                  <IconButton size='small'>
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title='Edit'>
                                  <IconButton size='small'>
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <DirectionsCar sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color='text.secondary'>
                        No vehicles registered yet
                      </Typography>
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={<Add />}
                        onClick={handleAddVehicle}
                        sx={{ mt: 2 }}
                      >
                        Add First Vehicle
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Jobs & ROs Tab */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    Repair Orders & Jobs ({jobs.length})
                  </Typography>

                  {jobs.length > 0 ? (
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>RO Number</TableCell>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {jobs.map((job) => (
                            <TableRow key={job.id} hover>
                              <TableCell>{job.roNumber}</TableCell>
                              <TableCell>{job.vehicleInfo}</TableCell>
                              <TableCell>
                                <Chip label={job.status} size='small' />
                              </TableCell>
                              <TableCell>
                                {new Date(job.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>${job.total?.toFixed(2) || '0.00'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color='text.secondary'>
                        No repair orders yet
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Communications Tab */}
              {tabValue === 2 && (
                <CommunicationsTab
                  customerId={id}
                  customerService={customerService}
                />
              )}

              {/* History Tab */}
              {tabValue === 3 && (
                <HistoryTab
                  customerId={id}
                  customerService={customerService}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Customer Dialog */}
      <CustomerForm
        open={editDialogOpen}
        customer={customer}
        onClose={() => setEditDialogOpen(false)}
        onSave={async () => {
          await loadCustomerData();
          setEditDialogOpen(false);
        }}
      />

      {/* Add Vehicle Dialog */}
      <VehicleFormDialog
        open={vehicleFormOpen}
        customerId={customer.id}
        onClose={() => setVehicleFormOpen(false)}
        onSave={async () => {
          await loadCustomerData();
          setVehicleFormOpen(false);
        }}
      />
    </Box>
  );
};

export default CustomerDetailPage;
