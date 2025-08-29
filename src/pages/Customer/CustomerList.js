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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Grid,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Edit,
  Delete,
  Visibility,
  Phone,
  Email,
  Message,
  Person,
  Business,
  Star,
  MoreVert,
  Refresh,
  Download,
  Upload,
  Print,
  Archive,
  RestoreFromTrash,
  DirectionsCar,
  Assignment,
  AttachMoney,
  Timeline
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { CustomerForm } from '../../components/Customer/CustomerForm';
import { CustomerDetailDialog } from '../../components/Customer/CustomerDetailDialog';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { SearchBar } from '../../components/Common/SearchBar';

// Services
import { customerService } from '../../services/customerService';

// Hooks
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';

const CustomerList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers based on search and filters
  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.firstName?.toLowerCase().includes(searchLower) ||
        customer.lastName?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchLower) ||
        customer.customerNumber?.toLowerCase().includes(searchLower) ||
        customer.companyName?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customerStatus === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customerType === typeFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, debouncedSearchTerm, statusFilter, typeFilter]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setCustomerFormOpen(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerFormOpen(true);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailOpen(true);
  };

  const handleDeleteCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      await customerService.deleteCustomer(selectedCustomer.id);
      await loadCustomers();
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'prospect': return 'warning';
      case 'vip': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'individual': return <Person />;
      case 'business': return <Business />;
      case 'insurance': return <AttachMoney />;
      case 'fleet': return <DirectionsCar />;
      default: return <Person />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'vip': return <Star />;
      case 'active': return <Person />;
      case 'inactive': return <Archive />;
      case 'prospect': return <Timeline />;
      default: return <Person />;
    }
  };

  const speedDialActions = [
    { icon: <Add />, name: 'Add Customer', action: handleAddCustomer },
    { icon: <Download />, name: 'Export', action: () => console.log('Export') },
    { icon: <Upload />, name: 'Import', action: () => console.log('Import') },
    { icon: <Print />, name: 'Print List', action: () => console.log('Print') }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customer Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadCustomers}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddCustomer}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers..."
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="prospect">Prospect</MenuItem>
                  <MenuItem value="vip">VIP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                  <MenuItem value="fleet">Fleet</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredCustomers.length} customers
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Vehicles</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
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
                          {getStatusIcon(customer.customerStatus)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {customer.getFullName ? customer.getFullName() : `${customer.firstName} ${customer.lastName}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.customerNumber}
                          </Typography>
                          {customer.companyName && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {customer.companyName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {customer.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Phone fontSize="small" />
                            <Typography variant="body2">{customer.phone}</Typography>
                          </Box>
                        )}
                        {customer.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email fontSize="small" />
                            <Typography variant="body2">{customer.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(customer.customerType)}
                        label={customer.customerType}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.customerStatus}
                        color={getStatusColor(customer.customerStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={customer.vehicles?.length || 0} color="primary">
                        <DirectionsCar />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.lastVisitDate ? new Date(customer.lastVisitDate).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCustomer(customer)}
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
      </Card>

      {/* Speed Dial for Mobile */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Customer actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.action();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      )}

      {/* Dialogs */}
      <CustomerForm
        open={customerFormOpen}
        customer={selectedCustomer}
        onClose={() => {
          setCustomerFormOpen(false);
          setSelectedCustomer(null);
        }}
        onSave={async () => {
          await loadCustomers();
          setCustomerFormOpen(false);
          setSelectedCustomer(null);
        }}
      />

      <CustomerDetailDialog
        open={customerDetailOpen}
        customer={selectedCustomer}
        onClose={() => {
          setCustomerDetailOpen(false);
          setSelectedCustomer(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCustomer?.firstName} {selectedCustomer?.lastName}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
