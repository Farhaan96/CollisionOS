import React, { useState, useEffect, useRef } from 'react';
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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Switch,
  Checkbox,
  useTheme,
  alpha,
} from '@mui/material';

// Import new components
import PartsSearchDialog from './PartsSearchDialog';
import PartsInventoryManager from './PartsInventoryManager';
import PartsOrderingSystem from './PartsOrderingSystem';
import VendorManagement from './VendorManagement';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  LocalShipping,
  Inventory,
  ShoppingCart,
  QrCode,
  Barcode,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Compare,
  AttachMoney,
  Refresh,
  Download,
  Upload,
  Print,
  Build,
  DirectionsCar,
  Settings,
  Store,
  ExpandMore,
  Visibility,
  Phone,
  Email,
  LocationOn,
  Star,
  TrendingUp,
  TrendingDown,
  PhotoCamera,
  Assignment,
  History,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { partsService } from '../../services/partsService';

// Parts suppliers based on Instructions document
const PARTS_SUPPLIERS = {
  oem_direct: {
    name: 'OEM Direct',
    type: 'OEM',
    color: '#1976d2',
    icon: '🏭',
    features: ['Genuine Parts', 'Warranty', 'Quality Guaranteed'],
    rating: 4.8,
    deliveryTime: '2-5 days',
  },
  oe_connection: {
    name: 'OE Connection',
    type: 'OEM',
    color: '#2e7d32',
    icon: '🔗',
    features: ['OEM Network', 'Real-time Pricing', 'Multi-brand'],
    rating: 4.6,
    deliveryTime: '1-3 days',
  },
  parts_trader: {
    name: 'PartsTrader',
    type: 'Aftermarket',
    color: '#ed6c02',
    icon: '🛒',
    features: ['Competitive Pricing', 'Wide Selection', 'Quality Aftermarket'],
    rating: 4.4,
    deliveryTime: '1-2 days',
  },
  lkq: {
    name: 'LKQ/Recycled',
    type: 'Recycled',
    color: '#388e3c',
    icon: '♻️',
    features: ['Eco-friendly', 'Cost Effective', 'Quality Tested'],
    rating: 4.2,
    deliveryTime: '1-4 days',
  },
  remanufactured: {
    name: 'Remanufactured Pro',
    type: 'Remanufactured',
    color: '#7b1fa2',
    icon: '🔧',
    features: ['Like New', 'Warranty Included', 'Quality Assured'],
    rating: 4.5,
    deliveryTime: '3-7 days',
  },
};

// Part categories
const PART_CATEGORIES = {
  body: { label: 'Body Parts', icon: DirectionsCar, color: '#1976d2' },
  mechanical: { label: 'Mechanical', icon: Build, color: '#f57c00' },
  electrical: { label: 'Electrical', icon: Settings, color: '#7b1fa2' },
  interior: { label: 'Interior', icon: Assignment, color: '#d32f2f' },
  glass: { label: 'Glass', icon: Visibility, color: '#1565c0' },
  consumables: { label: 'Consumables', icon: Inventory, color: '#2e7d32' },
};

// Part statuses
const PART_STATUSES = {
  needed: { label: 'Needed', color: '#f44336', icon: Warning },
  ordered: { label: 'Ordered', color: '#ff9800', icon: ShoppingCart },
  shipped: { label: 'Shipped', color: '#2196f3', icon: LocalShipping },
  received: { label: 'Received', color: '#4caf50', icon: CheckCircle },
  installed: { label: 'Installed', color: '#9c27b0', icon: Build },
  returned: { label: 'Returned', color: '#607d8b', icon: Error },
};

