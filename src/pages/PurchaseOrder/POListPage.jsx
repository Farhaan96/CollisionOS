/**
 * Purchase Order List Page - CollisionOS
 *
 * Main page for viewing and managing purchase orders
 * Features:
 * - List all POs with sorting and filtering
 * - Search by PO number, vendor, RO number
 * - Filter by status (draft, sent, received, etc.)
 * - Status badges with color coding
 * - Quick actions (view, print, receive parts, cancel)
 * - Vendor performance metrics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Alert,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Business as VendorIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import poService from '../../services/poService';

// PO Status configuration
const PO_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'default', icon: '📝' },
  sent: { label: 'Sent', color: 'info', icon: '📤' },
  acknowledged: { label: 'Acknowledged', color: 'primary', icon: '✓' },
  partial: { label: 'Partial', color: 'warning', icon: '⏳' },
  fully_received: { label: 'Received', color: 'success', icon: '✅' },
  cancelled: { label: 'Cancelled', color: 'error', icon: '❌' },
  closed: { label: 'Closed', color: 'default', icon: '📁' },
};

const POListPage = () => {
  const navigate = useNavigate();

  // State
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [metrics, setMetrics] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadPOs();
    loadVendors();
    loadMetrics();
  }, []);

  // Load purchase orders
  const loadPOs = async () => {
    setLoading(true);
    try {
      const result = await poService.getPurchaseOrders({
        page: page + 1,
        limit: rowsPerPage,
      });

      if (result.success) {
        setPOs(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load POs:', error);
      toast.error('Failed to load purchase orders');
      setPOs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load vendors for filter
  const loadVendors = async () => {
    try {
      const result = await poService.getVendors();
      if (result.success) {
        setVendors(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  // Load PO metrics
  const loadMetrics = async () => {
    try {
      const result = await poService.getPOMetrics();
      if (result.success) {
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  // Filtered POs
  const filteredPOs = useMemo(() => {
    let filtered = [...pos];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        po =>
          po.purchaseOrderNumber?.toLowerCase().includes(query) ||
          po.roNumber?.toLowerCase().includes(query) ||
          po.vendorName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.poStatus === statusFilter);
    }

    // Vendor filter
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(po => po.vendorId === vendorFilter);
    }

    return filtered;
  }, [pos, searchQuery, statusFilter, vendorFilter]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, po) => {
    setAnchorEl(event.currentTarget);
    setSelectedPO(po);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPO(null);
  };

  const handleViewPO = (po) => {
    navigate(`/purchase-orders/${po.id}`);
    handleMenuClose();
  };

  const handlePrintPO = async (po) => {
    try {
      await poService.exportPO(po.id, 'pdf');
      toast.success('PO exported successfully');
    } catch (error) {
      toast.error('Failed to export PO');
    }
    handleMenuClose();
  };

  const handleReceiveParts = (po) => {
    navigate(`/purchase-orders/${po.id}?tab=receive`);
    handleMenuClose();
  };

  const handleCancelPO = async (po) => {
    if (!confirm(`Cancel PO ${po.purchaseOrderNumber}?`)) {
      return;
    }

    try {
      const result = await poService.cancelPurchaseOrder(po.id, 'Cancelled by user');
      if (result.success) {
        toast.success('PO cancelled successfully');
        loadPOs(); // Reload list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Failed to cancel PO');
    }
    handleMenuClose();
  };

  const handleRefresh = () => {
    loadPOs();
    loadMetrics();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const config = PO_STATUS_CONFIG[status] || {
      label: status,
      color: 'default',
      icon: '•',
    };
    return (
      <Chip
        label={
          <Box display="flex" alignItems="center" gap={0.5}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </Box>
        }
        color={config.color}
        size="small"
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Purchase Orders
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/purchase-orders/create')}
          >
            Create PO
          </Button>
        </Stack>
      </Box>

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total POs
                </Typography>
                <Typography variant="h4">{metrics.totalPOs || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {metrics.pending || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Value
                </Typography>
                <Typography variant="h4">{formatCurrency(metrics.totalValue)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Avg Lead Time
                </Typography>
                <Typography variant="h4">{metrics.avgLeadTime || 0} days</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search PO#, RO#, or Vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {Object.entries(PO_STATUS_CONFIG).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.icon} {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Vendor</InputLabel>
                <Select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  label="Vendor"
                >
                  <MenuItem value="all">All Vendors</MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* PO Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>RO Number</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>PO Date</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary">No purchase orders found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPOs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((po) => (
                    <TableRow
                      key={po.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewPO(po)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {po.purchaseOrderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{po.roNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <VendorIcon fontSize="small" color="action" />
                          {po.vendorName}
                        </Box>
                      </TableCell>
                      <TableCell>{renderStatusBadge(po.poStatus)}</TableCell>
                      <TableCell>{formatDate(po.poDate)}</TableCell>
                      <TableCell>{formatDate(po.requestedDeliveryDate)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(po.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={po.totalLineItems} color="primary">
                          <ShippingIcon color="action" />
                        </Badge>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, po)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredPOs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedPO && handleViewPO(selectedPO)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedPO && handlePrintPO(selectedPO)}>
          <PrintIcon fontSize="small" sx={{ mr: 1 }} />
          Print PO
        </MenuItem>
        {selectedPO?.poStatus !== 'fully_received' && selectedPO?.poStatus !== 'cancelled' && (
          <MenuItem onClick={() => selectedPO && handleReceiveParts(selectedPO)}>
            <ShippingIcon fontSize="small" sx={{ mr: 1 }} />
            Receive Parts
          </MenuItem>
        )}
        {selectedPO?.poStatus === 'draft' && (
          <MenuItem onClick={() => selectedPO && handleCancelPO(selectedPO)}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} color="error" />
            Cancel PO
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
};

export default POListPage;
