/**
 * PaymentHistory Component - CollisionOS Phase 2
 *
 * Displays payment history for an invoice or repair order
 */

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Undo as RefundIcon,
  CreditCard as CardIcon,
  Money as CashIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { paymentService } from '../../services/paymentService';

const PaymentHistory = ({ payments, onRefund }) => {
  const [refundDialog, setRefundDialog] = useState({ open: false, payment: null });
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenRefund = (payment) => {
    setRefundDialog({ open: true, payment });
    setRefundAmount(payment.amount.toString());
    setRefundReason('');
    setError(null);
  };

  const handleCloseRefund = () => {
    setRefundDialog({ open: false, payment: null });
    setRefundAmount('');
    setRefundReason('');
    setError(null);
  };

  const handleProcessRefund = async () => {
    if (!refundDialog.payment) return;

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid refund amount');
      return;
    }

    if (amount > refundDialog.payment.amount) {
      setError('Refund amount cannot exceed original payment amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.refundPayment(refundDialog.payment.id, {
        amount,
        reason: refundReason
      });

      if (!result.success) {
        throw new Error(result.error || 'Refund failed');
      }

      onRefund && onRefund(result.payment);
      handleCloseRefund();
    } catch (err) {
      console.error('Refund error:', err);
      setError(err.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'cash':
        return <CashIcon />;
      case 'credit_card':
      case 'debit_card':
        return <CardIcon />;
      case 'check':
        return <CheckIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatPaymentType = (type) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!payments || payments.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No payments recorded yet
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Payment #</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Method/Reference</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} hover>
                <TableCell>
                  {format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPaymentIcon(payment.paymentType)}
                    <Typography variant="body2">{payment.paymentNumber}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{formatPaymentType(payment.paymentType)}</TableCell>
                <TableCell>
                  {payment.paymentType === 'check' && payment.checkNumber && (
                    <Typography variant="body2">Check #{payment.checkNumber}</Typography>
                  )}
                  {payment.paymentType === 'credit_card' && payment.cardLastFour && (
                    <Typography variant="body2">
                      {payment.cardBrand} ****{payment.cardLastFour}
                    </Typography>
                  )}
                  {payment.referenceNumber && (
                    <Typography variant="body2" color="text.secondary">
                      Ref: {payment.referenceNumber}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    ${payment.amount.toFixed(2)}
                  </Typography>
                  {payment.processingFee > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Fee: ${payment.processingFee.toFixed(2)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={payment.paymentStatus}
                    color={getStatusColor(payment.paymentStatus)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {payment.paymentStatus === 'completed' && (
                    <Tooltip title="Process Refund">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenRefund(payment)}
                      >
                        <RefundIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Refund Dialog */}
      <Dialog open={refundDialog.open} onClose={handleCloseRefund} maxWidth="sm" fullWidth>
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {refundDialog.payment && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Payment: {refundDialog.payment.paymentNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Original Amount: ${refundDialog.payment.amount.toFixed(2)}
              </Typography>

              <TextField
                fullWidth
                label="Refund Amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={loading}
                inputProps={{ min: 0, max: refundDialog.payment.amount, step: 0.01 }}
                sx={{ mt: 2, mb: 2 }}
              />

              <TextField
                fullWidth
                label="Refund Reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                disabled={loading}
                multiline
                rows={3}
                placeholder="Reason for refund..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRefund} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessRefund}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Process Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PaymentHistory;
