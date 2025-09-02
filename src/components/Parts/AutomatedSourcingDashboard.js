import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AutoAwesome,
  Speed,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  Settings,
  Visibility,
  Compare,
  AttachMoney,
  Timer,
  Store,
  Analytics,
  Notifications,
  PowerSettingsNew,
  BarChart,
  Timeline,
  LocalShipping,
  ShoppingCart,
  BuildCircle,
  Approval,
  Edit,
  SmartButton,
  PriceCheck,
  CompareArrows,
  Search,
  FilterList,
  Sort,
  MoreVert,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { partsService } from '../../services/partsService';

// Sourcing Status Configuration
const SOURCING_STATUSES = {
  initiated: { 
    label: 'Initiated', 
    color: '#2196f3', 
    icon: Search,
    description: 'Sourcing request started'
  },
  searching: { 
    label: 'Searching', 
    color: '#ff9800', 
    icon: Timer,
    description: 'Searching vendors for best options'
  },
  evaluating: { 
    label: 'Evaluating', 
    color: '#9c27b0', 
    icon: Compare,
    description: 'Analyzing vendor responses'
  },
  completed: { 
    label: 'Completed', 
    color: '#4caf50', 
    icon: CheckCircle,
    description: 'Sourcing completed successfully'
  },
  manual_review: { 
    label: 'Manual Review', 
    color: '#f44336', 
    icon: Warning,
    description: 'Requires manual intervention'
  },
  failed: { 
    label: 'Failed', 
    color: '#607d8b', 
    icon: Error,
    description: 'Sourcing failed - manual action needed'
  }
};

