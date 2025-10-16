/**
 * Purchase Order Detail Page - CollisionOS
 *
 * Detailed view of a single purchase order with receiving workflow
 * Features:
 * - PO header information
 * - Parts list with quantities
 * - Receiving workflow (mark parts as received)
 * - Partial receives tracking
 * - History timeline
 * - Print and export options
 * - Actions (receive parts, cancel PO, email to vendor)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import poService from '../../services/poService';

// Part condition options for receiving
const PART_CONDITIONS = [
  { value: 'good', label: 'Good', icon: '✅' },
  { value: 'damaged', label: 'Damaged', icon: '⚠️' },
  { value: 'wrong_part', label: 'Wrong Part', icon: '❌' },
];

const PODetailPage = () => {
  const { poId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'receive' ? 1 : 0;

  // State
  const [po, setPO] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receivingData, setReceivingData] = useState([]);
  const [isReceiving, setIsReceiving] = useState(false);
  const [history, setHistory] = useState([]);

  // Load PO data
  useEffect(() => {
    if (poId) {
      loadPOData();
    }
  }, [poId]);

  const loadPOData = async () => {
    setLoading(true);
    try {
      const result = await poService.getPurchaseOrder(poId);

      if (result.success) {
        setPO(result.data || {});
        setParts(result.parts || []);
        setHistory(result.receiving_history || []);

        // Initialize receiving data for parts not fully received
        const pendingParts = (result.parts || [])
          .filter(p => ['ordered', 'backordered'].includes(p.status))
          .map(part => ({
            part_line_id: part.id,
            part_number: part.part_number,
            description: part.description,
            ordered_quantity: part.quantity,
            received_quantity: part.quantity,
            condition: 'good',
            notes: '',
          }));

        setReceivingData(pendingParts);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load PO:', error);
      toast.error('Failed to load purchase order details');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleOpenReceiveDialog = () => {
    setReceiveDialogOpen(true);
  };

  const handleCloseReceiveDialog = () => {
    setReceiveDialogOpen(false);
  };

  const handleReceivingDataChange = (partLineId, field, value) => {
    setReceivingData(prev =>
      prev.map(item =>
        item.part_line_id === partLineId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleReceiveParts = async () => {
    // Validate receiving data
    const itemsToReceive = receivingData.filter(item => item.received_quantity > 0);

    if (itemsToReceive.length === 0) {
      toast.error('No parts selected for receiving');
      return;
    }

    // Check for damaged or wrong parts without notes
    const invalidItems = itemsToReceive.filter(
      item => ['damaged', 'wrong_part'].includes(item.condition) && !item.notes.trim()
    );

    if (invalidItems.length > 0) {
      toast.error('Please add notes for damaged or wrong parts');
      return;
    }

    setIsReceiving(true);

    try {
      const result = await poService.receivePOParts(poId, {
        received_parts: itemsToReceive.map(item => ({
          part_line_id: item.part_line_id,
          quantity_received: parseInt(item.received_quantity),
          condition: item.condition,
          notes: item.notes,
        })),
        delivery_note: '',
        received_by: 'current_user', // Would come from auth context
      });

      if (result.success) {
        toast.success(result.message || 'Parts received successfully');
        handleCloseReceiveDialog();
        loadPOData(); // Reload to show updated status
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to receive parts:', error);
      toast.error(error.message || 'Failed to receive parts');
    } finally {
      setIsReceiving(false);
    }
  };

  const handlePrintPO = async () => {
    try {
      await poService.exportPO(poId, 'pdf');
      toast.success('PO exported successfully');
    } catch (error) {
      toast.error('Failed to export PO');
    }
  };

  const handleCancelPO = async () => {
    if (!confirm(`Cancel PO ${po?.purchaseOrderNumber}?`)) {
      return;
    }

    try {
      const result = await poService.cancelPurchaseOrder(poId, 'Cancelled by user');
      if (result.success) {
        toast.success('PO cancelled successfully');
        loadPOData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Failed to cancel PO');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate receiving progress
  const receivingProgress = () => {
    if (!parts.length) return 0;
    const receivedParts = parts.filter(p => p.status === 'received').length;
    return (receivedParts / parts.length) * 100;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!po) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Purchase order not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/purchase-orders')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {po.purchaseOrderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              RO: {po.roNumber} • Vendor: {po.vendorName}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintPO}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<EmailIcon />}>
            Email Vendor
          </Button>
          {po.poStatus !== 'fully_received' && po.poStatus !== 'cancelled' && (
            <>
              <Button
                variant="contained"
                startIcon={<ShippingIcon />}
                onClick={handleOpenReceiveDialog}
              >
                Receive Parts
              </Button>
              {po.poStatus === 'draft' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelPO}
                >
                  Cancel PO
                </Button>
              )}
            </>
          )}
        </Stack>
      </Box>

      {/* PO Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Chip label={po.poStatus} color="primary" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                PO Date
              </Typography>
              <Typography variant="h6">{formatDate(po.poDate)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Delivery Date
              </Typography>
              <Typography variant="h6">{formatDate(po.requestedDeliveryDate)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(po.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Receiving Progress */}
      {po.poStatus !== 'draft' && po.poStatus !== 'cancelled' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">Receiving Progress</Typography>
              <Typography variant="body2" color="text.secondary">
                {parts.filter(p => p.status === 'received').length} of {parts.length} parts received
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={receivingProgress()}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
          <Tab label="Parts List" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>

        <Divider />

        {/* Tab Content */}
        {currentTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Ordered</TableCell>
                  <TableCell align="center">Received</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {part.part_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{part.description}</TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={part.quantity} color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={part.received_quantity || 0} color="success" />
                    </TableCell>
                    <TableCell>
                      <Chip label={part.status} size="small" color={part.status === 'received' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(part.unit_cost)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(part.quantity * part.unit_cost)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {currentTab === 1 && (
          <Box p={3}>
            <List>
              {history.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  No receiving history yet
                </Typography>
              ) : (
                history.map((entry, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={`Received ${entry.quantity} parts`}
                      secondary={`${formatDate(entry.received_date)} • ${entry.received_by}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        )}
      </Card>

      {/* Receive Parts Dialog */}
      <Dialog
        open={receiveDialogOpen}
        onClose={handleCloseReceiveDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Receive Parts - {po.purchaseOrderNumber}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Mark parts as received. Enter the actual quantity received and condition.
            </Typography>
          </Alert>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Ordered Qty</TableCell>
                  <TableCell>Received Qty</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receivingData.map((item) => (
                  <TableRow key={item.part_line_id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {item.part_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.ordered_quantity}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={item.received_quantity}
                        onChange={(e) =>
                          handleReceivingDataChange(
                            item.part_line_id,
                            'received_quantity',
                            e.target.value
                          )
                        }
                        inputProps={{ min: 0, max: item.ordered_quantity }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={item.condition}
                        onChange={(e) =>
                          handleReceivingDataChange(
                            item.part_line_id,
                            'condition',
                            e.target.value
                          )
                        }
                        sx={{ width: 140 }}
                      >
                        {PART_CONDITIONS.map((cond) => (
                          <MenuItem key={cond.value} value={cond.value}>
                            {cond.icon} {cond.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Notes..."
                        value={item.notes}
                        onChange={(e) =>
                          handleReceivingDataChange(
                            item.part_line_id,
                            'notes',
                            e.target.value
                          )
                        }
                        required={['damaged', 'wrong_part'].includes(item.condition)}
                        sx={{ width: 200 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseReceiveDialog} disabled={isReceiving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReceiveParts}
            disabled={isReceiving}
            startIcon={isReceiving ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {isReceiving ? 'Receiving...' : 'Confirm Receipt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PODetailPage;
