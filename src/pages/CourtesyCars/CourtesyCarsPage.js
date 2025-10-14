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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Info,
  LocalGasStation,
  Build,
  Schedule,
} from '@mui/icons-material';

const CourtesyCarsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTab, setSelectedTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Mock data for demonstration
  useEffect(() => {
    setVehicles([
      {
        id: 1,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC-123',
        status: 'available',
        mileage: 45000,
        fuelLevel: 75,
        lastService: '2024-01-01',
        nextService: '2024-04-01',
        location: 'Shop Lot',
      },
      {
        id: 2,
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        licensePlate: 'XYZ-789',
        status: 'in-use',
        mileage: 52000,
        fuelLevel: 45,
        lastService: '2023-12-15',
        nextService: '2024-03-15',
        location: 'Customer Location',
      },
      {
        id: 3,
        make: 'Nissan',
        model: 'Altima',
        year: 2021,
        licensePlate: 'DEF-456',
        status: 'maintenance',
        mileage: 38000,
        fuelLevel: 90,
        lastService: '2024-01-10',
        nextService: '2024-04-10',
        location: 'Service Bay',
      },
    ]);

    setAssignments([
      {
        id: 1,
        vehicleId: 2,
        customer: 'Sarah Johnson',
        customerPhone: '604-555-0123',
        jobNumber: 'RO-2025-001',
        assignedDate: '2024-01-10',
        expectedReturn: '2024-01-20',
        status: 'active',
        notes: 'Front end repair - estimated 10 days',
      },
      {
        id: 2,
        vehicleId: 1,
        customer: 'Mike Wilson',
        customerPhone: '604-555-0456',
        jobNumber: 'RO-2025-002',
        assignedDate: '2024-01-12',
        expectedReturn: '2024-01-18',
        status: 'returned',
        notes: 'Paint job completed',
      },
    ]);
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setDialogOpen(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'in-use': return 'primary';
      case 'maintenance': return 'warning';
      case 'out-of-service': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle />;
      case 'in-use': return <Person />;
      case 'maintenance': return <Build />;
      case 'out-of-service': return <Warning />;
      default: return <DirectionsCar />;
    }
  };

  const getFuelColor = (level) => {
    if (level < 25) return 'error';
    if (level < 50) return 'warning';
    return 'success';
  };

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const inUseVehicles = vehicles.filter(v => v.status === 'in-use');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Courtesy Cars
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage rental vehicles and customer assignments
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddVehicle}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add Vehicle
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {availableVehicles.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available
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
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {inUseVehicles.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Use
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
                    <Build />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {maintenanceVehicles.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Maintenance
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
                    <Schedule />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {assignments.filter(a => a.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Assignments
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
            <Tab label="Vehicle Fleet" />
            <Tab label="Current Assignments" />
            <Tab label="Assignment History" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {selectedTab === 0 && (
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: `${getStatusColor(vehicle.status)}.main` }}>
                        {getStatusIcon(vehicle.status)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.licensePlate}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={2}>
                      <Chip
                        label={vehicle.status}
                        color={getStatusColor(vehicle.status)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Mileage:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {vehicle.mileage.toLocaleString()} km
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Fuel Level:
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalGasStation sx={{ fontSize: 16, color: `${getFuelColor(vehicle.fuelLevel)}.main` }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.fuelLevel}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Location:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {vehicle.location}
                      </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                      >
                        Remove
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {selectedTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Current Assignments
              </Typography>
              {assignments.filter(a => a.status === 'active').length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Job Number</TableCell>
                        <TableCell>Assigned Date</TableCell>
                        <TableCell>Expected Return</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.filter(a => a.status === 'active').map((assignment) => {
                        const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
                        return (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {assignment.customer}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {assignment.customerPhone}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'N/A'}
                            </TableCell>
                            <TableCell>{assignment.jobNumber}</TableCell>
                            <TableCell>{new Date(assignment.assignedDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(assignment.expectedReturn).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={assignment.status}
                                color="primary"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No active assignments
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {selectedTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Assignment History
              </Typography>
              {assignments.length > 0 ? (
                <List>
                  {assignments.map((assignment) => {
                    const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
                    return (
                      <ListItem key={assignment.id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <DirectionsCar />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${assignment.customer} - ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Job: {assignment.jobNumber} • Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Expected Return: {new Date(assignment.expectedReturn).toLocaleDateString()}
                              </Typography>
                              {assignment.notes && (
                                <Typography variant="body2" color="text.secondary">
                                  {assignment.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={assignment.status}
                            color={assignment.status === 'active' ? 'primary' : 'default'}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Alert severity="info">
                  No assignment history
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vehicle Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Make"
                    defaultValue={selectedVehicle?.make || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    defaultValue={selectedVehicle?.model || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    defaultValue={selectedVehicle?.year || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License Plate"
                    defaultValue={selectedVehicle?.licensePlate || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mileage"
                    type="number"
                    defaultValue={selectedVehicle?.mileage || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select defaultValue={selectedVehicle?.status || 'available'}>
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="in-use">In Use</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="out-of-service">Out of Service</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    defaultValue={selectedVehicle?.location || ''}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">
              {selectedVehicle ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CourtesyCarsPage;
