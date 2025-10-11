/**
 * PaymentForm Component - CollisionOS Phase 2
 *
 * Comprehensive payment recording with Stripe Elements integration
 * Supports multiple payment types: cash, credit card, check, insurance, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Divider,
  InputAdornment
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { paymentService } from '../../services/paymentService';

// Initialize Stripe (load publishable key from env)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

/**
 * Card Input Component (uses Stripe Elements)
 */
const CardInput = ({ disabled }) => {
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Box
      sx={{
        border: '1px solid #d1d5db',
        borderRadius: 1,
        padding: 2,
        backgroundColor: disabled ? '#f3f4f6' : '#fff',
      }}
    >
      <CardElement options={cardElementOptions} />
    </Box>
  );
};

/**
 * Payment Form Inner Component (with Stripe context)
 */
const PaymentFormInner = ({
  open,
  onClose,
  invoice,
  repairOrder,
  onPaymentSuccess
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    paymentType: 'credit_card',
    amount: invoice?.balanceDue || repairOrder?.balanceDue || 0,
    paymentMethod: '',
    checkNumber: '',
    reference: '',
    notes: '',
    savePaymentMethod: false,
    sendReceipt: true
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        paymentType: 'credit_card',
        amount: invoice?.balanceDue || repairOrder?.balanceDue || 0,
        paymentMethod: '',
        checkNumber: '',
        reference: '',
        notes: '',
        savePaymentMethod: false,
        sendReceipt: true
      });
      setError(null);
      setSuccess(false);
    }
  }, [open, invoice, repairOrder]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const validateForm = () => {
    if (!formData.amount || formData.amount <= 0) {
      setError('Payment amount must be greater than zero');
      return false;
    }

    const maxAmount = invoice?.balanceDue || repairOrder?.balanceDue || 0;
    if (formData.amount > maxAmount) {
      setError(`Payment amount cannot exceed balance due ($${maxAmount.toFixed(2)})`);
      return false;
    }

    if (formData.paymentType === 'check' && !formData.checkNumber) {
      setError('Check number is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      let paymentResult;

      if (formData.paymentType === 'credit_card' || formData.paymentType === 'debit_card') {
        // Stripe payment flow
        if (!stripe || !elements) {
          throw new Error('Stripe has not loaded yet');
        }

        // Step 1: Create payment intent
        const intentResponse = await paymentService.createPaymentIntent({
          amount: formData.amount,
          invoice_id: invoice?.id,
          repair_order_id: repairOrder?.id,
          customer_id: invoice?.customerId || repairOrder?.customerId,
          save_payment_method: formData.savePaymentMethod
        });

        if (!intentResponse.success) {
          throw new Error(intentResponse.error || 'Failed to create payment intent');
        }

        const { clientSecret } = intentResponse.data;

        // Step 2: Confirm payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                name: invoice?.customer?.name || repairOrder?.customer?.name
              }
            }
          }
        );

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        // Step 3: Confirm and record in our system
        paymentResult = await paymentService.confirmPayment({
          payment_intent_id: paymentIntent.id,
          invoice_id: invoice?.id,
          repair_order_id: repairOrder?.id,
          notes: formData.notes
        });

      } else {
        // Non-Stripe payment (cash, check, insurance, etc.)
        paymentResult = await paymentService.createPayment({
          payment_type: formData.paymentType,
          amount: formData.amount,
          invoice_id: invoice?.id,
          repair_order_id: repairOrder?.id,
          payment_method: formData.paymentMethod,
          check_number: formData.checkNumber,
          reference_number: formData.reference,
          notes: formData.notes,
          send_receipt: formData.sendReceipt
        });
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      setSuccess(true);

      // Call success callback after short delay
      setTimeout(() => {
        onPaymentSuccess && onPaymentSuccess(paymentResult.payment);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred processing the payment');
    } finally {
      setLoading(false);
    }
  };

  const paymentTypes = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'check', label: 'Check' },
    { value: 'insurance', label: 'Insurance Payment' },
    { value: 'wire_transfer', label: 'Wire Transfer' },
    { value: 'ach', label: 'ACH/Bank Transfer' }
  ];

  const showStripeElements = formData.paymentType === 'credit_card' || formData.paymentType === 'debit_card';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Record Payment
        {invoice && (
          <Typography variant="body2" color="text.secondary">
            Invoice: {invoice.invoiceNumber} - Balance: ${invoice.balanceDue.toFixed(2)}
          </Typography>
        )}
        {repairOrder && !invoice && (
          <Typography variant="body2" color="text.secondary">
            RO: {repairOrder.roNumber} - Balance: ${repairOrder.balanceDue.toFixed(2)}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Payment recorded successfully!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Payment Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={formData.paymentType}
                onChange={handleChange('paymentType')}
                label="Payment Type"
                disabled={loading || success}
              >
                {paymentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Amount */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={formData.amount}
              onChange={handleChange('amount')}
              disabled={loading || success}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>

          {/* Stripe Card Element */}
          {showStripeElements && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Card Information
              </Typography>
              <CardInput disabled={loading || success} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.savePaymentMethod}
                    onChange={handleChange('savePaymentMethod')}
                    disabled={loading || success}
                  />
                }
                label="Save card for future payments"
                sx={{ mt: 1 }}
              />
            </Grid>
          )}

          {/* Check Number (for check payments) */}
          {formData.paymentType === 'check' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Check Number"
                  value={formData.checkNumber}
                  onChange={handleChange('checkNumber')}
                  disabled={loading || success}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank/Institution"
                  value={formData.paymentMethod}
                  onChange={handleChange('paymentMethod')}
                  disabled={loading || success}
                />
              </Grid>
            </>
          )}

          {/* Reference Number (for insurance, wire, ACH) */}
          {['insurance', 'wire_transfer', 'ach'].includes(formData.paymentType) && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference/Transaction Number"
                value={formData.reference}
                onChange={handleChange('reference')}
                disabled={loading || success}
              />
            </Grid>
          )}

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              disabled={loading || success}
              multiline
              rows={2}
              placeholder="Optional notes about this payment..."
            />
          </Grid>

          {/* Send Receipt */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.sendReceipt}
                  onChange={handleChange('sendReceipt')}
                  disabled={loading || success}
                />
              }
              label="Email receipt to customer"
            />
          </Grid>

          {/* Processing Fee Estimate (for card payments) */}
          {showStripeElements && formData.amount > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Amount:
                </Typography>
                <Typography variant="body2">
                  ${formData.amount.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Processing Fee (2.9% + $0.30):
                </Typography>
                <Typography variant="body2" color="error">
                  -${((formData.amount * 0.029) + 0.30).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight="bold">
                  Net Amount:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${(formData.amount - ((formData.amount * 0.029) + 0.30)).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading || success}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || success || !stripe}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Processing...' : `Record Payment ${formData.amount > 0 ? `($${formData.amount.toFixed(2)})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Main Payment Form Component (wraps with Stripe provider)
 */
const PaymentForm = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default PaymentForm;
