import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  useTheme,
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  CheckCircle,
  Warning,
  Receipt,
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Initialize Stripe (use placeholder if key not set)
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

/**
 * PaymentForm - Stripe payment form component
 */
const PaymentForm = ({ invoice, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const intentResponse = await axios.post('/api/payments/stripe/intent', {
        amount: invoice.balanceDue,
        invoice_id: invoice.id,
        customer_email: invoice.customer?.email,
        customer_name: invoice.customer
          ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
          : '',
      });

      if (!intentResponse.data.success) {
        throw new Error(intentResponse.data.error || 'Failed to create payment intent');
      }

      const { clientSecret } = intentResponse.data;

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await axios.post('/api/payments/stripe/confirm', {
          payment_intent_id: paymentIntent.id,
          invoice_id: invoice.id,
        });

        onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 2 }}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Card Details
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
          <CardElement
            options={{
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
            }}
          />
        </Paper>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type='submit'
        variant='contained'
        fullWidth
        disabled={!stripe || loading}
        startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
      >
        {loading ? 'Processing...' : `Pay $${parseFloat(invoice.balanceDue || 0).toFixed(2)}`}
      </Button>
    </form>
  );
};

/**
 * PaymentProcessingPage - Process payments for invoices
 */
const PaymentProcessingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [paymentType, setPaymentType] = useState('credit_card');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${invoiceId}`);
      if (response.data.success) {
        setInvoice(response.data.invoice);
        setPaymentAmount(response.data.invoice.balanceDue);
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError(err.response?.data?.error || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > invoice.balanceDue) {
      setError('Payment amount cannot exceed balance due');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        invoice_id: invoiceId,
        payment_type: paymentType,
        amount: paymentAmount,
        notes,
      };

      if (paymentType === 'check') {
        paymentData.check_number = checkNumber;
      }

      const response = await axios.post('/api/payments', paymentData);

      if (response.data.success) {
        setSuccess('Payment recorded successfully');
        setTimeout(() => {
          setSuccess(null);
          setPaymentDialog(false);
          loadInvoice();
        }, 2000);
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePaymentSuccess = () => {
    setSuccess('Payment processed successfully');
    setTimeout(() => {
      setSuccess(null);
      setPaymentDialog(false);
      loadInvoice();
    }, 2000);
  };

  if (loading && !invoice) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>Invoice not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
          Process Payment
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Invoice #{invoice.invoiceNumber}
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Invoice Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                Invoice Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  Customer
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 600 }}>
                  {invoice.customer
                    ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                    : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  Invoice Date
                </Typography>
                <Typography variant='body1'>
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  Due Date
                </Typography>
                <Typography variant='body1'>
                  {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2'>Subtotal:</Typography>
                <Typography variant='body2'>${parseFloat(invoice.subtotal || 0).toFixed(2)}</Typography>
              </Box>
              {invoice.discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant='body2'>Discount:</Typography>
                  <Typography variant='body2' color='success.main'>
                    -${parseFloat(invoice.discountAmount || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2'>Tax ({invoice.taxRate}%):</Typography>
                <Typography variant='body2'>${parseFloat(invoice.taxAmount || 0).toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body1' sx={{ fontWeight: 600 }}>
                  Total:
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 600 }}>
                  ${parseFloat(invoice.totalAmount || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='body2' color='text.secondary'>
                  Paid:
                </Typography>
                <Typography variant='body2' color='success.main'>
                  ${parseFloat(invoice.paidAmount || 0).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Balance Due:
                </Typography>
                <Typography variant='h6' sx={{ fontWeight: 600, color: 'primary.main' }}>
                  ${parseFloat(invoice.balanceDue || 0).toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                Record Payment
              </Typography>

              <FormControl component='fieldset' fullWidth sx={{ mb: 2 }}>
                <FormLabel component='legend'>Payment Type</FormLabel>
                <RadioGroup
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <FormControlLabel value='cash' control={<Radio />} label='Cash' />
                  <FormControlLabel value='check' control={<Radio />} label='Check' />
                  <FormControlLabel value='credit_card' control={<Radio />} label='Credit Card' />
                  <FormControlLabel value='insurance' control={<Radio />} label='Insurance' />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                label='Payment Amount'
                type='number'
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />

              {paymentType === 'check' && (
                <TextField
                  fullWidth
                  label='Check Number'
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}

              {paymentType === 'credit_card' && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    invoice={invoice}
                    onSuccess={handleStripePaymentSuccess}
                    onError={(err) => setError(err.message)}
                  />
                </Elements>
              ) : paymentType === 'credit_card' ? (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  Stripe is not configured. Please set REACT_APP_STRIPE_PUBLISHABLE_KEY environment variable.
                </Alert>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label='Notes (optional)'
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant='contained'
                    fullWidth
                    onClick={handleRecordPayment}
                    disabled={loading || !paymentAmount || paymentAmount <= 0}
                    startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
                  >
                    Record Payment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentProcessingPage;

