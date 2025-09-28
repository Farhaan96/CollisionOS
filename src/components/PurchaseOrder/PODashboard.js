import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Badge,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Checkbox,
  LinearProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import {
  ShoppingCart,
  Business,
  LocalShipping,
  Receipt,
  CheckCircle,
  Warning,
  Schedule,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Visibility,
  Edit,
  Print,
  Download,
  Add,
  FilterList,
  Sort,
  Search,
  MoreVert,
  Assignment,
  Inventory,
  Star,
  StarBorder,
  Phone,
  Email,
  Analytics,
  CompareArrows,
  Group,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * ReceivingInterface - Component for processing partial PO receiving
 */
const ReceivingInterface = ({ purchaseOrder, onReceiveComplete }) => {
  const [receivingItems, setReceivingItems] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (purchaseOrder?.items) {
      setReceivingItems(
        purchaseOrder.items.map(item => ({
          part_line_id: item.id,
          partNumber: item.partNumber,
          description: item.description,
          ordered: item.quantity,
          received: item.received || 0,
          receivedQuantity: item.quantity - (item.received || 0), // Default to remaining
          condition: 'good',
          notes: ''
        }))
      );
    }
  }, [purchaseOrder]);

  const updateReceivingItem = (partLineId, field, value) => {
    setReceivingItems(prev =>
      prev.map(item =>
        item.part_line_id === partLineId ? { ...item, [field]: value } : item
      )
    );
  };

  const processReceiving = async () => {
    setProcessing(true);
    try {
      const receivedItems = receivingItems
        .filter(item => item.receivedQuantity > 0)
        .map(item => ({
          part_line_id: item.part_line_id,
          received_quantity: item.receivedQuantity,
          condition: item.condition,
          notes: item.notes
        }));

      // Simulate API call to backend
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received_items: receivedItems })
      });

      const result = await response.json();

      if (result.success) {
        onReceiveComplete(result.data);
      } else {
        console.error('Receiving failed:', result.message);
      }
    } catch (error) {
      console.error('Receiving error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Items to Receive
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Part Number</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align='center'>Ordered</TableCell>
              <TableCell align='center'>Previously Received</TableCell>
              <TableCell align='center'>Receiving Now</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {receivingItems.map((item) => (
              <TableRow key={item.part_line_id}>
                <TableCell>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {item.partNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2'>
                    {item.description}
                  </Typography>
                </TableCell>
                <TableCell align='center'>
                  <Chip label={item.ordered} size='small' />
                </TableCell>
                <TableCell align='center'>
                  <Chip label={item.received} size='small' color='success' />
                </TableCell>
                <TableCell align='center'>
                  <TextField
                    type='number'
                    size='small'
                    value={item.receivedQuantity}
                    onChange={(e) => updateReceivingItem(item.part_line_id, 'receivedQuantity', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: item.ordered * 2 }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <FormControl size='small' sx={{ minWidth: 120 }}>
                    <Select
                      value={item.condition}
                      onChange={(e) => updateReceivingItem(item.part_line_id, 'condition', e.target.value)}
                    >
                      <MenuItem value='good'>Good</MenuItem>
                      <MenuItem value='damaged'>Damaged</MenuItem>
                      <MenuItem value='wrong_part'>Wrong Part</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField
                    size='small'
                    placeholder='Notes...'
                    value={item.notes}
                    onChange={(e) => updateReceivingItem(item.part_line_id, 'notes', e.target.value)}
                    sx={{ width: 120 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant='outlined'
          onClick={() => onReceiveComplete(null)}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={processReceiving}
          disabled={processing || receivingItems.every(item => item.receivedQuantity === 0)}
          startIcon={processing ? <Schedule /> : <CheckCircle />}
        >
          {processing ? 'Processing...' : 'Process Receipt'}
        </Button>
      </Box>
    </Box>
  );
};

/**
 * PODashboard - Advanced Purchase Order Management System
 * Complete vendor and purchasing workflow
 */
const PODashboard = ({ className, ...props }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState(0);
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showReceiving, setShowReceiving] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('poNumber');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Mock PO data
  const mockPOs = [
    {
      id: 'PO-2024-0156',
      poNumber: 'PO-2024-0156',
      vendor: {
        id: 'VENDOR-001',
        name: 'Toyota Parts Direct',
        rating: 4.8,
        phone: '(555) 234-5678',
        email: 'orders@toyotaparts.com',
        terms: 'Net 30',
        discount: 12.5,
      },
      status: 'ordered',
      createdDate: '2024-08-20',
      expectedDelivery: '2024-08-25',
      totalAmount: 1245.0,
      itemsCount: 8,
      receivedItems: 0,
      roNumber: 'RO-2024-001234',
      items: [
        {
          id: 'ITEM-001',
          partNumber: '53101-06180',
          description: 'Hood Assembly',
          quantity: 1,
          unitPrice: 450.0,
          totalPrice: 450.0,
          received: 0,
          backOrdered: 0,
        },
        {
          id: 'ITEM-002',
          partNumber: '53111-06050',
          description: 'Front Bumper Cover',
          quantity: 1,
          unitPrice: 320.0,
          totalPrice: 320.0,
          received: 0,
          backOrdered: 0,
        },
      ],
    },
    {
      id: 'PO-2024-0157',
      poNumber: 'PO-2024-0157',
      vendor: {
        id: 'VENDOR-002',
        name: 'Auto Parts Warehouse',
        rating: 4.5,
        phone: '(555) 345-6789',
        email: 'sales@apw.com',
        terms: 'Net 15',
        discount: 8.0,
      },
      status: 'partial',
      createdDate: '2024-08-18',
      expectedDelivery: '2024-08-24',
      totalAmount: 890.5,
      itemsCount: 12,
      receivedItems: 7,
      roNumber: 'RO-2024-001235',
      items: [],
    },
    {
      id: 'PO-2024-0158',
      poNumber: 'PO-2024-0158',
      vendor: {
        id: 'VENDOR-003',
        name: 'OEM Parts Supply',
        rating: 4.9,
        phone: '(555) 456-7890',
        email: 'orders@oemparts.com',
        terms: 'Net 30',
        discount: 15.0,
      },
      status: 'received',
      createdDate: '2024-08-15',
      expectedDelivery: '2024-08-22',
      actualDelivery: '2024-08-21',
      totalAmount: 2150.75,
      itemsCount: 15,
      receivedItems: 15,
      roNumber: 'RO-2024-001236',
      items: [],
    },
  ];

  // Mock vendor data
  const mockVendors = [
    {
      id: 'VENDOR-001',
      name: 'Toyota Parts Direct',
      rating: 4.8,
      phone: '(555) 234-5678',
      email: 'orders@toyotaparts.com',
      address: '123 Industrial Blvd, Manufacturing City, ST 12345',
      terms: 'Net 30',
      discount: 12.5,
      leadTime: 3,
      fillRate: 95.2,
      totalOrders: 45,
      totalSpent: 125000.0,
      lastOrderDate: '2024-08-20',
      specialties: ['Toyota', 'Lexus', 'OEM Parts'],
      performance: {
        onTimeDelivery: 94.5,
        qualityRating: 4.8,
        responseTime: 2.1,
        returnRate: 1.2,
      },
    },
    {
      id: 'VENDOR-002',
      name: 'Auto Parts Warehouse',
      rating: 4.5,
      phone: '(555) 345-6789',
      email: 'sales@apw.com',
      address: '456 Commerce Park, Supply City, ST 54321',
      terms: 'Net 15',
      discount: 8.0,
      leadTime: 2,
      fillRate: 88.7,
      totalOrders: 78,
      totalSpent: 89500.0,
      lastOrderDate: '2024-08-18',
      specialties: ['Aftermarket', 'Performance', 'Universal'],
      performance: {
        onTimeDelivery: 89.3,
        qualityRating: 4.5,
        responseTime: 1.8,
        returnRate: 3.1,
      },
    },
  ];

  // Load data
  useEffect(() => {
    setPOs(mockPOs);
    setVendors(mockVendors);
  }, []);

  // Filter and sort POs
  const filteredPOs = useMemo(() => {
    let filtered = [...pos];

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.status === statusFilter);
    }
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(po => po.vendor.id === vendorFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        po =>
          po.poNumber.toLowerCase().includes(term) ||
          po.vendor.name.toLowerCase().includes(term) ||
          po.roNumber.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'poNumber':
          aVal = a.poNumber;
          bVal = b.poNumber;
          break;
        case 'vendor':
          aVal = a.vendor.name;
          bVal = b.vendor.name;
          break;
        case 'amount':
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case 'createdDate':
          aVal = new Date(a.createdDate);
          bVal = new Date(b.createdDate);
          break;
        case 'expectedDelivery':
          aVal = new Date(a.expectedDelivery);
          bVal = new Date(b.expectedDelivery);
          break;
        default:
          aVal = a.poNumber;
          bVal = b.poNumber;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [pos, statusFilter, vendorFilter, searchTerm, sortBy, sortOrder]);

  // Handle PO actions
  const handlePOAction = useCallback(
    (action, po) => {
      switch (action) {
        case 'view':
          navigate(`/purchase-orders/${po.id}`);
          break;
        case 'edit':
          console.log('Edit PO:', po);
          break;
        case 'receive':
          setSelectedPO(po);
          setShowReceiving(true);
          break;
        case 'print':
          window.print();
          break;
        case 'email':
          window.open(
            `mailto:${po.vendor.email}?subject=Purchase Order ${po.poNumber}`
          );
          break;
        default:
          console.log(`Action ${action} for PO:`, po);
      }
    },
    [navigate]
  );

  // Get status color
  const getStatusColor = status => {
    switch (status) {
      case 'ordered':
        return 'primary';
      case 'partial':
        return 'warning';
      case 'received':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'backordered':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = status => {
    switch (status) {
      case 'ordered':
        return <Schedule />;
      case 'partial':
        return <Warning />;
      case 'received':
        return <CheckCircle />;
      case 'cancelled':
        return <Warning />;
      case 'backordered':
        return <LocalShipping />;
      default:
        return <Receipt />;
    }
  };

  // Render PO overview cards
  const renderPOOverview = () => {
    const stats = {
      total: pos.length,
      ordered: pos.filter(po => po.status === 'ordered').length,
      partial: pos.filter(po => po.status === 'partial').length,
      received: pos.filter(po => po.status === 'received').length,
      totalValue: pos.reduce((sum, po) => sum + po.totalAmount, 0),
    };

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h4' color='primary' sx={{ fontWeight: 600 }}>
                {stats.total}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total POs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant='h4'
                color='warning.main'
                sx={{ fontWeight: 600 }}
              >
                {stats.ordered}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Ordered
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant='h4'
                color='info.main'
                sx={{ fontWeight: 600 }}
              >
                {stats.partial}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Partial
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant='h4'
                color='success.main'
                sx={{ fontWeight: 600 }}
              >
                {stats.received}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant='h5' color='primary' sx={{ fontWeight: 600 }}>
                ${stats.totalValue.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render PO table
  const renderPOTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>PO Number</TableCell>
            <TableCell>Vendor</TableCell>
            <TableCell>RO Number</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align='right'>Items</TableCell>
            <TableCell align='right'>Total</TableCell>
            <TableCell>Expected</TableCell>
            <TableCell align='center'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPOs
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map(po => (
              <TableRow key={po.id} hover>
                <TableCell>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                    {po.poNumber}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {po.createdDate}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {po.vendor.name}
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Star fontSize='small' color='primary' />
                        <Typography variant='caption'>
                          {po.vendor.rating}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant='body2'>{po.roNumber}</Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    icon={getStatusIcon(po.status)}
                    label={po.status.replace('_', ' ')}
                    color={getStatusColor(po.status)}
                    size='small'
                  />
                  {po.status === 'partial' && (
                    <LinearProgress
                      variant='determinate'
                      value={(po.receivedItems / po.itemsCount) * 100}
                      sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                    />
                  )}
                </TableCell>

                <TableCell align='right'>
                  <Typography variant='body2'>
                    {po.receivedItems}/{po.itemsCount}
                  </Typography>
                </TableCell>

                <TableCell align='right'>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    ${po.totalAmount.toLocaleString()}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant='body2'>{po.expectedDelivery}</Typography>
                </TableCell>

                <TableCell align='center'>
                  <Tooltip title='View Details'>
                    <IconButton
                      size='small'
                      onClick={() => handlePOAction('view', po)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Receive Items'>
                    <IconButton
                      size='small'
                      onClick={() => handlePOAction('receive', po)}
                      disabled={po.status === 'received'}
                    >
                      <ShoppingCart />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size='small'
                    onClick={e => {
                      setMenuAnchor(e.currentTarget);
                      setSelectedPO(po);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={filteredPOs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={event => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </TableContainer>
  );

  // Render analytics dashboard with vendor KPIs
  const renderAnalyticsDashboard = () => {
    const analytics = calculateAnalytics();

    return (
      <Box>
        <Typography variant='h6' gutterBottom>
          Purchase Analytics & Vendor Performance
        </Typography>

        {/* Overall KPI Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='primary' sx={{ fontWeight: 600 }}>
                  ${analytics.totalSpend.toLocaleString()}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Spend
                </Typography>
                <Typography variant='caption' color='success.main'>
                  +{analytics.spendGrowth}% vs last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='warning.main' sx={{ fontWeight: 600 }}>
                  {analytics.avgLeadTime}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Avg Lead Time (days)
                </Typography>
                <Typography variant='caption' color='error.main'>
                  +0.5 days vs target
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='success.main' sx={{ fontWeight: 600 }}>
                  {analytics.avgFillRate}%
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Overall Fill Rate
                </Typography>
                <Typography variant='caption' color='success.main'>
                  Above 90% target
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant='h4' color='info.main' sx={{ fontWeight: 600 }}>
                  {analytics.activeVendors}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Active Vendors
                </Typography>
                <Typography variant='caption' color='info.main'>
                  {analytics.preferredVendors} preferred
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Vendor Performance Comparison */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Vendor Performance Scorecard
                </Typography>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Vendor</TableCell>
                        <TableCell align='center'>Fill Rate</TableCell>
                        <TableCell align='center'>On-Time %</TableCell>
                        <TableCell align='center'>Avg Lead Time</TableCell>
                        <TableCell align='center'>Return Rate</TableCell>
                        <TableCell align='center'>Overall Score</TableCell>
                        <TableCell align='center'>Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vendors.map(vendor => {
                        const score = calculateVendorScore(vendor);
                        return (
                          <TableRow key={vendor.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  <Business />
                                </Avatar>
                                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                  {vendor.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={`${vendor.fillRate}%`}
                                size='small'
                                color={vendor.fillRate >= 95 ? 'success' : vendor.fillRate >= 90 ? 'warning' : 'error'}
                              />
                            </TableCell>
                            <TableCell align='center'>
                              <Chip
                                label={`${vendor.performance.onTimeDelivery}%`}
                                size='small'
                                color={vendor.performance.onTimeDelivery >= 95 ? 'success' : vendor.performance.onTimeDelivery >= 90 ? 'warning' : 'error'}
                              />
                            </TableCell>
                            <TableCell align='center'>
                              <Typography variant='body2'>
                                {vendor.leadTime} days
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Typography variant='body2' color={vendor.performance.returnRate <= 2 ? 'success.main' : 'error.main'}>
                                {vendor.performance.returnRate}%
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                  {score.toFixed(1)}
                                </Typography>
                                {score >= 90 ? (
                                  <Star fontSize='small' color='warning' />
                                ) : score >= 80 ? (
                                  <Star fontSize='small' color='action' />
                                ) : (
                                  <StarBorder fontSize='small' color='action' />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align='center'>
                              {score >= 85 ? (
                                <TrendingUp fontSize='small' color='success' />
                              ) : (
                                <TrendingDown fontSize='small' color='error' />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Spend Distribution
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {vendors.map((vendor, index) => {
                    const percentage = (vendor.totalSpent / analytics.totalSpend) * 100;
                    return (
                      <Box key={vendor.id} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant='body2'>{vendor.name}</Typography>
                          <Typography variant='body2'>{percentage.toFixed(1)}%</Typography>
                        </Box>
                        <LinearProgress
                          variant='determinate'
                          value={percentage}
                          sx={{ height: 8, borderRadius: 4 }}
                          color={index % 2 === 0 ? 'primary' : 'secondary'}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Key Performance Indicators */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Performance Trends
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Monthly Performance Indicators
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='body2'>Fill Rate Target (95%)</Typography>
                    <LinearProgress
                      variant='determinate'
                      value={analytics.avgFillRate}
                      sx={{ width: '60%', mr: 1 }}
                      color={analytics.avgFillRate >= 95 ? 'success' : 'warning'}
                    />
                    <Typography variant='body2'>{analytics.avgFillRate}%</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='body2'>On-Time Delivery (90%)</Typography>
                    <LinearProgress
                      variant='determinate'
                      value={analytics.avgOnTimeDelivery}
                      sx={{ width: '60%', mr: 1 }}
                      color={analytics.avgOnTimeDelivery >= 90 ? 'success' : 'warning'}
                    />
                    <Typography variant='body2'>{analytics.avgOnTimeDelivery}%</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='body2'>Quality Rating (4.5+)</Typography>
                    <LinearProgress
                      variant='determinate'
                      value={(analytics.avgQualityRating / 5) * 100}
                      sx={{ width: '60%', mr: 1 }}
                      color={analytics.avgQualityRating >= 4.5 ? 'success' : 'warning'}
                    />
                    <Typography variant='body2'>{analytics.avgQualityRating}/5</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Vendor Recommendations
                </Typography>
                <Box>
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Based on performance analysis
                  </Typography>

                  {analytics.recommendations.map((rec, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 1,
                        p: 1,
                        bgcolor: rec.type === 'success' ? 'success.light' : rec.type === 'warning' ? 'warning.light' : 'error.light',
                        borderRadius: 1,
                        opacity: 0.1
                      }}
                    >
                      {rec.type === 'success' ? (
                        <CheckCircle fontSize='small' color='success' />
                      ) : rec.type === 'warning' ? (
                        <Warning fontSize='small' color='warning' />
                      ) : (
                        <Warning fontSize='small' color='error' />
                      )}
                      <Typography variant='body2'>{rec.message}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Calculate analytics data
  const calculateAnalytics = () => {
    const totalSpend = vendors.reduce((sum, v) => sum + v.totalSpent, 0);
    const avgFillRate = vendors.reduce((sum, v) => sum + v.fillRate, 0) / vendors.length;
    const avgLeadTime = vendors.reduce((sum, v) => sum + v.leadTime, 0) / vendors.length;
    const avgOnTimeDelivery = vendors.reduce((sum, v) => sum + v.performance.onTimeDelivery, 0) / vendors.length;
    const avgQualityRating = vendors.reduce((sum, v) => sum + v.performance.qualityRating, 0) / vendors.length;

    const recommendations = [
      {
        type: 'success',
        message: `${vendors.filter(v => v.fillRate >= 95).length} vendors meeting fill rate targets`
      },
      {
        type: 'warning',
        message: `Consider negotiating better terms with high-spend vendors`
      },
      {
        type: 'info',
        message: `Diversify supplier base to reduce lead time dependencies`
      }
    ];

    return {
      totalSpend,
      avgFillRate: Math.round(avgFillRate * 10) / 10,
      avgLeadTime: Math.round(avgLeadTime * 10) / 10,
      avgOnTimeDelivery: Math.round(avgOnTimeDelivery * 10) / 10,
      avgQualityRating: Math.round(avgQualityRating * 10) / 10,
      activeVendors: vendors.length,
      preferredVendors: vendors.filter(v => v.rating >= 4.5).length,
      spendGrowth: 12.5, // Mock growth percentage
      recommendations
    };
  };

  // Calculate vendor performance score
  const calculateVendorScore = (vendor) => {
    const fillRateScore = vendor.fillRate;
    const onTimeScore = vendor.performance.onTimeDelivery;
    const qualityScore = (vendor.performance.qualityRating / 5) * 100;
    const returnPenalty = vendor.performance.returnRate * 5; // Penalty for returns

    return Math.max(0, (fillRateScore * 0.3 + onTimeScore * 0.3 + qualityScore * 0.25 - returnPenalty * 0.15));
  };

  // Render vendor performance dashboard
  const renderVendorDashboard = () => (
    <Grid container spacing={3}>
      {vendors.map(vendor => (
        <Grid item xs={12} md={6} lg={4} key={vendor.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {vendor.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star fontSize='small' color='primary' />
                    <Typography variant='body2'>{vendor.rating}/5</Typography>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Fill Rate
                  </Typography>
                  <Typography variant='h6' color='primary'>
                    {vendor.fillRate}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Lead Time
                  </Typography>
                  <Typography variant='h6' color='primary'>
                    {vendor.leadTime} days
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    On-Time Delivery
                  </Typography>
                  <Typography variant='h6' color='success.main'>
                    {vendor.performance.onTimeDelivery}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='caption' color='text.secondary'>
                    Total Orders
                  </Typography>
                  <Typography variant='h6'>{vendor.totalOrders}</Typography>
                </Grid>
              </Grid>

              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                Specialties: {vendor.specialties.join(', ')}
              </Typography>

              <Typography variant='body2' color='text.secondary'>
                Total Spent: ${vendor.totalSpent.toLocaleString()}
              </Typography>
            </CardContent>

            <CardActions>
              <Button size='small' startIcon={<Phone />}>
                Call
              </Button>
              <Button size='small' startIcon={<Email />}>
                Email
              </Button>
              <Button size='small' startIcon={<Analytics />}>
                Reports
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box className={className} {...props}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          Purchase Order Management
        </Typography>

        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setShowCreatePO(true)}
        >
          Create PO
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons='auto'
        >
          <Tab icon={<Receipt />} label='Purchase Orders' />
          <Tab icon={<Business />} label='Vendors' />
          <Tab icon={<Analytics />} label='Analytics' />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {renderPOOverview()}

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Search POs...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label='Status'
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value='all'>All Status</MenuItem>
                    <MenuItem value='ordered'>Ordered</MenuItem>
                    <MenuItem value='partial'>Partial</MenuItem>
                    <MenuItem value='received'>Received</MenuItem>
                    <MenuItem value='cancelled'>Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={vendorFilter}
                    label='Vendor'
                    onChange={e => setVendorFilter(e.target.value)}
                  >
                    <MenuItem value='all'>All Vendors</MenuItem>
                    {vendors.map(vendor => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {renderPOTable()}
        </Box>
      )}

      {activeTab === 1 && renderVendorDashboard()}

      {activeTab === 2 && renderAnalyticsDashboard()}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => handlePOAction('edit', selectedPO)}>
          <Edit sx={{ mr: 1 }} fontSize='small' />
          Edit PO
        </MenuItem>
        <MenuItem onClick={() => handlePOAction('print', selectedPO)}>
          <Print sx={{ mr: 1 }} fontSize='small' />
          Print PO
        </MenuItem>
        <MenuItem onClick={() => handlePOAction('email', selectedPO)}>
          <Email sx={{ mr: 1 }} fontSize='small' />
          Email to Vendor
        </MenuItem>
      </Menu>

      {/* Create PO Dialog */}
      <Dialog
        open={showCreatePO}
        onClose={() => setShowCreatePO(false)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>Create New Purchase Order</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 2 }}>
            Multi-step PO creation workflow will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreatePO(false)}>Cancel</Button>
          <Button variant='contained'>Create PO</Button>
        </DialogActions>
      </Dialog>

      {/* Receiving Dialog */}
      <Dialog
        open={showReceiving}
        onClose={() => setShowReceiving(false)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Receipt />
            <Box>
              <Typography variant='h6'>
                Receive Items - {selectedPO?.poNumber}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {selectedPO?.vendor?.name} • Expected: {selectedPO?.expectedDelivery}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <ReceivingInterface
            purchaseOrder={selectedPO}
            onReceiveComplete={(result) => {
              setShowReceiving(false);
              // Refresh PO data after receiving
              setPOs(prevPOs =>
                prevPOs.map(po =>
                  po.id === selectedPO.id
                    ? { ...po, status: result.po_status, receivedItems: po.itemsCount }
                    : po
                )
              );
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color='primary'
          aria-label='create po'
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowCreatePO(true)}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default PODashboard;
