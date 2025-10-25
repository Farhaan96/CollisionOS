import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  DirectionsCar,
  Refresh,
  FilterList,
  Download,
  Upload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import VehicleFormDialog from '../../components/Vehicle/VehicleFormDialog';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { SearchBar } from '../../components/Common/SearchBar';

// Services
import { vehicleService } from '../../services/vehicleService';

// Hooks
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';

const VehicleListPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [makeFilter, setMakeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalVehicles, setTotalVehicles] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load vehicles
  useEffect(() => {
    loadVehicles();
  }, [page, rowsPerPage]);

  // Filter vehicles based on search and filters
  useEffect(() => {
    let filtered = vehicles;

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        vehicle =>
          vehicle.make?.toLowerCase().includes(searchLower) ||
          vehicle.model?.toLowerCase().includes(searchLower) ||
          vehicle.vin?.toLowerCase().includes(searchLower) ||
          vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
          vehicle.year?.toString().includes(searchLower)
      );
    }

    // Make filter
    if (makeFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.make === makeFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.year?.toString() === yearFilter);
    }

    setFilteredVehicles(filtered);
  }, [vehicles, debouncedSearchTerm, makeFilter, yearFilter]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const filters = {
        limit: rowsPerPage,
        offset: (page - 1) * rowsPerPage,
      };

      const response = await vehicleService.getVehicles(filters);

      // Handle paginated response format
      if (response && response.pagination) {
        setVehicles(response.data || []);
        setTotalVehicles(response.pagination.total || 0);
      } else {
        // Fallback for non-paginated response
        setVehicles(response || []);
        setTotalVehicles(response?.length || 0);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleFormOpen(true);
  };

  const handleEditVehicle = vehicle => {
    setSelectedVehicle(vehicle);
    setVehicleFormOpen(true);
  };

  const handleDeleteVehicle = vehicle => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedVehicle) return;

    try {
      await vehicleService.deleteVehicle(selectedVehicle.id);
      await loadVehicles();
      setDeleteDialogOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  // Get unique makes for filter
  const uniqueMakes = [...new Set(vehicles.map(v => v.make).filter(Boolean))].sort();

  // Get unique years for filter
  const uniqueYears = [...new Set(vehicles.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);

  const formatVehicleDisplay = vehicle => {
    return `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
  };

  if (loading && vehicles.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4' component='h1'>
          Vehicle Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant='outlined'
            startIcon={<Refresh />}
            onClick={loadVehicles}
          >
            Refresh
          </Button>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleAddVehicle}
          >
            Add Vehicle
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <SearchBar
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Search vehicles (VIN, make, model, plate)...'
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Make</InputLabel>
                <Select
                  value={makeFilter}
                  onChange={e => setMakeFilter(e.target.value)}
                  label='Make'
                >
                  <MenuItem value='all'>All Makes</MenuItem>
                  {uniqueMakes.map(make => (
                    <MenuItem key={make} value={make}>
                      {make}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  label='Year'
                >
                  <MenuItem value='all'>All Years</MenuItem>
                  {uniqueYears.map(year => (
                    <MenuItem key={year} value={year.toString()}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant='body2' color='text.secondary'>
                {filteredVehicles.length} vehicles
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vehicle Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>VIN</TableCell>
                <TableCell>License Plate</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Mileage</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredVehicles.map((vehicle, index) => (
                  <motion.tr
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    component={TableRow}
                    hover
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          <DirectionsCar />
                        </Avatar>
                        <Box>
                          <Typography variant='subtitle2'>
                            {formatVehicleDisplay(vehicle)}
                          </Typography>
                          {vehicle.trim && (
                            <Typography variant='caption' color='text.secondary'>
                              {vehicle.trim}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                        {vehicle.vin}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vehicle.licensePlate ? (
                        <Box>
                          <Typography variant='body2'>{vehicle.licensePlate}</Typography>
                          {vehicle.licensePlateState && (
                            <Typography variant='caption' color='text.secondary'>
                              {vehicle.licensePlateState}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.color ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: vehicle.color.toLowerCase(),
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                          <Typography variant='body2'>{vehicle.color}</Typography>
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {vehicle.mileage
                          ? `${vehicle.mileage.toLocaleString()} mi`
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vehicle.customer ? (
                        <Box>
                          <Typography variant='body2'>
                            {vehicle.customer.firstName} {vehicle.customer.lastName}
                          </Typography>
                          {vehicle.customer.phone && (
                            <Typography variant='caption' color='text.secondary'>
                              {vehicle.customer.phone}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title='View Details'>
                          <IconButton size='small'>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Edit'>
                          <IconButton
                            size='small'
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteVehicle(vehicle)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalVehicles}
          page={page - 1}
          onPageChange={(event, newPage) => setPage(newPage + 1)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* Dialogs */}
      <VehicleFormDialog
        open={vehicleFormOpen}
        vehicle={selectedVehicle}
        onClose={() => {
          setVehicleFormOpen(false);
          setSelectedVehicle(null);
        }}
        onSave={async () => {
          await loadVehicles();
          setVehicleFormOpen(false);
          setSelectedVehicle(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {formatVehicleDisplay(selectedVehicle || {})}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleListPage;
