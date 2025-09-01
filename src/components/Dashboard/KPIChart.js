import React, { useMemo, useRef, useCallback } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  Filler
);

export const KPIChart = React.memo(
  ({
    data,
    type = 'line',
    height = 200,
    title,
    currency = false,
    animated = true,
    gradient = true,
    colors,
  }) => {
    const theme = useTheme();
    const chartRef = useRef(null);

    // Memoize default colors to prevent recreation on each render
    const defaultColors = useMemo(
      () => [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
        '#9c27b0',
        '#ff5722',
        '#607d8b',
        '#795548',
      ],
      [theme.palette]
    );

    const chartColors = useMemo(
      () => colors || defaultColors,
      [colors, defaultColors]
    );

    const chartOptions = useMemo(() => {
      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: type === 'pie' || type === 'doughnut' ? 'bottom' : 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
              },
              color: theme.palette.text.primary,
            },
          },
          tooltip: {
            backgroundColor: theme.palette.background.paper,
            titleColor: theme.palette.text.primary,
            bodyColor: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (currency && context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(context.parsed.y);
                } else if (type === 'pie' || type === 'doughnut') {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed * 100) / total).toFixed(
                    1
                  );
                  label += `${context.parsed} (${percentage}%)`;
                } else {
                  label += context.parsed.y;
                }
                return label;
              },
            },
          },
        },
        scales:
          type === 'line' || type === 'bar'
            ? {
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: theme.palette.text.secondary,
                    font: {
                      size: 11,
                    },
                  },
                },
                y: {
                  grid: {
                    color: theme.palette.divider,
                    drawBorder: false,
                  },
                  ticks: {
                    color: theme.palette.text.secondary,
                    font: {
                      size: 11,
                    },
                    callback: function (value) {
                      if (currency) {
                        return new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(value);
                      }
                      return value;
                    },
                  },
                },
              }
            : {},
        animation: animated
          ? {
              duration: 600, // Reduced from 1000ms for faster rendering
              easing: 'easeInOutQuart',
            }
          : false,
        // Performance optimizations
        interaction: {
          intersect: false,
          mode: 'index',
        },
        elements: {
          point: {
            radius: type === 'line' ? 2 : 0, // Reduce point size
            hoverRadius: type === 'line' ? 4 : 0,
          },
        },
        datasets: {
          line: {
            pointRadius: 2,
            pointHoverRadius: 4,
            borderWidth: 2, // Reduce from 3
          },
          bar: {
            borderWidth: 0,
          },
        },
      };

      return baseOptions;
    }, [theme, type, currency, animated]);

    const chartData = useMemo(() => {
      if (!data || data.length === 0) return null;

      const labels = data.map(item => item.label);
      const values = data.map(item => item.value);

      if (type === 'line') {
        return {
          labels,
          datasets: [
            {
              label: title || 'Data',
              data: values,
              borderColor: chartColors[0],
              backgroundColor: gradient
                ? `linear-gradient(180deg, ${chartColors[0]}20 0%, ${chartColors[0]}05 100%)`
                : `${chartColors[0]}20`,
              borderWidth: 2, // Reduced from 3 for better performance
              fill: true,
              tension: 0.3, // Reduced from 0.4 for smoother curves with less processing
              pointRadius: 2, // Reduced from 4
              pointBackgroundColor: chartColors[0],
              pointBorderColor: '#fff',
              pointBorderWidth: 1, // Reduced from 2
              pointHoverRadius: 4, // Reduced from 6
            },
          ],
        };
      }

      if (type === 'bar') {
        return {
          labels,
          datasets: [
            {
              label: title || 'Data',
              data: values,
              backgroundColor: chartColors[0],
              borderColor: chartColors[0],
              borderWidth: 0,
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        };
      }

      if (type === 'pie' || type === 'doughnut') {
        return {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: chartColors.slice(0, values.length),
              borderColor: theme.palette.background.paper,
              borderWidth: 2,
              hoverBorderWidth: 3,
            },
          ],
        };
      }

      // Multi-dataset support for grouped charts
      if (Array.isArray(data[0]?.datasets)) {
        return {
          labels: data.map(item => item.label),
          datasets: data[0].datasets.map((dataset, index) => ({
            ...dataset,
            backgroundColor: chartColors[index],
            borderColor: chartColors[index],
            borderWidth: type === 'line' ? 3 : 0,
            fill: type === 'line' ? true : false,
            tension: type === 'line' ? 0.4 : undefined,
          })),
        };
      }

      return {
        labels,
        datasets: [
          {
            label: title || 'Data',
            data: values,
            backgroundColor: chartColors[0],
            borderColor: chartColors[0],
            borderWidth: type === 'line' ? 3 : 0,
          },
        ],
      };
    }, [data, type, title, chartColors, theme, gradient]);

    // Memoize the render function to prevent unnecessary re-renders
    const renderChart = useCallback(() => {
      if (!chartData) return null;

      switch (type) {
        case 'line':
          return (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          );
        case 'bar':
          return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
        case 'pie':
          return <Pie ref={chartRef} data={chartData} options={chartOptions} />;
        case 'doughnut':
          return (
            <Doughnut ref={chartRef} data={chartData} options={chartOptions} />
          );
        default:
          return (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          );
      }
    }, [chartData, chartOptions, type]);

    if (!data || data.length === 0) {
      return (
        <Box
          sx={{
            height: height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            bgcolor: theme.palette.background.default,
            opacity: 0.7,
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            No data available
          </Typography>
        </Box>
      );
    }

    if (!chartData) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant='body2' color='text.secondary'>
            Invalid chart data
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height, position: 'relative', p: 1 }}>{renderChart()}</Box>
    );
  }
);