const PartsManagementSystem = ({ jobId, onPartsUpdate }) => {
  const theme = useTheme();
  const barcodeRef = useRef();

  const [activeTab, setActiveTab] = useState(0);
  const [parts, setParts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);
  const [priceComparisonDialog, setPriceComparisonDialog] = useState(false);
  const [inventoryDialog, setInventoryDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState(false);

  // Sample parts data
  const sampleParts = [
    {
      id: '1',
      jobId: 'JOB-001',
      partNumber: 'TOY-52119-06903',
      description: 'Front Bumper Cover',
      category: 'body',
      quantity: 1,
      status: 'ordered',
      estimatedCost: 450.0,
      actualCost: 425.0,
      supplier: 'oem_direct',
      orderDate: '2024-01-15',
      estimatedDelivery: '2024-01-18',
      actualDelivery: null,
      warranty: '24 months',
      damageLineId: 'DL-001',
    },
    {
      id: '2',
      jobId: 'JOB-001',
      partNumber: 'TOY-81130-06861',
      description: 'Right Headlight Assembly',
      category: 'electrical',
      quantity: 1,
      status: 'received',
      estimatedCost: 380.0,
      actualCost: 365.0,
      supplier: 'oe_connection',
      orderDate: '2024-01-14',
      estimatedDelivery: '2024-01-17',
      actualDelivery: '2024-01-16',
      warranty: '12 months',
      damageLineId: 'DL-002',
    },
  ];

  // Sample inventory data
  const sampleInventory = [
    {
      id: '1',
      partNumber: 'UNIV-PAINT-001',
      description: 'Basecoat Paint - White',
      category: 'consumables',
      currentStock: 15,
      minStock: 5,
      maxStock: 30,
      unitCost: 45.0,
      location: 'Paint Room - Shelf A',
      lastUpdated: '2024-01-16',
      supplier: 'parts_trader',
    },
    {
      id: '2',
      partNumber: 'UNIV-SAND-400',
      description: 'Sandpaper 400 Grit',
      category: 'consumables',
      currentStock: 8,
      minStock: 10,
      maxStock: 50,
      unitCost: 12.0,
      location: 'Supply Room - Bin 3',
      lastUpdated: '2024-01-15',
      supplier: 'parts_trader',
    },
  ];

  useEffect(() => {
    setParts(sampleParts);
    setInventory(sampleInventory);
    loadPartsData();
  }, []);

  // Load parts data from service
  const loadPartsData = async () => {
    setLoading(true);
    try {
      const [partsData, inventoryData, ordersData] = await Promise.all([
        partsService.getAllParts({ jobId }),
        partsService.getInventoryStatus(),
        partsService.getPurchaseOrders(),
      ]);

      setParts(partsData || sampleParts);
      setInventory(inventoryData || sampleInventory);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Failed to load parts data:', error);
      // Fallback to sample data
      setParts(sampleParts);
      setInventory(sampleInventory);
    } finally {
      setLoading(false);
    }
  };

  // Handle parts updates
  const handlePartsChange = () => {
    loadPartsData();
    if (onPartsUpdate) onPartsUpdate();
  };

  // Handle adding parts from search
  const handleAddParts = selectedParts => {
    // Add parts to current job or inventory
    selectedParts.forEach(part => {
      if (jobId) {
        // Add to job parts
        setParts(prev => [...prev, { ...part, jobId, status: 'needed' }]);
      } else {
        // Add to inventory
        setInventory(prev => [...prev, part]);
      }
    });

    handlePartsChange();
  };

  // Parts search and price comparison
  const searchParts = async searchQuery => {
    setLoading(true);
    try {
      // Simulate API call to search parts across suppliers
      await new Promise(resolve => setTimeout(resolve, 1500));

      return [
        {
          partNumber: 'TOY-52119-06903',
          description: 'Front Bumper Cover - Toyota Camry 2022',
          fits: ['2018-2024 Toyota Camry'],
          suppliers: [
            {
              name: 'OEM Direct',
              price: 450.0,
              availability: 'In Stock',
              shipping: 25.0,
            },
            {
              name: 'PartsTrader',
              price: 285.0,
              availability: '2-3 days',
              shipping: 15.0,
            },
            {
              name: 'LKQ',
              price: 175.0,
              availability: 'In Stock',
              shipping: 20.0,
            },
          ],
        },
      ];
    } finally {
      setLoading(false);
    }
  };

  // Barcode scanner simulation
  const handleBarcodeScan = barcode => {
    // Simulate barcode lookup
    const foundPart = inventory.find(item => item.partNumber === barcode);
    if (foundPart) {
      setSelectedPart(foundPart);
      setInventoryDialog(true);
    } else {
      // Search external databases
      searchParts(barcode);
    }
  };

  // Parts ordering workflow
  const createPurchaseOrder = selectedParts => {
    const groupedBySupplier = selectedParts.reduce((acc, part) => {
      if (!acc[part.supplier]) {
        acc[part.supplier] = [];
      }
      acc[part.supplier].push(part);
      return acc;
    }, {});

    return Object.entries(groupedBySupplier).map(([supplierId, parts]) => ({
      id: Date.now().toString() + supplierId,
      supplierId,
      supplierName: PARTS_SUPPLIERS[supplierId]?.name,
      parts,
      totalAmount: parts.reduce(
        (sum, part) => sum + part.quantity * part.unitCost,
        0
      ),
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    }));
  };

  // Parts board component showing parts pipeline
  const PartsBoard = () => {
    const partsByStatus = Object.keys(PART_STATUSES).reduce((acc, status) => {
      acc[status] = parts.filter(part => part.status === status);
      return acc;
    }, {});

    return (
      <Box sx={{ display: 'flex', overflowX: 'auto', gap: 2, pb: 2 }}>
        {Object.entries(PART_STATUSES).map(([statusKey, status]) => {
          const StatusIcon = status.icon;
          const statusParts = partsByStatus[statusKey] || [];

          return (
            <Card key={statusKey} sx={{ minWidth: 280, maxWidth: 280 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ bgcolor: status.color, mr: 1, width: 32, height: 32 }}
                  >
                    <StatusIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant='h6'>{status.label}</Typography>
                  <Badge
                    badgeContent={statusParts.length}
                    color='primary'
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {statusParts.map(part => (
                    <Card
                      key={part.id}
                      variant='outlined'
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { boxShadow: theme.shadows[2] },
                      }}
                      onClick={() => {
                        setSelectedPart(part);
                        setDialogOpen(true);
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography
                          variant='subtitle2'
                          fontWeight='bold'
                          noWrap
                        >
                          {part.partNumber}
                        </Typography>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          noWrap
                        >
                          {part.description}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 1,
                          }}
                        >
                          <Chip
                            size='small'
                            label={PART_CATEGORIES[part.category]?.label}
                            sx={{
                              backgroundColor: alpha(
                                PART_CATEGORIES[part.category]?.color || '#666',
                                0.1
                              ),
                              color:
                                PART_CATEGORIES[part.category]?.color || '#666',
                            }}
                          />
                          <Typography variant='body2' fontWeight='bold'>
                            {formatCurrency(part.estimatedCost)}
                          </Typography>
                        </Box>

                        {part.estimatedDelivery && (
                          <Typography variant='caption' color='text.secondary'>
                            ETA: {formatDate(part.estimatedDelivery)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {statusParts.length === 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 100,
                        color: 'text.secondary',
                        fontStyle: 'italic',
                      }}
                    >
                      No parts in {status.label.toLowerCase()}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  // Inventory management component
  const InventoryManagement = () => {
    const lowStockItems = inventory.filter(
      item => item.currentStock <= item.minStock
    );

    return (
      <Box>
        {/* Low stock alert */}
        {lowStockItems.length > 0 && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            {lowStockItems.length} items are running low on stock and need
            reordering.
          </Alert>
        )}

        {/* Inventory table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Part Number</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Min/Max</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Unit Cost</TableCell>
                <TableCell>Total Value</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map(item => {
                const isLowStock = item.currentStock <= item.minStock;
                const stockPercentage =
                  (item.currentStock / item.maxStock) * 100;

                return (
                  <TableRow
                    key={item.id}
                    sx={{
                      backgroundColor: isLowStock
                        ? alpha(theme.palette.error.main, 0.1)
                        : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant='body2' fontWeight='bold'>
                        {item.partNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={PART_CATEGORIES[item.category]?.label}
                        sx={{
                          backgroundColor: alpha(
                            PART_CATEGORIES[item.category]?.color || '#666',
                            0.1
                          ),
                          color:
                            PART_CATEGORIES[item.category]?.color || '#666',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Typography variant='body2' fontWeight='bold'>
                            {item.currentStock}
                          </Typography>
                          {isLowStock && (
                            <Warning color='error' fontSize='small' />
                          )}
                        </Box>
                        <LinearProgress
                          variant='determinate'
                          value={stockPercentage}
                          sx={{
                            mt: 0.5,
                            height: 4,
                            backgroundColor: alpha(
                              theme.palette.grey[300],
                              0.5
                            ),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: isLowStock
                                ? theme.palette.error.main
                                : theme.palette.success.main,
                            },
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {item.minStock} / {item.maxStock}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight='bold'>
                        {formatCurrency(item.currentStock * item.unitCost)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size='small' onClick={() => {}}>
                        <Edit />
                      </IconButton>
                      <IconButton size='small' onClick={() => {}}>
                        <QrCode />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Purchase orders component
  const PurchaseOrders = () => {
    const sampleOrders = [
      {
        id: '1',
        poNumber: 'PO-2024-001',
        supplier: PARTS_SUPPLIERS.oem_direct,
        status: 'pending',
        orderDate: '2024-01-15',
        estimatedDelivery: '2024-01-20',
        totalAmount: 1250.0,
        itemsCount: 3,
      },
    ];

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant='h6'>Purchase Orders</Typography>
          <Button
            startIcon={<Add />}
            variant='contained'
            onClick={() => setOrderDialog(true)}
          >
            Create PO
          </Button>
        </Box>

        <Grid container spacing={2}>
          {sampleOrders.map(order => (
            <Grid item xs={12} md={6} lg={4} key={order.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant='h6' fontWeight='bold'>
                        {order.poNumber}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {order.supplier.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={order.status === 'pending' ? 'warning' : 'success'}
                    />
                  </Box>

                  <Typography
                    variant='h5'
                    color='primary'
                    fontWeight='bold'
                    sx={{ mb: 1 }}
                  >
                    {formatCurrency(order.totalAmount)}
                  </Typography>

                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {order.itemsCount} items • Ordered{' '}
                    {formatDate(order.orderDate)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size='small' startIcon={<Visibility />}>
                      View
                    </Button>
                    <Button size='small' startIcon={<Print />}>
                      Print
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
        <Typography variant='h5'>Parts Management</Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<QrCode />}
            variant='outlined'
            onClick={() => setScannerActive(true)}
          >
            Scan Barcode
          </Button>
          <Button
            startIcon={<Search />}
            variant='outlined'
            onClick={() => setSearchDialog(true)}
          >
            Search Parts
          </Button>
          <Button
            startIcon={<Add />}
            variant='contained'
            onClick={() => setDialogOpen(true)}
          >
            Add Part
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label='Parts Board' />
        <Tab label='Inventory' />
        <Tab label='Purchase Orders' />
        <Tab label='Vendors' />
        <Tab label='Analytics' />
      </Tabs>

      {/* Tab content */}
      <Box>
        {activeTab === 0 && <PartsBoard />}
        {activeTab === 1 && (
          <PartsInventoryManager onPartsChange={handlePartsChange} />
        )}
        {activeTab === 2 && (
          <PartsOrderingSystem onOrdersChange={handlePartsChange} />
        )}
        {activeTab === 3 && (
          <VendorManagement onVendorsChange={handlePartsChange} />
        )}
        {activeTab === 4 && (
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Parts Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='subtitle1' gutterBottom>
                        Top Moving Parts
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Analytics dashboard coming soon...
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='subtitle1' gutterBottom>
                        Inventory Valuation
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Total inventory value:{' '}
                        {formatCurrency(
                          inventory.reduce(
                            (sum, item) =>
                              sum + item.currentStock * item.unitCost,
                            0
                          )
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Parts search dialog */}
      <PartsSearchDialog
        open={searchDialog}
        onClose={() => setSearchDialog(false)}
        onAddParts={handleAddParts}
      />

      {/* Real-time updates switch */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: theme.shadows[4],
        }}
      >
        <Typography variant='caption'>Real-time Updates</Typography>
        <Switch
          checked={realtimeUpdates}
          onChange={e => setRealtimeUpdates(e.target.checked)}
          size='small'
        />
      </Box>
    </Box>
  );
};

export default PartsManagementSystem;
