import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Warning,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  QrCode,
  Visibility,
  Print,
  Download,
  Upload,
  Refresh,
  FilterList,
  Search,
  PhotoCamera,
  Assignment,
  Store,
  LocalShipping
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DataGrid } from '@mui/x-data-grid';
import { partsService } from '../../services/partsService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PART_CATEGORIES = {
  body: { label: 'Body Parts', color: '#1976d2', icon: '🚗' },
  mechanical: { label: 'Mechanical', color: '#f57c00', icon: '⚙️' },
  electrical: { label: 'Electrical', color: '#7b1fa2', icon: '🔌' },
  interior: { label: 'Interior', color: '#d32f2f', icon: '🪑' },
  glass: { label: 'Glass', color: '#1565c0', icon: '🪟' },
  consumables: { label: 'Consumables', color: '#2e7d32', icon: '🧴' }
};

const PartsInventoryManager = ({ onPartsChange }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [stockDialog, setStockDialog] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    stockStatus: '',
    supplier: ''
  });
  const [stockUpdate, setStockUpdate] = useState({
    operation: 'set',
    quantity: '',
    notes: ''
  });

  // Load inventory data
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partsService.getAllParts({
        include_inventory: true,
        include_vendor: true
      });
      setInventory(data);
      setFilteredInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Filter and search inventory
  useEffect(() => {
    let filtered = inventory;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.oemPartNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(part => part.category === filters.category);
    }

    if (filters.stockStatus) {
      filtered = filtered.filter(part => {
        const stockStatus = getStockStatus(part);
        return stockStatus === filters.stockStatus;
      });
    }

    if (filters.supplier) {
      filtered = filtered.filter(part => part.primaryVendorId === filters.supplier);
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, filters]);

  // Get stock status
  const getStockStatus = (part) => {
    if (part.currentStock <= 0) return 'out_of_stock';
    if (part.currentStock <= part.minimumStock) return 'low_stock';
    if (part.currentStock <= part.reorderPoint) return 'reorder';
    return 'in_stock';
  };

  // Get stock status color
  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock': return theme.palette.error.main;
      case 'low_stock': return theme.palette.warning.main;
      case 'reorder': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    if (!selectedPart || !stockUpdate.quantity) return;

    try {
      await partsService.updateStock(
        selectedPart.id,
        parseInt(stockUpdate.quantity),
        stockUpdate.operation
      );
      
      setStockDialog(false);
      setStockUpdate({ operation: 'set', quantity: '', notes: '' });
      loadInventory();
      
      if (onPartsChange) onPartsChange();
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  // Calculate inventory statistics
  const inventoryStats = React.useMemo(() => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(part => getStockStatus(part) === 'low_stock').length;
    const outOfStockItems = inventory.filter(part => getStockStatus(part) === 'out_of_stock').length;
    const totalValue = inventory.reduce((sum, part) => sum + (part.currentStock * (part.costPrice || 0)), 0);

    return { totalItems, lowStockItems, outOfStockItems, totalValue };
  }, [inventory]);

  // Data Grid columns
  const columns = [
    {
      field: 'partNumber',
      headerName: 'Part Number',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
          {params.row.oemPartNumber && (
            <Typography variant="caption" color="text.secondary">
              OEM: {params.row.oemPartNumber}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 130,
      renderCell: (params) => {
        const category = PART_CATEGORIES[params.value];
        return (
          <Chip
            size="small"
            label={category?.label}
            sx={{
              backgroundColor: alpha(category?.color || '#666', 0.1),
              color: category?.color || '#666'
            }}
          />
        );
      }
    },
    {
      field: 'currentStock',
      headerName: 'Stock',
      width: 120,
      renderCell: (params) => {
        const status = getStockStatus(params.row);
        const stockPercentage = (params.value / (params.row.maximumStock || params.value)) * 100;
        
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body2" fontWeight="bold">
                {params.value}
              </Typography>
              {status === 'low_stock' && <Warning sx={{ fontSize: 16, color: 'warning.main' }} />}
              {status === 'out_of_stock' && <Warning sx={{ fontSize: 16, color: 'error.main' }} />}
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(stockPercentage, 100)}
              sx={{
                height: 4,
                backgroundColor: alpha(theme.palette.grey[300], 0.5),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStockStatusColor(status)
                }
              }}
            />
          </Box>
        );
      }
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.location || 'Not set'}
        </Typography>
      )
    },
    {
      field: 'costPrice',
      headerName: 'Cost',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? formatCurrency(params.value) : '-'}
        </Typography>
      )
    },
    {
      field: 'totalValue',
      headerName: 'Total Value',
      width: 120,
      renderCell: (params) => {
        const value = params.row.currentStock * (params.row.costPrice || 0);
        return (
          <Typography variant="body2" fontWeight="bold">
            {formatCurrency(value)}
          </Typography>
        );
      }
    },
    {
      field: 'lastUpdated',
      headerName: 'Last Updated',
      width: 120,
      renderCell: (params) => (
        <Typography variant="caption">
          {params.row.updatedAt ? formatDate(params.row.updatedAt) : '-'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedPart(params.row);
                setEditDialog(true);
              }}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Update Stock">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedPart(params.row);
                setStockDialog(true);
              }}
            >
              <Assignment />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generate QR">
            <IconButton size="small">
              <QrCode />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Details">
            <IconButton size="small">
              <Visibility />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

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
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
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

  // Low Stock Items Component
  const LowStockItems = () => {
    const lowStockItems = inventory.filter(part => 
      ['low_stock', 'out_of_stock'].includes(getStockStatus(part))
    );

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Low Stock Alert</Typography>
            <Badge badgeContent={lowStockItems.length} color="error">
              <Warning />
            </Badge>
          </Box>
          
          {lowStockItems.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              py: 3,
              color: 'text.secondary'
            }}>
              <CheckCircle sx={{ fontSize: 48, mb: 1 }} />
              <Typography>All items are well stocked!</Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {lowStockItems.map((part) => (
                <Box
                  key={part.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderRadius: 1
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {part.partNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {part.description}
                    </Typography>
                    <Typography variant="caption">
                      Current: {part.currentStock} | Min: {part.minimumStock}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setSelectedPart(part);
                      setStockDialog(true);
                    }}
                  >
                    Restock
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Inventory Management</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<Download />}
            variant="outlined"
            onClick={() => {
              // Export inventory data
            }}
          >
            Export
          </Button>
          <Button
            startIcon={<Upload />}
            variant="outlined"
            onClick={() => {
              // Import inventory data
            }}
          >
            Import
          </Button>
          <Button
            startIcon={<Refresh />}
            variant="outlined"
            onClick={loadInventory}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Items"
            value={inventoryStats.totalItems}
            subtitle="Active parts"
            icon={<Store />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Low Stock"
            value={inventoryStats.lowStockItems}
            subtitle="Need attention"
            icon={<Warning />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Out of Stock"
            value={inventoryStats.outOfStockItems}
            subtitle="Urgent restock"
            icon={<LocalShipping />}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Value"
            value={formatCurrency(inventoryStats.totalValue)}
            subtitle="Inventory worth"
            icon={<TrendingUp />}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Inventory" />
        <Tab label={`Low Stock (${inventoryStats.lowStockItems})`} />
        <Tab label="Analytics" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {Object.entries(PART_CATEGORIES).map(([key, category]) => (
                      <MenuItem key={key} value={key}>{category.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stock Status</InputLabel>
                  <Select
                    value={filters.stockStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
                    label="Stock Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="in_stock">In Stock</MenuItem>
                    <MenuItem value="low_stock">Low Stock</MenuItem>
                    <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                    <MenuItem value="reorder">Needs Reorder</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => setFilters({ category: '', stockStatus: '', supplier: '' })}
                  >
                    Clear Filters
                  </Button>
                  <Button variant="outlined" startIcon={<Add />}>
                    Add Part
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Inventory Table */}
          <Card>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredInventory}
                columns={columns}
                pageSize={25}
                rowsPerPageOptions={[10, 25, 50]}
                loading={loading}
                disableSelectionOnClick
                getRowClassName={(params) => {
                  const status = getStockStatus(params.row);
                  if (status === 'out_of_stock') return 'row-out-of-stock';
                  if (status === 'low_stock') return 'row-low-stock';
                  return '';
                }}
                sx={{
                  '& .row-out-of-stock': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1)
                  },
                  '& .row-low-stock': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.1)
                  }
                }}
              />
            </Box>
          </Card>
        </Box>
      )}

      {activeTab === 1 && <LowStockItems />}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analytics dashboard coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Stock Update Dialog */}
      <Dialog open={stockDialog} onClose={() => setStockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Stock - {selectedPart?.partNumber}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Current Stock: {selectedPart?.currentStock}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Operation</InputLabel>
                <Select
                  value={stockUpdate.operation}
                  onChange={(e) => setStockUpdate(prev => ({ ...prev, operation: e.target.value }))}
                  label="Operation"
                >
                  <MenuItem value="set">Set to</MenuItem>
                  <MenuItem value="add">Add</MenuItem>
                  <MenuItem value="subtract">Subtract</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={stockUpdate.quantity}
                onChange={(e) => setStockUpdate(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={2}
                value={stockUpdate.notes}
                onChange={(e) => setStockUpdate(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStockUpdate}
            disabled={!stockUpdate.quantity}
          >
            Update Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartsInventoryManager;