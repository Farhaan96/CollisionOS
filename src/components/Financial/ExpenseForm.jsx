/**
 * ExpenseForm Component - CollisionOS Phase 2
 *
 * Form for creating and editing expenses
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
  Grid,
  Alert,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import { expenseService } from '../../services/expenseService';

const ExpenseForm = ({ open, onClose, expense, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    expense_type: 'job_cost',
    category: '',
    subcategory: '',
    description: '',
    amount: '',
    tax_amount: '',
    vendor_name: '',
    vendor_invoice_number: '',
    expense_date: new Date().toISOString().split('T')[0],
    due_date: '',
    is_billable: false,
    markup_percentage: '',
    notes: ''
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        expense_type: expense.expenseType || 'job_cost',
        category: expense.category || '',
        subcategory: expense.subcategory || '',
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        tax_amount: expense.taxAmount?.toString() || '',
        vendor_name: expense.vendorName || '',
        vendor_invoice_number: expense.vendorInvoiceNumber || '',
        expense_date: expense.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: expense.dueDate?.split('T')[0] || '',
        is_billable: expense.isBillable || false,
        markup_percentage: expense.markupPercentage?.toString() || '',
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const validateForm = () => {
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (!formData.description) {
      setError('Description is required');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valid amount is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (expense) {
        result = await expenseService.updateExpense(expense.id, formData);
      } else {
        result = await expenseService.createExpense(formData);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save expense');
      }

      onSuccess && onSuccess(result.expense);
    } catch (err) {
      console.error('Save expense error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = {
    job_cost: ['Sublet', 'Materials', 'Special Tools', 'Towing', 'Storage'],
    operating: ['Rent', 'Utilities', 'Insurance', 'Supplies', 'Marketing'],
    payroll: ['Wages', 'Benefits', 'Taxes', 'Bonuses'],
    overhead: ['Equipment', 'Software', 'Training', 'Licensing'],
    capital: ['Equipment Purchase', 'Facility Improvement', 'Vehicle Purchase']
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{expense ? 'Edit Expense' : 'New Expense'}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Expense Type</InputLabel>
              <Select
                value={formData.expense_type}
                onChange={handleChange('expense_type')}
                label="Expense Type"
                disabled={loading}
              >
                <MenuItem value="job_cost">Job Cost</MenuItem>
                <MenuItem value="operating">Operating Expense</MenuItem>
                <MenuItem value="payroll">Payroll</MenuItem>
                <MenuItem value="overhead">Overhead</MenuItem>
                <MenuItem value="capital">Capital Expense</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={expenseCategories[formData.expense_type] || []}
              value={formData.category}
              onChange={(e, newValue) => setFormData({ ...formData, category: newValue || '' })}
              onInputChange={(e, newValue) => setFormData({ ...formData, category: newValue || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Category" required disabled={loading} />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              disabled={loading}
              required
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={handleChange('amount')}
              disabled={loading}
              required
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tax Amount"
              type="number"
              value={formData.tax_amount}
              onChange={handleChange('tax_amount')}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Total"
              value={(parseFloat(formData.amount || 0) + parseFloat(formData.tax_amount || 0)).toFixed(2)}
              disabled
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vendor Name"
              value={formData.vendor_name}
              onChange={handleChange('vendor_name')}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vendor Invoice #"
              value={formData.vendor_invoice_number}
              onChange={handleChange('vendor_invoice_number')}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expense Date"
              type="date"
              value={formData.expense_date}
              onChange={handleChange('expense_date')}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={handleChange('due_date')}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              disabled={loading}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : (expense ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseForm;