const AutomatedSourcingDashboard = ({ jobId, onSourcingUpdate }) => {
  const theme = useTheme();
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(false);
  const [sourcingRequests, setSourcingRequests] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [overrideDialog, setOverrideDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dateRange: '7d'
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for real-time sourcing updates
      socket.on('sourcing_update', handleSourcingUpdate);
      socket.on('vendor_response', handleVendorResponse);
      socket.on('automation_alert', handleAutomationAlert);

      return () => {
        socket.off('sourcing_update');
        socket.off('vendor_response');
        socket.off('automation_alert');
      };
    }
  }, [socket, isConnected]);

  // Load initial data
  useEffect(() => {
    loadSourcingData();
    loadAnalytics();
  }, [jobId, filters]);

  const loadSourcingData = async () => {
    setLoading(true);
    try {
      // Sample data - replace with actual API call
      const sampleRequests = [
        {
          id: 'SR-001',
          partNumber: 'TOY-52119-06903',
          partDescription: 'Front Bumper Cover',
          status: 'evaluating',
          priority: 'high',
          initiatedAt: new Date(Date.now() - 30 * 60 * 1000),
          estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000),
          vendorResponses: 5,
          bestPrice: 285.00,
          potentialSavings: 165.00,
          confidence: 92,
          roNumber: 'RO-2024-001',
          automationDecision: 'recommend',
          vendorComparisons: [
            { vendor: 'OEM Direct', price: 450.00, delivery: '3-5 days', score: 85 },
            { vendor: 'PartsTrader', price: 285.00, delivery: '1-2 days', score: 95 },
            { vendor: 'LKQ Recycled', price: 175.00, delivery: '2-3 days', score: 78 }
          ]
        },
        {
          id: 'SR-002',
          partNumber: 'HON-71501-S5A-A00',
          partDescription: 'Right Headlight Assembly',
          status: 'completed',
          priority: 'medium',
          initiatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 30 * 60 * 1000),
          vendorResponses: 3,
          selectedPrice: 320.00,
          potentialSavings: 95.00,
          confidence: 88,
          roNumber: 'RO-2024-002',
          automationDecision: 'auto_approved'
        }
      ];

      setSourcingRequests(sampleRequests);
    } catch (error) {
      console.error('Failed to load sourcing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Sample analytics data
      const sampleAnalytics = {
        totalRequests: 156,
        successRate: 94.2,
        avgSavings: 23.5,
        avgResponseTime: '4.2 min',
        automationRate: 87.3,
        costSavingsToday: 1850.00,
        costSavingsThisWeek: 12450.00,
        topVendor: 'PartsTrader',
        vendorPerformance: [
          { vendor: 'PartsTrader', score: 95, responseTime: '2.1 min' },
          { vendor: 'OEM Direct', score: 88, responseTime: '5.4 min' },
          { vendor: 'LKQ Recycled', score: 82, responseTime: '3.8 min' }
        ]
      };

      setAnalytics(sampleAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleSourcingUpdate = (data) => {
    setSourcingRequests(prev => 
      prev.map(req => req.id === data.id ? { ...req, ...data } : req)
    );
    
    if (onSourcingUpdate) {
      onSourcingUpdate(data);
    }
  };

  const handleVendorResponse = (data) => {
    setSourcingRequests(prev => 
      prev.map(req => {
        if (req.id === data.sourcingId) {
          return {
            ...req,
            vendorResponses: req.vendorResponses + 1,
            vendorComparisons: [...(req.vendorComparisons || []), data.response]
          };
        }
        return req;
      })
    );
  };

  const handleAutomationAlert = (alert) => {
    // Show toast notification for automation alerts
    console.log('Automation alert:', alert);
  };

  const handleApproveDecision = async (requestId, decision) => {
    try {
      // API call to approve automation decision
      await partsService.approveSourcingDecision(requestId, decision);
      
      setSourcingRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: 'completed' } : req)
      );
    } catch (error) {
      console.error('Failed to approve decision:', error);
    }
  };

  const handleManualOverride = async (requestId, overrideData) => {
    try {
      // API call to override automation decision
      await partsService.overrideSourcingDecision(requestId, overrideData);
      
      setSourcingRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, ...overrideData } : req)
      );
      
      setOverrideDialog(false);
    } catch (error) {
      console.error('Failed to override decision:', error);
    }
  };

  const getStatusColor = (status) => {
    return SOURCING_STATUSES[status]?.color || theme.palette.grey[500];
  };

  const formatDuration = (startTime, endTime = null) => {
    const end = endTime || new Date();
    const diff = Math.floor((end - startTime) / 1000 / 60); // minutes
    return diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  // Main dashboard metrics cards
  const MetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {analytics.totalRequests || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <Search />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {analytics.successRate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                <CheckCircle />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(analytics.costSavingsToday || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Savings Today
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {analytics.avgResponseTime || '0m'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                <Timer />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Active sourcing requests table
  const SourcingRequestsTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Active Sourcing Requests</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={automationEnabled}
                  onChange={(e) => setAutomationEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Automation"
              labelPlacement="start"
            />
            <IconButton onClick={loadSourcingData}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                <TableCell>Part Details</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Vendor Responses</TableCell>
                <TableCell>Best Price</TableCell>
                <TableCell>Savings</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sourcingRequests.map((request) => {
                const StatusIcon = SOURCING_STATUSES[request.status]?.icon || Timer;
                const statusConfig = SOURCING_STATUSES[request.status];
                
                return (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.roNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.partNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.partDescription}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<StatusIcon sx={{ fontSize: 16 }} />}
                        label={statusConfig?.label || request.status}
                        size="small"
                        sx={{
                          backgroundColor: alpha(getStatusColor(request.status), 0.1),
                          color: getStatusColor(request.status),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                        <LinearProgress
                          variant="determinate"
                          value={request.confidence || 0}
                          sx={{
                            flexGrow: 1,
                            height: 6,
                            borderRadius: 3,
                          }}
                        />
                        <Typography variant="caption">
                          {request.confidence || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={request.vendorResponses} color="primary">
                        <Store />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(request.bestPrice || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(request.potentialSavings || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDuration(request.initiatedAt, request.completedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDetailsDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {request.status === 'manual_review' && (
                          <>
                            <Tooltip title="Approve Decision">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApproveDecision(request.id, 'approve')}
                              >
                                <Approval />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Manual Override">
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setOverrideDialog(true);
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {sourcingRequests.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No active sourcing requests
            </Typography>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Vendor performance sidebar
  const VendorPerformanceSidebar = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Vendor Performance
        </Typography>
        
        {analytics.vendorPerformance?.map((vendor, index) => (
          <Box key={vendor.vendor} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {vendor.vendor}
              </Typography>
              <Chip 
                label={`${vendor.score}%`} 
                size="small"
                color={vendor.score > 90 ? 'success' : vendor.score > 80 ? 'primary' : 'warning'}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={vendor.score}
              sx={{ mb: 0.5, height: 4, borderRadius: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              Avg Response: {vendor.responseTime}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Real-time connection status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Automated Parts Sourcing Dashboard</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={isConnected ? <CheckCircle /> : <Error />}
            label={isConnected ? 'Real-time Connected' : 'Offline'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          
          {!isConnected && (
            <Alert severity="warning" sx={{ py: 0 }}>
              Real-time updates disabled - working offline
            </Alert>
          )}
        </Box>
      </Box>

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <SourcingRequestsTable />
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <VendorPerformanceSidebar />
        </Grid>
      </Grid>

      {/* Details Dialog */}
      <Dialog 
        open={detailsDialog} 
        onClose={() => setDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Sourcing Request Details: {selectedRequest?.id}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              {/* Request details content */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Part Number:</Typography>
                  <Typography variant="body2">{selectedRequest.partNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Description:</Typography>
                  <Typography variant="body2">{selectedRequest.partDescription}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Vendor comparisons */}
              <Typography variant="h6" gutterBottom>Vendor Comparisons</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vendor</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Delivery</TableCell>
                      <TableCell>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRequest.vendorComparisons?.map((comparison, index) => (
                      <TableRow key={index}>
                        <TableCell>{comparison.vendor}</TableCell>
                        <TableCell>{formatCurrency(comparison.price)}</TableCell>
                        <TableCell>{comparison.delivery}</TableCell>
                        <TableCell>
                          <Chip 
                            label={comparison.score}
                            size="small"
                            color={comparison.score > 90 ? 'success' : 'primary'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Override Dialog */}
      <Dialog 
        open={overrideDialog} 
        onClose={() => setOverrideDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manual Override</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Override automation decision for: {selectedRequest?.partNumber}
          </Typography>
          {/* Override form content would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => handleManualOverride(selectedRequest?.id, {})}
          >
            Apply Override
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutomatedSourcingDashboard;