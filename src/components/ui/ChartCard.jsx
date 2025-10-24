import React from 'react';
import { Card, CardContent, Box, Typography, IconButton, useTheme, Skeleton, Chip } from '@mui/material';
import { MoreVert, Refresh } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * ChartCard - Card wrapper specifically designed for chart components
 *
 * @param {string} title - Card title
 * @param {string} subtitle - Optional subtitle/description
 * @param {ReactNode} children - Chart component to render
 * @param {ReactElement|ReactElement[]} actions - Action buttons
 * @param {boolean} loading - Show loading skeleton
 * @param {function} onRefresh - Optional refresh handler
 * @param {string} timeRange - Optional time range label (e.g., "Last 30 Days")
 * @param {number} height - Card content height in pixels (default: 400)
 * @param {number} chartHeight - Chart height in pixels (default: height - header)
 */
const ChartCard = ({
  title,
  subtitle,
  children,
  actions,
  loading = false,
  onRefresh,
  timeRange,
  height = 400,
  chartHeight,
}) => {
  const theme = useTheme();

  // Calculate chart height (leave room for header)
  const calculatedChartHeight = chartHeight || (height - 100);

  if (loading) {
    return (
      <Card
        sx={{
          height,
          borderRadius: 2,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ p: 3, height: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
          <Skeleton
            variant="rectangular"
            height={calculatedChartHeight}
            sx={{ borderRadius: 2 }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height,
        borderRadius: 2,
        background: theme.palette.mode === 'dark'
          ? 'rgba(30, 41, 59, 0.8)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {timeRange && (
                <Chip
                  label={timeRange}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Box display="flex" gap={0.5} alignItems="center">
            {onRefresh && (
              <IconButton
                size="small"
                onClick={onRefresh}
                sx={{
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}15`,
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            )}
            {actions && (
              Array.isArray(actions) ? (
                actions.map((action, index) => (
                  <React.Fragment key={index}>{action}</React.Fragment>
                ))
              ) : (
                actions
              )
            )}
          </Box>
        </Box>

        {/* Chart Content */}
        <Box
          sx={{
            flex: 1,
            height: calculatedChartHeight,
            minHeight: 0,
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  timeRange: PropTypes.string,
  height: PropTypes.number,
  chartHeight: PropTypes.number,
};

export default ChartCard;
