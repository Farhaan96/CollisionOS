import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Collapse,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search,
  Close,
  QrCode,
  DirectionsCar,
  ShoppingCart,
  Compare,
  Visibility,
  PhotoCamera,
  Star,
  TrendingUp,
  TrendingDown,
  ExpandMore,
  ExpandLess,
  FilterList,
  Clear
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { partsService } from '../../services/partsService';

// Utility function for currency formatting
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Parts suppliers configuration
const PARTS_SUPPLIERS = {
  oem_direct: { name: 'OEM Direct', type: 'OEM', color: '#1976d2', rating: 4.8, deliveryTime: '2-5 days' },
  oe_connection: { name: 'OE Connection', type: 'OEM', color: '#2e7d32', rating: 4.6, deliveryTime: '1-3 days' },
  parts_trader: { name: 'PartsTrader', type: 'Aftermarket', color: '#ed6c02', rating: 4.4, deliveryTime: '1-2 days' },
  lkq: { name: 'LKQ/Recycled', type: 'Recycled', color: '#388e3c', rating: 4.2, deliveryTime: '1-4 days' },
  remanufactured: { name: 'Remanufactured Pro', type: 'Remanufactured', color: '#7b1fa2', rating: 4.5, deliveryTime: '3-7 days' }
};

const PART_CATEGORIES = {
  body: { label: 'Body Parts', color: '#1976d2' },
  mechanical: { label: 'Mechanical', color: '#f57c00' },
  electrical: { label: 'Electrical', color: '#7b1fa2' },
  interior: { label: 'Interior', color: '#d32f2f' },
  glass: { label: 'Glass', color: '#1565c0' },
  consumables: { label: 'Consumables', color: '#2e7d32' }
};

