import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  LinearProgress,
  Tooltip,
  Badge,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Settings,
  Visibility,
  Analytics,
  Speed,
  TrendingUp,
  TrendingDown,
  Store,
  Api,
  CloudDone,
  CloudOff,
  Timer,
  AttachMoney,
  Inventory,
  LocalShipping,
  Assignment,
  BugReport,
  Security,
  NetworkCheck,
  Dashboard,
  DataUsage,
  Signal,
  SignalCellularAlt,
  Sync,
  SyncProblem,
  Timeline,
  BarChart,
  PieChart,
  MonitorHeart,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useSocket } from '../../hooks/useSocket';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Vendor Integration Status
const VENDOR_STATUS = {
  online: { label: 'Online', color: '#4caf50', icon: CheckCircle },
  degraded: { label: 'Degraded', color: '#ff9800', icon: Warning },
  offline: { label: 'Offline', color: '#f44336', icon: Error },
  maintenance: { label: 'Maintenance', color: '#2196f3', icon: Settings }
};

// API Health Levels
const HEALTH_LEVELS = {
  excellent: { label: 'Excellent', color: '#4caf50', score: 95 },
  good: { label: 'Good', color: '#8bc34a', score: 85 },
  fair: { label: 'Fair', color: '#ff9800', score: 70 },
  poor: { label: 'Poor', color: '#ff5722', score: 50 },
  critical: { label: 'Critical', color: '#f44336', score: 30 }
};

