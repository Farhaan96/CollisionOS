import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  Skeleton,
  FormControl,
  Select,
  InputLabel,
  TextField,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  Receipt,
  Business,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  AttachMoney,
  Warning,
  CheckCircle,
  Schedule,
  MoreVert,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  Call,
  Sms,
  Print,
  Edit,
  Visibility,
  Star,
  TrendingUp,
  CalendarToday
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * SearchResults - Advanced results display with contextual actions
 * 
 * Features:
 * - Unified result cards showing RO + Claim + Customer + Vehicle
 * - Quick actions: View RO, Call Customer, Update Status
 * - Advanced filters: Stage, Hold reasons, Insurer, Date ranges
 * - Sort options: Priority, Promise date, Stage, Value
 * - List and grid view modes
 */
const SearchResults = ({
  results = [],
  isLoading = false,
  searchQuery = '',
  onItemSelect,
  onFilterChange,
  onSortChange,
  showFilters = true,
  showSortOptions = true,
  defaultView = 'grid', // 'grid' or 'list'
  maxResults = 50,
  className,
  ...props
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [viewMode, setViewMode] = useState(defaultView);
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    insurance: 'all',
    daysInShop: 'all',
    dateRange: 'all'
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Sort and filter results
  const processedResults = useMemo(() => {
    let filtered = [...results];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }
    if (filters.insurance !== 'all') {
      filtered = filtered.filter(item => item.insurance === filters.insurance);
    }
    if (filters.daysInShop !== 'all') {
      const days = parseInt(filters.daysInShop);
      filtered = filtered.filter(item => {
        if (days === 7) return item.daysInShop <= 7;
        if (days === 14) return item.daysInShop <= 14;
        if (days === 30) return item.daysInShop <= 30;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'amount':
          aVal = a.estimatedAmount || 0;
          bVal = b.estimatedAmount || 0;
          break;
        case 'daysInShop':
          aVal = a.daysInShop || 0;
          bVal = b.daysInShop || 0;
          break;
        case 'customerName':
          aVal = (a.customerName || '').toLowerCase();
          bVal = (b.customerName || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'relevance':
        default:
          aVal = a.relevance || 0;
          bVal = b.relevance || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered.slice(0, maxResults);
  }, [results, filters, sortBy, sortOrder, maxResults]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const statuses = [...new Set(results.map(r => r.status))].filter(Boolean);
    const priorities = [...new Set(results.map(r => r.priority))].filter(Boolean);
    const insurances = [...new Set(results.map(r => r.insurance))].filter(Boolean);
    
    return {
      statuses,
      priorities,
      insurances
    };
  }, [results]);

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    
    if (onSortChange) {
      onSortChange({ sortBy: newSortBy, sortOrder });
    }
  };

  // Handle item actions
  const handleMenuClick = (event, item) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleItemClick = (item) => {
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      navigate(`/production?ro=${item.id}&view=details`);
    }
  };

  const handleQuickAction = (action, item) => {
    switch (action) {
      case 'view':
        handleItemClick(item);
        break;
      case 'call':
        window.open(`tel:${item.phone || '(555) 123-4567'}`);
        break;
      case 'email':
        window.open(`mailto:${item.email || 'customer@email.com'}`);
        break;
      case 'edit':
        navigate(`/production?ro=${item.id}&action=edit`);
        break;
      case 'update-status':
        navigate(`/production?ro=${item.id}&action=update-status`);
        break;
      default:
        console.log(`Action ${action} for item:`, item);
    }
    handleMenuClose();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'estimate': return 'warning';
      case 'in_progress': return 'primary';
      case 'quality_check': return 'info';
      case 'ready_for_pickup': return 'success';
      case 'completed': return 'success';
      case 'on_hold': return 'error';
      default: return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'normal': return theme.palette.primary.main;
      case 'low': return theme.palette.text.secondary;
      default: return theme.palette.text.secondary;
    }
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <Grid container spacing={2}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} lg={4} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Box>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render result card
  const renderResultCard = (item, index) => {
    const isRO = item.searchType === 'repair_order' || item.type === 'repair_order';
    const isCustomer = item.searchType === 'customer' || item.type === 'customer';

    return (
      <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} lg={viewMode === 'grid' ? 4 : 12} key={item.id}>
        <Card
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[4],
            }
          }}
          onClick={() => handleItemClick(item)}
        >
          <CardContent sx={{ pb: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Avatar
                sx={{
                  backgroundColor: isRO ? theme.palette.primary.main : theme.palette.secondary.main,
                  mr: 2,
                  width: 48,
                  height: 48
                }}
              >
                {isRO ? <DirectionsCar /> : <Person />}
              </Avatar>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {isRO ? item.id : item.name}
                  </Typography>
                  
                  {isRO && (
                    <>
                      <Chip
                        label={item.status?.replace('_', ' ') || 'Unknown'}
                        size="small"
                        color={getStatusColor(item.status)}
                        sx={{ fontSize: '0.75rem' }}
                      />
                      {item.priority === 'high' && (
                        <Warning
                          sx={{ color: getPriorityColor(item.priority), fontSize: 20 }}
                        />
                      )}
                    </>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" noWrap>
                  {isRO ? `${item.customerName} • ${item.vehicleInfo}` : item.email}
                </Typography>
              </Box>
              
              <IconButton
                size="small"
                onClick={(e) => handleMenuClick(e, item)}
                sx={{ ml: 1 }}
              >
                <MoreVert />
              </IconButton>
            </Box>

            {/* Details */}
            <Box sx={{ pl: 7 }}>
              {isRO && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Receipt fontSize="small" color="action" />
                      <Typography variant="body2">
                        {item.claimNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Business fontSize="small" color="action" />
                      <Typography variant="body2">
                        {item.insurance}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AttachMoney fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${item.estimatedAmount?.toLocaleString() || 'TBD'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2">
                        {item.daysInShop || 0} days
                      </Typography>
                    </Box>
                  </Box>
                  
                  {item.vin && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <DirectionsCar fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {item.vin}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              
              {isCustomer && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">
                        {item.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {item.satisfaction}/5
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>
                      {item.address}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {item.totalROs} repair orders
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>

          {/* Quick Actions */}
          <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<Visibility />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAction('view', item);
                }}
              >
                View
              </Button>
              
              {isRO && (
                <Button
                  size="small"
                  startIcon={<Call />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction('call', item);
                  }}
                >
                  Call
                </Button>
              )}
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              {isRO && item.plate && `Plate: ${item.plate}`}
            </Typography>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Box className={className} {...props}>
      {/* Header with Filters and Sort */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Search Results
            {searchQuery && ` for "${searchQuery}"`}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({processedResults.length} found)
            </Typography>
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* View Mode Toggle */}
            <Tooltip title="List View">
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <ViewList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Grid View">
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <ViewModule />
              </IconButton>
            </Tooltip>
            
            {/* Filters Toggle */}
            {showFilters && (
              <Button
                startIcon={<FilterList />}
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                variant={showFiltersPanel ? 'contained' : 'outlined'}
                size="small"
              >
                Filters
              </Button>
            )}
          </Box>
        </Box>

        {/* Filters Panel */}
        <Collapse in={showFiltersPanel}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {filterOptions.statuses.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                {filterOptions.priorities.map(priority => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Insurance</InputLabel>
              <Select
                value={filters.insurance}
                label="Insurance"
                onChange={(e) => handleFilterChange('insurance', e.target.value)}
              >
                <MenuItem value="all">All Insurers</MenuItem>
                {filterOptions.insurances.map(insurance => (
                  <MenuItem key={insurance} value={insurance}>
                    {insurance}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="daysInShop">Days in Shop</MenuItem>
                <MenuItem value="customerName">Customer</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Collapse>
      </Paper>

      {/* Results */}
      {isLoading ? renderSkeleton() : (
        <Grid container spacing={2}>
          {processedResults.map((item, index) => renderResultCard(item, index))}
        </Grid>
      )}

      {/* Empty State */}
      {!isLoading && processedResults.length === 0 && results.length > 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No results match your filters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters to see more results
          </Typography>
          <Button
            sx={{ mt: 2 }}
            onClick={() => setFilters({
              status: 'all',
              priority: 'all',
              insurance: 'all',
              daysInShop: 'all',
              dateRange: 'all'
            })}
          >
            Clear Filters
          </Button>
        </Paper>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleQuickAction('view', selectedItem)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleQuickAction('edit', selectedItem)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleQuickAction('call', selectedItem)}>
          <Call sx={{ mr: 1 }} fontSize="small" />
          Call Customer
        </MenuItem>
        <MenuItem onClick={() => handleQuickAction('email', selectedItem)}>
          <Email sx={{ mr: 1 }} fontSize="small" />
          Email Customer
        </MenuItem>
        {selectedItem?.status === 'estimate' && (
          <MenuItem onClick={() => handleQuickAction('update-status', selectedItem)}>
            <TrendingUp sx={{ mr: 1 }} fontSize="small" />
            Update Status
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default SearchResults;