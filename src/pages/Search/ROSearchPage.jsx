import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  useTheme,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Assignment,
  DirectionsCar,
  Person,
  Phone,
  Email,
  AccessTime,
  AttachMoney,
  Warning,
  CheckCircle,
  Schedule,
  Build,
  LocalShipping,
  Visibility,
  Edit,
  Print,
  Share,
  FilterList,
  Sort,
  Refresh,
  Dashboard,
  Analytics,
  TrendingUp,
  Timeline,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CollisionRepairSearchBar from '../../components/Search/CollisionRepairSearchBar';
import roService from '../../services/roService';
import { toast } from 'react-hot-toast';
// import { supabase } from '../../config/supabaseClient'; // Disabled during local DB migration

/**
 * ROSearchPage - Main search interface for collision repair workflows
 *
 * Features:
 * - Search-first interface with global search bar
 * - RO status dashboard with real-time metrics
 * - Quick filters for common searches (Today's ROs, Pending Parts, etc.)
 * - Recent ROs with workflow status
 * - Performance metrics and KPIs
 * - Direct navigation to RO detail pages
 */
const ROSearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [searchResults, setSearchResults] = useState([]);
  const [recentROs, setRecentROs] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('opened_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  });

  // Mock shop ID - in real app, get from auth context
  const shopId = '550e8400-e29b-41d4-a716-446655440000';

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call real backend API
      const result = await roService.getRepairOrders({
        shopId,
        limit: 50,
        page: 1,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.dateFrom && filters.dateTo && {
          dateRange: { from: filters.dateFrom, to: filters.dateTo }
        })
      });

      if (result.success) {
        setRecentROs(result.data);

        // Calculate metrics from the actual data
        const metrics = {
          totalROs: result.data.length,
          inProgress: result.data.filter(ro => ro.status === 'in_progress').length,
          estimate: result.data.filter(ro => ro.status === 'estimate').length,
          partsPending: result.data.filter(ro => ro.status === 'parts_pending').length,
          completed: result.data.filter(ro => ro.status === 'completed').length,
          totalValue: result.data.reduce((sum, ro) => sum + (parseFloat(ro.total_amount) || 0), 0),
          avgAmount: result.data.length > 0
            ? result.data.reduce((sum, ro) => sum + (parseFloat(ro.total_amount) || 0), 0) / result.data.length
            : 0,
          urgent: result.data.filter(ro => ro.priority === 'urgent').length,
        };

        setDashboardMetrics(metrics);
      } else {
        toast.error(result.error || 'Failed to load repair orders');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load repair orders: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, filters]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle search with backend API
  const handleSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const result = await roService.searchRepairOrders(searchTerm, {
        limit: 50,
        page: 1
      });

      if (result.success) {
        // Transform search results to match expected format
        const transformedResults = result.data.map(ro => ({
          id: ro.id,
          type: 'repair_order',
          label: ro.ro_number,
          subtitle: ro.customer ?
            `${ro.customer.first_name || ''} ${ro.customer.last_name || ''}`.trim() +
            (ro.vehicle ? ` - ${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : '') :
            'No customer info',
          status: ro.status,
          data: ro,
          icon: Assignment
        }));

        setSearchResults(transformedResults);
        if (transformedResults.length > 0) {
          setSelectedTab(1); // Switch to search results tab
        } else {
          toast.info('No results found for "' + searchTerm + '"');
        }
      } else {
        toast.error(result.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed: ' + error.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search results from CollisionRepairSearchBar component
  const handleSearchResults = useCallback((results) => {
    setSearchResults(results);
    if (results.length > 0) {
      setSelectedTab(1); // Switch to search results tab
    }
  }, []);

  // Handle item selection from search
  const handleItemSelect = useCallback((item) => {
    if (item.type === 'repair_order') {
      navigate(`/ro/${item.data.id}`);
    } else if (item.type === 'vehicle') {
      // Navigate to vehicle's active RO if exists
      const activeRO = item.data.repair_orders?.find(ro =>
        ['estimate', 'in_progress', 'parts_pending'].includes(ro.status)
      );
      if (activeRO) {
        navigate(`/ro/${activeRO.id}`);
      } else {
        navigate(`/vehicles/${item.data.id}`);
      }
    } else if (item.type === 'claim') {
      const ro = item.data.repair_orders?.[0];
      if (ro) {
        navigate(`/ro/${ro.id}`);
      } else {
        navigate(`/claims/${item.data.id}`);
      }
    } else if (item.type === 'customer') {
      navigate(`/customers/${item.data.id}`);
    }
  }, [navigate]);

  // Quick filter functions
  const quickFilters = [
    {
      label: 'Today\'s Drop-offs',
      count: recentROs.filter(ro => {
        const today = new Date().toISOString().split('T')[0];
        return ro.drop_off_date?.startsWith(today);
      }).length,
      color: 'primary',
      icon: Schedule,
      onClick: () => {
        // Filter logic here
        console.log('Filter: Today\'s drop-offs');
      }
    },
    {
      label: 'Pending Parts',
      count: dashboardMetrics.partsPending,
      color: 'warning',
      icon: LocalShipping,
      onClick: () => {
        // Filter logic here
        console.log('Filter: Pending parts');
      }
    },
    {
      label: 'Ready for Delivery',
      count: dashboardMetrics.completed,
      color: 'success',
      icon: CheckCircle,
      onClick: () => {
        // Filter logic here
        console.log('Filter: Ready for delivery');
      }
    },
    {
      label: 'Urgent Priority',
      count: dashboardMetrics.urgent,
      color: 'error',
      icon: Warning,
      onClick: () => {
        // Filter logic here
        console.log('Filter: Urgent priority');
      }
    },
  ];

  // Get status color for RO status
  const getStatusColor = (status) => {
    const statusColors = {
      estimate: 'info',
      in_progress: 'warning',
      parts_pending: 'secondary',
      completed: 'success',
      delivered: 'primary',
      cancelled: 'error',
    };
    return statusColors[status] || 'default';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const priorityColors = {
      low: 'success',
      normal: 'default',
      high: 'warning',
      urgent: 'error',
    };
    return priorityColors[priority] || 'default';
  };

  // Handle sort
  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setFilterDialogOpen(false);
    loadDashboardData();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Sort ROs
  const sortedROs = React.useMemo(() => {
    const sorted = [...recentROs];
    sorted.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'ro_number':
          aVal = a.ro_number || '';
          bVal = b.ro_number || '';
          break;
        case 'customer':
          aVal = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          bVal = `${b.first_name || ''} ${b.last_name || ''}`.trim();
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
  }, [recentROs, sortBy, sortOrder]);

  // Render dashboard metrics
  const renderDashboardMetrics = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total ROs
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardMetrics.totalROs}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <Assignment />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  In Progress
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {dashboardMetrics.inProgress}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                <Build />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Value
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  ${dashboardMetrics.totalValue?.toLocaleString()}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                <AttachMoney />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Avg Amount
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  ${Math.round(dashboardMetrics.avgAmount || 0).toLocaleString()}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                <TrendingUp />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Render quick filters
  const renderQuickFilters = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {quickFilters.map((filter, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
            onClick={filter.onClick}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {filter.label}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    <Badge badgeContent={filter.count} color={filter.color} max={99}>
                      <filter.icon color={filter.color} />
                    </Badge>
                    <span style={{ marginLeft: 8 }}>{filter.count}</span>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render RO table row
  const renderROTableRow = (ro) => {
    // Map field names to handle both snake_case from API and camelCase
    const customer = ro.customer || (ro.first_name ? { first_name: ro.first_name, last_name: ro.last_name, phone: ro.phone } : null);
    const vehicle = ro.vehicleProfile || ro.vehicle || (ro.year ? { year: ro.year, make: ro.make, model: ro.model, color: ro.color, license_plate: ro.license_plate } : null);

    return (
      <TableRow
        key={ro.id}
        hover
        sx={{ cursor: 'pointer' }}
        onClick={() => navigate(`/ro/${ro.id}`)}
      >
        <TableCell>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
              <Assignment fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="medium">
                {ro.ro_number}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {ro.ro_type || 'Collision Repair'}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A' : 'N/A'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {customer?.phone || 'No phone'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {vehicle ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'N/A' : 'N/A'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {vehicle ? `${vehicle.color || 'N/A'} | ${vehicle.license_plate || 'N/A'}` : 'N/A'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={1}>
            <Chip
              label={(ro.status || 'unknown').replace('_', ' ').toUpperCase()}
              size="small"
              color={getStatusColor(ro.status)}
            />
            {ro.priority && ro.priority !== 'normal' && (
              <Chip
                label={ro.priority.toUpperCase()}
                size="small"
                color={getPriorityColor(ro.priority)}
              />
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            ${ro.total_amount?.toLocaleString() || 'TBD'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {ro.estimated_completion_date ?
              new Date(ro.estimated_completion_date).toLocaleDateString() :
              ro.estimated_completion ?
                new Date(ro.estimated_completion).toLocaleDateString() :
                'TBD'
            }
          </Typography>
        </TableCell>

        <TableCell>
          <Box display="flex" gap={0.5}>
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
            <Tooltip title="Edit RO">
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
            {(customer?.phone || ro.phone) && (
              <Tooltip title="Call Customer">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${customer?.phone || ro.phone}`);
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
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Collision Repair Workflow
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Search and manage repair orders, claims, vehicles, and customers
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            onClick={() => navigate('/ro/new')}
          >
            New RO
          </Button>
        </Box>
      </Box>

      {/* Global Search Bar */}
      <Box mb={4}>
        <CollisionRepairSearchBar
          shopId={shopId}
          onSearchResults={handleSearchResults}
          onItemSelect={handleItemSelect}
          placeholder="Search RO#, Claim#, VIN, Customer, Phone..."
          showQuickActions={true}
        />
      </Box>

      {/* Dashboard Metrics */}
      {isLoading ? (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      ) : (
        renderDashboardMetrics()
      )}

      {/* Quick Filters */}
      <Typography variant="h6" fontWeight="medium" gutterBottom>
        Quick Filters
      </Typography>
      {renderQuickFilters()}

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Recent ROs" />
          <Tab
            label={
              <Badge badgeContent={searchResults.length} color="primary">
                Search Results
              </Badge>
            }
          />
          <Tab label="Analytics" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {selectedTab === 0 && (
            <Box>
              <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="medium">
                  Recent Repair Orders
                </Typography>
                <Box display="flex" gap={1}>
                  <Tooltip title="Filter Results">
                    <IconButton size="small" onClick={() => setFilterDialogOpen(true)}>
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sort Options">
                    <IconButton size="small">
                      <Sort />
                    </IconButton>
                  </Tooltip>
                </Box>
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
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'amount'}
                          direction={sortBy === 'amount' ? sortOrder : 'asc'}
                          onClick={() => handleSort('amount')}
                        >
                          Amount
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'opened_at'}
                          direction={sortBy === 'opened_at' ? sortOrder : 'asc'}
                          onClick={() => handleSort('opened_at')}
                        >
                          Est. Completion
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          {[...Array(7)].map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton variant="text" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      sortedROs
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(renderROTableRow)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={recentROs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Box>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Search Results ({searchResults.length})
              </Typography>
              {searchResults.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Use the search bar above to find repair orders, claims, vehicles, or customers.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {searchResults.map((result) => (
                    <Grid item xs={12} md={6} lg={4} key={result.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 3 },
                        }}
                        onClick={() => handleItemSelect(result)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="start" gap={2}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              <result.icon />
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="subtitle2" fontWeight="medium">
                                {result.label}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {result.subtitle}
                              </Typography>
                              {result.status && (
                                <Chip
                                  label={result.status}
                                  size="small"
                                  color={getStatusColor(result.status)}
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Analytics Dashboard
              </Typography>
              <Alert severity="info">
                Analytics dashboard coming soon. This will include collision repair KPIs,
                performance metrics, and business intelligence.
              </Alert>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="medium">
              Filter Repair Orders
            </Typography>
            <IconButton size="small" onClick={() => setFilterDialogOpen(false)}>
              <Close />
            </IconButton>
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
                <MenuItem value="parts_pending">Parts Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            {/* Date Range Filters */}
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