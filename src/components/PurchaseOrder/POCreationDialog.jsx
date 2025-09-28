/**
 * PO Creation Dialog - CollisionOS
 *
 * Dialog for creating purchase orders from selected parts in collision repair workflow
 * Features:
 * - Vendor selection with search and KPI display
 * - Delivery date selection
 * - Notes and special instructions
 * - Parts summary with pricing
 * - PO numbering preview
 * - Expedite options
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Stack,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ShoppingCart,
  Business,
  LocalShipping,
  Schedule,
  Warning,
  CheckCircle,
  AttachMoney,
  Assignment,
  Close,
  Speed,
  Star,
  StarBorder,
  Phone,
  Email,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { toast } from 'react-hot-toast';
import poService from '../../services/poService';

const POCreationDialog = ({
  open,
  onClose,
  selectedParts = [],
  roNumber,
  shopId,
  onPOCreated
}) => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [expedite, setExpedite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorKPIs, setVendorKPIs] = useState({});

  // Calculate PO summary
  const poSummary = useMemo(() => {
    const totalCost = selectedParts.reduce((sum, part) => sum + (part.unit_cost || 0) * (part.quantity_ordered || 1), 0);
    const totalParts = selectedParts.length;
    const totalQuantity = selectedParts.reduce((sum, part) => sum + (part.quantity_ordered || 1), 0);

    return {
      totalCost,
      totalParts,
      totalQuantity
    };
  }, [selectedParts]);

  // Generate PO number preview
  const poNumberPreview = useMemo(() => {
    if (!roNumber || !selectedVendor) return 'PO-XXXX-XXXX';

    const vendorCode = selectedVendor.vendor_code || 'VEND';
    const date = new Date();
    const yymm = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;

    return `${roNumber}-${yymm}-${vendorCode}-001`;
  }, [roNumber, selectedVendor]);

  // Load vendors on open
  useEffect(() => {
    if (open) {
      loadVendors();
    }
  }, [open]);

  // Load vendor KPIs when vendor selected
  useEffect(() => {
    if (selectedVendor) {
      loadVendorKPIs(selectedVendor.id);
    }
  }, [selectedVendor]);

  const loadVendors = async () => {
    setVendorsLoading(true);
    try {
      const result = await poService.getVendors(shopId);

      if (result.success) {
        setVendors(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast.error(`Failed to load vendors: ${error.message}`);
    } finally {
      setVendorsLoading(false);
    }
  };

  const loadVendorKPIs = async (vendorId) => {
    try {
      const result = await poService.getVendorKPIs(vendorId);

      if (result.success) {
        setVendorKPIs(result.data);
      }
    } catch (error) {
      console.error('Failed to load vendor KPIs:', error);
    }
  };

  const handleCreatePO = async () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (!deliveryDate) {
      toast.error('Please select a delivery date');
      return;
    }

    const partLineIds = selectedParts.map(part => part.id);

    setIsLoading(true);
    try {
      const result = await poService.createPOFromParts({
        part_line_ids: partLineIds,
        vendor_id: selectedVendor.id,
        ro_number: roNumber,
        delivery_date: deliveryDate.toISOString(),
        notes,
        expedite,
        shop_id: shopId
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(`Purchase order ${result.po_number} created successfully`);

      if (onPOCreated) {
        onPOCreated(result.data);
      }

      handleClose();
    } catch (error) {
      console.error('Failed to create PO:', error);
      toast.error(`Failed to create PO: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedVendor(null);
    setDeliveryDate(null);
    setNotes('');
    setExpedite(false);
    setVendorKPIs({});
    onClose();
  };

  const renderVendorKPIs = () => {
    if (!vendorKPIs.leadTime) return null;

    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Vendor Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {vendorKPIs.leadTime}d
                </Typography>
                <Typography variant="caption">Lead Time</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="success.main">
                  {vendorKPIs.fillRate}%
                </Typography>
                <Typography variant="caption">Fill Rate</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" color={vendorKPIs.returnRate > 5 ? 'error.main' : 'text.primary'}>
                  {vendorKPIs.returnRate}%
                </Typography>
                <Typography variant="caption">Return Rate</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="secondary.main">
                  {vendorKPIs.onTimeDelivery}%
                </Typography>
                <Typography variant="caption">On Time</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ShoppingCart color="primary" />
            <Typography variant="h6">Create Purchase Order</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* PO Number Preview */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Purchase Order Number
          </Typography>
          <Typography variant="h6" fontFamily="monospace">
            {poNumberPreview}
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column - PO Details */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* Vendor Selection */}
              <FormControl fullWidth>
                <Autocomplete
                  options={vendors}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedVendor}
                  onChange={(event, newValue) => setSelectedVendor(newValue)}
                  loading={vendorsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Vendor"
                      required
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.vendor_code} • {option.category || 'General'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </FormControl>

              {/* Delivery Date */}
              <DatePicker
                label="Expected Delivery Date"
                value={deliveryDate}
                onChange={setDeliveryDate}
                minDate={new Date()}
                slots={{
                  textField: (params) => (
                    <TextField
                      {...params}
                      required
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <LocalShipping sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  )
                }}
              />

              {/* Notes */}
              <TextField
                label="Notes & Special Instructions"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special delivery instructions or notes..."
                InputProps={{
                  startAdornment: <Assignment sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                }}
              />

              {/* Expedite Option */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expedite}
                    onChange={(e) => setExpedite(e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Speed color="warning" />
                    <Typography>Rush/Expedite Order</Typography>
                  </Box>
                }
              />

              {/* Vendor KPIs */}
              {renderVendorKPIs()}
            </Stack>
          </Grid>

          {/* Right Column - Parts Summary */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Parts Summary ({selectedParts.length} items)
            </Typography>

            <List dense sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {selectedParts.map((part, index) => (
                <React.Fragment key={part.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.875rem' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={part.description}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Part #: {part.part_number}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Qty: {part.quantity_ordered || 1} × ${part.unit_cost || 0}
                          </Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" fontWeight="bold">
                      ${((part.unit_cost || 0) * (part.quantity_ordered || 1)).toFixed(2)}
                    </Typography>
                  </ListItem>
                  {index < selectedParts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {/* PO Totals */}
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Order Summary
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Total Parts:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      {poSummary.totalParts}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Total Quantity:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      {poSummary.totalQuantity}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Total Amount:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" align="right" color="primary">
                      ${poSummary.totalCost.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {expedite && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Rush order - Additional fees may apply
                </Typography>
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreatePO}
          disabled={isLoading || !selectedVendor || !deliveryDate}
          startIcon={isLoading ? <LinearProgress size={20} /> : <ShoppingCart />}
        >
          {isLoading ? 'Creating...' : `Create PO - $${poSummary.totalCost.toFixed(2)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default POCreationDialog;