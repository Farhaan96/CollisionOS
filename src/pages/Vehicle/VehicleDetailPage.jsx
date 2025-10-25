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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  DirectionsCar,
  Speed,
  Palette,
  CalendarToday,
  Person,
  Build,
  Assignment,
  Info,
  LocalGasStation,
  Settings,
  Visibility,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// Services
import { vehicleService } from '../../services/vehicleService';
import { customerService } from '../../services/customerService';

/**
 * VehicleDetailPage Component
 * Displays comprehensive vehicle information including:
 * - VIN, year, make, model, trim, color
 * - Owner information
 * - Service history
 * - Current repair status
 * - Photos
 * - Odometer readings
 */
const VehicleDetailPage = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [odometerHistory, setOdometerHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadVehicleData();
    }
  }, [id]);

  const loadVehicleData = async () => {
    setLoading(true);
    try {
      // Fetch vehicle data
      const vehicleData = await vehicleService.getVehicleById(id);
      setVehicle(vehicleData);

      // Fetch customer/owner data
      if (vehicleData.customerId) {
        const customerData = await customerService.getCustomerById(vehicleData.customerId);
        setCustomer(customerData);
      }

      // Fetch service history (repair orders for this vehicle)
      const historyData = await vehicleService.getVehicleServiceHistory(id).catch(() => []);
      setServiceHistory(Array.isArray(historyData) ? historyData : []);

      // Fetch odometer readings
      const odometerData = await vehicleService.getVehicleOdometerHistory(id).catch(() => []);
      setOdometerHistory(Array.isArray(odometerData) ? odometerData : []);
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (customer?.id) {
      navigate(`/customers/${customer.id}`);
    } else {
      navigate('/vehicles');
    }
  };

  const handleEdit = () => {
    // TODO: Open vehicle edit dialog
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_shop':
        return 'success';
      case 'delivered':
      case 'completed':
        return 'info';
      case 'inactive':
        return 'default';
      default:
        return 'warning';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Vehicle not found</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back
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
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Vehicle Details
        </Typography>
        <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Vehicle Info Card */}
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
                  <DirectionsCar sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Typography>
                {vehicle.trim && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {vehicle.trim}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                  {vehicle.color && (
                    <Chip
                      label={vehicle.color}
                      size="small"
                      icon={<Palette />}
                      variant="outlined"
                    />
                  )}
                  {vehicle.currentStatus && (
                    <Chip
                      label={vehicle.currentStatus}
                      color={getStatusColor(vehicle.currentStatus)}
                      size="small"
                    />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Vehicle Information */}
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Info />
                  </ListItemIcon>
                  <ListItemText
                    primary="VIN"
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                      >
                        {vehicle.vin || 'Not provided'}
                      </Typography>
                    }
                  />
                </ListItem>

                {vehicle.licensePlate && (
                  <ListItem>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText
                      primary="License Plate"
                      secondary={vehicle.licensePlate}
                    />
                  </ListItem>
                )}

                {vehicle.odometer && (
                  <ListItem>
                    <ListItemIcon>
                      <Speed />
                    </ListItemIcon>
                    <ListItemText
                      primary="Current Odometer"
                      secondary={`${vehicle.odometer.toLocaleString()} miles`}
                    />
                  </ListItem>
                )}

                {vehicle.fuelType && (
                  <ListItem>
                    <ListItemIcon>
                      <LocalGasStation />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fuel Type"
                      secondary={vehicle.fuelType}
                    />
                  </ListItem>
                )}

                {vehicle.transmission && (
                  <ListItem>
                    <ListItemIcon>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText
                      primary="Transmission"
                      secondary={vehicle.transmission}
                    />
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* Owner Information */}
              {customer && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Owner Information
                  </Typography>
                  <ListItem>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${customer.firstName} ${customer.lastName}`}
                      secondary={customer.email || customer.phone}
                    />
                  </ListItem>
                  <Button
                    variant="text"
                    size="small"
                    fullWidth
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    View Customer Profile
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          {/* Service History */}
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            sx={{ mb: 3 }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Service History ({serviceHistory.length} visits)
              </Typography>

              {serviceHistory.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>RO Number</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Service Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serviceHistory.map((service) => (
                        <TableRow key={service.id} hover>
                          <TableCell>{service.roNumber}</TableCell>
                          <TableCell>
                            {format(new Date(service.openedAt || service.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {service.serviceType || service.description || 'Collision Repair'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={service.stage || service.status}
                              size="small"
                              color={getStatusColor(service.stage || service.status)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(service.totalEstimate || service.total)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/ro/${service.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No service history available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Odometer History */}
          {odometerHistory.length > 0 && (
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Odometer Readings
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Reading (miles)</TableCell>
                        <TableCell>Source</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {odometerHistory.map((reading, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {format(new Date(reading.date || reading.recordedAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell align="right">
                            {reading.reading?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {reading.source || reading.recordedBy || 'Service Visit'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default VehicleDetailPage;
