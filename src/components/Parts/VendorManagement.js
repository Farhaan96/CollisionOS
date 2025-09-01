import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Rating,
  LinearProgress,
  Tabs,
  Tab,
  Tooltip,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Phone,
  Email,
  LocationOn,
  Language,
  Star,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  LocalShipping,
  Assessment,
  Visibility,
  VerifiedUser,
  Warning,
  Schedule,
  AttachMoney,
  Business,
  ContactPhone,
  Description,
  Timeline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { partsService } from '../../services/partsService';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Vendor types and categories
const VENDOR_TYPES = {
  oem: {
    label: 'OEM',
    color: '#1976d2',
    description: 'Original Equipment Manufacturer',
  },
  aftermarket: {
    label: 'Aftermarket',
    color: '#ed6c02',
    description: 'Aftermarket Parts Supplier',
  },
  recycled: {
    label: 'Recycled',
    color: '#388e3c',
    description: 'Recycled/Used Parts',
  },
  remanufactured: {
    label: 'Remanufactured',
    color: '#7b1fa2',
    description: 'Remanufactured Parts',
  },
  consumables: {
    label: 'Consumables',
    color: '#2e7d32',
    description: 'Consumables & Supplies',
  },
};

const PERFORMANCE_METRICS = {
  onTimeDelivery: { label: 'On-Time Delivery', icon: Schedule },
  qualityRating: { label: 'Quality Rating', icon: VerifiedUser },
  priceCompetitiveness: { label: 'Price Competitiveness', icon: AttachMoney },
  responsiveness: { label: 'Responsiveness', icon: ContactPhone },
  orderAccuracy: { label: 'Order Accuracy', icon: Assessment },
};

