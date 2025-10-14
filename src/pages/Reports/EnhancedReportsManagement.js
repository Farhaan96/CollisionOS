import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Refresh,
  FilterList,
  Assessment,
  AttachMoney,
  People,
  DirectionsCar,
  Build,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const EnhancedReportsManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [drillDownData, setDrillDownData] = useState(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  // Mock data for demonstration
  const [reportData, setReportData] = useState({
    revenue: [
      { month: 'Jan', revenue: 45000, jobs: 12 },
      { month: 'Feb', revenue: 52000, jobs: 15 },
      { month: 'Mar', revenue: 48000, jobs: 13 },
      { month: 'Apr', revenue: 61000, jobs: 18 },
      { month: 'May', revenue: 55000, jobs: 16 },
      { month: 'Jun', revenue: 67000, jobs: 20 },
    ],
    jobsByStatus: [
      { status: 'Completed', count: 45, color: '#4caf50' },
      { status: 'In Progress', count: 12, color: '#ff9800' },
      { status: 'Pending', count: 8, color: '#2196f3' },
      { status: 'Cancelled', count: 3, color: '#f44336' },
    ],
    topCustomers: [
      { name: 'Sarah Johnson', revenue: 15000, jobs: 5 },
      { name: 'Mike Wilson', revenue: 12000, jobs: 4 },
      { name: 'Emily Davis', revenue: 10000, jobs: 3 },
      { name: 'John Smith', revenue: 8500, jobs: 2 },
    ],
    partsSpending: [
      { vendor: 'Auto Parts Co', amount: 25000, percentage: 35 },
      { vendor: 'Body Shop Supply', amount: 18000, percentage: 25 },
      { vendor: 'Paint Pro', amount: 15000, percentage: 21 },
      { vendor: 'Other', amount: 12000, percentage: 19 },
    ],
    technicianProductivity: [
      { name: 'Mike Wilson', jobs: 25, hours: 180, efficiency: 95 },
      { name: 'Lisa Chen', jobs: 22, hours: 165, efficiency: 92 },
      { name: 'Tom Brown', jobs: 18, hours: 150, efficiency: 88 },
    ],
  });

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
    // In a real app, this would trigger a new data fetch
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleChartClick = (data, chartType) => {
    setDrillDownData({ data, chartType });
    setDrillDownOpen(true);
  };

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      data.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Reports & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Business insights and performance metrics
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                onChange={handleDateRangeChange}
                label="Date Range"
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 1 }}>
                    <AttachMoney sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      $328,000
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" color="success.main">
                        +12% from last month
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'success.main', p: 1, borderRadius: 1 }}>
                    <Build sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      68
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Jobs
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" color="success.main">
                        +8% from last month
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'info.main', p: 1, borderRadius: 1 }}>
                    <People sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      45
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Customers
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" color="success.main">
                        +5% from last month
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'warning.main', p: 1, borderRadius: 1 }}>
                    <DirectionsCar sx={{ color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      12.5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. Days per Job
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" color="success.main">
                        -2 days from last month
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
          >
            <Tab label="Revenue Analysis" />
            <Tab label="Job Status" />
            <Tab label="Customer Insights" />
            <Tab label="Parts & Vendors" />
            <Tab label="Technician Performance" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {selectedTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Revenue Trend
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => exportToCSV(reportData.revenue, 'revenue-trend')}
                    >
                      Export
                    </Button>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#1976d2"
                        strokeWidth={2}
                        dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                        onClick={(data) => handleChartClick(data, 'revenue')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Jobs by Month
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="jobs"
                        fill="#4caf50"
                        onClick={(data) => handleChartClick(data, 'jobs')}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {selectedTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Jobs by Status
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.jobsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        onClick={(data) => handleChartClick(data, 'jobStatus')}
                      >
                        {reportData.jobsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Status Breakdown
                  </Typography>
                  <Box>
                    {reportData.jobsByStatus.map((item, index) => (
                      <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: item.color,
                            }}
                          />
                          <Typography variant="body2">{item.status}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.count}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {selectedTab === 2 && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Customers by Revenue
                </Typography>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => exportToCSV(reportData.topCustomers, 'top-customers')}
                >
                  Export
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Jobs</TableCell>
                      <TableCell align="right">Avg. per Job</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.topCustomers.map((customer, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell align="right">${customer.revenue.toLocaleString()}</TableCell>
                        <TableCell align="right">{customer.jobs}</TableCell>
                        <TableCell align="right">
                          ${Math.round(customer.revenue / customer.jobs).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {selectedTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Parts Spending by Vendor
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.partsSpending} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="vendor" type="category" width={100} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="amount"
                        fill="#ff9800"
                        onClick={(data) => handleChartClick(data, 'partsSpending')}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Vendor Breakdown
                  </Typography>
                  <Box>
                    {reportData.partsSpending.map((vendor, index) => (
                      <Box key={index} mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">{vendor.vendor}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${vendor.amount.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: '100%',
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${vendor.percentage}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {selectedTab === 4 && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Technician Performance
                </Typography>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => exportToCSV(reportData.technicianProductivity, 'technician-performance')}
                >
                  Export
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Technician</TableCell>
                      <TableCell align="right">Jobs Completed</TableCell>
                      <TableCell align="right">Hours Worked</TableCell>
                      <TableCell align="right">Efficiency %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.technicianProductivity.map((tech, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{tech.name}</TableCell>
                        <TableCell align="right">{tech.jobs}</TableCell>
                        <TableCell align="right">{tech.hours}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${tech.efficiency}%`}
                            color={tech.efficiency >= 90 ? 'success' : tech.efficiency >= 80 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Drill-down Dialog */}
        <Dialog open={drillDownOpen} onClose={() => setDrillDownOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Detailed Data - {drillDownData?.chartType}
          </DialogTitle>
          <DialogContent>
            {drillDownData && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Clicked data point: {JSON.stringify(drillDownData.data, null, 2)}
                </Typography>
                <Alert severity="info">
                  This would show detailed breakdown of the selected data point in a real implementation.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDrillDownOpen(false)}>Close</Button>
            <Button variant="contained" startIcon={<Download />}>
              Export Details
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default EnhancedReportsManagement;
