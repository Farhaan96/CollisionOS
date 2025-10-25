import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Build,
  Payment,
  DirectionsCar,
  Assignment,
  CheckCircle,
  AttachMoney,
  CalendarToday,
  Visibility,
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * HistoryTab Component
 * Displays customer service history including past ROs, invoices, and payments
 * Shows timeline of all customer interactions and transactions
 */
const HistoryTab = ({ customerId, customerService }) => {
  const [history, setHistory] = useState([]);
  const [repairOrders, setRepairOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalJobs: 0,
    totalInvoices: 0,
    lifetimeValue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load history data on mount
  useEffect(() => {
    if (customerId) {
      loadHistory();
    }
  }, [customerId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [rosData, invoicesData] = await Promise.all([
        customerService.getCustomerRepairOrders(customerId).catch(() => []),
        customerService.getCustomerInvoices(customerId).catch(() => []),
      ]);

      setRepairOrders(Array.isArray(rosData) ? rosData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);

      // Build unified timeline from ROs and invoices
      const timeline = [
        ...(rosData || []).map(ro => ({
          id: `ro-${ro.id}`,
          type: 'repair_order',
          date: ro.openedAt || ro.createdAt,
          title: `Repair Order #${ro.roNumber}`,
          description: ro.vehicleInfo || `${ro.vehicle?.year} ${ro.vehicle?.make} ${ro.vehicle?.model}`,
          status: ro.stage || ro.status,
          amount: ro.totalEstimate || ro.total,
          data: ro,
        })),
        ...(invoicesData || []).map(inv => ({
          id: `inv-${inv.id}`,
          type: 'invoice',
          date: inv.invoiceDate || inv.createdAt,
          title: `Invoice #${inv.invoiceNumber}`,
          description: `Payment ${inv.paymentStatus || 'pending'}`,
          status: inv.paymentStatus,
          amount: inv.totalAmount,
          data: inv,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistory(timeline);

      // Calculate stats
      const totalSpent = (invoicesData || [])
        .filter(inv => inv.paymentStatus === 'paid' || inv.paymentStatus === 'completed')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      const totalJobs = (rosData || []).length;
      const totalInvoices = (invoicesData || []).length;

      setStats({
        totalSpent,
        totalJobs,
        totalInvoices,
        lifetimeValue: totalSpent,
      });
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for timeline item type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'repair_order':
        return <Build />;
      case 'invoice':
        return <Payment />;
      case 'payment':
        return <AttachMoney />;
      default:
        return <Assignment />;
    }
  };

  // Get color for item type
  const getTypeColor = (type, status) => {
    if (type === 'repair_order') {
      switch (status?.toLowerCase()) {
        case 'completed':
        case 'delivered':
          return 'success';
        case 'in_progress':
        case 'paint':
        case 'repair':
          return 'warning';
        case 'cancelled':
          return 'error';
        default:
          return 'primary';
      }
    }
    if (type === 'invoice') {
      return status === 'paid' || status === 'completed' ? 'success' : 'warning';
    }
    return 'default';
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {stats.totalJobs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Jobs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Payment />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {stats.totalInvoices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Invoices
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(stats.totalSpent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(stats.lifetimeValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lifetime Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Service History Timeline */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Service History Timeline
      </Typography>

      {history.length > 0 ? (
        <Timeline position="right">
          {history.map((item, index) => (
            <TimelineItem key={item.id}>
              <TimelineOppositeContent
                color="text.secondary"
                sx={{ flex: 0.2, pt: 2 }}
              >
                <Typography variant="body2">
                  {format(new Date(item.date), 'MMM d, yyyy')}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {format(new Date(item.date), 'h:mm a')}
                </Typography>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot color={getTypeColor(item.type, item.status)}>
                  {getTypeIcon(item.type)}
                </TimelineDot>
                {index < history.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent sx={{ pb: 3 }}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                    {item.amount && (
                      <Typography variant="h6" color="primary">
                        {formatCurrency(item.amount)}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                    {item.status && (
                      <Chip
                        label={item.status}
                        size="small"
                        color={getTypeColor(item.type, item.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    )}
                    <Chip
                      label={item.type.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>

                  {/* Additional Details for ROs */}
                  {item.type === 'repair_order' && item.data && (
                    <Box sx={{ mt: 2 }}>
                      {item.data.claimNumber && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Claim: {item.data.claimNumber}
                        </Typography>
                      )}
                      {item.data.insurerName && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Insurance: {item.data.insurerName}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            No service history available
          </Typography>
        </Box>
      )}

      {/* Recent Repair Orders Table */}
      {repairOrders.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Repair Orders
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>RO Number</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repairOrders.slice(0, 5).map((ro) => (
                  <TableRow key={ro.id} hover>
                    <TableCell>{ro.roNumber}</TableCell>
                    <TableCell>
                      {ro.vehicleInfo || `${ro.vehicle?.year} ${ro.vehicle?.make} ${ro.vehicle?.model}`}
                    </TableCell>
                    <TableCell>
                      {format(new Date(ro.openedAt || ro.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ro.stage || ro.status}
                        size="small"
                        color={getTypeColor('repair_order', ro.stage || ro.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(ro.totalEstimate || ro.total)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default HistoryTab;
