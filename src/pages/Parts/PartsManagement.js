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
  useMediaQuery
} from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  LocalShipping,
  Warning,
  TrendingUp,
  Assessment
} from '@mui/icons-material';

// Components
import PartsManagementSystem from '../../components/Parts/PartsManagementSystem';

// Hooks  
import { useAuth } from '../../contexts/AuthContext';

const PartsManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // Mock data for dashboard
  const partsStats = {
    totalParts: 156,
    partsOrdered: 23,
    partsReceived: 12,
    lowStockItems: 5,
    pendingOrders: 8,
    totalValue: 45670.00
  };

  const alerts = [
    { id: 1, type: 'warning', message: '5 items are running low on stock' },
    { id: 2, type: 'info', message: '3 parts orders are arriving today' },
    { id: 3, type: 'error', message: '2 parts orders are overdue' }
  ];

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Parts',
      value: partsStats.totalParts,
      change: '+12%',
      color: theme.palette.primary.main,
      icon: <Inventory />
    },
    {
      title: 'Parts Ordered',
      value: partsStats.partsOrdered,
      change: '+5%',
      color: theme.palette.warning.main,
      icon: <ShoppingCart />
    },
    {
      title: 'Parts Received',
      value: partsStats.partsReceived,
      change: '+18%',
      color: theme.palette.success.main,
      icon: <LocalShipping />
    },
    {
      title: 'Low Stock Items',
      value: partsStats.lowStockItems,
      change: '-2',
      color: theme.palette.error.main,
      icon: <Warning />
    }
  ];

  const StatCard = ({ title, value, change, color, icon }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
              <Typography
                variant="body2"
                color="success.main"
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
              justifyContent: 'center'
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
        <Typography variant="h4" component="h1" gutterBottom>
          Parts Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage parts inventory, orders, and supplier relationships
        </Typography>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.type}
              sx={{ mb: 1 }}
              action={
                <Button color="inherit" size="small">
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
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => {}}
            >
              Create Purchase Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<LocalShipping />}
              onClick={() => {}}
            >
              Receive Shipment
            </Button>
            <Button
              variant="outlined"
              startIcon={<Inventory />}
              onClick={() => {}}
            >
              Stock Check
            </Button>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => {}}
            >
              Parts Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Parts Management System */}
      <PartsManagementSystem />
    </Box>
  );
};

export default PartsManagement;