import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Assignment,
  DirectionsCar,
  Person,
  Receipt,
  Clear
} from '@mui/icons-material';
import { searchRepairOrders } from '../../services/roService';
import { toast } from 'react-hot-toast';

/**
 * CollisionRepairSearchBar - Advanced search for collision repair workflow
 *
 * Features:
 * - Search by RO#, Claim#, VIN, Customer name, phone
 * - Real-time search with debouncing
 * - Categorized results with icons
 * - Quick actions and navigation
 */
const CollisionRepairSearchBar = ({
  shopId,
  onSearchResults,
  onItemSelect,
  placeholder = "Search RO#, Claim#, VIN, Customer...",
  showQuickActions = false,
  maxResults = 20
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (searchQuery) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (searchQuery.trim().length >= 2) {
            await performSearch(searchQuery);
          } else {
            setResults([]);
            setShowResults(false);
          }
        }, 300);
      };
    })(),
    []
  );

  // Perform search
  const performSearch = async (searchQuery) => {
    if (!shopId) return;

    setIsSearching(true);
    try {
      const result = await searchRepairOrders(searchQuery, {
        shopId,
        limit: maxResults
      });

      if (result.success) {
        const formattedResults = result.data.map(ro => ({
          id: ro.id,
          type: 'repair_order',
          title: ro.ro_number,
          subtitle: `${ro.customer?.first_name} ${ro.customer?.last_name}`,
          description: `${ro.vehicle?.year} ${ro.vehicle?.make} ${ro.vehicle?.model}`,
          status: ro.status,
          priority: ro.priority,
          data: ro
        }));

        setResults(formattedResults);
        setShowResults(true);
        
        if (onSearchResults) {
          onSearchResults(formattedResults);
        }
      } else {
        console.error('Search failed:', result.error);
        toast.error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change
  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle result selection
  const handleResultSelect = (result) => {
    setShowResults(false);
    setQuery('');
    if (onItemSelect) {
      onItemSelect(result);
    }
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  // Get result icon
  const getResultIcon = (type) => {
    switch (type) {
      case 'repair_order':
        return <Assignment />;
      case 'vehicle':
        return <DirectionsCar />;
      case 'customer':
        return <Person />;
      case 'claim':
        return <Receipt />;
      default:
        return <SearchIcon />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'estimate':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'parts_pending':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'delivered':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 2, position: 'relative' }}>
      <TextField
        fullWidth
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {isSearching ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon color="action" />
              )}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton onClick={handleClear} size="small">
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper'
          }
        }}
      />

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            boxShadow: 3
          }}
        >
          <List dense>
            {results.map((result, index) => (
              <React.Fragment key={result.id}>
                <ListItem
                  button
                  onClick={() => handleResultSelect(result)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    {getResultIcon(result.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {result.title}
                        </Typography>
                        <Chip
                          label={result.status}
                          size="small"
                          color={getStatusColor(result.status)}
                          variant="outlined"
                        />
                        {result.priority === 'urgent' && (
                          <Chip
                            label="Urgent"
                            size="small"
                            color="error"
                            variant="filled"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {result.subtitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {result.description}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !isSearching && query.length >= 2 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            p: 2,
            boxShadow: 3
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No results found for "{query}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default CollisionRepairSearchBar;