const VendorIntegrationMonitor = ({ onVendorUpdate }) => {
  const theme = useTheme();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [diagnosticsDialog, setDiagnosticsDialog] = useState(false);
  const [performanceData, setPerformanceData] = useState({});
  const [alerts, setAlerts] = useState([]);

  // Sample vendor data
  const sampleVendors = [
    {
      id: 'partsTrader',
      name: 'PartsTrader',
      status: 'online',
      apiHealth: 'excellent',
      responseTime: 1250, // ms
      successRate: 98.5,
      requestsToday: 1450,
      quotaUsed: 68,
      quotaLimit: 10000,
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      pricing: {
        averageDiscount: 15.2,
        totalSavings: 12450.00,
        priceAccuracy: 94.8
      },
      inventory: {
        catalogSize: 2400000,
        availabilityRate: 89.3,
        lastUpdate: new Date(Date.now() - 15 * 60 * 1000)
      },
      performance: {
        uptime: 99.8,
        avgResponseTime: 1200,
        errorRate: 0.2,
        timeouts: 3
      },
      integration: {
        version: '2.4.1',
        features: ['pricing', 'inventory', 'ordering', 'tracking'],
        webhooks: true,
        rateLimit: '1000/hour'
      }
    },
    {
      id: 'oemDirect',
      name: 'OEM Direct',
      status: 'degraded',
      apiHealth: 'fair',
      responseTime: 4200,
      successRate: 91.2,
      requestsToday: 850,
      quotaUsed: 45,
      quotaLimit: 5000,
      lastSync: new Date(Date.now() - 25 * 60 * 1000),
      pricing: {
        averageDiscount: 8.5,
        totalSavings: 6200.00,
        priceAccuracy: 99.1
      },
      inventory: {
        catalogSize: 850000,
        availabilityRate: 95.7,
        lastUpdate: new Date(Date.now() - 45 * 60 * 1000)
      },
      performance: {
        uptime: 97.3,
        avgResponseTime: 4100,
        errorRate: 2.1,
        timeouts: 12
      },
      integration: {
        version: '1.8.3',
        features: ['pricing', 'inventory', 'ordering'],
        webhooks: false,
        rateLimit: '500/hour'
      }
    },
    {
      id: 'lkqRecycled',
      name: 'LKQ Recycled',
      status: 'online',
      apiHealth: 'good',
      responseTime: 2100,
      successRate: 94.8,
      requestsToday: 720,
      quotaUsed: 32,
      quotaLimit: 3000,
      lastSync: new Date(Date.now() - 10 * 60 * 1000),
      pricing: {
        averageDiscount: 35.8,
        totalSavings: 18200.00,
        priceAccuracy: 88.3
      },
      inventory: {
        catalogSize: 650000,
        availabilityRate: 76.4,
        lastUpdate: new Date(Date.now() - 20 * 60 * 1000)
      },
      performance: {
        uptime: 98.9,
        avgResponseTime: 2000,
        errorRate: 1.3,
        timeouts: 8
      },
      integration: {
        version: '3.1.0',
        features: ['pricing', 'inventory', 'quality_photos'],
        webhooks: true,
        rateLimit: '750/hour'
      }
    }
  ];

  useEffect(() => {
    loadVendorData();
    loadPerformanceData();
    loadAlerts();
  }, []);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('vendor_status_update', handleVendorStatusUpdate);
      socket.on('vendor_performance_update', handlePerformanceUpdate);
      socket.on('vendor_alert', handleVendorAlert);

      return () => {
        socket.off('vendor_status_update');
        socket.off('vendor_performance_update');
        socket.off('vendor_alert');
      };
    }
  }, [socket, isConnected]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setVendors(sampleVendors);
    } catch (error) {
      console.error('Failed to load vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    // Sample performance chart data
    const chartData = {
      responseTime: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [
          {
            label: 'PartsTrader',
            data: [1200, 1100, 1300, 1250, 1400, 1200],
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
          },
          {
            label: 'OEM Direct',
            data: [4100, 3900, 4300, 4200, 4500, 4100],
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
          }
        ]
      },
      successRate: {
        labels: ['PartsTrader', 'OEM Direct', 'LKQ Recycled'],
        datasets: [
          {
            data: [98.5, 91.2, 94.8],
            backgroundColor: ['#4caf50', '#ff9800', '#2196f3'],
            borderWidth: 2,
          }
        ]
      }
    };

    setPerformanceData(chartData);
  };

  const loadAlerts = async () => {
    const sampleAlerts = [
      {
        id: 1,
        vendor: 'OEM Direct',
        type: 'warning',
        message: 'Response time increased by 35% in the last hour',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        acknowledged: false
      },
      {
        id: 2,
        vendor: 'PartsTrader',
        type: 'info',
        message: 'API quota usage at 68% for today',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        acknowledged: true
      }
    ];

    setAlerts(sampleAlerts);
  };

  const handleVendorStatusUpdate = (data) => {
    setVendors(prev => 
      prev.map(vendor => 
        vendor.id === data.id ? { ...vendor, ...data } : vendor
      )
    );
  };

  const handlePerformanceUpdate = (data) => {
    setPerformanceData(prev => ({ ...prev, ...data }));
  };

  const handleVendorAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 9)]);
  };

  const getHealthColor = (health) => {
    return HEALTH_LEVELS[health]?.color || theme.palette.grey[500];
  };

  const getStatusIcon = (status) => {
    const StatusIcon = VENDOR_STATUS[status]?.icon || Error;
    return <StatusIcon />;
  };

  const formatResponseTime = (ms) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const formatUptime = (uptime) => {
    return `${uptime.toFixed(1)}%`;
  };

  // Vendor Health Overview Cards
  const VendorHealthCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {vendors.map((vendor) => (
        <Grid item xs={12} md={4} key={vendor.id}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: selectedVendor?.id === vendor.id ? `2px solid ${theme.palette.primary.main}` : 'none'
              }}
              onClick={() => setSelectedVendor(vendor)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {vendor.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(vendor.status)}
                    label={VENDOR_STATUS[vendor.status]?.label}
                    color={vendor.status === 'online' ? 'success' : vendor.status === 'degraded' ? 'warning' : 'error'}
                    size="small"
                  />
                </Box>

                {/* API Health Indicator */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">API Health</Typography>
                    <Typography variant="body2" fontWeight="bold" color={getHealthColor(vendor.apiHealth)}>
                      {HEALTH_LEVELS[vendor.apiHealth]?.label}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={HEALTH_LEVELS[vendor.apiHealth]?.score || 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getHealthColor(vendor.apiHealth),
                      },
                    }}
                  />
                </Box>

                {/* Key Metrics */}
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Response Time</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatResponseTime(vendor.responseTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {vendor.successRate}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Requests Today</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {vendor.requestsToday.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Quota Used</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {vendor.quotaUsed}%
                    </Typography>
                  </Grid>
                </Grid>

                {/* Quota Usage Bar */}
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={vendor.quotaUsed}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: vendor.quotaUsed > 80 ? theme.palette.warning.main : theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );

  // Performance Charts Tab
  const PerformanceCharts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Response Time Trends (24h)</Typography>
            {performanceData.responseTime && (
              <Line
                data={performanceData.responseTime}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Response Time (ms)'
                      }
                    }
                  }
                }}
                height={100}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Success Rates</Typography>
            {performanceData.successRate && (
              <Doughnut
                data={performanceData.successRate}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
                height={200}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Vendor Details Table
  const VendorDetailsTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Vendor Integration Details</Typography>
          <Box>
            <IconButton onClick={loadVendorData}>
              <Refresh />
            </IconButton>
            <IconButton onClick={() => setDiagnosticsDialog(true)}>
              <BugReport />
            </IconButton>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>API Version</TableCell>
                <TableCell>Features</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Quota Usage</TableCell>
                <TableCell>Last Sync</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <Store />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {vendor.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {vendor.integration.rateLimit}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(vendor.status)}
                      <Box>
                        <Typography variant="body2">
                          {VENDOR_STATUS[vendor.status]?.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatUptime(vendor.performance.uptime)} uptime
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={vendor.integration.version}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {vendor.integration.features.map((feature) => (
                        <Chip 
                          key={feature}
                          label={feature}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {formatResponseTime(vendor.responseTime)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vendor.successRate}% success
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {vendor.quotaUsed}% / {vendor.quotaLimit}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={vendor.quotaUsed}
                        size="small"
                        sx={{ mt: 0.5, height: 3 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(vendor.lastSync)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setDetailsDialog(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Alerts Tab
  const AlertsPanel = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Integration Alerts</Typography>
        <List>
          {alerts.map((alert) => (
            <ListItem key={alert.id} divider>
              <ListItemIcon>
                {alert.type === 'error' ? <Error color="error" /> : 
                 alert.type === 'warning' ? <Warning color="warning" /> : 
                 <Analytics color="info" />}
              </ListItemIcon>
              <ListItemText
                primary={alert.message}
                secondary={`${alert.vendor} • ${formatDate(alert.timestamp)}`}
              />
              <ListItemSecondaryAction>
                {!alert.acknowledged && (
                  <Button size="small">Acknowledge</Button>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Vendor Integration Monitor</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={isConnected ? <CheckCircle /> : <Error />}
            label={isConnected ? 'Real-time Monitoring Active' : 'Offline Mode'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Vendor Health Overview */}
      <VendorHealthCards />

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Performance Charts" />
        <Tab label="Integration Details" />
        <Tab label={`Alerts ${alerts.filter(a => !a.acknowledged).length > 0 ? `(${alerts.filter(a => !a.acknowledged).length})` : ''}`} />
      </Tabs>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && <PerformanceCharts />}
        {activeTab === 1 && <VendorDetailsTable />}
        {activeTab === 2 && <AlertsPanel />}
      </Box>

      {/* Vendor Details Dialog */}
      <Dialog 
        open={detailsDialog} 
        onClose={() => setDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedVendor?.name} Integration Details
        </DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Performance Metrics</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">Uptime: {formatUptime(selectedVendor.performance.uptime)}</Typography>
                  <Typography variant="body2">Avg Response: {formatResponseTime(selectedVendor.performance.avgResponseTime)}</Typography>
                  <Typography variant="body2">Error Rate: {selectedVendor.performance.errorRate}%</Typography>
                  <Typography variant="body2">Timeouts: {selectedVendor.performance.timeouts}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Integration Info</Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">Version: {selectedVendor.integration.version}</Typography>
                  <Typography variant="body2">Webhooks: {selectedVendor.integration.webhooks ? 'Enabled' : 'Disabled'}</Typography>
                  <Typography variant="body2">Rate Limit: {selectedVendor.integration.rateLimit}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorIntegrationMonitor;