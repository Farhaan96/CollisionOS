/**
 * InvoiceBuilder Page - CollisionOS Phase 2
 *
 * Comprehensive invoice creation and management interface
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Alert,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { invoiceService } from '../../services/invoiceService';
import PaymentForm from '../../components/Financial/PaymentForm';
import PaymentHistory from '../../components/Financial/PaymentHistory';

const InvoiceBuilder = ({ invoiceId, repairOrderId, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [invoice, setInvoice] = useState({
    invoice_type: 'standard',
    customer_id: '',
    repair_order_id: repairOrderId || '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'net30',
    labor_total: 0,
    parts_total: 0,
    sublet_total: 0,
    subtotal: 0,
    tax_rate: 7.5,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    notes: ''
  });

  const [lineItems, setLineItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentDialog, setPaymentDialog] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  useEffect(() => {
    calculateTotals();
  }, [lineItems, invoice.tax_rate, invoice.discount_amount]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const result = await invoiceService.getInvoice(invoiceId);
      if (result.success) {
        setInvoice(result.invoice);
        setLineItems(result.invoice.lineItems || []);
        setPayments(result.invoice.payments || []);
      } else {
        setError(result.error || 'Failed to load invoice');
      }
    } catch (err) {
      console.error('Load invoice error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let laborTotal = 0;
    let partsTotal = 0;
    let subletTotal = 0;

    lineItems.forEach(item => {
      const total = item.quantity * item.unit_price;
      switch (item.item_type) {
        case 'labor':
          laborTotal += total;
          break;
        case 'parts':
          partsTotal += total;
          break;
        case 'sublet':
          subletTotal += total;
          break;
        default:
          break;
      }
    });

    const subtotal = laborTotal + partsTotal + subletTotal;
    const discountAmount = parseFloat(invoice.discount_amount) || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxRate = parseFloat(invoice.tax_rate) || 0;
    const taxAmount = taxableAmount * (taxRate / 100);
    const totalAmount = taxableAmount + taxAmount;

    setInvoice(prev => ({
      ...prev,
      labor_total: laborTotal,
      parts_total: partsTotal,
      sublet_total: subletTotal,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  };

  const handleInvoiceChange = (field) => (event) => {
    setInvoice({ ...invoice, [field]: event.target.value });
    setError(null);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now(),
        item_type: 'labor',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0
      }
    ]);
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }

    setLineItems(updated);
  };

  const handleDeleteLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const validateInvoice = () => {
    if (!invoice.customer_id) {
      setError('Customer is required');
      return false;
    }
    if (lineItems.length === 0) {
      setError('At least one line item is required');
      return false;
    }
    return true;
  };

  const handleSave = async (sendToCustomer = false) => {
    if (!validateInvoice()) return;

    setLoading(true);
    setError(null);

    try {
      const invoiceData = {
        ...invoice,
        line_items: lineItems.map(item => ({
          item_type: item.item_type,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      };

      let result;
      if (invoiceId) {
        result = await invoiceService.updateInvoice(invoiceId, invoiceData);
      } else {
        result = await invoiceService.createInvoice(invoiceData);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save invoice');
      }

      setSuccess('Invoice saved successfully');

      // Send to customer if requested
      if (sendToCustomer && result.invoice?.id) {
        const sendResult = await invoiceService.sendInvoice(result.invoice.id);
        if (sendResult.success) {
          setSuccess('Invoice saved and sent to customer');
        }
      }

      onSave && onSave(result.invoice);
    } catch (err) {
      console.error('Save invoice error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment) => {
    setPayments([...payments, payment]);
    loadInvoice(); // Reload to get updated balance
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {invoiceId ? 'Edit Invoice' : 'New Invoice'}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            sx={{ mr: 1 }}
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => handleSave(false)}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => handleSave(true)}
            disabled={loading}
          >
            Save & Send
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Invoice Header */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Invoice Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Invoice Type</InputLabel>
                    <Select
                      value={invoice.invoice_type}
                      onChange={handleInvoiceChange('invoice_type')}
                      label="Invoice Type"
                      disabled={loading}
                    >
                      <MenuItem value="standard">Standard Invoice</MenuItem>
                      <MenuItem value="estimate">Estimate</MenuItem>
                      <MenuItem value="supplement">Supplement</MenuItem>
                      <MenuItem value="final">Final Invoice</MenuItem>
                      <MenuItem value="credit_memo">Credit Memo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Invoice Date"
                    type="date"
                    value={invoice.invoice_date}
                    onChange={handleInvoiceChange('invoice_date')}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={invoice.due_date}
                    onChange={handleInvoiceChange('due_date')}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      value={invoice.payment_terms}
                      onChange={handleInvoiceChange('payment_terms')}
                      label="Payment Terms"
                      disabled={loading}
                    >
                      <MenuItem value="due_on_receipt">Due on Receipt</MenuItem>
                      <MenuItem value="net15">Net 15 Days</MenuItem>
                      <MenuItem value="net30">Net 30 Days</MenuItem>
                      <MenuItem value="net45">Net 45 Days</MenuItem>
                      <MenuItem value="net60">Net 60 Days</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Invoice Summary</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Labor:</Typography>
                <Typography>${invoice.labor_total.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Parts:</Typography>
                <Typography>${invoice.parts_total.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Sublet:</Typography>
                <Typography>${invoice.sublet_total.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>${invoice.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax ({invoice.tax_rate}%):</Typography>
                <Typography>${invoice.tax_amount.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">${invoice.total_amount.toFixed(2)}</Typography>
              </Box>
              {invoiceId && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Paid:</Typography>
                    <Typography color="success.main">${(invoice.paid_amount || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">Balance Due:</Typography>
                    <Typography fontWeight="bold" color="warning.main">
                      ${(invoice.balance_due || invoice.total_amount).toFixed(2)}
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setPaymentDialog(true)}
                    disabled={invoice.balance_due <= 0}
                    sx={{ mt: 2 }}
                  >
                    Record Payment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Line Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Line Items</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddLineItem}
                  disabled={loading}
                >
                  Add Item
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="120px">Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell width="100px">Qty</TableCell>
                      <TableCell width="120px">Unit Price</TableCell>
                      <TableCell width="120px">Total</TableCell>
                      <TableCell width="60px"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>
                          <Select
                            value={item.item_type}
                            onChange={(e) => handleLineItemChange(index, 'item_type', e.target.value)}
                            size="small"
                            fullWidth
                          >
                            <MenuItem value="labor">Labor</MenuItem>
                            <MenuItem value="parts">Parts</MenuItem>
                            <MenuItem value="sublet">Sublet</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            size="small"
                            fullWidth
                            placeholder="Item description..."
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography>${item.total.toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLineItem(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lineItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">
                            No line items. Click "Add Item" to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tax Rate (%)"
                    type="number"
                    value={invoice.tax_rate}
                    onChange={handleInvoiceChange('tax_rate')}
                    disabled={loading}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Discount Amount"
                    type="number"
                    value={invoice.discount_amount}
                    onChange={handleInvoiceChange('discount_amount')}
                    disabled={loading}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment History */}
        {invoiceId && payments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Payment History</Typography>
                <PaymentHistory payments={payments} onRefund={loadInvoice} />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                label="Invoice Notes"
                value={invoice.notes}
                onChange={handleInvoiceChange('notes')}
                disabled={loading}
                multiline
                rows={3}
                placeholder="Additional notes or terms..."
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      {paymentDialog && (
        <PaymentForm
          open={paymentDialog}
          onClose={() => setPaymentDialog(false)}
          invoice={invoice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Box>
  );
};

export default InvoiceBuilder;
