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
  Tabs,
  Tab,
  Badge,
  Tooltip,
  useTheme,
  Alert,
  Skeleton,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CollisionRepairSearchBar from '../../components/Search/CollisionRepairSearchBar';
import { supabase } from '../../config/supabaseClient';

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

  // Mock shop ID - in real app, get from auth context
  const shopId = '550e8400-e29b-41d4-a716-446655440000';

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load recent repair orders
      const { data: repairOrders, error: roError } = await supabase
        .from('repair_orders')
        .select(`
          id,
          ro_number,
          status,
          ro_type,
          priority,
          total_amount,
          drop_off_date,
          estimated_completion_date,
          customers:customer_id (
            first_name,
            last_name,
            phone
          ),
          vehicles:vehicle_id (
            year,
            make,
            model,
            color,
            license_plate
          ),
          claims:claim_id (
            claim_number,
            insurance_companies:insurance_company_id (
              short_name
            )
          )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!roError && repairOrders) {
        setRecentROs(repairOrders);
      }

      // Calculate dashboard metrics
      const metrics = {
        totalROs: repairOrders?.length || 0,
        inProgress: repairOrders?.filter(ro => ro.status === 'in_progress').length || 0,
        estimate: repairOrders?.filter(ro => ro.status === 'estimate').length || 0,
        partsPending: repairOrders?.filter(ro => ro.status === 'parts_pending').length || 0,
        completed: repairOrders?.filter(ro => ro.status === 'completed').length || 0,
        totalValue: repairOrders?.reduce((sum, ro) => sum + (ro.total_amount || 0), 0) || 0,
        avgAmount: repairOrders?.length > 0 ?
          (repairOrders.reduce((sum, ro) => sum + (ro.total_amount || 0), 0) / repairOrders.length) : 0,
        urgent: repairOrders?.filter(ro => ro.priority === 'urgent').length || 0,
      };

      setDashboardMetrics(metrics);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle search results
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
  const renderROTableRow = (ro) => (
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
              {ro.ro_type}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {ro.customers?.first_name} {ro.customers?.last_name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {ro.customers?.phone}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {ro.vehicles?.year} {ro.vehicles?.make} {ro.vehicles?.model}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {ro.vehicles?.color} | {ro.vehicles?.license_plate}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1}>
          <Chip
            label={ro.status.replace('_', ' ').toUpperCase()}
            size="small"
            color={getStatusColor(ro.status)}
          />
          {ro.priority !== 'normal' && (
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
          {ro.customers?.phone && (
            <Tooltip title="Call Customer">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${ro.customers.phone}`);
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
                  <IconButton size="small">
                    <FilterList />
                  </IconButton>
                  <IconButton size="small">
                    <Sort />
                  </IconButton>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>RO Number</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Est. Completion</TableCell>
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
                      recentROs
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
    </Container>
  );
};

export default ROSearchPage;