/**
 * FinancialDashboard Page - CollisionOS Phase 2
 *
 * Comprehensive financial overview and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  MoneyOff as ExpenseIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { expenseService } from '../../services/expenseService';

const FinancialDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('this_month');

  const [metrics, setMetrics] = useState({
    revenue: { current: 0, previous: 0, change: 0 },
    expenses: { current: 0, previous: 0, change: 0 },
    profit: { current: 0, previous: 0, change: 0 },
    outstanding: 0
  });

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [overdueExpenses, setOverdueExpenses] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const getDateRangeParams = () => {
    const now = new Date();
    let start_date, end_date;

    switch (dateRange) {
      case 'today':
        start_date = now.toISOString().split('T')[0];
        end_date = start_date;
        break;
      case 'last_7_days':
        start_date = subDays(now, 7).toISOString().split('T')[0];
        end_date = now.toISOString().split('T')[0];
        break;
      case 'this_month':
        start_date = startOfMonth(now).toISOString().split('T')[0];
        end_date = endOfMonth(now).toISOString().split('T')[0];
        break;
      case 'last_30_days':
        start_date = subDays(now, 30).toISOString().split('T')[0];
        end_date = now.toISOString().split('T')[0];
        break;
      case 'this_year':
        start_date = `${now.getFullYear()}-01-01`;
        end_date = `${now.getFullYear()}-12-31`;
        break;
      default:
        start_date = startOfMonth(now).toISOString().split('T')[0];
        end_date = endOfMonth(now).toISOString().split('T')[0];
    }

    return { start_date, end_date };
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { start_date, end_date } = getDateRangeParams();

      // Load invoices
      const invoicesResult = await invoiceService.getInvoices({
        start_date,
        end_date,
        limit: 100
      });

      // Load payments
      const paymentsResult = await paymentService.getPayments({
        start_date,
        end_date,
        limit: 100
      });

      // Load expenses
      const expensesResult = await expenseService.getExpenses({
        start_date,
        end_date,
        limit: 100
      });

      // Load overdue items
      const overdueInvoicesResult = await invoiceService.getOverdueInvoices();
      const overdueExpensesResult = await expenseService.getOverdueExpenses();

      // Calculate metrics
      const totalRevenue = invoicesResult.summary?.totalPaid || 0;
      const totalExpenses = expensesResult.summary?.totalPaid || 0;
      const totalProfit = totalRevenue - totalExpenses;
      const totalOutstanding = invoicesResult.summary?.totalOutstanding || 0;

      setMetrics({
        revenue: { current: totalRevenue, previous: 0, change: 0 },
        expenses: { current: totalExpenses, previous: 0, change: 0 },
        profit: { current: totalProfit, previous: 0, change: 0 },
        outstanding: totalOutstanding
      });

      setRecentInvoices(invoicesResult.invoices?.slice(0, 5) || []);
      setRecentPayments(paymentsResult.payments?.slice(0, 5) || []);
      setOverdueInvoices(overdueInvoicesResult.invoices || []);
      setOverdueExpenses(overdueExpensesResult.expenses || []);

    } catch (err) {
      console.error('Load dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color = 'primary', change }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              ${value.toFixed(2)}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(change).toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 1,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon color={color} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Financial Dashboard</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            label="Date Range"
            size="small"
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="last_7_days">Last 7 Days</MenuItem>
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="last_30_days">Last 30 Days</MenuItem>
            <MenuItem value="this_year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={metrics.revenue.current}
            icon={InvoiceIcon}
            color="success"
            change={metrics.revenue.change}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Expenses"
            value={metrics.expenses.current}
            icon={ExpenseIcon}
            color="error"
            change={metrics.expenses.change}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Net Profit"
            value={metrics.profit.current}
            icon={BalanceIcon}
            color="primary"
            change={metrics.profit.change}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Outstanding"
            value={metrics.outstanding}
            icon={PaymentIcon}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Invoices */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Invoices</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No invoices found</TableCell>
                      </TableRow>
                    ) : (
                      recentInvoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>
                            {invoice.customer?.firstName} {invoice.customer?.lastName}
                          </TableCell>
                          <TableCell align="right">${invoice.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.invoiceStatus}
                              size="small"
                              color={invoice.invoiceStatus === 'paid' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Payments</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Payment #</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No payments found</TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map((payment) => (
                        <TableRow key={payment.id} hover>
                          <TableCell>
                            {format(new Date(payment.paymentDate), 'MMM dd')}
                          </TableCell>
                          <TableCell>{payment.paymentNumber}</TableCell>
                          <TableCell>
                            <Chip label={payment.paymentType} size="small" />
                          </TableCell>
                          <TableCell align="right">${payment.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Invoices */}
        {overdueInvoices.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Overdue Invoices ({overdueInvoices.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell align="right">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdueInvoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>
                            {invoice.customer?.firstName} {invoice.customer?.lastName}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            ${invoice.balanceDue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Overdue Expenses */}
        {overdueExpenses.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Overdue Expenses ({overdueExpenses.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Expense #</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdueExpenses.map((expense) => (
                        <TableRow key={expense.id} hover>
                          <TableCell>{expense.expenseNumber}</TableCell>
                          <TableCell>{expense.vendorName || 'N/A'}</TableCell>
                          <TableCell>
                            {format(new Date(expense.dueDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            ${expense.totalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default FinancialDashboard;
