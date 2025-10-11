/**
 * ExpenseManagement Page - CollisionOS Phase 2
 *
 * Complete expense tracking and approval workflow interface
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Payment as PayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { expenseService } from '../../services/expenseService';
import ExpenseForm from '../../components/Financial/ExpenseForm';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    expense_type: '',
    category: '',
    approval_status: '',
    payment_status: '',
    start_date: '',
    end_date: ''
  });

  // Dialogs
  const [formDialog, setFormDialog] = useState({ open: false, expense: null });
  const [approveDialog, setApproveDialog] = useState({ open: false, expense: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, expense: null, reason: '' });
  const [payDialog, setPayDialog] = useState({ open: false, expense: null, amount: '', method: '', reference: '' });
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, expense: null });

  useEffect(() => {
    loadExpenses();
  }, [filters]);

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await expenseService.getExpenses(filters);
      if (result.success) {
        setExpenses(result.expenses || []);
        setSummary(result.summary || null);
      } else {
        setError(result.error || 'Failed to load expenses');
      }
    } catch (err) {
      console.error('Load expenses error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  const handleClearFilters = () => {
    setFilters({
      expense_type: '',
      category: '',
      approval_status: '',
      payment_status: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleOpenForm = (expense = null) => {
    setFormDialog({ open: true, expense });
  };

  const handleCloseForm = () => {
    setFormDialog({ open: false, expense: null });
  };

  const handleExpenseSaved = () => {
    loadExpenses();
    handleCloseForm();
  };

  const handleOpenActionMenu = (event, expense) => {
    setActionMenu({ anchorEl: event.currentTarget, expense });
  };

  const handleCloseActionMenu = () => {
    setActionMenu({ anchorEl: null, expense: null });
  };

  const handleApprove = async () => {
    if (!approveDialog.expense) return;

    try {
      const result = await expenseService.approveExpense(approveDialog.expense.id);
      if (result.success) {
        loadExpenses();
        setApproveDialog({ open: false, expense: null });
      } else {
        setError(result.error || 'Failed to approve expense');
      }
    } catch (err) {
      console.error('Approve error:', err);
      setError(err.message);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.expense || !rejectDialog.reason) {
      setError('Rejection reason is required');
      return;
    }

    try {
      const result = await expenseService.rejectExpense(rejectDialog.expense.id, {
        reason: rejectDialog.reason
      });
      if (result.success) {
        loadExpenses();
        setRejectDialog({ open: false, expense: null, reason: '' });
      } else {
        setError(result.error || 'Failed to reject expense');
      }
    } catch (err) {
      console.error('Reject error:', err);
      setError(err.message);
    }
  };

  const handlePay = async () => {
    if (!payDialog.expense) return;

    const amount = parseFloat(payDialog.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid payment amount');
      return;
    }

    try {
      const result = await expenseService.payExpense(payDialog.expense.id, {
        amount,
        payment_method: payDialog.method,
        payment_reference: payDialog.reference
      });
      if (result.success) {
        loadExpenses();
        setPayDialog({ open: false, expense: null, amount: '', method: '', reference: '' });
      } else {
        setError(result.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const result = await expenseService.deleteExpense(expenseId);
      if (result.success) {
        loadExpenses();
      } else {
        setError(result.error || 'Failed to delete expense');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      unpaid: 'warning',
      partial: 'info',
      paid: 'success'
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Expense Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          New Expense
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Expenses</Typography>
                <Typography variant="h4">${summary.totalExpenses.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Paid</Typography>
                <Typography variant="h4" color="success.main">${summary.totalPaid.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Outstanding</Typography>
                <Typography variant="h4" color="warning.main">${summary.totalOutstanding.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
            <Button size="small" onClick={handleClearFilters} sx={{ ml: 'auto' }}>
              Clear All
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={filters.expense_type}
                  onChange={handleFilterChange('expense_type')}
                  label="Expense Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="job_cost">Job Cost</MenuItem>
                  <MenuItem value="operating">Operating</MenuItem>
                  <MenuItem value="payroll">Payroll</MenuItem>
                  <MenuItem value="overhead">Overhead</MenuItem>
                  <MenuItem value="capital">Capital</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={filters.approval_status}
                  onChange={handleFilterChange('approval_status')}
                  label="Approval Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filters.payment_status}
                  onChange={handleFilterChange('payment_status')}
                  label="Payment Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={filters.start_date}
                onChange={handleFilterChange('start_date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Expense #</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Approval</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">Loading...</TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">No expenses found</TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>
                    {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{expense.expenseNumber}</TableCell>
                  <TableCell>
                    <Chip label={expense.expenseType.replace('_', ' ')} size="small" />
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {expense.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{expense.vendorName || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      ${expense.totalAmount.toFixed(2)}
                    </Typography>
                    {expense.paidAmount > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Paid: ${expense.paidAmount.toFixed(2)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={expense.approvalStatus}
                      color={getStatusColor(expense.approvalStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={expense.paymentStatus}
                      color={getStatusColor(expense.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenActionMenu(e, expense)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionMenu}
      >
        {actionMenu.expense?.approvalStatus === 'pending' && (
          [
            <MenuItem
              key="approve"
              onClick={() => {
                setApproveDialog({ open: true, expense: actionMenu.expense });
                handleCloseActionMenu();
              }}
            >
              <ListItemIcon><ApproveIcon color="success" /></ListItemIcon>
              <ListItemText>Approve</ListItemText>
            </MenuItem>,
            <MenuItem
              key="reject"
              onClick={() => {
                setRejectDialog({ open: true, expense: actionMenu.expense, reason: '' });
                handleCloseActionMenu();
              }}
            >
              <ListItemIcon><RejectIcon color="error" /></ListItemIcon>
              <ListItemText>Reject</ListItemText>
            </MenuItem>
          ]
        )}
        {actionMenu.expense?.approvalStatus === 'approved' && actionMenu.expense?.paymentStatus !== 'paid' && (
          <MenuItem
            onClick={() => {
              setPayDialog({
                open: true,
                expense: actionMenu.expense,
                amount: (actionMenu.expense.totalAmount - actionMenu.expense.paidAmount).toString(),
                method: '',
                reference: ''
              });
              handleCloseActionMenu();
            }}
          >
            <ListItemIcon><PayIcon color="primary" /></ListItemIcon>
            <ListItemText>Record Payment</ListItemText>
          </MenuItem>
        )}
        {['draft', 'pending'].includes(actionMenu.expense?.approvalStatus) && (
          [
            <MenuItem
              key="edit"
              onClick={() => {
                handleOpenForm(actionMenu.expense);
                handleCloseActionMenu();
              }}
            >
              <ListItemIcon><EditIcon /></ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>,
            <MenuItem
              key="delete"
              onClick={() => {
                handleDelete(actionMenu.expense.id);
                handleCloseActionMenu();
              }}
            >
              <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          ]
        )}
      </Menu>

      {/* Expense Form Dialog */}
      {formDialog.open && (
        <ExpenseForm
          open={formDialog.open}
          onClose={handleCloseForm}
          expense={formDialog.expense}
          onSuccess={handleExpenseSaved}
        />
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, expense: null })}>
        <DialogTitle>Approve Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this expense?
          </Typography>
          {approveDialog.expense && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Amount: ${approveDialog.expense.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Description: {approveDialog.expense.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, expense: null })}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success">Approve</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, expense: null, reason: '' })}>
        <DialogTitle>Reject Expense</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rejection Reason"
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
            multiline
            rows={3}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, expense: null, reason: '' })}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error">Reject</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payDialog.open} onClose={() => setPayDialog({ open: false, expense: null, amount: '', method: '', reference: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Record Expense Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={payDialog.amount}
                onChange={(e) => setPayDialog({ ...payDialog, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={payDialog.method}
                  onChange={(e) => setPayDialog({ ...payDialog, method: e.target.value })}
                  label="Payment Method"
                >
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="ach">ACH/Bank Transfer</MenuItem>
                  <MenuItem value="wire">Wire Transfer</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference/Check Number"
                value={payDialog.reference}
                onChange={(e) => setPayDialog({ ...payDialog, reference: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog({ open: false, expense: null, amount: '', method: '', reference: '' })}>
            Cancel
          </Button>
          <Button onClick={handlePay} variant="contained">Record Payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseManagement;