const PartsSearchDialog = ({ open, onClose, onAddParts }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState({ make: '', model: '', year: '', category: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [priceComparison, setPriceComparison] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filters, setFilters] = useState({
    partType: '',
    supplier: '',
    category: '',
    priceRange: [0, 1000]
  });
  const scannerRef = useRef(null);

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setErrorMessage('');
    try {
      const results = await partsService.searchParts(searchTerm, filters);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setErrorMessage('Failed to search parts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle vehicle search
  const handleVehicleSearch = async () => {
    const { make, model, year, category } = vehicleSearch;
    if (!make || !model || !year) return;
    
    setLoading(true);
    setErrorMessage('');
    try {
      const results = await partsService.searchPartsByVehicle(make, model, year, category);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Vehicle search failed:', error);
      setSearchResults([]);
      setErrorMessage('Failed to search parts for this vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle price comparison
  const handlePriceComparison = async (partNumber) => {
    setLoading(true);
    try {
      const comparison = await partsService.comparePrices(partNumber, Object.keys(PARTS_SUPPLIERS));
      setPriceComparison(Array.isArray(comparison) ? comparison : []);
    } catch (error) {
      console.error('Price comparison failed:', error);
      setPriceComparison([]);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    if (!barcode?.trim()) return;
    
    setLoading(true);
    try {
      const result = await partsService.lookupByBarcode(barcode);
      setSearchResults(result ? [result] : []);
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      setSearchResults([]);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  // Toggle part selection
  const togglePartSelection = (part) => {
    setSelectedParts(prev => {
      const isSelected = prev.find(p => p.id === part.id);
      if (isSelected) {
        return prev.filter(p => p.id !== part.id);
      } else {
        return [...prev, part];
      }
    });
  };

  // Add selected parts
  const handleAddSelectedParts = () => {
    if (selectedParts.length > 0) {
      onAddParts(selectedParts);
      setSelectedParts([]);
      onClose();
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      partType: '',
      supplier: '',
      category: '',
      priceRange: [0, 1000]
    });
  };

  // Search Result Card Component
  const SearchResultCard = ({ part, index }) => {
    const isSelected = selectedParts.find(p => p.id === part.id);
    const isExpanded = expandedCard === part.id;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card
          sx={{
            mb: 2,
            border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
            borderColor: isSelected ? 'primary.main' : 'divider',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: theme.shadows[4],
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {part.partNumber || 'Unknown Part Number'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {part.description || 'No description available'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {part.category && (
                    <Chip
                      size="small"
                      label={PART_CATEGORIES[part.category]?.label || part.category}
                      sx={{
                        backgroundColor: alpha(PART_CATEGORIES[part.category]?.color || '#666', 0.1),
                        color: PART_CATEGORIES[part.category]?.color || '#666'
                      }}
                    />
                  )}
                  {part.partType && (
                    <Chip
                      size="small"
                      label={part.partType.toUpperCase()}
                      variant="outlined"
                    />
                  )}
                  {part.fits && (
                    <Chip
                      size="small"
                      icon={<DirectionsCar />}
                      label={`Fits: ${part.fits}`}
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {part.price ? formatCurrency(part.price) : 'Price not available'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedCard(isExpanded ? null : part.id)}
                  >
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handlePriceComparison(part.partNumber)}
                  >
                    <Compare />
                  </IconButton>
                  <Button
                    variant={isSelected ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => togglePartSelection(part)}
                    sx={{ minWidth: 80 }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </Box>
              </Box>
            </Box>
            
            {/* Expanded Details */}
            <Collapse in={isExpanded}>
              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Supplier Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: part.supplier?.color }}>
                        {part.supplier?.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{part.supplier?.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="caption">{part.supplier?.rating}/5.0</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Delivery: {part.supplier?.deliveryTime}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Part Details
                    </Typography>
                    {part.oemPartNumber && (
                      <Typography variant="body2">OEM #: {part.oemPartNumber}</Typography>
                    )}
                    {part.warranty && (
                      <Typography variant="body2">Warranty: {part.warranty}</Typography>
                    )}
                    <Typography variant="body2">
                      Availability: {part.availability || 'In Stock'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Price Comparison Component
  const PriceComparisonTable = () => {
    if (priceComparison.length === 0) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Price Comparison
        </Typography>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Supplier</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Shipping</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Delivery</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {priceComparison.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: item.supplier.color }}>
                        {item.supplier.name.charAt(0)}
                      </Avatar>
                      {item.supplier.name}
                    </Box>
                  </TableCell>
                  <TableCell>{item.supplier.type}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>{formatCurrency(item.shipping)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.price + item.shipping)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="caption">{item.supplier.rating}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{item.supplier.deliveryTime}</Typography>
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Search Parts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedParts.length > 0 && (
              <Chip
                label={`${selectedParts.length} selected`}
                color="primary"
                size="small"
              />
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Search Tabs */}
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Text Search" />
          <Tab label="Vehicle Search" />
          <Tab label="Barcode Scan" />
        </Tabs>

        {/* Text Search */}
        {activeTab === 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search by part number, description, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : <Search />}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Part Type</InputLabel>
                <Select
                  value={filters.partType}
                  onChange={(e) => setFilters(prev => ({ ...prev, partType: e.target.value }))}
                  label="Part Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="oem">OEM</MenuItem>
                  <MenuItem value="aftermarket">Aftermarket</MenuItem>
                  <MenuItem value="recycled">Recycled</MenuItem>
                  <MenuItem value="remanufactured">Remanufactured</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
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

              <Button
                startIcon={<Clear />}
                onClick={clearFilters}
                sx={{ alignSelf: 'flex-start' }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        )}

        {/* Vehicle Search */}
        {activeTab === 1 && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Make"
                  value={vehicleSearch.make}
                  onChange={(e) => setVehicleSearch(prev => ({ ...prev, make: e.target.value }))}
                  placeholder="Toyota, Ford, etc."
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Model"
                  value={vehicleSearch.model}
                  onChange={(e) => setVehicleSearch(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Camry, F-150, etc."
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  value={vehicleSearch.year}
                  onChange={(e) => setVehicleSearch(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="2022"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={vehicleSearch.category}
                    onChange={(e) => setVehicleSearch(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                  >
                    <MenuItem value="">All</MenuItem>
                    {Object.entries(PART_CATEGORIES).map(([key, category]) => (
                      <MenuItem key={key} value={key}>{category.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleVehicleSearch}
                  disabled={loading || !vehicleSearch.make || !vehicleSearch.model || !vehicleSearch.year}
                  sx={{ height: '100%' }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Barcode Scan */}
        {activeTab === 2 && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Click the camera button to activate barcode scanning, or enter a barcode manually.
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Enter barcode or part number"
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeScan(e.target.value)}
              />
              <Button
                variant="outlined"
                startIcon={<QrCode />}
                onClick={() => {
                  // Implement barcode scanner activation
                }}
              >
                Scan
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => {
                  // Implement photo recognition
                }}
              >
                Photo
              </Button>
            </Box>
          </Box>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Typography variant="h6" gutterBottom>
                Search Results ({searchResults.length} found)
              </Typography>
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {searchResults.map((part, index) => (
                  <SearchResultCard key={part.id || index} part={part} index={index} />
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Price Comparison */}
        <PriceComparisonTable />

        {/* No Results */}
        {!loading && searchResults.length === 0 && (searchTerm || vehicleSearch.make) && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            py: 4,
            color: 'text.secondary'
          }}>
            <Search sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>No parts found</Typography>
            <Typography variant="body2" textAlign="center">
              Try adjusting your search criteria or filters
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAddSelectedParts}
          disabled={selectedParts.length === 0}
          startIcon={<ShoppingCart />}
        >
          Add Selected Parts ({selectedParts.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartsSearchDialog;