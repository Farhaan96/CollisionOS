import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  LinearProgress,
  Stack,
  Grid,
  Rating,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  EmojiEvents,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  TrendingUp,
  TrendingDown,
  Star,
  Reviews,
  Phone,
  Message,
  MoreVert,
  Feedback,
  Analytics,
  Email,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// Utils
import { getGlassStyles, glassHoverEffects } from '../../../utils/glassTheme';
import { microAnimations, springConfigs } from '../../../utils/animations';
import { useTheme as useAppTheme } from '../../../contexts/ThemeContext';

const CustomerSatisfactionWidget = ({
  period = 'weekly',
  expanded = false,
}) => {
  const theme = useTheme();
  const { mode } = useAppTheme();

  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'reviews', 'trends'
  const [anchorEl, setAnchorEl] = useState(null);
  const [satisfactionData, setSatisfactionData] = useState({});
  const [recentReviews, setRecentReviews] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [sentimentBreakdown, setSentimentBreakdown] = useState([]);

  // Rating configuration
  const ratingConfig = {
    5: {
      icon: <SentimentVerySatisfied />,
      label: 'Excellent',
      color: theme.palette.success.main,
      description: 'Exceeded expectations',
    },
    4: {
      icon: <SentimentSatisfied />,
      label: 'Good',
      color: theme.palette.info.main,
      description: 'Met expectations',
    },
    3: {
      icon: <SentimentNeutral />,
      label: 'Average',
      color: theme.palette.warning.main,
      description: 'Satisfactory service',
    },
    2: {
      icon: <SentimentDissatisfied />,
      label: 'Poor',
      color: theme.palette.error.main,
      description: 'Below expectations',
    },
    1: {
      icon: <SentimentVeryDissatisfied />,
      label: 'Terrible',
      color: theme.palette.error.dark,
      description: 'Unsatisfactory service',
    },
  };

  useEffect(() => {
    // Generate mock satisfaction data
    const generateSatisfactionData = () => {
      // Overall metrics
      const totalReviews = 127;
      const averageRating = 4.3;
      const previousRating = 4.1;
      const npsScore = 68; // Net Promoter Score
      const responseRate = 85;

      setSatisfactionData({
        totalReviews,
        averageRating,
        previousRating,
        change: (
          ((averageRating - previousRating) / previousRating) *
          100
        ).toFixed(1),
        npsScore,
        responseRate,
        recommendationRate: 89,
      });

      // Rating distribution
      const distribution = [
        {
          rating: 5,
          count: 58,
          percentage: 46,
          color: theme.palette.success.main,
        },
        {
          rating: 4,
          count: 42,
          percentage: 33,
          color: theme.palette.info.main,
        },
        {
          rating: 3,
          count: 18,
          percentage: 14,
          color: theme.palette.warning.main,
        },
        { rating: 2, count: 6, percentage: 5, color: theme.palette.error.main },
        { rating: 1, count: 3, percentage: 2, color: theme.palette.error.dark },
      ];
      setSentimentBreakdown(distribution);

      // Recent reviews
      const reviews = [
        {
          id: 1,
          customer: 'John Smith',
          rating: 5,
          comment:
            'Excellent service! My car looks brand new. The team was professional and kept me updated throughout the process.',
          date: '2 days ago',
          jobNumber: 'JOB-001',
          category: 'Body Repair',
        },
        {
          id: 2,
          customer: 'Sarah Johnson',
          rating: 4,
          comment:
            'Good work overall. The repair quality is great, though it took a bit longer than expected.',
          date: '3 days ago',
          jobNumber: 'JOB-012',
          category: 'Paint Work',
        },
        {
          id: 3,
          customer: 'Mike Davis',
          rating: 5,
          comment:
            'Outstanding customer service and attention to detail. Highly recommend this shop!',
          date: '5 days ago',
          jobNumber: 'JOB-008',
          category: 'Full Service',
        },
        {
          id: 4,
          customer: 'Lisa Wilson',
          rating: 3,
          comment:
            'Average experience. The work was done correctly but communication could be better.',
          date: '1 week ago',
          jobNumber: 'JOB-005',
          category: 'Mechanical',
        },
        {
          id: 5,
          customer: 'Robert Brown',
          rating: 5,
          comment:
            'Perfect job! Fast, efficient, and great customer service. Will definitely return.',
          date: '1 week ago',
          jobNumber: 'JOB-003',
          category: 'Insurance Claim',
        },
      ];
      setRecentReviews(reviews);

      // Trend data
      const trends = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setWeek(date.getWeek() - (11 - i));
        return {
          week: `Week ${i + 1}`,
          rating: (4.0 + Math.random() * 0.8).toFixed(1),
          reviews: Math.floor(Math.random() * 15) + 8,
          nps: Math.floor(Math.random() * 20) + 55,
          responseRate: Math.floor(Math.random() * 15) + 80,
        };
      });
      setTrendData(trends);
    };

    generateSatisfactionData();
  }, [period, theme.palette]);

  const handleMenuClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSentimentIcon = rating => {
    return ratingConfig[rating]?.icon || <SentimentNeutral />;
  };

  const getSentimentColor = rating => {
    return ratingConfig[rating]?.color || theme.palette.grey[500];
  };

  // Review card component
  const ReviewCard = ({ review }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
    >
      <Card
        sx={{
          mb: 2,
          ...getGlassStyles('subtle', mode),
          ...glassHoverEffects(mode, 1),
          cursor: 'pointer',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: getSentimentColor(review.rating),
                width: 40,
                height: 40,
              }}
            >
              {getSentimentIcon(review.rating)}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                  {review.customer}
                </Typography>
                <Chip
                  label={review.jobNumber}
                  size='small'
                  variant='outlined'
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Rating
                  value={review.rating}
                  readOnly
                  size='small'
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: getSentimentColor(review.rating),
                    },
                  }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {review.date}
                </Typography>
                <Chip
                  label={review.category}
                  size='small'
                  sx={{
                    fontSize: '0.6rem',
                    height: 18,
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    color: 'text.secondary',
                  }}
                />
              </Box>

              <Typography
                variant='body2'
                sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}
              >
                {review.comment}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card
          sx={{
            p: 2,
            ...getGlassStyles('elevated', mode),
            maxWidth: 200,
          }}
        >
          <Typography variant='subtitle2' sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: entry.color,
                }}
              />
              <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>
                {entry.name}: {entry.value}
                {entry.name === 'rating' ? '/5' : ''}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill='white'
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline='central'
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.success.main,
              width: 40,
              height: 40,
              boxShadow: `0 4px 16px ${theme.palette.success.main}40`,
            }}
          >
            <EmojiEvents />
          </Avatar>
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Customer Satisfaction
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Reviews and feedback analysis
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant='outlined'
            size='small'
            startIcon={<Reviews />}
            onClick={() =>
              setSelectedView(
                selectedView === 'overview'
                  ? 'reviews'
                  : selectedView === 'reviews'
                    ? 'trends'
                    : 'overview'
              )
            }
            sx={{ minWidth: 120 }}
          >
            {selectedView === 'overview'
              ? 'Overview'
              : selectedView === 'reviews'
                ? 'Reviews'
                : 'Trends'}
          </Button>

          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              p: 2,
              ...getGlassStyles('subtle', mode),
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <Rating
                value={satisfactionData.averageRating}
                readOnly
                precision={0.1}
                size='small'
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: theme.palette.warning.main,
                  },
                }}
              />
            </Box>
            <Typography variant='h5' sx={{ fontWeight: 700 }}>
              {satisfactionData.averageRating}/5
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Average Rating
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                mt: 0.5,
              }}
            >
              <TrendingUp sx={{ color: 'success.main', fontSize: 14 }} />
              <Typography
                variant='caption'
                sx={{ color: 'success.main', fontWeight: 600 }}
              >
                +{satisfactionData.change}%
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              p: 2,
              ...getGlassStyles('subtle', mode),
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                mx: 'auto',
                mb: 1,
                width: 32,
                height: 32,
              }}
            >
              <Reviews />
            </Avatar>
            <Typography variant='h5' sx={{ fontWeight: 700 }}>
              {satisfactionData.totalReviews}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Total Reviews
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              p: 2,
              ...getGlassStyles('subtle', mode),
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'info.main',
                mx: 'auto',
                mb: 1,
                width: 32,
                height: 32,
              }}
            >
              <ThumbUp />
            </Avatar>
            <Typography variant='h5' sx={{ fontWeight: 700 }}>
              {satisfactionData.npsScore}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              NPS Score
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              p: 2,
              ...getGlassStyles('subtle', mode),
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'success.main',
                mx: 'auto',
                mb: 1,
                width: 32,
                height: 32,
              }}
            >
              <Feedback />
            </Avatar>
            <Typography variant='h5' sx={{ fontWeight: 700 }}>
              {satisfactionData.responseRate}%
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Response Rate
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Content Area */}
      <Box sx={{ flex: 1 }}>
        <AnimatePresence mode='wait'>
          {selectedView === 'overview' && (
            <motion.div
              key='overview'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      p: 3,
                      ...getGlassStyles('default', mode),
                      height: '100%',
                    }}
                  >
                    <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                      Rating Distribution
                    </Typography>
                    <ResponsiveContainer width='100%' height={250}>
                      <PieChart>
                        <Pie
                          data={sentimentBreakdown}
                          cx='50%'
                          cy='50%'
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={80}
                          fill='#8884d8'
                          dataKey='count'
                        >
                          {sentimentBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      p: 3,
                      ...getGlassStyles('default', mode),
                      height: '100%',
                    }}
                  >
                    <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                      Rating Breakdown
                    </Typography>
                    <Stack spacing={2}>
                      {sentimentBreakdown.map(item => (
                        <Box
                          key={item.rating}
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: item.color,
                              width: 32,
                              height: 32,
                            }}
                          >
                            {getSentimentIcon(item.rating)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant='body2'
                                sx={{ fontWeight: 500 }}
                              >
                                {item.rating} Star{item.rating !== 1 ? 's' : ''}
                              </Typography>
                              <Typography
                                variant='body2'
                                sx={{ fontWeight: 600 }}
                              >
                                {item.count} ({item.percentage}%)
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant='determinate'
                              value={item.percentage}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: item.color,
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {selectedView === 'reviews' && (
            <motion.div
              key='reviews'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                Recent Customer Reviews
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                {recentReviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </Box>
            </motion.div>
          )}

          {selectedView === 'trends' && (
            <motion.div
              key='trends'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            >
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                Satisfaction Trends
              </Typography>
              <ResponsiveContainer width='100%' height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient
                      id='ratingGradient'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop
                        offset='5%'
                        stopColor={theme.palette.success.main}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset='95%'
                        stopColor={theme.palette.success.main}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke={mode === 'dark' ? '#374151' : '#e5e7eb'}
                  />
                  <XAxis
                    dataKey='week'
                    tick={{ fontSize: 12 }}
                    stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                    domain={[3.5, 5]}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type='monotone'
                    dataKey='rating'
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    fill='url(#ratingGradient)'
                    name='Rating'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
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
            mt: 1,
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Email sx={{ mr: 2 }} />
          Send Survey
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Phone sx={{ mr: 2 }} />
          Follow Up Calls
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Analytics sx={{ mr: 2 }} />
          Detailed Analysis
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomerSatisfactionWidget;
