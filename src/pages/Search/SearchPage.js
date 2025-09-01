import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp,
  History,
  Star,
} from '@mui/icons-material';
import { GlobalSearchBar, SearchResults } from '../../components/Search';
import { useNavigate } from 'react-router-dom';

/**
 * SearchPage - Comprehensive search interface for collision repair workflow
 * Primary entry point for finding ROs, Claims, Customers, and Vehicles
 */
const SearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Popular searches
  const popularSearches = [
    { label: 'Active Repairs', query: 'status:in_progress', count: 24 },
    { label: 'Ready for Pickup', query: 'status:ready_for_pickup', count: 6 },
    { label: 'Parts Hold', query: 'status:parts_hold', count: 8 },
    { label: 'State Farm Claims', query: 'insurance:"State Farm"', count: 12 },
    { label: 'High Priority', query: 'priority:high', count: 5 },
  ];

  // Recent searches from localStorage
  const [recentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem('collisionos_recent_searches');
      return stored ? JSON.parse(stored).slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  // Handle search results
  const handleSearchResults = useCallback(results => {
    setSearchResults(results);
    setIsLoading(false);
  }, []);

  // Handle search query change
  const handleSearchQueryChange = useCallback(query => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsLoading(true);
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, []);

  // Handle item selection
  const handleItemSelect = useCallback(item => {
    // Navigation will be handled by the search bar component
    console.log('Item selected:', item);
  }, []);

  // Handle popular search click
  const handlePopularSearch = searchTerm => {
    // This would trigger a search with the specific query
    console.log('Popular search:', searchTerm);
    setSearchQuery(searchTerm.query);
  };

  return (
    <Container maxWidth='lg'>
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <SearchIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant='h3' sx={{ fontWeight: 600, mb: 2 }}>
            Find Anything
          </Typography>
          <Typography variant='h6' color='text.secondary' sx={{ mb: 4 }}>
            Search repair orders, claims, customers, and vehicles instantly
          </Typography>

          {/* Main Search Bar */}
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <GlobalSearchBar
              onSearchResults={handleSearchResults}
              onItemSelect={handleItemSelect}
              placeholder='Search by RO#, Claim#, VIN last 6, Customer name or phone...'
              showRecentSearches={true}
              showVoiceSearch={true}
              showBarcodeScanner={true}
              maxResults={12}
              sx={{ mb: 4 }}
            />
          </Box>
        </Box>

        {/* Search Results */}
        {(searchResults.length > 0 || isLoading) && (
          <SearchResults
            results={searchResults}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onItemSelect={handleItemSelect}
            showFilters={true}
            showSortOptions={true}
            defaultView='grid'
            sx={{ mb: 4 }}
          />
        )}

        {/* Popular Searches & Recent Searches (shown when no search active) */}
        {searchQuery.length < 2 && (
          <Box>
            {/* Popular Searches */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography
                variant='h6'
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
              >
                <TrendingUp />
                Popular Searches
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {popularSearches.map((search, index) => (
                  <Chip
                    key={index}
                    label={`${search.label} (${search.count})`}
                    variant='outlined'
                    clickable
                    onClick={() => handlePopularSearch(search)}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main + '10',
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography
                  variant='h6'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
                >
                  <History />
                  Recent Searches
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {recentSearches.map((item, index) => (
                    <Chip
                      key={index}
                      label={item.id || item.name}
                      variant='outlined'
                      clickable
                      onClick={() => handleItemSelect(item)}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.secondary.main + '10',
                          borderColor: theme.palette.secondary.main,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            )}

            {/* Search Tips */}
            <Paper sx={{ p: 3 }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Search Tips
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  grid: '1fr 1fr / 1fr',
                  gap: 2,
                  '@media (max-width: 768px)': { grid: '1fr' },
                }}
              >
                <Box>
                  <Typography
                    variant='subtitle2'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Quick Searches
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    • RO-2024-001234 (Repair Order)
                    <br />
                    • CL-789456 (Claim Number)
                    <br />
                    • 001234 (VIN last 6 digits)
                    <br />• ABC-123 (License Plate)
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant='subtitle2'
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Customer Searches
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    • John Smith (Customer Name)
                    <br />
                    • (555) 123-4567 (Phone Number)
                    <br />
                    • john@email.com (Email Address)
                    <br />• 2023 Toyota Camry (Vehicle)
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => console.log('Voice search help')}
                >
                  🎤 Voice Search Available
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => console.log('Barcode scanner help')}
                >
                  📷 Scan VIN Barcodes
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => navigate('/help/search')}
                >
                  📖 Advanced Search Guide
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SearchPage;
