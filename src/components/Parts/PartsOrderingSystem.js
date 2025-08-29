import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tooltip,
  Badge,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add,
  ShoppingCart,
  LocalShipping,
  Print,
  Email,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  Warning,
  Info,
  Phone,
  LocationOn,
  Star,
  Timeline,
  Assignment,
  Receipt
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { partsService } from '../../services/partsService';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Order status configuration
const ORDER_STATUSES = {
  draft: { label: 'Draft', color: '#9e9e9e', icon: Edit },
  pending: { label: 'Pending', color: '#ff9800', icon: Schedule },
  approved: { label: 'Approved', color: '#2196f3', icon: CheckCircle },
  ordered: { label: 'Ordered', color: '#673ab7', icon: ShoppingCart },
  shipped: { label: 'Shipped', color: '#03a9f4', icon: LocalShipping },
  received: { label: 'Received', color: '#4caf50', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#f44336', icon: Warning }
};

// Supplier configuration
const SUPPLIERS = {
  oem_direct: { name: 'OEM Direct', type: 'OEM', color: '#1976d2', rating: 4.8 },
  oe_connection: { name: 'OE Connection', type: 'OEM', color: '#2e7d32', rating: 4.6 },
  parts_trader: { name: 'PartsTrader', type: 'Aftermarket', color: '#ed6c02', rating: 4.4 },
  lkq: { name: 'LKQ/Recycled', type: 'Recycled', color: '#388e3c', rating: 4.2 },
  remanufactured: { name: 'Remanufactured Pro', type: 'Remanufactured', color: '#7b1fa2', rating: 4.5 }
};

const PartsOrderingSystem = ({ onOrdersChange }) => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [createOrderDialog, setCreateOrderDialog] = useState(false);
  const [orderDetailsDialog, setOrderDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const [newOrder, setNewOrder] = useState({
    supplierId: '',
    expectedDelivery: null,
    priority: 'normal',
    notes: '',
    parts: []
  });

  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalValue: 0
  });

  // Load orders data
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partsService.getPurchaseOrders({
        include_vendor: true,
        include_parts: true
      });
      setOrders(data);
      
      // Calculate stats
      const stats = {
        totalOrders: data.length,
        pendingOrders: data.filter(order => ['pending', 'approved', 'ordered'].includes(order.status)).length,
        shippedOrders: data.filter(order => ['shipped', 'received'].includes(order.status)).length,
        totalValue: data.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      };
      setOrderStats(stats);
      
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Create new purchase order
  const handleCreateOrder = async () => {
    if (!newOrder.supplierId || newOrder.parts.length === 0) return;

    try {
      const orderData = {
        ...newOrder,
        totalAmount: newOrder.parts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0),
        itemCount: newOrder.parts.length,
        orderDate: new Date().toISOString(),
        status: 'draft'
      };

      await partsService.createPurchaseOrder(orderData);
      setCreateOrderDialog(false);
      setNewOrder({ supplierId: '', expectedDelivery: null, priority: 'normal', notes: '', parts: [] });
      setActiveStep(0);
      loadOrders();
      
      if (onOrdersChange) onOrdersChange();
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  // Update order status
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await partsService.updatePurchaseOrder(orderId, { status: newStatus });
      loadOrders();
      
      if (onOrdersChange) onOrdersChange();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  // Order Steps for creation wizard
  const orderCreationSteps = [
    {
      label: 'Select Supplier',
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={newOrder.supplierId}
                onChange={(e) => setNewOrder(prev => ({ ...prev, supplierId: e.target.value }))}
                label="Supplier"
              >
                {Object.entries(SUPPLIERS).map(([key, supplier]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: supplier.color }}>
                        {supplier.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{supplier.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {supplier.type} • ★ {supplier.rating}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newOrder.priority}
                onChange={(e) => setNewOrder(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Expected Delivery"
              value={newOrder.expectedDelivery}
              onChange={(date) => setNewOrder(prev => ({ ...prev, expectedDelivery: date }))}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newOrder.notes}
              onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Add Parts',
      content: (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Order Items</Typography>
            <Button
              startIcon={<Add />}
              onClick={() => {
                // Open parts search dialog
              }}
            >
              Add Parts
            </Button>
          </Box>
          
          {newOrder.parts.length === 0 ? (
            <Alert severity="info">No parts selected. Use the "Add Parts" button to add items to this order.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Part Number</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newOrder.parts.map((part, index) => (
                    <TableRow key={index}>
                      <TableCell>{part.partNumber}</TableCell>
                      <TableCell>{part.description}</TableCell>
                      <TableCell>{part.quantity}</TableCell>
                      <TableCell>{formatCurrency(part.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(part.quantity * part.unitPrice)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setNewOrder(prev => ({
                              ...prev,
                              parts: prev.parts.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )
    },
    {
      label: 'Review & Submit',
      content: (
        <Box>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Order Summary</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Supplier:</Typography>
                  <Typography variant="body2">{SUPPLIERS[newOrder.supplierId]?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Priority:</Typography>
                  <Chip size="small" label={newOrder.priority.toUpperCase()} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Items:</Typography>
                  <Typography variant="body2">{newOrder.parts.length} parts</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(newOrder.parts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0))}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {newOrder.parts.length === 0 && (
            <Alert severity="warning">Please add at least one part to the order.</Alert>
          )}
        </Box>
      )
    }
  ];

  // Order Card Component
  const OrderCard = ({ order, index }) => {
    const status = ORDER_STATUSES[order.status];
    const supplier = SUPPLIERS[order.supplierId];
    const StatusIcon = status?.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card
          sx={{
            cursor: 'pointer',
            '&:hover': {
              boxShadow: theme.shadows[4],
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease'
            }
          }}
          onClick={() => {
            setSelectedOrder(order);
            setOrderDetailsDialog(true);
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  PO-{order.id?.slice(-6) || 'DRAFT'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {supplier?.name}
                </Typography>
              </Box>
              <Chip
                icon={StatusIcon ? <StatusIcon sx={{ fontSize: 16 }} /> : undefined}
                label={status?.label}
                sx={{
                  bgcolor: alpha(status?.color || '#666', 0.1),
                  color: status?.color || '#666',
                  fontWeight: 600
                }}
              />
            </Box>

            <Typography variant="h4" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
              {formatCurrency(order.totalAmount || 0)}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {order.itemCount || 0} items • {formatDate(order.orderDate)}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {order.priority === 'urgent' && (
                  <Chip size="small" label="URGENT" color="error" />
                )}
                {order.priority === 'high' && (
                  <Chip size="small" label="HIGH" color="warning" />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setOrderDetailsDialog(true);
                    }}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print PO">
                  <IconButton size="small">
                    <Print />
                  </IconButton>
                </Tooltip>
                {order.status === 'draft' && (
                  <Tooltip title="Edit">
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Stats Card Component
  const StatsCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: color,
              color: 'white',
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Purchase Orders</Typography>
        
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => setCreateOrderDialog(true)}
        >
          Create Order
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Orders"
            value={orderStats.totalOrders}
            subtitle="This month"
            icon={<Receipt />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending"
            value={orderStats.pendingOrders}
            subtitle="Need attention"
            icon={<Schedule />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="In Transit"
            value={orderStats.shippedOrders}
            subtitle="On the way"
            icon={<LocalShipping />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Value"
            value={formatCurrency(orderStats.totalValue)}
            subtitle="All orders"
            icon={<Timeline />}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Orders Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No Purchase Orders</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create your first purchase order to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateOrderDialog(true)}
            >
              Create First Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order, index) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <OrderCard order={order} index={index} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Order Dialog */}
      <Dialog
        open={createOrderDialog}
        onClose={() => setCreateOrderDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: '600px' } }}
      >
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
            {orderCreationSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  {step.content}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (index === orderCreationSteps.length - 1) {
                          handleCreateOrder();
                        } else {
                          setActiveStep(prev => prev + 1);
                        }
                      }}
                      disabled={
                        (index === 0 && !newOrder.supplierId) ||
                        (index === 1 && newOrder.parts.length === 0) ||
                        (index === 2 && newOrder.parts.length === 0)
                      }
                      sx={{ mr: 1 }}
                    >
                      {index === orderCreationSteps.length - 1 ? 'Create Order' : 'Next'}
                    </Button>
                    {index > 0 && (
                      <Button onClick={() => setActiveStep(prev => prev - 1)}>
                        Back
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOrderDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog
        open={orderDetailsDialog}
        onClose={() => setOrderDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Order Details - PO-{selectedOrder?.id?.slice(-6)}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Order Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Status:</Typography>
                          <Chip
                            label={ORDER_STATUSES[selectedOrder.status]?.label}
                            color={selectedOrder.status === 'received' ? 'success' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Priority:</Typography>
                          <Typography variant="body2">{selectedOrder.priority?.toUpperCase()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Order Date:</Typography>
                          <Typography variant="body2">{formatDate(selectedOrder.orderDate)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Expected Delivery:</Typography>
                          <Typography variant="body2">
                            {selectedOrder.expectedDelivery ? formatDate(selectedOrder.expectedDelivery) : 'Not specified'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button startIcon={<Print />} size="small" fullWidth>
                          Print PO
                        </Button>
                        <Button startIcon={<Email />} size="small" fullWidth>
                          Email Supplier
                        </Button>
                        {selectedOrder.status !== 'received' && (
                          <Button
                            startIcon={<CheckCircle />}
                            size="small"
                            fullWidth
                            color="success"
                            onClick={() => handleStatusUpdate(selectedOrder.id, 'received')}
                          >
                            Mark as Received
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Order Items Table */}
              {selectedOrder.parts && selectedOrder.parts.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Order Items</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Part Number</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.parts.map((part, index) => (
                          <TableRow key={index}>
                            <TableCell>{part.partNumber}</TableCell>
                            <TableCell>{part.description}</TableCell>
                            <TableCell>{part.quantity}</TableCell>
                            <TableCell>{formatCurrency(part.unitPrice)}</TableCell>
                            <TableCell>{formatCurrency(part.quantity * part.unitPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartsOrderingSystem;