import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  Box, 
  Typography, 
  ButtonGroup, 
  Button, 
  IconButton, 
  Tooltip,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Brush,
  ComposedChart,
  Bar
} from 'recharts';
import {
  ZoomIn,
  ZoomOut,
  Download,
  Settings,
  Fullscreen,
  Timeline,
  BarChart,
  ShowChart,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, currency = true }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <Box
      sx={{
        background: `${premiumDesignSystem.colors.glass.white[15]}`,
        backdropFilter: premiumDesignSystem.effects.backdrop.lg,
        border: `1px solid ${premiumDesignSystem.colors.glass.white[20]}`,
        borderRadius: premiumDesignSystem.borderRadius.lg,
        p: 2,
        minWidth: 200,
        boxShadow: premiumDesignSystem.shadows.glass.strong
      }}
    >
      <Typography variant="body2" sx={{ 
        fontWeight: premiumDesignSystem.typography.fontWeight.semibold,
        mb: 1,
        color: premiumDesignSystem.colors.neutral[700]
      }}>
        {label}
      </Typography>
      {payload.map((entry, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: entry.color,
              mr: 1.5,
              flexShrink: 0
            }}
          />
          <Typography variant="body2" sx={{ 
            color: premiumDesignSystem.colors.neutral[600],
            mr: 1,
            flexGrow: 1
          }}>
            {entry.name}:
          </Typography>
          <Typography variant="body2" sx={{ 
            fontWeight: premiumDesignSystem.typography.fontWeight.semibold,
            color: premiumDesignSystem.colors.neutral[800]
          }}>
            {currency 
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(entry.value)
              : entry.value.toLocaleString()
            }
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Export functionality
const exportToCSV = (data, filename = 'revenue_data') => {
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Export to image functionality
const exportToImage = (chartRef, filename = 'revenue_chart') => {
  if (!chartRef.current) return;

  const svg = chartRef.current.querySelector('svg');
  if (!svg) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const data = new XMLSerializer().serializeToString(svg);
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(data);
};

export const RevenueChart = React.memo(({
  data = [],
  title = "Revenue Overview",
  height = 400,
  showGrid = true,
  showLegend = true,
  showBrush: showBrushProp = false,
  animated = true,
  realTimeUpdate = false,
  updateInterval = 30000, // 30 seconds
  onDataUpdate,
  currency = true,
  series = [
    { key: 'revenue', name: 'Revenue', color: premiumDesignSystem.colors.primary[500] },
    { key: 'target', name: 'Target', color: premiumDesignSystem.colors.semantic.success.main, type: 'line', strokeDasharray: '5 5' }
  ],
  theme = 'light',
  ...props
}) => {
  const [chartType, setChartType] = useState('area'); // 'line', 'area', 'combined'
  const [timeRange, setTimeRange] = useState('all'); // '7d', '30d', '90d', 'all'
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomDomain, setZoomDomain] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [smoothLine, setSmoothLine] = useState(true);
  const [showDataPoints, setShowDataPoints] = useState(false);
  const [showBrush, setShowBrush] = useState(showBrushProp);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const chartRef = useRef(null);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (timeRange === 'all') return data;
    
    const now = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return data.filter(item => {
      const itemDate = new Date(item.date || item.period || item.label);
      return itemDate >= cutoffDate;
    });
  }, [data, timeRange]);

  // Real-time updates
  React.useEffect(() => {
    if (!realTimeUpdate || !onDataUpdate) return;

    const interval = setInterval(() => {
      onDataUpdate?.();
      setLastUpdate(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [realTimeUpdate, onDataUpdate, updateInterval]);

  // Chart colors based on theme
  const chartColors = useMemo(() => {
    return series.map(s => s.color || premiumDesignSystem.colors.primary[500]);
  }, [series]);

  // Handle zoom
  const handleZoom = useCallback((domain) => {
    setZoomDomain(domain);
    setIsZoomed(!!domain);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomDomain(null);
    setIsZoomed(false);
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    exportToCSV(filteredData, `revenue_chart_${new Date().toISOString().split('T')[0]}`);
  }, [filteredData]);

  const handleExportImage = useCallback(() => {
    exportToImage(chartRef, `revenue_chart_${new Date().toISOString().split('T')[0]}`);
  }, []);

  // Settings menu
  const handleSettingsClick = useCallback((event) => {
    setSettingsAnchor(event.currentTarget);
    setShowSettings(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setSettingsAnchor(null);
    setShowSettings(false);
  }, []);

  // Format axis labels
  const formatXAxisLabel = useCallback((tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const formatYAxisLabel = useCallback((value) => {
    if (currency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short'
      }).format(value);
    }
    return value.toLocaleString();
  }, [currency]);

  // Render chart based on type
  const renderChart = useCallback(() => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    const commonAxisProps = {
      xAxis: {
        dataKey: 'date',
        tickFormatter: formatXAxisLabel,
        stroke: premiumDesignSystem.colors.neutral[400],
        fontSize: 12
      },
      yAxis: {
        tickFormatter: formatYAxisLabel,
        stroke: premiumDesignSystem.colors.neutral[400],
        fontSize: 12
      }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={premiumDesignSystem.colors.neutral[200]}
                opacity={0.5}
              />
            )}
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <RechartsTooltip content={<CustomTooltip currency={currency} />} />
            {showLegend && <Legend />}
            
            {series.map((serie, index) => (
              <Line
                key={serie.key}
                type={smoothLine ? "monotone" : "linear"}
                dataKey={serie.key}
                stroke={serie.color || chartColors[index]}
                strokeWidth={3}
                strokeDasharray={serie.strokeDasharray}
                dot={showDataPoints ? { r: 4, fill: serie.color } : false}
                activeDot={{ r: 6, stroke: serie.color, strokeWidth: 2, fill: '#fff' }}
                animationDuration={animated ? 1500 : 0}
                name={serie.name}
              />
            ))}
            
            {showBrush && <Brush dataKey="date" height={30} />}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={premiumDesignSystem.colors.neutral[200]}
                opacity={0.5}
              />
            )}
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <RechartsTooltip content={<CustomTooltip currency={currency} />} />
            {showLegend && <Legend />}
            
            {series.map((serie, index) => (
              <Area
                key={serie.key}
                type={smoothLine ? "monotone" : "linear"}
                dataKey={serie.key}
                stroke={serie.color || chartColors[index]}
                fill={`url(#gradient${index})`}
                strokeWidth={3}
                strokeDasharray={serie.strokeDasharray}
                dot={showDataPoints ? { r: 4, fill: serie.color } : false}
                activeDot={{ r: 6, stroke: serie.color, strokeWidth: 2, fill: '#fff' }}
                animationDuration={animated ? 1500 : 0}
                name={serie.name}
              />
            ))}
            
            {showBrush && <Brush dataKey="date" height={30} />}
          </AreaChart>
        );

      case 'combined':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={premiumDesignSystem.colors.neutral[200]}
                opacity={0.5}
              />
            )}
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <RechartsTooltip content={<CustomTooltip currency={currency} />} />
            {showLegend && <Legend />}
            
            {series.map((serie, index) => {
              if (serie.type === 'bar') {
                return (
                  <Bar
                    key={serie.key}
                    dataKey={serie.key}
                    fill={serie.color || chartColors[index]}
                    name={serie.name}
                    animationDuration={animated ? 1500 : 0}
                  />
                );
              } else {
                return (
                  <Line
                    key={serie.key}
                    type={smoothLine ? "monotone" : "linear"}
                    dataKey={serie.key}
                    stroke={serie.color || chartColors[index]}
                    strokeWidth={3}
                    strokeDasharray={serie.strokeDasharray}
                    dot={showDataPoints ? { r: 4, fill: serie.color } : false}
                    activeDot={{ r: 6, stroke: serie.color, strokeWidth: 2, fill: '#fff' }}
                    animationDuration={animated ? 1500 : 0}
                    name={serie.name}
                  />
                );
              }
            })}
            
            {showBrush && <Brush dataKey="date" height={30} />}
          </ComposedChart>
        );

      default:
        return null;
    }
  }, [chartType, filteredData, showGrid, showLegend, showBrush, animated, currency, smoothLine, showDataPoints, series, chartColors, formatXAxisLabel, formatYAxisLabel]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <Box
        ref={chartRef}
        sx={{
          background: `${premiumDesignSystem.colors.glass.white[8]}`,
          backdropFilter: premiumDesignSystem.effects.backdrop.lg,
          border: `1px solid ${premiumDesignSystem.colors.glass.white[15]}`,
          borderRadius: premiumDesignSystem.borderRadius.xl,
          p: 3,
          boxShadow: premiumDesignSystem.shadows.glass.medium,
          position: 'relative',
          overflow: 'hidden'
        }}
        {...props}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: premiumDesignSystem.typography.fontWeight.semibold,
                color: premiumDesignSystem.colors.neutral[800],
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            {realTimeUpdate && (
              <Chip
                label={`Last updated: ${lastUpdate.toLocaleTimeString()}`}
                size="small"
                icon={<Refresh />}
                sx={{
                  backgroundColor: `${premiumDesignSystem.colors.semantic.info.main}20`,
                  color: premiumDesignSystem.colors.semantic.info.main,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Chart type selector */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Line Chart">
                <Button
                  onClick={() => setChartType('line')}
                  variant={chartType === 'line' ? 'contained' : 'outlined'}
                >
                  <ShowChart />
                </Button>
              </Tooltip>
              <Tooltip title="Area Chart">
                <Button
                  onClick={() => setChartType('area')}
                  variant={chartType === 'area' ? 'contained' : 'outlined'}
                >
                  <Timeline />
                </Button>
              </Tooltip>
              <Tooltip title="Combined Chart">
                <Button
                  onClick={() => setChartType('combined')}
                  variant={chartType === 'combined' ? 'contained' : 'outlined'}
                >
                  <BarChart />
                </Button>
              </Tooltip>
            </ButtonGroup>

            {/* Time range selector */}
            <ButtonGroup size="small" variant="outlined">
              {['7d', '30d', '90d', 'all'].map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'contained' : 'outlined'}
                  sx={{ minWidth: 50 }}
                >
                  {range}
                </Button>
              ))}
            </ButtonGroup>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Export CSV">
                <IconButton onClick={handleExportCSV} size="small">
                  <Download />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Export Image">
                <IconButton onClick={handleExportImage} size="small">
                  <Fullscreen />
                </IconButton>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton onClick={handleSettingsClick} size="small">
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <defs>
              {series.map((serie, index) => (
                <linearGradient key={`gradient${index}`} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={serie.color || chartColors[index]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={serie.color || chartColors[index]} stopOpacity={0.05}/>
                </linearGradient>
              ))}
            </defs>
            {renderChart()}
          </ResponsiveContainer>
        </Box>

        {/* Settings Menu */}
        <Menu
          anchorEl={settingsAnchor}
          open={showSettings}
          onClose={handleSettingsClose}
          PaperProps={{
            sx: {
              background: `${premiumDesignSystem.colors.glass.white[15]}`,
              backdropFilter: premiumDesignSystem.effects.backdrop.lg,
              border: `1px solid ${premiumDesignSystem.colors.glass.white[20]}`
            }
          }}
        >
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={smoothLine}
                  onChange={(e) => setSmoothLine(e.target.checked)}
                />
              }
              label="Smooth Lines"
            />
          </MenuItem>
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={showDataPoints}
                  onChange={(e) => setShowDataPoints(e.target.checked)}
                />
              }
              label="Show Data Points"
            />
          </MenuItem>
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={showBrush}
                  onChange={(e) => setShowBrush(e.target.checked)}
                />
              }
              label="Show Brush"
            />
          </MenuItem>
        </Menu>
      </Box>
    </motion.div>
  );
});

RevenueChart.displayName = 'RevenueChart';

export default RevenueChart;