const VendorManagement = ({ onVendorsChange }) => {
  const theme = useTheme();
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newVendor, setNewVendor] = useState({
    name: '',
    type: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    contact: {
      name: '',
      title: '',
      email: '',
      phone: '',
    },
    terms: {
      paymentTerms: '',
      shippingPolicy: '',
      returnPolicy: '',
      minimumOrder: '',
      discountTiers: [],
    },
    categories: [],
    isActive: true,
  });

  // Load vendors data
  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partsService.getVendors();
      setVendors(data);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Create vendor
  const handleCreateVendor = async () => {
    try {
      await partsService.createVendor(newVendor);
      setCreateDialog(false);
      setNewVendor({
        name: '',
        type: '',
        email: '',
        phone: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
        contact: { name: '', title: '', email: '', phone: '' },
        terms: {
          paymentTerms: '',
          shippingPolicy: '',
          returnPolicy: '',
          minimumOrder: '',
          discountTiers: [],
        },
        categories: [],
        isActive: true,
      });
      loadVendors();

      if (onVendorsChange) onVendorsChange();
    } catch (error) {
      console.error('Failed to create vendor:', error);
    }
  };

  // Update vendor
  const handleUpdateVendor = async (id, updates) => {
    try {
      await partsService.updateVendor(id, updates);
      loadVendors();

      if (onVendorsChange) onVendorsChange();
    } catch (error) {
      console.error('Failed to update vendor:', error);
    }
  };

  // Calculate vendor performance score
  const calculatePerformanceScore = vendor => {
    const metrics = vendor.performanceMetrics || {};
    const scores = Object.values(metrics).filter(
      score => score !== null && score !== undefined
    );
    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  };

  // Get vendor performance color
  const getPerformanceColor = score => {
    if (score >= 4.5) return theme.palette.success.main;
    if (score >= 3.5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Vendor Card Component
  const VendorCard = ({ vendor, index }) => {
    const vendorType = VENDOR_TYPES[vendor.type];
    const performanceScore = calculatePerformanceScore(vendor);
    const performanceColor = getPerformanceColor(performanceScore);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card
          sx={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: theme.shadows[4],
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease',
            },
          }}
          onClick={() => {
            setSelectedVendor(vendor);
            setDetailsDialog(true);
          }}
        >
          <CardContent sx={{ flex: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: vendorType?.color || theme.palette.primary.main,
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                {vendor.name?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h6' fontWeight='bold' noWrap>
                  {vendor.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size='small'
                    label={vendorType?.label}
                    sx={{
                      bgcolor: alpha(vendorType?.color || '#666', 0.1),
                      color: vendorType?.color || '#666',
                    }}
                  />
                  {!vendor.isActive && (
                    <Chip size='small' label='Inactive' color='error' />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant='body2' fontWeight='bold'>
                  {performanceScore.toFixed(1)}
                </Typography>
              </Box>
            </Box>

            {/* Contact Info */}
            <Box sx={{ mb: 2 }}>
              {vendor.email && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant='body2' color='text.secondary' noWrap>
                    {vendor.email}
                  </Typography>
                </Box>
              )}
              {vendor.phone && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant='body2' color='text.secondary'>
                    {vendor.phone}
                  </Typography>
                </Box>
              )}
              {vendor.address?.city && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant='body2' color='text.secondary' noWrap>
                    {vendor.address.city}, {vendor.address.state}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Performance Metrics */}
            <Box sx={{ mb: 2 }}>
              <Typography variant='subtitle2' gutterBottom>
                Performance
              </Typography>
              <LinearProgress
                variant='determinate'
                value={(performanceScore / 5) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.grey[300], 0.5),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: performanceColor,
                  },
                }}
              />
            </Box>

            {/* Stats */}
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>
                  Orders
                </Typography>
                <Typography variant='body2' fontWeight='bold'>
                  {vendor.stats?.totalOrders || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='caption' color='text.secondary'>
                  Last Order
                </Typography>
                <Typography variant='body2' fontWeight='bold'>
                  {vendor.stats?.lastOrderDate
                    ? formatDate(vendor.stats.lastOrderDate)
                    : 'Never'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>

          {/* Actions */}
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size='small'
                startIcon={<ShoppingCart />}
                onClick={e => {
                  e.stopPropagation();
                  // Create order with this vendor
                }}
              >
                Order
              </Button>
              <Button
                size='small'
                startIcon={<Visibility />}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedVendor(vendor);
                  setDetailsDialog(true);
                }}
              >
                Details
              </Button>
            </Box>
          </Box>
        </Card>
      </motion.div>
    );
  };

  // Vendor Details Component
  const VendorDetails = ({ vendor }) => {
    if (!vendor) return null;

    return (
      <Box>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label='Overview' />
          <Tab label='Performance' />
          <Tab label='Orders' />
          <Tab label='Contact' />
        </Tabs>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Vendor Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Type:
                      </Typography>
                      <Chip
                        label={VENDOR_TYPES[vendor.type]?.label}
                        sx={{
                          bgcolor: alpha(
                            VENDOR_TYPES[vendor.type]?.color || '#666',
                            0.1
                          ),
                          color: VENDOR_TYPES[vendor.type]?.color || '#666',
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Status:
                      </Typography>
                      <Chip
                        label={vendor.isActive ? 'Active' : 'Inactive'}
                        color={vendor.isActive ? 'success' : 'error'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant='body2' color='text.secondary'>
                        Description:
                      </Typography>
                      <Typography variant='body2'>
                        {VENDOR_TYPES[vendor.type]?.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Quick Stats
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Orders
                      </Typography>
                      <Typography variant='h6'>
                        {vendor.stats?.totalOrders || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Total Spent
                      </Typography>
                      <Typography variant='h6'>
                        {formatCurrency(vendor.stats?.totalSpent || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Average Order
                      </Typography>
                      <Typography variant='h6'>
                        {formatCurrency(vendor.stats?.averageOrder || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Performance Tab */}
        {activeTab === 1 && (
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={3}>
                {Object.entries(PERFORMANCE_METRICS).map(([key, metric]) => {
                  const score = vendor.performanceMetrics?.[key] || 0;
                  const MetricIcon = metric.icon;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <MetricIcon sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant='subtitle2'>
                            {metric.label}
                          </Typography>
                        </Box>
                        <Rating value={score} precision={0.1} readOnly />
                        <Typography variant='h6' color='primary'>
                          {score.toFixed(1)}/5.0
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Orders Tab */}
        {activeTab === 2 && (
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Recent Orders
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendor.recentOrders?.map(order => (
                      <TableRow key={order.id}>
                        <TableCell>PO-{order.id.slice(-6)}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>{order.itemCount} items</TableCell>
                        <TableCell>
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Chip size='small' label={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Contact Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Primary Contact
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <ContactPhone />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={vendor.contact?.name || 'No contact name'}
                        secondary={vendor.contact?.title || 'No title'}
                      />
                    </ListItem>
                    <Divider variant='inset' component='li' />
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <Email />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary='Email'
                        secondary={
                          vendor.contact?.email || vendor.email || 'No email'
                        }
                      />
                    </ListItem>
                    <Divider variant='inset' component='li' />
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <Phone />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary='Phone'
                        secondary={
                          vendor.contact?.phone || vendor.phone || 'No phone'
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Address
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <LocationOn sx={{ mt: 0.5, color: 'text.secondary' }} />
                    <Box>
                      {vendor.address?.street && (
                        <Typography variant='body2'>
                          {vendor.address.street}
                        </Typography>
                      )}
                      <Typography variant='body2'>
                        {vendor.address?.city}, {vendor.address?.state}{' '}
                        {vendor.address?.zipCode}
                      </Typography>
                      <Typography variant='body2'>
                        {vendor.address?.country}
                      </Typography>
                    </Box>
                  </Box>

                  {vendor.website && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Language sx={{ color: 'text.secondary' }} />
                      <Typography
                        variant='body2'
                        color='primary'
                        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => window.open(vendor.website, '_blank')}
                      >
                        {vendor.website}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h5'>Vendor Management</Typography>

        <Button
          startIcon={<Add />}
          variant='contained'
          onClick={() => setCreateDialog(true)}
        >
          Add Vendor
        </Button>
      </Box>

      {/* Vendors Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading vendors...</Typography>
        </Box>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant='h6' gutterBottom>
              No Vendors
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Add your first vendor to get started
            </Typography>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => setCreateDialog(true)}
            >
              Add First Vendor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {vendors.map((vendor, index) => (
            <Grid item xs={12} sm={6} lg={4} key={vendor.id}>
              <VendorCard vendor={vendor} index={index} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Vendor Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Add New Vendor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Vendor Name'
                value={newVendor.name}
                onChange={e =>
                  setNewVendor(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newVendor.type}
                  onChange={e =>
                    setNewVendor(prev => ({ ...prev, type: e.target.value }))
                  }
                  label='Type'
                >
                  {Object.entries(VENDOR_TYPES).map(([key, type]) => (
                    <MenuItem key={key} value={key}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={newVendor.email}
                onChange={e =>
                  setNewVendor(prev => ({ ...prev, email: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Phone'
                value={newVendor.phone}
                onChange={e =>
                  setNewVendor(prev => ({ ...prev, phone: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Website'
                value={newVendor.website}
                onChange={e =>
                  setNewVendor(prev => ({ ...prev, website: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Address'
                value={newVendor.address.street}
                onChange={e =>
                  setNewVendor(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='City'
                value={newVendor.address.city}
                onChange={e =>
                  setNewVendor(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='State'
                value={newVendor.address.state}
                onChange={e =>
                  setNewVendor(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='ZIP Code'
                value={newVendor.address.zipCode}
                onChange={e =>
                  setNewVendor(prev => ({
                    ...prev,
                    address: { ...prev.address, zipCode: e.target.value },
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleCreateVendor}
            disabled={!newVendor.name || !newVendor.type}
          >
            Create Vendor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vendor Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth='lg'
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: VENDOR_TYPES[selectedVendor?.type]?.color }}>
              {selectedVendor?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant='h6'>{selectedVendor?.name}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {VENDOR_TYPES[selectedVendor?.type]?.label}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <VendorDetails vendor={selectedVendor} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          <Button variant='outlined' startIcon={<Edit />}>
            Edit Vendor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorManagement;
