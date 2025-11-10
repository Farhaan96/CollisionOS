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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import {
  Receipt,
  Download,
  Send,
  Edit,
  Delete,
  Add,
  CheckCircle,
  Warning,
  Print,
  Payment,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

/**
 * InvoiceGenerationPage - Generate invoices from completed repair orders
 */
const InvoiceGenerationPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { roId } = useParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [selectedRO, setSelectedRO] = useState(null);
  const [roDetails, setRODetails] = useState(null);
  const [paymentTerms, setPaymentTerms] = useState('net30');
  const [discounts, setDiscounts] = useState([]);
  const [additionalCharges, setAdditionalCharges] = useState([]);

  useEffect(() => {
    loadInvoices();
    if (roId) {
      loadRODetails(roId);
    }
  }, [roId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/invoices');
      if (response.data.success) {
        setInvoices(response.data.invoices || []);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(err.response?.data?.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadRODetails = async (id) => {
    try {
      const response = await axios.get(`/api/jobs/${id}`);
      if (response.data.success) {
        setRODetails(response.data.job);
      }
    } catch (err) {
      console.error('Error loading RO details:', err);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedRO && !roId) {
      setError('Please select a repair order');
      return;
    }

    const targetROId = roId || selectedRO;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`/api/invoices/generate-from-ro/${targetROId}`, {
        payment_terms: paymentTerms,
        discounts,
        additional_charges,
      });

      if (response.data.success) {
        setSuccess('Invoice generated successfully');
        setTimeout(() => setSuccess(null), 3000);
        setGenerateDialog(false);
        await loadInvoices();
        navigate(`/invoices/${response.data.invoice.id}`);
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      const response = await axios.post(`/api/invoices/${invoiceId}/send`);
      if (response.data.success) {
        setSuccess('Invoice sent successfully');
        setTimeout(() => setSuccess(null), 3000);
        await loadInvoices();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invoice');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
            Invoice Management
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Generate and manage invoices from completed repair orders
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setGenerateDialog(true)}
        >
          Generate Invoice
        </Button>
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

      {/* Invoices Table */}
      <Card>
        <CardContent>
          {loading && invoices.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>RO #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {invoice.customer
                          ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.repairOrder?.roNumber || invoice.repairOrderId || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate
                          ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        ${parseFloat(invoice.totalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.invoiceStatus}
                          color={
                            invoice.invoiceStatus === 'paid'
                              ? 'success'
                              : invoice.invoiceStatus === 'overdue'
                              ? 'error'
                              : invoice.invoiceStatus === 'sent'
                              ? 'info'
                              : 'default'
                          }
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size='small'
                            onClick={() => handleDownloadPDF(invoice.id)}
                            title='Download PDF'
                          >
                            <Download fontSize='small' />
                          </IconButton>
                          {invoice.invoiceStatus === 'draft' && (
                            <IconButton
                              size='small'
                              onClick={() => handleSendInvoice(invoice.id)}
                              title='Send Invoice'
                            >
                              <Send fontSize='small' />
                            </IconButton>
                          )}
                          <IconButton
                            size='small'
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                            title='View Details'
                          >
                            <Receipt fontSize='small' />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog
        open={generateDialog}
        onClose={() => setGenerateDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Generate Invoice from Repair Order</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Payment Terms</InputLabel>
            <Select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              label='Payment Terms'
            >
              <MenuItem value='due_on_receipt'>Due on Receipt</MenuItem>
              <MenuItem value='net15'>Net 15 Days</MenuItem>
              <MenuItem value='net30'>Net 30 Days</MenuItem>
              <MenuItem value='net45'>Net 45 Days</MenuItem>
              <MenuItem value='net60'>Net 60 Days</MenuItem>
            </Select>
          </FormControl>

          {roDetails && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Repair Order Summary:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      RO Number:
                    </Typography>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                      {roDetails.jobNumber || roDetails.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Estimated Total:
                    </Typography>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                      ${parseFloat(roDetails.estimatedTotal || 0).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleGenerateInvoice}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Receipt />}
          >
            Generate Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceGenerationPage;

