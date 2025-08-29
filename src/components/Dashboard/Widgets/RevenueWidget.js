import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  LinearProgress,
  Stack,
  Divider
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  MoreVert,
  Download,
  Visibility,
  Assessment,
  DateRange,
  CompareArrows
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { motion } from 'framer-motion';

// Utils
import { getGlassStyles, glassHoverEffects } from '../../../utils/glassTheme';
import { microAnimations } from '../../../utils/animations';
import { useTheme as useAppTheme } from '../../../contexts/ThemeContext';

const RevenueWidget = ({ period = 'daily', expanded = false }) => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewType, setViewType] = useState('chart'); // 'chart', 'table', 'breakdown'

  // Mock revenue data
  const [revenueData, setRevenueData] = useState([]);
  const [kpiData, setKpiData] = useState({});
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    // Generate mock data based on period
    const generateData = () => {
      const periods = {
        daily: 7,
        weekly: 12,
        monthly: 12
      };
      
      const count = periods[period];
      const data = [];
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const baseRevenue = 15000 + Math.random() * 10000;
        data.push({
          date: period === 'daily' ? date.toLocaleDateString() : 
                period === 'weekly' ? `Week ${count - i}` :
                date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.round(baseRevenue),
          target: Math.round(baseRevenue * 1.1),
          jobs: Math.round(8 + Math.random() * 12),
          avgJobValue: Math.round(baseRevenue / (8 + Math.random() * 12))
        });
      }
      
      setRevenueData(data);
      
      // Calculate KPIs
      const currentRevenue = data[data.length - 1]?.revenue || 0;
      const previousRevenue = data[data.length - 2]?.revenue || 0;
      const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
      const avgRevenue = totalRevenue / data.length;
      
      setKpiData({
        current: currentRevenue,
        previous: previousRevenue,
        change: previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0,
        total: totalRevenue,
        average: Math.round(avgRevenue),
        target: data[data.length - 1]?.target || 0,
        targetProgress: currentRevenue ? (currentRevenue / (data[data.length - 1]?.target || currentRevenue) * 100).toFixed(1) : 0
      });

      // Revenue breakdown
      setBreakdown([
        { category: 'Insurance Claims', amount: Math.round(currentRevenue * 0.6), percentage: 60 },
        { category: 'Customer Pay', amount: Math.round(currentRevenue * 0.25), percentage: 25 },
        { category: 'Warranty Work', amount: Math.round(currentRevenue * 0.1), percentage: 10 },
        { category: 'Other', amount: Math.round(currentRevenue * 0.05), percentage: 5 }
      ]);
    };

    generateData();
  }, [period]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = () => {
    // Export functionality
    console.log('Exporting revenue data...');
    handleMenuClose();
  };

  const handleDrillDown = () => {
    // Drill down functionality
    console.log('Drilling down into revenue details...');
    handleMenuClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ 
          p: 2, 
          ...getGlassStyles('elevated', mode),
          maxWidth: 250
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: 1, 
                  bgcolor: entry.color 
                }} 
              />
              <Typography variant="body2">
                {entry.name}: {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
              boxShadow: `0 4px 16px ${theme.palette.primary.main}40`
            }}
          >
            <AttachMoney />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Revenue Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {period.charAt(0).toUpperCase() + period.slice(1)} performance
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CompareArrows />}
            onClick={() => setViewType(viewType === 'chart' ? 'table' : viewType === 'table' ? 'breakdown' : 'chart')}
            sx={{ minWidth: 100 }}
          >
            {viewType === 'chart' ? 'Chart' : viewType === 'table' ? 'Table' : 'Breakdown'}
          </Button>
          
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* KPI Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ 
            flex: 1, 
            p: 2, 
            ...getGlassStyles('subtle', mode),
            border: `1px solid ${theme.palette.primary.main}30`
          }}>
            <Typography variant="body2" color="text.secondary">
              Current
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {formatCurrency(kpiData.current)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {parseFloat(kpiData.change) > 0 ? (
                <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: parseFloat(kpiData.change) > 0 ? 'success.main' : 'error.main',
                  fontWeight: 600
                }}
              >
                {kpiData.change}%
              </Typography>
            </Box>
          </Card>

          <Card sx={{ 
            flex: 1, 
            p: 2, 
            ...getGlassStyles('subtle', mode)
          }}>
            <Typography variant="body2" color="text.secondary">
              vs Target
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {kpiData.targetProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(parseFloat(kpiData.targetProgress), 100)}
              sx={{
                mt: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: parseFloat(kpiData.targetProgress) >= 100 ? 
                    'linear-gradient(90deg, #10b981, #059669)' :
                    'linear-gradient(90deg, #f59e0b, #d97706)'
                }
              }}
            />
          </Card>

          {expanded && (
            <Card sx={{ 
              flex: 1, 
              p: 2, 
              ...getGlassStyles('subtle', mode)
            }}>
              <Typography variant="body2" color="text.secondary">
                Average
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatCurrency(kpiData.average)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                per {period.slice(0, -2)}
              </Typography>
            </Card>
          )}
        </Stack>
      </motion.div>

      {/* Content Area */}
      <Box sx={{ flex: 1, minHeight: 300 }}>
        {viewType === 'chart' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={theme.palette.warning.main}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {viewType === 'table' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Target</TableCell>
                  <TableCell align="right">Jobs</TableCell>
                  <TableCell align="right">Avg Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenueData.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.date}</TableCell>
                    <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.target)}</TableCell>
                    <TableCell align="right">{row.jobs}</TableCell>
                    <TableCell align="right">{formatCurrency(row.avgJobValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {viewType === 'breakdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Revenue Breakdown
            </Typography>
            <Stack spacing={2}>
              {breakdown.map((item, index) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card sx={{ 
                    p: 2, 
                    ...getGlassStyles('subtle', mode),
                    ...glassHoverEffects(mode, 1)
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item.category}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.percentage}% of total revenue
                    </Typography>
                  </Card>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            ...getGlassStyles('elevated', mode),
            backdropFilter: 'blur(20px)',
            mt: 1
          }
        }}
      >
        <MenuItem onClick={handleExport}>
          <Download sx={{ mr: 2 }} />
          Export Data
        </MenuItem>
        <MenuItem onClick={handleDrillDown}>
          <Assessment sx={{ mr: 2 }} />
          Detailed Report
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DateRange sx={{ mr: 2 }} />
          Date Range
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RevenueWidget;