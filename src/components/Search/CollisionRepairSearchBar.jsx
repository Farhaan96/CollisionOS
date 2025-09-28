import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  Typography,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  Skeleton,
  Fade,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  DirectionsCar,
  Person,
  Receipt,
  Business,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Star,
  Warning,
  Close,
  Mic,
  QrCodeScanner,
  History,
  TrendingUp,
  CameraAlt,
  Assignment,
  LocalGasStation,
  AttachMoney,
  CalendarToday,
  Speed,
  Description,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../config/supabaseClient';

/**
 * CollisionRepairSearchBar - Enhanced search interface for collision repair workflow
 *
 * Features:
 * - Search by: RO#, Claim#, Plate, VIN (full or last 6), Customer name/phone
 * - Real-time suggestions with collision repair context
 * - Insurance company integration
 * - Parts status indicators
 * - Repair workflow status
 * - Quick actions (View RO, Call Customer, Update Status)
 * - Recent searches with collision repair context
 */
const CollisionRepairSearchBar = ({
  onSearchResults,
  onItemSelect,
  placeholder = 'Search RO#, Claim#, VIN, Customer, Phone...',
  showRecentSearches = true,
  showQuickActions = true,
  maxResults = 8,
  className,
  shopId,
  ...props
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('collisionRepairRecentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((item) => {
    const newSearch = {
      id: item.id,
      type: item.type,
      label: item.label,
      timestamp: new Date().toISOString(),
    };

    setRecentSearches(prev => {
      const filtered = prev.filter(search => search.id !== item.id);
      const updated = [newSearch, ...filtered].slice(0, 10);
      localStorage.setItem('collisionRepairRecentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Perform collision repair search
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const searchResults = [];
      const queryLower = query.toLowerCase();

      // Search repair orders
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
          damage_description,
          customers:customer_id (
            id,
            first_name,
            last_name,
            phone,
            email
          ),
          vehicles:vehicle_id (
            id,
            vin,
            year,
            make,
            model,
            trim,
            color,
            license_plate
          ),
          claims:claim_id (
            id,
            claim_number,
            insurance_companies:insurance_company_id (
              name,
              short_name
            )
          )
        `)
        .or(`ro_number.ilike.%${query}%,damage_description.ilike.%${query}%`)
        .eq('shop_id', shopId)
        .limit(maxResults);

      if (!roError && repairOrders) {
        repairOrders.forEach(ro => {
          searchResults.push({
            id: ro.id,
            type: 'repair_order',
            label: `RO ${ro.ro_number}`,
            subtitle: `${ro.customers?.first_name} ${ro.customers?.last_name} - ${ro.vehicles?.year} ${ro.vehicles?.make} ${ro.vehicles?.model}`,
            data: ro,
            relevance: calculateRelevance(query, [
              ro.ro_number,
              ro.customers?.first_name,
              ro.customers?.last_name,
              ro.vehicles?.make,
              ro.vehicles?.model,
              ro.claims?.claim_number
            ]),
            icon: Assignment,
            status: ro.status,
            priority: ro.priority,
            amount: ro.total_amount,
            customer: `${ro.customers?.first_name} ${ro.customers?.last_name}`,
            vehicle: `${ro.vehicles?.year} ${ro.vehicles?.make} ${ro.vehicles?.model}`,
            claim: ro.claims?.claim_number,
            insurance: ro.claims?.insurance_companies?.short_name,
          });
        });
      }

      // Search by VIN (full or last 6 digits)
      const vinQuery = query.length >= 6 ?
        (query.length === 17 ? query : `%${query}`) :
        null;

      if (vinQuery) {
        const { data: vehicles, error: vehicleError } = await supabase
          .from('vehicles')
          .select(`
            id,
            vin,
            year,
            make,
            model,
            trim,
            color,
            license_plate,
            customers:customer_id (
              id,
              first_name,
              last_name,
              phone
            ),
            repair_orders!repair_orders_vehicle_id_fkey (
              id,
              ro_number,
              status,
              total_amount,
              claims:claim_id (
                claim_number
              )
            )
          `)
          .ilike('vin', vinQuery)
          .limit(maxResults);

        if (!vehicleError && vehicles) {
          vehicles.forEach(vehicle => {
            const activeRO = vehicle.repair_orders?.find(ro =>
              ['estimate', 'in_progress', 'parts_pending'].includes(ro.status)
            );

            searchResults.push({
              id: `vehicle-${vehicle.id}`,
              type: 'vehicle',
              label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              subtitle: `VIN: ${vehicle.vin} | ${vehicle.customers?.first_name} ${vehicle.customers?.last_name}`,
              data: vehicle,
              relevance: calculateRelevance(query, [
                vehicle.vin,
                vehicle.make,
                vehicle.model,
                vehicle.license_plate
              ]),
              icon: DirectionsCar,
              vin: vehicle.vin,
              customer: `${vehicle.customers?.first_name} ${vehicle.customers?.last_name}`,
              activeRO: activeRO?.ro_number,
              roStatus: activeRO?.status,
            });
          });
        }
      }

      // Search claims by claim number
      const { data: claims, error: claimError } = await supabase
        .from('claims')
        .select(`
          id,
          claim_number,
          claim_status,
          incident_date,
          deductible,
          initial_estimate_amount,
          adjuster_name,
          customers:customer_id (
            first_name,
            last_name,
            phone
          ),
          vehicles:vehicle_id (
            year,
            make,
            model,
            vin
          ),
          insurance_companies:insurance_company_id (
            name,
            short_name
          ),
          repair_orders!repair_orders_claim_id_fkey (
            id,
            ro_number,
            status
          )
        `)
        .ilike('claim_number', `%${query}%`)
        .eq('shop_id', shopId)
        .limit(maxResults);

      if (!claimError && claims) {
        claims.forEach(claim => {
          searchResults.push({
            id: `claim-${claim.id}`,
            type: 'claim',
            label: `Claim ${claim.claim_number}`,
            subtitle: `${claim.insurance_companies?.short_name} - ${claim.customers?.first_name} ${claim.customers?.last_name}`,
            data: claim,
            relevance: calculateRelevance(query, [
              claim.claim_number,
              claim.customers?.first_name,
              claim.customers?.last_name
            ]),
            icon: Description,
            status: claim.claim_status,
            customer: `${claim.customers?.first_name} ${claim.customers?.last_name}`,
            vehicle: `${claim.vehicles?.year} ${claim.vehicles?.make} ${claim.vehicles?.model}`,
            insurance: claim.insurance_companies?.short_name,
            roNumber: claim.repair_orders?.[0]?.ro_number,
          });
        });
      }

      // Search customers by name or phone
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          type,
          vehicles!vehicles_customer_id_fkey (
            id,
            year,
            make,
            model,
            vin,
            repair_orders!repair_orders_vehicle_id_fkey (
              id,
              ro_number,
              status,
              total_amount
            )
          )
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('shop_id', shopId)
        .limit(maxResults);

      if (!customerError && customers) {
        customers.forEach(customer => {
          const activeROs = customer.vehicles?.flatMap(v =>
            v.repair_orders?.filter(ro =>
              ['estimate', 'in_progress', 'parts_pending'].includes(ro.status)
            ) || []
          ) || [];

          searchResults.push({
            id: `customer-${customer.id}`,
            type: 'customer',
            label: `${customer.first_name} ${customer.last_name}`,
            subtitle: `${customer.phone} | ${customer.vehicles?.length || 0} vehicles`,
            data: customer,
            relevance: calculateRelevance(query, [
              customer.first_name,
              customer.last_name,
              customer.phone,
              customer.email
            ]),
            icon: Person,
            phone: customer.phone,
            email: customer.email,
            vehicleCount: customer.vehicles?.length || 0,
            activeROCount: activeROs.length,
          });
        });
      }

      // Sort by relevance and limit results
      const sortedResults = searchResults
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxResults);

      setResults(sortedResults);
      if (onSearchResults) {
        onSearchResults(sortedResults);
      }

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, maxResults, onSearchResults]);

  // Calculate search relevance score
  const calculateRelevance = (query, fields) => {
    let score = 0;
    const queryLower = query.toLowerCase();

    fields.forEach(field => {
      if (field && typeof field === 'string') {
        const fieldLower = field.toLowerCase();
        if (fieldLower === queryLower) {
          score += 10; // Exact match
        } else if (fieldLower.startsWith(queryLower)) {
          score += 7; // Starts with
        } else if (fieldLower.includes(queryLower)) {
          score += 3; // Contains
        }
      }
    });

    return score;
  };

  // Handle search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm, performSearch]);

  // Handle item selection
  const handleItemSelect = useCallback((item) => {
    saveRecentSearch(item);
    setSearchTerm('');
    setIsOpen(false);

    if (onItemSelect) {
      onItemSelect(item);
    } else {
      // Default navigation based on item type
      switch (item.type) {
        case 'repair_order':
          navigate(`/ro/${item.data.id}`);
          break;
        case 'vehicle':
          navigate(`/vehicles/${item.data.id}`);
          break;
        case 'claim':
          navigate(`/claims/${item.data.id}`);
          break;
        case 'customer':
          navigate(`/customers/${item.data.id}`);
          break;
        default:
          console.log('Selected item:', item);
      }
    }
  }, [saveRecentSearch, onItemSelect, navigate]);

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback((recentItem) => {
    setSearchTerm(recentItem.label);
    performSearch(recentItem.label);
  }, [performSearch]);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    searchRef.current?.focus();
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get status color for items
  const getStatusColor = (status) => {
    const statusColors = {
      estimate: 'info',
      in_progress: 'warning',
      parts_pending: 'secondary',
      completed: 'success',
      delivered: 'primary',
      cancelled: 'error',
      open: 'info',
      closed: 'success',
    };
    return statusColors[status] || 'default';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const priorityColors = {
      low: 'success',
      normal: 'info',
      high: 'warning',
      urgent: 'error',
    };
    return priorityColors[priority] || 'default';
  };

  // Render search result item
  const renderResultItem = (item, index) => {
    const IconComponent = item.icon;

    return (
      <ListItem key={item.id} disablePadding>
        <ListItemButton
          onClick={() => handleItemSelect(item)}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
              <IconComponent fontSize="small" />
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {item.label}
                </Typography>
                {item.status && (
                  <Chip
                    label={item.status.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={getStatusColor(item.status)}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
                {item.priority && item.priority !== 'normal' && (
                  <Chip
                    label={item.priority.toUpperCase()}
                    size="small"
                    color={getPriorityColor(item.priority)}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            }
            secondary={
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  {item.subtitle}
                </Typography>
                {item.type === 'repair_order' && (
                  <Box display="flex" gap={1} alignItems="center">
                    {item.claim && (
                      <Chip label={item.claim} size="small" variant="outlined" />
                    )}
                    {item.insurance && (
                      <Chip label={item.insurance} size="small" variant="outlined" />
                    )}
                    {item.amount > 0 && (
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        ${item.amount.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                )}
                {item.type === 'vehicle' && item.activeRO && (
                  <Chip
                    label={`Active: ${item.activeRO}`}
                    size="small"
                    color={getStatusColor(item.roStatus)}
                  />
                )}
              </Stack>
            }
          />
          {showQuickActions && (
            <Box display="flex" gap={0.5}>
              {item.phone && (
                <Tooltip title="Call Customer">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${item.phone}`);
                    }}
                  >
                    <Phone fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {item.type === 'repair_order' && (
                <Tooltip title="View RO Details">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/ro/${item.data.id}`);
                    }}
                  >
                    <Assignment fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box ref={resultsRef} position="relative" className={className} {...props}>
      {/* Search Input */}
      <Paper
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          boxShadow: isOpen ? 3 : 1,
          borderRadius: 2,
        }}
      >
        <IconButton sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase
          ref={searchRef}
          sx={{ ml: 1, flex: 1 }}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm && results.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        {searchTerm && (
          <IconButton onClick={handleClear} aria-label="clear">
            <Close />
          </IconButton>
        )}
      </Paper>

      {/* Search Results Dropdown */}
      <Fade in={isOpen}>
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          {isLoading ? (
            <Box p={2}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : results.length > 0 ? (
            <List sx={{ p: 1 }}>
              {results.map(renderResultItem)}
            </List>
          ) : searchTerm.length >= 2 ? (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">
                No results found for "{searchTerm}"
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Try searching by RO#, Claim#, VIN, Customer name, or Phone
              </Typography>
            </Box>
          ) : showRecentSearches && recentSearches.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }} color="text.secondary">
                Recent Searches
              </Typography>
              <List sx={{ p: 1 }}>
                {recentSearches.slice(0, 5).map((recent) => (
                  <ListItem key={recent.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleRecentSearchSelect(recent)}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemIcon>
                        <History color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={recent.label}
                        secondary={`${recent.type} • ${new Date(recent.timestamp).toLocaleDateString()}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </Paper>
      </Fade>
    </Box>
  );
};

export default CollisionRepairSearchBar;