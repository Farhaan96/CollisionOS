import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  LocalShipping,
  Warning,
  TrendingUp,
  Assessment,
  AutoMode,
  Insights,
} from '@mui/icons-material';

// Components
import PartsManagementSystem from '../../components/Parts/PartsManagementSystem';
import AutomatedSourcingDashboard from '../../components/Parts/AutomatedSourcingDashboard';
import VendorIntegrationMonitor from '../../components/Parts/VendorIntegrationMonitor';

// Hooks
import { useAuth } from '../../contexts/AuthContext';

const PartsManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mock data for dashboard
  const partsStats = {
    totalParts: 156,
    partsOrdered: 23,
    partsReceived: 12,
    lowStockItems: 5,
    pendingOrders: 8,
    totalValue: 45670.0,
  };

  const alerts = [
    { id: 1, type: 'warning', message: '5 items are running low on stock' },
    { id: 2, type: 'info', message: '3 parts orders are arriving today' },
    { id: 3, type: 'error', message: '2 parts orders are overdue' },
  ];

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Parts',
      value: partsStats.totalParts,
      change: '+12%',
      color: theme.palette.primary.main,
      icon: <Inventory />,
    },
    {
      title: 'Parts Ordered',
      value: partsStats.partsOrdered,
      change: '+5%',
      color: theme.palette.warning.main,
      icon: <ShoppingCart />,
    },
    {
      title: 'Parts Received',
      value: partsStats.partsReceived,
      change: '+18%',
      color: theme.palette.success.main,
      icon: <LocalShipping />,
    },
    {
      title: 'Low Stock Items',
      value: partsStats.lowStockItems,
      change: '-2',
      color: theme.palette.error.main,
      icon: <Warning />,
    },
  ];

  const StatCard = ({ title, value, change, color, icon }) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              {title}
            </Typography>
            <Typography
              variant='h4'
              component='div'
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp
                sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }}
              />
              <Typography
                variant='body2'
                color='success.main'
                sx={{ fontWeight: 'medium' }}
              >
                {change} from last month
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              bgcolor: color,
              color: 'white',
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Parts Management
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Manage parts inventory, orders, and supplier relationships
        </Typography>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              severity={alert.type}
              sx={{ mb: 1 }}
              action={
                <Button color='inherit' size='small'>
                  View
                </Button>
              }
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant='contained'
              startIcon={<ShoppingCart />}
              onClick={() => {}}
            >
              Create Purchase Order
            </Button>
            <Button
              variant='outlined'
              startIcon={<LocalShipping />}
              onClick={() => {}}
            >
              Receive Shipment
            </Button>
            <Button
              variant='outlined'
              startIcon={<Inventory />}
              onClick={() => {}}
            >
              Stock Check
            </Button>
            <Button
              variant='outlined'
              startIcon={<Assessment />}
              onClick={() => {}}
            >
              Parts Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<Inventory />} 
            label="Parts Management" 
            iconPosition="start"
            sx={{ minHeight: 64, textTransform: 'none', fontSize: '0.9rem' }}
          />
          <Tab 
            icon={<AutoMode />} 
            label="Automated Sourcing" 
            iconPosition="start"
            sx={{ minHeight: 64, textTransform: 'none', fontSize: '0.9rem' }}
          />
          <Tab 
            icon={<Insights />} 
            label="Vendor Integration" 
            iconPosition="start"
            sx={{ minHeight: 64, textTransform: 'none', fontSize: '0.9rem' }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {tabValue === 0 && <PartsManagementSystem />}
        {tabValue === 1 && <AutomatedSourcingDashboard />}
        {tabValue === 2 && <VendorIntegrationMonitor />}
      </Box>
    </Box>
  );
};

export default PartsManagement;
