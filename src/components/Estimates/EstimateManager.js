import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  useTheme
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  FileCopy,
  Print,
  Email,
  Download,
  Upload,
  Search,
  FilterList,
  MoreVert,
  ExpandMore,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Error,
  Info,
  Build,
  Palette,
  DirectionsCar,
  Assignment,
  AttachMoney,
  Schedule,
  History,
  Compare,
  Calculate,
  PhotoCamera,
  CloudUpload,
  Integration,
  Sync,
  AutoAwesome,
  Timeline
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Integration systems based on Instructions document
const INTEGRATION_SYSTEMS = {
  ccc_one: {
    name: 'CCC ONE',
    icon: '🔗',
    color: '#1976d2',
    features: ['XML Import', 'Real-time Sync', 'Parts Pricing', 'Labor Times']
  },
  mitchell: {
    name: 'Mitchell Cloud',
    icon: '☁️',
    color: '#2e7d32',
    features: ['BMS Import', 'Estimate Sync', 'Photo Integration', 'Supplements']
  },
  audatex: {
    name: 'Audatex/Qapter',
    icon: '📊',
    color: '#ed6c02',
    features: ['Direct Exchange', 'Part Recommendations', 'Repair Methods']
  },
  web_est: {
    name: 'Web-Est',
    icon: '🌐',
    color: '#9c27b0',
    features: ['Automated Import', 'Damage Analysis', 'Photo Estimating']
  }
};

// Estimate status workflow
const ESTIMATE_STATUSES = {
  draft: { label: 'Draft', color: '#757575', icon: Edit },
  in_progress: { label: 'In Progress', color: '#2196f3', icon: Build },
  review: { label: 'Under Review', color: '#ff9800', icon: Visibility },
  approved: { label: 'Approved', color: '#4caf50', icon: CheckCircle },
  declined: { label: 'Declined', color: '#f44336', icon: Error },
  supplement: { label: 'Supplement', color: '#9c27b0', icon: Add },
  final: { label: 'Final', color: '#2e7d32', icon: Assignment }
};

// Damage categories
const DAMAGE_CATEGORIES = {
  body: { label: 'Body Damage', color: '#1976d2' },
  paint: { label: 'Paint Damage', color: '#e91e63' },
  mechanical: { label: 'Mechanical', color: '#ff5722' },
  electrical: { label: 'Electrical', color: '#9c27b0' },
  interior: { label: 'Interior', color: '#795548' },
  glass: { label: 'Glass', color: '#607d8b' },
  structural: { label: 'Structural', color: '#f44336' }
};

const EstimateManager = ({ vehicleId, customerId, onEstimateCreate, onEstimateUpdate }) => {
  const theme = useTheme();
  const fileInputRef = useRef();
  
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [integrationDialog, setIntegrationDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [aiAnalysisDialog, setAiAnalysisDialog] = useState(false);
  const [supplementDialog, setSupplementDialog] = useState(false);
  const [priceComparisonDialog, setPriceComparisonDialog] = useState(false);

  // Sample data for development
  const sampleEstimates = [
    {
      id: '1',
      estimateNumber: 'EST-2024-001',
      status: 'approved',
      createdDate: '2024-01-15',
      updatedDate: '2024-01-16',
      customer: { name: 'John Smith', phone: '(555) 123-4567' },
      vehicle: { year: 2022, make: 'Toyota', model: 'Camry', vin: '1234567890' },
      insurance: { company: 'State Farm', claimNumber: 'SF-123456' },
      damageDescription: 'Front end collision damage, bumper and headlight replacement needed',
      totalAmount: 4250.00,
      laborAmount: 2800.00,
      partsAmount: 1200.00,
      materialsAmount: 250.00,
      estimator: 'Mike Johnson',
      version: 1,
      supplements: []
    },
    {
      id: '2',
      estimateNumber: 'EST-2024-002',
      status: 'in_progress',
      createdDate: '2024-01-16',
      updatedDate: '2024-01-16',
      customer: { name: 'Sarah Wilson', phone: '(555) 987-6543' },
      vehicle: { year: 2021, make: 'Honda', model: 'Civic', vin: '0987654321' },
      insurance: { company: 'Allstate', claimNumber: 'AL-789012' },
      damageDescription: 'Rear quarter panel damage, requires metalwork and paint',
      totalAmount: 3150.00,
      laborAmount: 2100.00,
      partsAmount: 800.00,
      materialsAmount: 250.00,
      estimator: 'Lisa Chen',
      version: 1,
      supplements: []
    }
  ];

  useEffect(() => {
    setEstimates(sampleEstimates);
  }, []);

  // Create new estimate
  const handleCreateEstimate = () => {
    setSelectedEstimate(null);
    setDialogOpen(true);
  };

  // Edit existing estimate
  const handleEditEstimate = (estimate) => {
    setSelectedEstimate(estimate);
    setDialogOpen(true);
  };

  // Import from integration system
  const handleImportEstimate = async (systemId, data) => {
    setLoading(true);
    try {
      // Simulate API call to import estimate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newEstimate = {
        id: Date.now().toString(),
        estimateNumber: `EST-${new Date().getFullYear()}-${String(estimates.length + 1).padStart(3, '0')}`,
        status: 'draft',
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
        importedFrom: systemId,
        ...data
      };
      
      setEstimates(prev => [...prev, newEstimate]);
      setIntegrationDialog(false);
      
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI-powered damage analysis
  const handleAIAnalysis = async (photos) => {
    setLoading(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analysisResults = {
        confidence: 85,
        damageAreas: [
          { area: 'Front Bumper', severity: 'Major', confidence: 90 },
          { area: 'Right Headlight', severity: 'Complete', confidence: 95 },
          { area: 'Hood', severity: 'Minor', confidence: 75 }
        ],
        estimatedCost: 4200,
        recommendedActions: [
          'Replace front bumper cover',
          'Replace right headlight assembly',
          'Repair and repaint hood'
        ]
      };
      
      return analysisResults;
    } finally {
      setLoading(false);
    }
  };

  // Parts price comparison
  const getPartsComparison = async (partNumber) => {
    // Simulate parts price comparison from multiple suppliers
    return [
      { supplier: 'OEM Direct', price: 450.00, availability: 'In Stock', warranty: '24 months' },
      { supplier: 'Aftermarket Plus', price: 285.00, availability: '2-3 days', warranty: '12 months' },
      { supplier: 'LKQ Recycled', price: 175.00, availability: 'In Stock', warranty: '6 months' },
      { supplier: 'Remanufactured Pro', price: 320.00, availability: '1 week', warranty: '18 months' }
    ];
  };

  // Estimate line items component
  const EstimateLineItems = ({ estimate }) => {
    const [lineItems, setLineItems] = useState([
      {
        id: '1',
        category: 'body',
        operation: 'Replace',
        description: 'Front Bumper Cover',
        partNumber: 'TOY-52119-06903',
        quantity: 1,
        laborHours: 2.5,
        laborRate: 65.00,
        partPrice: 450.00,
        materialCost: 25.00,
        total: 637.50
      },
      {
        id: '2',
        category: 'electrical',
        operation: 'Replace',
        description: 'Right Headlight Assembly',
        partNumber: 'TOY-81130-06861',
        quantity: 1,
        laborHours: 1.0,
        laborRate: 65.00,
        partPrice: 380.00,
        materialCost: 0.00,
        total: 445.00
      }
    ]);

    const addLineItem = () => {
      const newItem = {
        id: Date.now().toString(),
        category: 'body',
        operation: 'Repair',
        description: '',
        partNumber: '',
        quantity: 1,
        laborHours: 0,
        laborRate: 65.00,
        partPrice: 0,
        materialCost: 0,
        total: 0
      };
      setLineItems(prev => [...prev, newItem]);
    };

    const updateLineItem = (id, field, value) => {
      setLineItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate total
          updated.total = (updated.laborHours * updated.laborRate) + updated.partPrice + updated.materialCost;
          return updated;
        }
        return item;
      }));
    };

    const removeLineItem = (id) => {
      setLineItems(prev => prev.filter(item => item.id !== id));
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Line Items</Typography>
          <Button
            startIcon={<Add />}
            variant="outlined"
            onClick={addLineItem}
          >
            Add Line Item
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Operation</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Part #</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Labor Hrs</TableCell>
                <TableCell>Labor Rate</TableCell>
                <TableCell>Part Price</TableCell>
                <TableCell>Materials</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={item.category}
                        onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                      >
                        {Object.entries(DAMAGE_CATEGORIES).map(([key, cat]) => (
                          <MenuItem key={key} value={key}>
                            <Chip
                              size="small"
                              label={cat.label}
                              sx={{ backgroundColor: cat.color, color: 'white' }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={item.operation}
                      onChange={(e) => updateLineItem(item.id, 'operation', e.target.value)}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      sx={{ minWidth: 200 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={item.partNumber}
                      onChange={(e) => updateLineItem(item.id, 'partNumber', e.target.value)}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value))}
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      step="0.1"
                      value={item.laborHours}
                      onChange={(e) => updateLineItem(item.id, 'laborHours', parseFloat(e.target.value))}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      step="0.01"
                      value={item.laborRate}
                      onChange={(e) => updateLineItem(item.id, 'laborRate', parseFloat(e.target.value))}
                      sx={{ width: 80 }}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      step="0.01"
                      value={item.partPrice}
                      onChange={(e) => updateLineItem(item.id, 'partPrice', parseFloat(e.target.value))}
                      sx={{ width: 90 }}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      step="0.01"
                      value={item.materialCost}
                      onChange={(e) => updateLineItem(item.id, 'materialCost', parseFloat(e.target.value))}
                      sx={{ width: 80 }}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.total)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals Summary */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Labor Total</Typography>
                <Typography variant="h6">
                  {formatCurrency(lineItems.reduce((sum, item) => sum + (item.laborHours * item.laborRate), 0))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Parts Total</Typography>
                <Typography variant="h6">
                  {formatCurrency(lineItems.reduce((sum, item) => sum + item.partPrice, 0))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Materials Total</Typography>
                <Typography variant="h6">
                  {formatCurrency(lineItems.reduce((sum, item) => sum + item.materialCost, 0))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Grand Total</Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatCurrency(lineItems.reduce((sum, item) => sum + item.total, 0))}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Integration dialog component
  const IntegrationDialog = () => (
    <Dialog open={integrationDialog} onClose={() => setIntegrationDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>Import from Integration System</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Object.entries(INTEGRATION_SYSTEMS).map(([key, system]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedIntegration === key ? system.color : 'divider',
                  '&:hover': { borderColor: system.color }
                }}
                onClick={() => setSelectedIntegration(key)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ mr: 2 }}>{system.icon}</Typography>
                    <Box>
                      <Typography variant="h6">{system.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Integration System
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {system.features.map((feature, index) => (
                      <Chip
                        key={index}
                        size="small"
                        label={feature}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedIntegration && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Select how you want to import the estimate from {INTEGRATION_SYSTEMS[selectedIntegration].name}
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload File (XML/BMS)
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".xml,.bms,.json"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Handle file upload
                      console.log('File selected:', file.name);
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Sync />}
                  onClick={() => handleImportEstimate(selectedIntegration, {})}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Sync from System'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIntegrationDialog(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Estimate Management</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<Integration />}
            variant="outlined"
            onClick={() => setIntegrationDialog(true)}
          >
            Import
          </Button>
          <Button
            startIcon={<PhotoCamera />}
            variant="outlined"
            onClick={() => setAiAnalysisDialog(true)}
          >
            AI Analysis
          </Button>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={handleCreateEstimate}
          >
            New Estimate
          </Button>
        </Box>
      </Box>

      {/* Estimates list */}
      <Grid container spacing={2}>
        {estimates.map((estimate) => {
          const status = ESTIMATE_STATUSES[estimate.status];
          const StatusIcon = status.icon;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={estimate.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {estimate.estimateNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {estimate.customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {estimate.vehicle.year} {estimate.vehicle.make} {estimate.vehicle.model}
                        </Typography>
                      </Box>
                      
                      <Chip
                        icon={<StatusIcon />}
                        label={status.label}
                        sx={{
                          backgroundColor: status.color,
                          color: 'white'
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {estimate.damageDescription}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        {formatCurrency(estimate.totalAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        v{estimate.version}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Created: {formatDate(estimate.createdDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        By: {estimate.estimator}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditEstimate(estimate)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Print />}
                        onClick={() => {}}
                      >
                        Print
                      </Button>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialogs */}
      <IntegrationDialog />

      {/* Estimate creation/edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          {selectedEstimate ? 'Edit Estimate' : 'Create New Estimate'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Basic Info" />
            <Tab label="Line Items" />
            <Tab label="Photos" />
            <Tab label="Supplements" />
            <Tab label="History" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimate Number"
                    value={selectedEstimate?.estimateNumber || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedEstimate?.status || 'draft'}
                      label="Status"
                    >
                      {Object.entries(ESTIMATE_STATUSES).map(([key, status]) => (
                        <MenuItem key={key} value={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <status.icon sx={{ mr: 1, color: status.color }} />
                            {status.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Damage Description"
                    value={selectedEstimate?.damageDescription || ''}
                  />
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <EstimateLineItems estimate={selectedEstimate} />
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Damage Photos
                </Typography>
                <Button
                  startIcon={<PhotoCamera />}
                  variant="outlined"
                  onClick={() => {}}
                >
                  Add Photos
                </Button>
              </Box>
            )}

            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Supplements
                </Typography>
                <Button
                  startIcon={<Add />}
                  variant="outlined"
                  onClick={() => setSupplementDialog(true)}
                >
                  Create Supplement
                </Button>
              </Box>
            )}

            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Estimate History
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <History />
                    </ListItemIcon>
                    <ListItemText
                      primary="Estimate created"
                      secondary={`${formatDate(selectedEstimate?.createdDate)} by ${selectedEstimate?.estimator}`}
                    />
                  </ListItem>
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">
            {selectedEstimate ? 'Update' : 'Create'} Estimate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EstimateManager;
