import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
  Warning,
  Error,
  CheckCircle,
  Speed,
  Timeline,
  Assessment,
  AttachMoney,
  Person,
  Build,
  DirectionsCar,
  Schedule,
  LocalShipping,
  Inventory,
  Star,
  ThumbUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Pie, Doughnut, Area } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// KPI Configuration based on Instructions document
const KPI_CONFIGS = {
  // Core Financial KPIs
  revenue: {
    title: 'Revenue',
    icon: AttachMoney,
    color: '#1976d2',
    format: 'currency',
    targets: { excellent: 50000, good: 35000, fair: 20000 },
  },
  aro: {
    title: 'Average Repair Order',
    icon: Assessment,
    color: '#2e7d32',
    format: 'currency',
    targets: { excellent: 3500, good: 2500, fair: 1500 },
  },
  laborRate: {
    title: 'Effective Labor Rate',
    icon: Speed,
    color: '#ed6c02',
    format: 'currency',
    targets: { excellent: 65, good: 55, fair: 45 },
  },
  grossProfit: {
    title: 'Gross Profit Margin',
    icon: TrendingUp,
    color: '#9c27b0',
    format: 'percentage',
    targets: { excellent: 55, good: 45, fair: 35 },
  },

  // Production KPIs
  cycleTime: {
    title: 'Cycle Time (Keys-to-Keys)',
    icon: Timeline,
    color: '#d32f2f',
    format: 'days',
    targets: { excellent: 7, good: 10, fair: 14 },
  },
  touchTime: {
    title: 'Touch Time Efficiency',
    icon: Build,
    color: '#1976d2',
    format: 'percentage',
    targets: { excellent: 85, good: 75, fair: 65 },
  },
  firstTimeFixRate: {
    title: 'First Time Fix Rate',
    icon: CheckCircle,
    color: '#2e7d32',
    format: 'percentage',
    targets: { excellent: 95, good: 90, fair: 85 },
  },
  comebackRate: {
    title: 'Comeback Rate',
    icon: Warning,
    color: '#ed6c02',
    format: 'percentage',
    inverted: true,
    targets: { excellent: 2, good: 5, fair: 8 },
  },

  // Customer KPIs
  customerSatisfaction: {
    title: 'Customer Satisfaction (CSI)',
    icon: Star,
    color: '#f57c00',
    format: 'score',
    targets: { excellent: 4.5, good: 4.0, fair: 3.5 },
  },
  customerRetention: {
    title: 'Customer Retention Rate',
    icon: Person,
    color: '#7b1fa2',
    format: 'percentage',
    targets: { excellent: 80, good: 70, fair: 60 },
  },
  onTimeDelivery: {
    title: 'On-Time Delivery',
    icon: Schedule,
    color: '#388e3c',
    format: 'percentage',
    targets: { excellent: 95, good: 90, fair: 85 },
  },

  // Parts & Inventory KPIs
  partsGrossProfit: {
    title: 'Parts Gross Profit',
    icon: Inventory,
    color: '#5d4037',
    format: 'percentage',
    targets: { excellent: 35, good: 25, fair: 20 },
  },
  partsAvailability: {
    title: 'Parts Availability',
    icon: LocalShipping,
    color: '#1565c0',
    format: 'percentage',
    targets: { excellent: 95, good: 90, fair: 85 },
  },

  // Efficiency KPIs
  laborEfficiency: {
    title: 'Labor Efficiency',
    icon: Speed,
    color: '#00695c',
    format: 'percentage',
    targets: { excellent: 90, good: 80, fair: 70 },
  },
  bayUtilization: {
    title: 'Bay Utilization',
    icon: DirectionsCar,
    color: '#4527a0',
    format: 'percentage',
    targets: { excellent: 85, good: 75, fair: 65 },
  },
  scheduleCompliance: {
    title: 'Schedule Compliance',
    icon: Schedule,
    color: '#c62828',
    format: 'percentage',
    targets: { excellent: 95, good: 90, fair: 85 },
  },
};

const AdvancedKPIChart = React.memo(
  ({ kpiData = {}, timeframe = 'month', showTrends = true }) => {
    const theme = useTheme();
    const [selectedKPIs, setSelectedKPIs] = useState([
      'revenue',
      'cycleTime',
      'customerSatisfaction',
      'laborEfficiency',
    ]);
    const [chartType, setChartType] = useState('line');
    const [viewMode, setViewMode] = useState('grid');

    // Memoize performance level function for better performance
    const getPerformanceLevel = useCallback((kpiKey, value) => {
      const config = KPI_CONFIGS[kpiKey];
      if (!config || !config.targets) return 'unknown';

      const { excellent, good, fair } = config.targets;
      const isInverted = config.inverted; // For metrics where lower is better

      if (isInverted) {
        if (value <= excellent) return 'excellent';
        if (value <= good) return 'good';
        if (value <= fair) return 'fair';
        return 'poor';
      } else {
        if (value >= excellent) return 'excellent';
        if (value >= good) return 'good';
        if (value >= fair) return 'fair';
        return 'poor';
      }
    }, []);

    // Memoize performance color mapping
    const getPerformanceColor = useCallback(
      level => {
        switch (level) {
          case 'excellent':
            return theme.palette.success.main;
          case 'good':
            return theme.palette.info.main;
          case 'fair':
            return theme.palette.warning.main;
          case 'poor':
            return theme.palette.error.main;
          default:
            return theme.palette.grey[500];
        }
      },
      [theme.palette]
    );

    // Memoize value formatting to prevent unnecessary recalculations
    const formatKPIValue = useCallback((kpiKey, value) => {
      const config = KPI_CONFIGS[kpiKey];
      if (!config) return value;

      switch (config.format) {
        case 'currency':
          return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
          }).format(value);
        case 'percentage':
          return `${value?.toFixed(1)}%`;
        case 'days':
          return `${value?.toFixed(1)} days`;
        case 'score':
          return `${value?.toFixed(1)}/5.0`;
        default:
          return value?.toLocaleString();
      }
    }, []);

    // Memoize chart data generation for better performance
    const chartData = useMemo(() => {
      const datasets = selectedKPIs.map((kpiKey, index) => {
        const config = KPI_CONFIGS[kpiKey];
        const data = kpiData[kpiKey]?.trend || [];

        return {
          label: config?.title || kpiKey,
          data: data,
          borderColor: config?.color || theme.palette.primary.main,
          backgroundColor: alpha(
            config?.color || theme.palette.primary.main,
            0.1
          ),
          fill: chartType === 'area',
          tension: 0.3, // Reduced for better performance
        };
      });

      return {
        labels: kpiData.labels || [],
        datasets,
      };
    }, [selectedKPIs, kpiData, theme.palette.primary.main, chartType]);

    // Memoize chart options for better performance
    const chartOptions = useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300, // Reduced animation duration for better performance
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: context => {
                const kpiKey = selectedKPIs[context.datasetIndex];
                const formattedValue = formatKPIValue(kpiKey, context.parsed.y);
                return `${context.dataset.label}: ${formattedValue}`;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Value',
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
      }),
      [selectedKPIs, formatKPIValue]
    );

    // Memoize KPI Card component to prevent unnecessary re-renders
    const KPICard = React.memo(
      ({ kpiKey, data, isSelected, onClick }) => {
        const config = KPI_CONFIGS[kpiKey];
        const currentValue = data?.current || 0;
        const previousValue = data?.previous || 0;
        const change = useMemo(
          () =>
            previousValue
              ? ((currentValue - previousValue) / previousValue) * 100
              : 0,
          [currentValue, previousValue]
        );
        const performanceLevel = getPerformanceLevel(kpiKey, currentValue);
        const performanceColor = getPerformanceColor(performanceLevel);

        const IconComponent = config?.icon || Info;

        return (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.01 }} // Reduced for better performance
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }} // Faster animations
          >
            <Card
              sx={{
                cursor: 'pointer',
                border: isSelected
                  ? `2px solid ${theme.palette.primary.main}`
                  : '1px solid',
                borderColor: isSelected
                  ? theme.palette.primary.main
                  : 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => onClick(kpiKey)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      {config?.title || kpiKey}
                    </Typography>
                    <Typography
                      variant='h5'
                      component='div'
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      {formatKPIValue(kpiKey, currentValue)}
                    </Typography>

                    {/* Performance indicator */}
                    <Chip
                      size='small'
                      label={performanceLevel.toUpperCase()}
                      sx={{
                        backgroundColor: alpha(performanceColor, 0.1),
                        color: performanceColor,
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  <Avatar
                    sx={{
                      bgcolor: config?.color || theme.palette.primary.main,
                      width: 48,
                      height: 48,
                      ml: 2,
                    }}
                  >
                    <IconComponent />
                  </Avatar>
                </Box>

                {/* Trend indicator */}
                {showTrends && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    {change > 0 ? (
                      <TrendingUp
                        sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }}
                      />
                    ) : change < 0 ? (
                      <TrendingDown
                        sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }}
                      />
                    ) : (
                      <TrendingFlat
                        sx={{ color: 'grey.500', fontSize: 16, mr: 0.5 }}
                      />
                    )}
                    <Typography
                      variant='body2'
                      color={
                        change > 0
                          ? 'success.main'
                          : change < 0
                            ? 'error.main'
                            : 'text.secondary'
                      }
                    >
                      {Math.abs(change).toFixed(1)}% vs{' '}
                      {timeframe === 'month' ? 'last month' : 'previous period'}
                    </Typography>
                  </Box>
                )}

                {/* Target progress bar */}
                {config?.targets && (
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant='caption' color='text.secondary'>
                        Target Progress
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {performanceLevel === 'excellent'
                          ? '100%'
                          : performanceLevel === 'good'
                            ? '75%'
                            : performanceLevel === 'fair'
                              ? '50%'
                              : '25%'}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant='determinate'
                      value={
                        performanceLevel === 'excellent'
                          ? 100
                          : performanceLevel === 'good'
                            ? 75
                            : performanceLevel === 'fair'
                              ? 50
                              : 25
                      }
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(performanceColor, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: performanceColor,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      },
      [
        getPerformanceLevel,
        getPerformanceColor,
        formatKPIValue,
        theme.palette,
        isSelected,
        onClick,
      ]
    );

    // Memoize KPI toggle handler
    const handleKPIToggle = useCallback(kpiKey => {
      setSelectedKPIs(prev => {
        if (prev.includes(kpiKey)) {
          return prev.filter(k => k !== kpiKey);
        } else {
          return [...prev, kpiKey];
        }
      });
    }, []);

    // Memoize chart render function
    const renderChart = useCallback(() => {
      if (selectedKPIs.length === 0) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 300,
            }}
          >
            <Typography color='text.secondary'>
              Select KPIs to view trends
            </Typography>
          </Box>
        );
      }

      switch (chartType) {
        case 'bar':
          return <Bar data={chartData} options={chartOptions} height={300} />;
        case 'area':
          return <Line data={chartData} options={chartOptions} height={300} />;
        default:
          return <Line data={chartData} options={chartOptions} height={300} />;
      }
    }, [selectedKPIs, chartType, chartData, chartOptions]);

    return (
      <Box>
        {/* Controls */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant='h6'>KPI Dashboard</Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size='small'
            >
              <ToggleButton value='grid'>Grid</ToggleButton>
              <ToggleButton value='chart'>Chart</ToggleButton>
            </ToggleButtonGroup>

            {viewMode === 'chart' && (
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e, value) => value && setChartType(value)}
                size='small'
              >
                <ToggleButton value='line'>Line</ToggleButton>
                <ToggleButton value='bar'>Bar</ToggleButton>
                <ToggleButton value='area'>Area</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>
        </Box>

        {/* Content */}
        <AnimatePresence mode='wait'>
          {viewMode === 'grid' ? (
            <motion.div
              key='grid'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 3,
                }}
              >
                {Object.keys(KPI_CONFIGS).map(kpiKey => (
                  <KPICard
                    key={kpiKey}
                    kpiKey={kpiKey}
                    data={kpiData[kpiKey]}
                    isSelected={selectedKPIs.includes(kpiKey)}
                    onClick={handleKPIToggle}
                  />
                ))}
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key='chart'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ height: 400 }}>{renderChart()}</Box>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    );
  }
);

export default AdvancedKPIChart;
