import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * GlobalSearchBar - Primary search interface for collision repair workflow
 *
 * Features:
 * - Search by: RO#, Claim#, Plate, VIN last 6, Customer name/phone
 * - Real-time suggestions with preview cards
 * - Recent searches and favorites
 * - Voice search integration
 * - Barcode/QR code scanning for VIN
 * - Contextual actions (View RO, Call Customer, Update Status)
 */
const GlobalSearchBar = ({
  onSearchResults,
  onItemSelect,
  placeholder = 'Search RO#, Claim#, VIN, Customer, Phone...',
  showRecentSearches = true,
  showVoiceSearch = true,
  showBarcodeScanner = true,
  maxResults = 8,
  className,
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
  const [isListening, setIsListening] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mock data for demonstration - replace with actual API calls
  const mockData = {
    repairOrders: [
      {
        id: 'RO-2024-001234',
        type: 'repair_order',
        customerName: 'John Smith',
        vehicleInfo: '2023 Toyota Camry',
        vin: 'JTNKARJE5P3001234',
        plate: 'ABC-123',
        claimNumber: 'CL-789456',
        status: 'in_progress',
        priority: 'normal',
        estimatedAmount: 4250.0,
        daysinShop: 3,
        insurance: 'State Farm',
      },
      {
        id: 'RO-2024-001235',
        type: 'repair_order',
        customerName: 'Sarah Johnson',
        vehicleInfo: '2022 Honda Civic',
        vin: 'JHMFK7J71NS001235',
        plate: 'XYZ-789',
        claimNumber: 'CL-456123',
        status: 'estimate',
        priority: 'high',
        estimatedAmount: 2800.0,
        daysInShop: 1,
        insurance: 'Allstate',
      },
    ],
    customers: [
      {
        id: 'CUST-001',
        type: 'customer',
        name: 'Mike Rodriguez',
        phone: '(555) 123-4567',
        email: 'mike.rodriguez@email.com',
        address: '123 Main St, City, State',
        totalROs: 3,
        satisfaction: 4.8,
      },
    ],
  };

  // Search function with fuzzy matching
  const performSearch = useCallback(
    async query => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));

        const queryLower = query.toLowerCase();
        const searchResults = [];

        // Search repair orders
        mockData.repairOrders.forEach(ro => {
          const matches = [
            ro.id.toLowerCase().includes(queryLower),
            ro.customerName.toLowerCase().includes(queryLower),
            ro.vin.toLowerCase().includes(queryLower),
            ro.plate.toLowerCase().includes(queryLower),
            ro.claimNumber.toLowerCase().includes(queryLower),
            ro.vehicleInfo.toLowerCase().includes(queryLower),
          ];

          if (matches.some(match => match)) {
            searchResults.push({
              ...ro,
              relevance: matches.filter(Boolean).length,
              searchType: 'repair_order',
            });
          }
        });

        // Search customers
        mockData.customers.forEach(customer => {
          const matches = [
            customer.name.toLowerCase().includes(queryLower),
            customer.phone.includes(query),
            customer.email.toLowerCase().includes(queryLower),
          ];

          if (matches.some(match => match)) {
            searchResults.push({
              ...customer,
              relevance: matches.filter(Boolean).length,
              searchType: 'customer',
            });
          }
        });

        // Sort by relevance
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
    },
    [maxResults, onSearchResults]
  );

  // Effect to perform search when debounced term changes
  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, performSearch]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('collisionos_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Handle search input change
  const handleSearchChange = event => {
    const value = event.target.value;
    setSearchTerm(value);
    setIsOpen(true);
  };

  // Handle item selection
  const handleItemSelect = useCallback(
    item => {
      // Save to recent searches
      const newRecentSearches = [
        { ...item, searchedAt: new Date().toISOString() },
        ...recentSearches.filter(rs => rs.id !== item.id).slice(0, 9),
      ];
      setRecentSearches(newRecentSearches);
      localStorage.setItem(
        'collisionos_recent_searches',
        JSON.stringify(newRecentSearches)
      );

      // Close search
      setIsOpen(false);
      setSearchTerm('');

      // Navigate or callback
      if (onItemSelect) {
        onItemSelect(item);
      } else {
        navigateToItem(item);
      }
    },
    [recentSearches, onItemSelect]
  );

  // Navigation logic
  const navigateToItem = item => {
    switch (item.searchType || item.type) {
      case 'repair_order':
        navigate(`/production?ro=${item.id}&view=details`);
        break;
      case 'customer':
        navigate(`/customers?id=${item.id}&view=profile`);
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  // Quick actions for items
  const getQuickActions = item => {
    const actions = [];

    if (item.searchType === 'repair_order') {
      actions.push(
        { icon: Receipt, label: 'View RO', action: () => navigateToItem(item) },
        {
          icon: Phone,
          label: 'Call Customer',
          action: () => handleCallCustomer(item),
        }
      );

      if (item.status === 'estimate') {
        actions.push({
          icon: TrendingUp,
          label: 'Update Status',
          action: () => handleUpdateStatus(item),
        });
      }
    }

    if (item.searchType === 'customer') {
      actions.push(
        {
          icon: Person,
          label: 'View Profile',
          action: () => navigateToItem(item),
        },
        { icon: Phone, label: 'Call', action: () => handleCallCustomer(item) },
        { icon: Email, label: 'Email', action: () => handleEmailCustomer(item) }
      );
    }

    return actions;
  };

  // Action handlers
  const handleCallCustomer = item => {
    const phone = item.phone || '(555) 123-4567';
    window.open(`tel:${phone}`);
  };

  const handleEmailCustomer = item => {
    const email = item.email || 'customer@email.com';
    window.open(`mailto:${email}`);
  };

  const handleUpdateStatus = item => {
    navigate(`/production?ro=${item.id}&action=update-status`);
  };

  // Voice search (mock implementation)
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);
    recognition.start();

    recognition.onresult = event => {
      const result = event.results[0][0].transcript;
      setSearchTerm(result);
      setIsOpen(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert('Voice search error occurred');
    };
  };

  // Barcode scanner (mock implementation)
  const handleBarcodeScanner = () => {
    // In real implementation, would integrate with camera API
    alert('Barcode scanner would open camera to scan VIN barcode');
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render result item
  const renderResultItem = (item, index) => {
    const isRO = item.searchType === 'repair_order';
    const isCustomer = item.searchType === 'customer';
    const actions = getQuickActions(item);

    return (
      <ListItem key={item.id} disablePadding>
        <ListItemButton
          onClick={() => handleItemSelect(item)}
          sx={{
            py: 2,
            px: 2,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: isRO
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
              }}
            >
              {isRO ? <DirectionsCar /> : <Person />}
            </Avatar>
          </ListItemIcon>

          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                  {isRO ? item.id : item.name}
                </Typography>
                {isRO && (
                  <>
                    <Chip
                      label={item.status.replace('_', ' ')}
                      size='small'
                      color={
                        item.status === 'in_progress' ? 'primary' : 'default'
                      }
                      sx={{ fontSize: '0.75rem' }}
                    />
                    {item.priority === 'high' && (
                      <Warning color='warning' fontSize='small' />
                    )}
                  </>
                )}
                {isCustomer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star fontSize='small' color='primary' />
                    <Typography variant='caption'>
                      {item.satisfaction}
                    </Typography>
                  </Box>
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  {isRO && (
                    <>
                      {item.customerName} • {item.vehicleInfo}
                      <br />
                      Claim: {item.claimNumber} • {item.insurance}
                      <br />${item.estimatedAmount.toLocaleString()} •{' '}
                      {item.daysInShop} days
                    </>
                  )}
                  {isCustomer && (
                    <>
                      {item.phone} • {item.email}
                      <br />
                      {item.address}
                      <br />
                      {item.totalROs} repair orders
                    </>
                  )}
                </Typography>
              </Box>
            }
          />

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
            {actions.slice(0, isMobile ? 1 : 3).map((action, actionIndex) => (
              <Tooltip key={actionIndex} title={action.label}>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    action.action();
                  }}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <action.icon fontSize='small' />
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </ListItemButton>
      </ListItem>
    );
  };

  // Render recent searches
  const renderRecentSearches = () => {
    if (!showRecentSearches || recentSearches.length === 0) return null;

    return (
      <>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Recent Searches
          </Typography>
        </Box>
        {recentSearches
          .slice(0, 4)
          .map((item, index) => renderResultItem(item, `recent-${index}`))}
        <Divider />
      </>
    );
  };

  return (
    <Box
      sx={{ position: 'relative', width: '100%', maxWidth: 600 }}
      className={className}
      {...props}
    >
      {/* Search Input */}
      <Paper
        ref={searchRef}
        elevation={isOpen ? 3 : 1}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[2],
          },
        }}
      >
        <IconButton sx={{ p: '10px' }} aria-label='search'>
          <SearchIcon />
        </IconButton>

        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          inputProps={{ 'aria-label': 'global search' }}
        />

        {/* Voice Search */}
        {showVoiceSearch && (
          <Tooltip title='Voice Search'>
            <IconButton
              sx={{ p: '10px' }}
              onClick={handleVoiceSearch}
              color={isListening ? 'primary' : 'default'}
            >
              <Mic />
            </IconButton>
          </Tooltip>
        )}

        {/* Barcode Scanner */}
        {showBarcodeScanner && (
          <Tooltip title='Scan VIN Barcode'>
            <IconButton sx={{ p: '10px' }} onClick={handleBarcodeScanner}>
              <QrCodeScanner />
            </IconButton>
          </Tooltip>
        )}

        {/* Clear Search */}
        {searchTerm && (
          <IconButton
            sx={{ p: '10px' }}
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setIsOpen(false);
            }}
          >
            <Close />
          </IconButton>
        )}
      </Paper>

      {/* Search Results */}
      {isOpen && (
        <Fade in={isOpen}>
          <Paper
            ref={resultsRef}
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1300,
              maxHeight: 500,
              overflow: 'auto',
              mt: 1,
            }}
          >
            <List sx={{ py: 0 }}>
              {/* Loading State */}
              {isLoading && (
                <>
                  {[...Array(3)].map((_, index) => (
                    <ListItem key={`skeleton-${index}`} sx={{ py: 2 }}>
                      <ListItemIcon>
                        <Skeleton variant='circular' width={40} height={40} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Skeleton variant='text' width='60%' />}
                        secondary={
                          <>
                            <Skeleton variant='text' width='80%' />
                            <Skeleton variant='text' width='40%' />
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </>
              )}

              {/* Recent Searches (when no search term) */}
              {!searchTerm && !isLoading && renderRecentSearches()}

              {/* Search Results */}
              {!isLoading && results.length > 0 && (
                <>
                  {searchTerm && (
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Search Results ({results.length})
                      </Typography>
                    </Box>
                  )}
                  {results.map((item, index) => renderResultItem(item, index))}
                </>
              )}

              {/* No Results */}
              {!isLoading && searchTerm && results.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        align='center'
                      >
                        No results found for "{searchTerm}"
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default GlobalSearchBar;
