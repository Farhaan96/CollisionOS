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
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Groups,
  Person,
  Star,
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  WorkHistory,
  Speed,
  Assignment,
  CheckCircle,
  Warning,
  MoreVert,
  Leaderboard,
  Analytics,
  Schedule,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// Utils
import { getGlassStyles, glassHoverEffects } from '../../../utils/glassTheme';
import { microAnimations, springConfigs } from '../../../utils/animations';
import { useTheme as useAppTheme } from '../../../contexts/ThemeContext';

const TeamPerformanceWidget = ({ period = 'weekly', expanded = false }) => {
  const theme = useTheme();
  const { mode } = useAppTheme();

  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'individual', 'metrics'
  const [anchorEl, setAnchorEl] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [teamMetrics, setTeamMetrics] = useState({});
  const [performanceData, setPerformanceData] = useState([]);

  // Mock team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Mike Johnson',
      role: 'Senior Technician',
      avatar: '/avatars/mike.jpg',
      experience: 8,
    },
    {
      id: 2,
      name: 'Sarah Chen',
      role: 'Body Repair Specialist',
      avatar: '/avatars/sarah.jpg',
      experience: 5,
    },
    {
      id: 3,
      name: 'David Rodriguez',
      role: 'Paint Technician',
      avatar: '/avatars/david.jpg',
      experience: 6,
    },
    {
      id: 4,
      name: 'Emily Watson',
      role: 'Parts Specialist',
      avatar: '/avatars/emily.jpg',
      experience: 4,
    },
    {
      id: 5,
      name: 'James Thompson',
      role: 'Quality Inspector',
      avatar: '/avatars/james.jpg',
      experience: 7,
    },
    {
      id: 6,
      name: 'Lisa Garcia',
      role: 'Service Advisor',
      avatar: '/avatars/lisa.jpg',
      experience: 3,
    },
  ];

  useEffect(() => {
    // Generate mock team performance data
    const generateTeamData = () => {
      const data = teamMembers.map(member => {
        const baseEfficiency = 70 + Math.random() * 25;
        const baseQuality = 85 + Math.random() * 12;
        const completedJobs = Math.floor(Math.random() * 15) + 5;

        return {
          ...member,
          efficiency: Math.round(baseEfficiency),
          quality: Math.round(baseQuality),
          completedJobs,
          onTimeDelivery: Math.round(80 + Math.random() * 18),
          customerRating: (4.0 + Math.random() * 1.0).toFixed(1),
          hoursWorked: Math.floor(Math.random() * 20) + 30,
          overtimeHours: Math.floor(Math.random() * 8),
          skillLevel: Math.floor(Math.random() * 3) + 3, // 3-5 scale
          trend: Math.random() > 0.5 ? 'up' : 'down',
          improvement: (Math.random() * 15).toFixed(1),
        };
      });

      setTeamData(data);

      // Calculate team metrics
      const totalJobs = data.reduce(
        (sum, member) => sum + member.completedJobs,
        0
      );
      const avgEfficiency = Math.round(
        data.reduce((sum, member) => sum + member.efficiency, 0) / data.length
      );
      const avgQuality = Math.round(
        data.reduce((sum, member) => sum + member.quality, 0) / data.length
      );
      const avgRating = (
        data.reduce(
          (sum, member) => sum + parseFloat(member.customerRating),
          0
        ) / data.length
      ).toFixed(1);
      const totalHours = data.reduce(
        (sum, member) => sum + member.hoursWorked,
        0
      );
      const totalOvertime = data.reduce(
        (sum, member) => sum + member.overtimeHours,
        0
      );

      setTeamMetrics({
        totalMembers: data.length,
        totalJobs,
        avgEfficiency,
        avgQuality,
        avgRating,
        totalHours,
        totalOvertime,
        utilizationRate: Math.round((totalHours / (data.length * 40)) * 100), // assuming 40h work week
        topPerformer: data.reduce((prev, current) =>
          prev.efficiency + prev.quality > current.efficiency + current.quality
            ? prev
            : current
        ),
        improvementTrend: data.filter(member => member.trend === 'up').length,
      });

      // Performance trend data
      const trendData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          efficiency: Math.round(75 + Math.random() * 20),
          quality: Math.round(85 + Math.random() * 12),
          productivity: Math.round(80 + Math.random() * 15),
          satisfaction: Math.round(85 + Math.random() * 10),
        };
      });
      setPerformanceData(trendData);
    };

    generateTeamData();
  }, [period]);

  const handleMenuClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSkillLevelColor = level => {
    switch (level) {
      case 5:
        return theme.palette.success.main;
      case 4:
        return theme.palette.info.main;
      case 3:
        return theme.palette.warning.main;
      default:
        return theme.palette.error.main;
    }
  };

  const getSkillLevelLabel = level => {
    switch (level) {
      case 5:
        return 'Expert';
      case 4:
        return 'Advanced';
      case 3:
        return 'Intermediate';
      case 2:
        return 'Beginner';
      default:
        return 'Trainee';
    }
  };

  // Team member card component
  const TeamMemberCard = ({ member }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      whileHover={{ y: -2 }}
    >
      <Card
        sx={{
          height: '100%',
          ...getGlassStyles('subtle', mode),
          ...glassHoverEffects(mode, 1),
          cursor: 'pointer',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Badge
              overlap='circular'
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Avatar
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor:
                      member.trend === 'up' ? 'success.main' : 'warning.main',
                  }}
                >
                  {member.trend === 'up' ? (
                    <TrendingUp sx={{ fontSize: 10 }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 10 }} />
                  )}
                </Avatar>
              }
            >
              <Avatar
                src={member.avatar}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.primary.main,
                }}
              >
                {member.name.charAt(0)}
              </Avatar>
            </Badge>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                {member.name}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mb: 0.5 }}
              >
                {member.role}
              </Typography>
              <Chip
                label={getSkillLevelLabel(member.skillLevel)}
                size='small'
                sx={{
                  bgcolor: getSkillLevelColor(member.skillLevel),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Box>
          </Box>

          <Stack spacing={1.5}>
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant='caption' color='text.secondary'>
                  Efficiency
                </Typography>
                <Typography variant='caption' sx={{ fontWeight: 600 }}>
                  {member.efficiency}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={member.efficiency}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor:
                      member.efficiency > 85
                        ? 'success.main'
                        : member.efficiency > 70
                          ? 'info.main'
                          : 'warning.main',
                  },
                }}
              />
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant='caption' color='text.secondary'>
                  Quality Score
                </Typography>
                <Typography variant='caption' sx={{ fontWeight: 600 }}>
                  {member.quality}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={member.quality}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor: 'success.main',
                  },
                }}
              />
            </Box>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, lineHeight: 1 }}
                >
                  {member.completedJobs}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Jobs
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, lineHeight: 1 }}
                >
                  {member.customerRating}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Rating
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, lineHeight: 1 }}
                >
                  {member.hoursWorked}h
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Hours
                </Typography>
              </Box>
            </Box>
          </Stack>
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
                {entry.name}: {entry.value}%
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
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
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
              boxShadow: `0 4px 16px ${theme.palette.primary.main}40`,
            }}
          >
            <Groups />
          </Avatar>
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Team Performance
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Staff productivity and metrics
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant='outlined'
            size='small'
            startIcon={<Leaderboard />}
            onClick={() =>
              setSelectedView(
                selectedView === 'overview'
                  ? 'individual'
                  : selectedView === 'individual'
                    ? 'metrics'
                    : 'overview'
              )
            }
            sx={{ minWidth: 120 }}
          >
            {selectedView === 'overview'
              ? 'Overview'
              : selectedView === 'individual'
                ? 'Individual'
                : 'Metrics'}
          </Button>

          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Team Overview Cards */}
      {selectedView === 'overview' && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
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
                  <Groups />
                </Avatar>
                <Typography variant='h5' sx={{ fontWeight: 700 }}>
                  {teamMetrics.totalMembers}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Team Members
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
                  <Assignment />
                </Avatar>
                <Typography variant='h5' sx={{ fontWeight: 700 }}>
                  {teamMetrics.totalJobs}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Total Jobs
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
                  <Speed />
                </Avatar>
                <Typography variant='h5' sx={{ fontWeight: 700 }}>
                  {teamMetrics.avgEfficiency}%
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Avg Efficiency
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
                    bgcolor: 'warning.main',
                    mx: 'auto',
                    mb: 1,
                    width: 32,
                    height: 32,
                  }}
                >
                  <Star />
                </Avatar>
                <Typography variant='h5' sx={{ fontWeight: 700 }}>
                  {teamMetrics.avgRating}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Avg Rating
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

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
              style={{ height: '100%' }}
            >
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                Performance Trends
              </Typography>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke={mode === 'dark' ? '#374151' : '#e5e7eb'}
                  />
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 12 }}
                    stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke={mode === 'dark' ? '#9ca3af' : '#6b7280'}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='efficiency'
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    name='Efficiency'
                  />
                  <Line
                    type='monotone'
                    dataKey='quality'
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    name='Quality'
                  />
                  <Line
                    type='monotone'
                    dataKey='satisfaction'
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    name='Satisfaction'
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {selectedView === 'individual' && (
            <motion.div
              key='individual'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                Team Members
              </Typography>
              <Grid container spacing={2}>
                {teamData.map(member => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={expanded ? 4 : 6}
                    lg={expanded ? 3 : 4}
                    key={member.id}
                  >
                    <TeamMemberCard member={member} />
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}

          {selectedView === 'metrics' && (
            <motion.div
              key='metrics'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card
                    sx={{
                      p: 3,
                      ...getGlassStyles('default', mode),
                      height: '100%',
                    }}
                  >
                    <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                      Performance Distribution
                    </Typography>
                    <ResponsiveContainer width='100%' height={250}>
                      <BarChart data={teamData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='name' tick={{ fontSize: 10 }} />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar
                          dataKey='efficiency'
                          fill={theme.palette.primary.main}
                          name='Efficiency'
                        />
                        <Bar
                          dataKey='quality'
                          fill={theme.palette.success.main}
                          name='Quality'
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card
                    sx={{
                      p: 3,
                      ...getGlassStyles('default', mode),
                      height: '100%',
                    }}
                  >
                    <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                      Top Performers
                    </Typography>
                    <List dense>
                      {teamData
                        .sort(
                          (a, b) =>
                            b.efficiency +
                            b.quality -
                            (a.efficiency + a.quality)
                        )
                        .slice(0, 3)
                        .map((member, index) => (
                          <ListItem key={member.id} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Badge
                                badgeContent={index + 1}
                                color={
                                  index === 0
                                    ? 'primary'
                                    : index === 1
                                      ? 'secondary'
                                      : 'default'
                                }
                              >
                                <Avatar
                                  src={member.avatar}
                                  sx={{ width: 32, height: 32 }}
                                >
                                  {member.name.charAt(0)}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant='body2'
                                  sx={{ fontWeight: 500 }}
                                >
                                  {member.name}
                                </Typography>
                              }
                              secondary={
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {Math.round(
                                    (member.efficiency + member.quality) / 2
                                  )}
                                  % avg
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Card>
                </Grid>
              </Grid>
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
          <Person sx={{ mr: 2 }} />
          Staff Directory
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Schedule sx={{ mr: 2 }} />
          Schedule Management
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Analytics sx={{ mr: 2 }} />
          Performance Report
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TeamPerformanceWidget;
