import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  useTheme,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Assignment,
  DirectionsCar,
  Person,
  Phone,
  Build,
  LocalShipping,
  CheckCircle,
  Warning,
  Add,
  Search,
  FilterList,
  Refresh,
  Visibility,
  Edit,
  AttachMoney,
  Schedule,
  Home,
  NavigateNext,
  Clear,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { KPICard, StatusBadge } from '../../components/ui';
import CollisionRepairSearchBar from '../../components/Search/CollisionRepairSearchBar';
import roService from '../../services/roService';
import { toast } from 'react-hot-toast';

/**
 * ROSearchPage (Redesigned) - Modern collision repair order management interface
 *
 * Features:
 * - Beautiful gradient header
 * - KPI cards for key metrics
 * - Enhanced search with filters
 * - Modern table with StatusBadge
 * - Responsive design
 * - Loading skeletons
 * - Empty states
 */
const ROSearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [ros, setROs] = useState([]);
  const [filteredROs, setFilteredROs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('opened_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    insurance: '',
    technician: '',
    dateFrom: '',
    dateTo: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  // Mock shop ID - in real app, get from auth context
  const shopId = '550e8400-e29b-41d4-a716-446655440000';

  // Load ROs from backend
  const loadROs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await roService.getRepairOrders({
        shopId,
        limit: 100,
        page: 1,
      });

      if (result.success) {
        setROs(result.data);
        setFilteredROs(result.data);
      } else {
        toast.error(result.error || 'Failed to load repair orders');
      }
    } catch (error) {
      console.error('Failed to load ROs:', error);
      toast.error('Failed to load repair orders: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadROs();
  }, [loadROs]);

  // Calculate metrics from ROs
  const metrics = React.useMemo(() => {
    return {
      totalActive: filteredROs.filter(ro => ['estimate', 'in_progress', 'parts_pending'].includes(ro.status)).length,
      completedThisWeek: filteredROs.filter(ro => {
        if (ro.status !== 'completed' && ro.status !== 'delivered') return false;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(ro.delivered_at || ro.updated_at) >= oneWeekAgo;
      }).length,
      waitingParts: filteredROs.filter(ro => ro.status === 'parts_pending').length,
      overdue: filteredROs.filter(ro => {
        if (!ro.estimated_completion_date) return false;
        return new Date(ro.estimated_completion_date) < new Date() && !['completed', 'delivered'].includes(ro.status);
      }).length,
    };
  }, [filteredROs]);

  // Handle search
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    const lowerTerm = term.toLowerCase();

    const filtered = ros.filter(ro => {
      // Backend now returns: customer, vehicle, claim (singular)
      const customer = ro.customer;
      const vehicle = ro.vehicle || ro.vehicleProfile;

      return (
        ro.ro_number?.toLowerCase().includes(lowerTerm) ||
        customer?.first_name?.toLowerCase().includes(lowerTerm) ||
        customer?.last_name?.toLowerCase().includes(lowerTerm) ||
        vehicle?.vin?.toLowerCase().includes(lowerTerm) ||
        vehicle?.license_plate?.toLowerCase().includes(lowerTerm)
      );
    });

    setFilteredROs(filtered);
    setPage(0);
  }, [ros]);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    let filtered = [...ros];
    const active = [];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(ro => ro.status === filters.status);
      active.push({ key: 'status', label: `Status: ${filters.status}`, value: filters.status });
    }

    // Insurance filter
    if (filters.insurance) {
      filtered = filtered.filter(ro => ro.claimManagement?.insurance_companies?.name === filters.insurance);
      active.push({ key: 'insurance', label: `Insurance: ${filters.insurance}`, value: filters.insurance });
    }

    // Technician filter
    if (filters.technician) {
      filtered = filtered.filter(ro => ro.assigned_technician === filters.technician);
      active.push({ key: 'technician', label: `Tech: ${filters.technician}`, value: filters.technician });
    }

    // Date range filter
    if (filters.dateFrom && filters.dateTo) {
      filtered = filtered.filter(ro => {
        const roDate = new Date(ro.opened_at);
        return roDate >= new Date(filters.dateFrom) && roDate <= new Date(filters.dateTo);
      });
      active.push({ key: 'dateRange', label: `${filters.dateFrom} to ${filters.dateTo}`, value: filters.dateRange });
    }

    setFilteredROs(filtered);
    setActiveFilters(active);
    setFilterDialogOpen(false);
    setPage(0);
  }, [ros, filters]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      status: '',
      insurance: '',
      technician: '',
      dateFrom: '',
      dateTo: ''
    });
    setActiveFilters([]);
    setFilteredROs(ros);
    setPage(0);
  }, [ros]);

  // Remove single filter
  const handleRemoveFilter = useCallback((filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
    const newActive = activeFilters.filter(f => f.key !== filterKey);
    setActiveFilters(newActive);

    // Reapply remaining filters
    setTimeout(() => handleApplyFilters(), 0);
  }, [activeFilters, handleApplyFilters]);

  // Handle sort
  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
  };

  // Sort ROs
  const sortedROs = React.useMemo(() => {
    const sorted = [...filteredROs];
    sorted.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'ro_number':
          aVal = a.ro_number || '';
          bVal = b.ro_number || '';
          break;
        case 'customer':
          aVal = `${a.customer?.first_name || ''} ${a.customer?.last_name || ''}`.trim();
          bVal = `${b.customer?.first_name || ''} ${b.customer?.last_name || ''}`.trim();
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'amount':
          aVal = a.total_amount || 0;
          bVal = b.total_amount || 0;
          break;
        case 'opened_at':
        default:
          aVal = new Date(a.opened_at || 0);
          bVal = new Date(b.opened_at || 0);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredROs, sortBy, sortOrder]);

  // Paginated ROs
  const paginatedROs = sortedROs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Calculate days in shop
  const getDaysInShop = (ro) => {
    const startDate = new Date(ro.opened_at);
    const endDate = ro.delivered_at ? new Date(ro.delivered_at) : new Date();
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Get days in shop color
  const getDaysColor = (days) => {
    if (days < 5) return theme.palette.success.main;
    if (days < 10) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        sx={{ mb: 2 }}
      >
        <Link
          underline="hover"
          color="inherit"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 0.5 }} fontSize="small" />
          Repair Orders
        </Typography>
      </Breadcrumbs>

      {/* Header with Gradient Title */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1,
            }}
          >
            Repair Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage collision repair workflows and track progress
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadROs}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/ro/new')}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              },
            }}
          >
            New Repair Order
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by RO#, customer name, VIN, or license plate..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleSearch('')}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.background.default,
              },
            }}
          />
          <Tooltip title="Advanced Filters">
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterDialogOpen(true)}
              sx={{ minWidth: 140 }}
            >
              Filters
              {activeFilters.length > 0 && (
                <Chip
                  label={activeFilters.length}
                  size="small"
                  color="primary"
                  sx={{ ml: 1, height: 20 }}
                />
              )}
            </Button>
          </Tooltip>
        </Box>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Box mt={2} display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Active filters:
            </Typography>
            {activeFilters.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                onDelete={() => handleRemoveFilter(filter.key)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              sx={{ ml: 1 }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {/* Quick Stats KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Jobs"
            value={metrics.totalActive}
            icon={<Build />}
            color={theme.palette.primary.main}
            loading={isLoading}
            onClick={() => {
              setFilters({ ...filters, status: 'in_progress' });
              handleApplyFilters();
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Completed This Week"
            value={metrics.completedThisWeek}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Waiting for Parts"
            value={metrics.waitingParts}
            icon={<LocalShipping />}
            color={theme.palette.warning.main}
            loading={isLoading}
            onClick={() => {
              setFilters({ ...filters, status: 'parts_pending' });
              handleApplyFilters();
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Overdue"
            value={metrics.overdue}
            icon={<Warning />}
            color={theme.palette.error.main}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Main Table */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Repair Orders ({filteredROs.length})
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'ro_number'}
                    direction={sortBy === 'ro_number' ? sortOrder : 'asc'}
                    onClick={() => handleSort('ro_number')}
                  >
                    RO Number
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'customer'}
                    direction={sortBy === 'customer' ? sortOrder : 'asc'}
                    onClick={() => handleSort('customer')}
                  >
                    Customer
                  </TableSortLabel>
                </TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>Insurance</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === 'amount'}
                    direction={sortBy === 'amount' ? sortOrder : 'asc'}
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Days in Shop</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedROs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Assignment sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No repair orders found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {searchTerm || activeFilters.length > 0
                        ? 'Try adjusting your search or filters'
                        : 'Create your first repair order to get started'}
                    </Typography>
                    {!searchTerm && activeFilters.length === 0 && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/ro/new')}
                        sx={{ mt: 2 }}
                      >
                        Create Repair Order
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedROs.map((ro) => {
                  const customer = ro.customer;
                  const vehicle = ro.vehicleProfile || ro.vehicle;
                  const daysInShop = getDaysInShop(ro);

                  return (
                    <TableRow
                      key={ro.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                      onClick={() => navigate(`/ro/${ro.id}`)}
                    >
                      {/* RO Number */}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              bgcolor: `${theme.palette.primary.main}20`,
                              color: theme.palette.primary.main,
                              width: 36,
                              height: 36,
                            }}
                          >
                            <Assignment fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{
                                color: theme.palette.primary.main,
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {ro.ro_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(ro.opened_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A' : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer?.phone || 'No phone'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Vehicle */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {vehicle ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'N/A' : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {vehicle?.license_plate || 'No plate'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={ro.status} size="small" />
                      </TableCell>

                      {/* Insurance */}
                      <TableCell>
                        <Typography variant="body2">
                          {ro.claimManagement?.insurance_companies?.name || 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* Amount */}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          ${ro.total_amount?.toLocaleString() || '0.00'}
                        </Typography>
                      </TableCell>

                      {/* Days in Shop */}
                      <TableCell align="center">
                        <Chip
                          label={daysInShop}
                          size="small"
                          sx={{
                            backgroundColor: `${getDaysColor(daysInShop)}20`,
                            color: getDaysColor(daysInShop),
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/ro/${ro.id}`);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/ro/${ro.id}/edit`);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {customer?.phone && (
                            <Tooltip title="Call Customer">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${customer.phone}`);
                                }}
                              >
                                <Phone fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredROs.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredROs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        )}
      </Paper>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterList />
            <Typography variant="h6" fontWeight={600}>
              Advanced Filters
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Status Filter */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="estimate">Estimate</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="parts_pending">Waiting for Parts</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
              </Select>
            </FormControl>

            {/* Date Range */}
            <TextField
              fullWidth
              type="date"
              label="Date From"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              type="date"
              label="Date To"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters} color="secondary">
            Clear Filters
          </Button>
          <Button onClick={() => setFilterDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyFilters} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ROSearchPage;
