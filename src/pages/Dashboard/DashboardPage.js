import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  CardContent,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  IconButton,
  Button,
  Badge,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Build,
  Assessment,
  DirectionsCar,
  Inventory,
  Refresh,
  Notifications,
  Timer,
  PrecisionManufacturing,
  MonetizationOn,
  MoreVert,
  CloudUpload,
} from '@mui/icons-material';
import { ModernBackground } from '../../components/Common/ModernBackground';
import { BentoGrid, BentoItem } from '../../components/Layout/BentoGrid';
import { GlassCard } from '../../components/Common/GlassCard';
import { AnimatedCounter } from '../../utils/AnimatedCounter';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';

// Memoized real-time data to prevent unnecessary re-renders
const realTimeData = {
  cycleTime: {
    current: 6.8,
    target: 7.0,
    lastWeek: 7.2,
    trend: -5.6,
    series: [
      { day: 'Mon', value: 7.2 },
      { day: 'Tue', value: 7.0 },
      { day: 'Wed', value: 6.9 },
      { day: 'Thu', value: 6.8 },
      { day: 'Fri', value: 6.5 },
      { day: 'Sat', value: 6.8 },
      { day: 'Sun', value: 6.8 },
    ],
  },
  laborEfficiency: {
    current: 142.5,
    target: 125.0,
    series: [
      { name: 'Mike Johnson', efficiency: 156, revenue: 12500 },
      { name: 'Sarah Davis', efficiency: 145, revenue: 11800 },
      { name: 'Tom Wilson', efficiency: 138, revenue: 10900 },
      { name: 'Lisa Brown', efficiency: 132, revenue: 9800 },
    ],
  },
  revenuePerTech: 11025,
  averageRO: 1850,
  utilizationRate: 87.5,
  partsEfficiency: {
    inventoryTurns: 8.2,
    onTime: 94.2,
    markup: 28.5,
  },
  touchTime: {
    current: 4.2,
    target: 4.0,
    breakdown: [
      { stage: 'Teardown', hours: 8, target: 6 },
      { stage: 'Body Work', hours: 24, target: 22 },
      { stage: 'Paint Prep', hours: 12, target: 10 },
      { stage: 'Paint', hours: 16, target: 16 },
      { stage: 'Assembly', hours: 18, target: 16 },
    ],
  },
};

const productionData = [
  { status: 'Estimate', count: 8, color: '#3B82F6' },
  { status: 'Parts Ordered', count: 12, color: '#F59E0B' },
  { status: 'Body Work', count: 15, color: '#8B5CF6' },
  { status: 'Paint Prep', count: 6, color: '#06B6D4' },
  { status: 'Paint Booth', count: 4, color: '#EF4444' },
  { status: 'Assembly', count: 9, color: '#10B981' },
  { status: 'QC', count: 3, color: '#6366F1' },
  { status: 'Ready', count: 5, color: '#22C55E' },
];

const revenueData = [
  { month: 'Jan', labor: 85000, parts: 45000, total: 130000 },
  { month: 'Feb', labor: 92000, parts: 48000, total: 140000 },
  { month: 'Mar', labor: 88000, parts: 52000, total: 140000 },
  { month: 'Apr', labor: 95000, parts: 55000, total: 150000 },
  { month: 'May', labor: 102000, parts: 58000, total: 160000 },
  { month: 'Jun', labor: 108000, parts: 62000, total: 170000 },
];

const alerts = [
  {
    id: 1,
    type: 'error',
    title: 'Parts Overdue',
    message: 'BMW 3-Series front bumper 3 days overdue',
    priority: 'high',
  },
  {
    id: 2,
    type: 'warning',
    title: 'Cycle Time Alert',
    message: 'Job #2457 exceeding target by 2 days',
    priority: 'medium',
  },
  {
    id: 3,
    type: 'info',
    title: 'Insurance Approval',
    message: 'Supplement approved for $1,245',
    priority: 'low',
  },
];

// Additional data for tables
const recentJobs = [
  {
    id: '2457',
    customer: 'John Smith',
    vehicle: '2020 Honda Civic',
    status: 'Body Work',
    value: 2847.5,
    days: 3,
  },
  {
    id: '2458',
    customer: 'Sarah Johnson',
    vehicle: '2019 Toyota Camry',
    status: 'Paint Prep',
    value: 1956.75,
    days: 1,
  },
  {
    id: '2459',
    customer: 'Mike Wilson',
    vehicle: '2021 Ford F-150',
    status: 'Estimate',
    value: 3420.0,
    days: 0,
  },
  {
    id: '2460',
    customer: 'Lisa Brown',
    vehicle: '2018 BMW 3-Series',
    status: 'Assembly',
    value: 4120.25,
    days: 5,
  },
  {
    id: '2461',
    customer: 'Tom Davis',
    vehicle: '2022 Chevrolet Silverado',
    status: 'QC',
    value: 2875.5,
    days: 6,
  },
];

const partsInventory = [
  {
    part: 'Front Bumper - Honda Civic',
    quantity: 2,
    cost: 450.0,
    supplier: 'Honda Parts',
    status: 'In Stock',
  },
  {
    part: 'Hood - Toyota Camry',
    quantity: 1,
    cost: 320.0,
    supplier: 'Toyota Parts',
    status: 'Low Stock',
  },
  {
    part: 'Rear Bumper - Ford F-150',
    quantity: 0,
    cost: 580.0,
    supplier: 'Ford Parts',
    status: 'Out of Stock',
  },
  {
    part: 'Fender - BMW 3-Series',
    quantity: 3,
    cost: 420.0,
    supplier: 'BMW Parts',
    status: 'In Stock',
  },
  {
    part: 'Headlight Assembly - Chevy Silverado',
    quantity: 1,
    cost: 380.0,
    supplier: 'GM Parts',
    status: 'Low Stock',
  },
];

const technicianSchedule = [
  {
    name: 'Mike Johnson',
    currentJob: '2457 - Honda Civic',
    status: 'Body Work',
    efficiency: 156,
    hours: 8.5,
  },
  {
    name: 'Sarah Davis',
    currentJob: '2458 - Toyota Camry',
    status: 'Paint Prep',
    efficiency: 145,
    hours: 7.0,
  },
  {
    name: 'Tom Wilson',
    currentJob: '2460 - BMW 3-Series',
    status: 'Assembly',
    efficiency: 138,
    hours: 9.0,
  },
  {
    name: 'Lisa Brown',
    currentJob: '2461 - Chevy Silverado',
    status: 'QC',
    efficiency: 132,
    hours: 6.5,
  },
];

// Memoized KPI Card Component for better performance
const ProfessionalKPICard = React.memo(
  ({
    title,
    value,
    prefix = '',
    suffix = '',
    trend,
    icon,
    color,
    subtext,
    isLoading = false,
  }) => {
    const trendColor =
      title.includes('Cycle Time') || title.includes('Touch Time')
        ? trend < 0
          ? '#10B981'
          : '#EF4444'
        : trend > 0
          ? '#10B981'
          : '#EF4444';

    return (
      <GlassCard
        sx={{
          height: '100%',
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${color}, transparent)`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='flex-start'
            mb={2}
          >
            <Avatar
              sx={{
                bgcolor: color + '20',
                color: color,
                width: 56,
                height: 56,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${color}40`,
              }}
            >
              {icon}
            </Avatar>
            <IconButton size='small' sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <MoreVert />
            </IconButton>
          </Stack>

          <Typography
            variant='h3'
            sx={{
              fontWeight: 800,
              mb: 0.5,
              background: `linear-gradient(135deg, ${color}, #ffffff)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </Typography>

          <Typography
            variant='body2'
            sx={{ color: 'rgba(255,255,255,0.8)', mb: 2, fontWeight: 500 }}
          >
            {title}
          </Typography>

          <Stack direction='row' alignItems='center' spacing={1}>
            <Chip
              size='small'
              icon={trend >= 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${Math.abs(trend).toFixed(1)}%`}
              sx={{
                bgcolor: trendColor + '20',
                color: trendColor,
                border: `1px solid ${trendColor}40`,
                fontWeight: 600,
              }}
            />
            <Typography
              variant='caption'
              sx={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {subtext}
            </Typography>
          </Stack>
        </CardContent>
      </GlassCard>
    );
  }
);

// Memoized Production Status Widget
const ProductionStatusCard = React.memo(() => (
  <GlassCard sx={{ height: '100%', p: 3 }}>
    <Typography variant='h6' sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
      Production Pipeline
    </Typography>
    <Grid container spacing={2}>
      {productionData.map((item, index) => (
        <Grid xs={6} sm={4} md={3} key={index}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${item.color}40`,
            }}
          >
            <Typography
              variant='h4'
              sx={{
                color: item.color,
                fontWeight: 800,
                mb: 1,
              }}
            >
              {item.count}
            </Typography>
            <Typography
              variant='caption'
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              {item.status}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </GlassCard>
));

// Memoized Revenue Chart Component
const RevenueChart = React.memo(() => (
  <GlassCard sx={{ height: 400, p: 3, overflow: 'hidden' }}>
    <Typography variant='h6' sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
      Revenue Trend - Last 6 Months
    </Typography>
    <Box sx={{ width: '100%', height: 300, minWidth: 0 }}>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id='laborGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#3B82F6' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#3B82F6' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='partsGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#10B981' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#10B981' stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey='month'
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
            }}
          />
          <Area
            type='monotone'
            dataKey='labor'
            stackId='1'
            stroke='#3B82F6'
            fill='url(#laborGradient)'
          />
          <Area
            type='monotone'
            dataKey='parts'
            stackId='1'
            stroke='#10B981'
            fill='url(#partsGradient)'
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  </GlassCard>
));

// Memoized Technician Performance Component
const TechnicianPerformance = React.memo(() => (
  <GlassCard sx={{ height: '100%', p: 3 }}>
    <Typography variant='h6' sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
      Technician Performance
    </Typography>
    <Stack spacing={3}>
      {realTimeData.laborEfficiency.series.map((tech, index) => (
        <Box key={index}>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            mb={1}
          >
            <Typography
              variant='body2'
              sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
            >
              {tech.name}
            </Typography>
            <Stack direction='row' spacing={2} alignItems='center'>
              <Typography variant='caption' sx={{ color: '#10B981' }}>
                ${tech.revenue.toLocaleString()}
              </Typography>
              <Chip
                label={`${tech.efficiency}%`}
                size='small'
                sx={{
                  bgcolor: tech.efficiency >= 140 ? '#10B98120' : '#F59E0B20',
                  color: tech.efficiency >= 140 ? '#10B981' : '#F59E0B',
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Stack>
          <LinearProgress
            variant='determinate'
            value={Math.min(tech.efficiency, 200)}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: tech.efficiency >= 140 ? '#10B981' : '#F59E0B',
                borderRadius: 4,
              },
            }}
          />
        </Box>
      ))}
    </Stack>
  </GlassCard>
));

// Memoized Alerts Panel
const AlertsPanel = React.memo(() => (
  <GlassCard
    sx={{ height: '100%', p: 3, overflow: 'hidden', maxWidth: '100%' }}
  >
    <Stack
      direction='row'
      justifyContent='space-between'
      alignItems='center'
      mb={3}
      sx={{ width: '100%', overflow: 'hidden' }}
    >
      <Typography
        variant='h6'
        sx={{ fontWeight: 700, color: 'white', flex: 1, minWidth: 0 }}
      >
        Live Alerts
      </Typography>
      <Badge badgeContent={alerts.length} color='error' sx={{ flexShrink: 0 }}>
        <Notifications sx={{ color: 'rgba(255,255,255,0.7)' }} />
      </Badge>
    </Stack>
    <Stack spacing={2}>
      {alerts.map(alert => (
        <Paper
          key={alert.id}
          sx={{
            p: 2,
            background:
              alert.type === 'error'
                ? 'rgba(239,68,68,0.1)'
                : alert.type === 'warning'
                  ? 'rgba(245,158,11,0.1)'
                  : 'rgba(59,130,246,0.1)',
            border: `1px solid ${
              alert.type === 'error'
                ? '#EF4444'
                : alert.type === 'warning'
                  ? '#F59E0B'
                  : '#3B82F6'
            }40`,
          }}
        >
          <Typography
            variant='body2'
            sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}
          >
            {alert.title}
          </Typography>
          <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {alert.message}
          </Typography>
        </Paper>
      ))}
    </Stack>
  </GlassCard>
));

// Memoized Recent Jobs Table
const RecentJobsTable = React.memo(() => (
  <GlassCard sx={{ height: '100%', p: 3 }}>
    <Typography variant='h6' sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
      Recent Jobs
    </Typography>
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Job #
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Customer
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Vehicle
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Status
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Value
            </th>
            <th
              style={{
                textAlign: 'center',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Days
            </th>
          </tr>
        </thead>
        <tbody>
          {recentJobs.map(job => (
            <tr
              key={job.id}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <td style={{ padding: '8px', color: 'white', fontWeight: 600 }}>
                {job.id}
              </td>
              <td style={{ padding: '8px', color: 'rgba(255,255,255,0.9)' }}>
                {job.customer}
              </td>
              <td style={{ padding: '8px', color: 'rgba(255,255,255,0.9)' }}>
                {job.vehicle}
              </td>
              <td style={{ padding: '8px' }}>
                <Chip
                  label={job.status}
                  size='small'
                  sx={{
                    bgcolor:
                      job.status === 'Estimate'
                        ? '#3B82F6'
                        : job.status === 'Body Work'
                          ? '#8B5CF6'
                          : job.status === 'Paint Prep'
                            ? '#06B6D4'
                            : job.status === 'Assembly'
                              ? '#10B981'
                              : '#F59E0B',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </td>
              <td
                style={{
                  padding: '8px',
                  textAlign: 'right',
                  color: '#10B981',
                  fontWeight: 600,
                }}
              >
                ${job.value.toLocaleString()}
              </td>
              <td
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {job.days}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  </GlassCard>
));

// Memoized Parts Inventory Table
const PartsInventoryTable = React.memo(() => (
  <GlassCard sx={{ height: '100%', p: 3 }}>
    <Typography variant='h6' sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
      Parts Inventory
    </Typography>
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Part
            </th>
            <th
              style={{
                textAlign: 'center',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Qty
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Cost
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Supplier
            </th>
            <th
              style={{
                textAlign: 'center',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {partsInventory.map((part, index) => (
            <tr
              key={index}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <td style={{ padding: '8px', color: 'rgba(255,255,255,0.9)' }}>
                {part.part}
              </td>
              <td
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {part.quantity}
              </td>
              <td
                style={{
                  padding: '8px',
                  textAlign: 'right',
                  color: '#F59E0B',
                  fontWeight: 600,
                }}
              >
                ${part.cost.toLocaleString()}
              </td>
              <td style={{ padding: '8px', color: 'rgba(255,255,255,0.9)' }}>
                {part.supplier}
              </td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <Chip
                  label={part.status}
                  size='small'
                  sx={{
                    bgcolor:
                      part.status === 'In Stock'
                        ? '#10B981'
                        : part.status === 'Low Stock'
                          ? '#F59E0B'
                          : '#EF4444',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  </GlassCard>
));

// Memoized Technician Schedule Table
const TechnicianScheduleTable = React.memo(() => (
  <GlassCard sx={{ height: '100%', p: 3 }}>
    <Typography variant='h6' sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
      Technician Schedule
    </Typography>
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Technician
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Current Job
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Status
            </th>
            <th
              style={{
                textAlign: 'center',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Efficiency
            </th>
            <th
              style={{
                textAlign: 'center',
                padding: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
              }}
            >
              Hours
            </th>
          </tr>
        </thead>
        <tbody>
          {technicianSchedule.map((tech, index) => (
            <tr
              key={index}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <td style={{ padding: '8px', color: 'white', fontWeight: 600 }}>
                {tech.name}
              </td>
              <td style={{ padding: '8px', color: 'rgba(255,255,255,0.9)' }}>
                {tech.currentJob}
              </td>
              <td style={{ padding: '8px' }}>
                <Chip
                  label={tech.status}
                  size='small'
                  sx={{
                    bgcolor:
                      tech.status === 'Body Work'
                        ? '#8B5CF6'
                        : tech.status === 'Paint Prep'
                          ? '#06B6D4'
                          : tech.status === 'Assembly'
                            ? '#10B981'
                            : '#F59E0B',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <Chip
                  label={`${tech.efficiency}%`}
                  size='small'
                  sx={{
                    bgcolor: tech.efficiency >= 140 ? '#10B981' : '#F59E0B',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </td>
              <td
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {tech.hours}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  </GlassCard>
));

export const DashboardPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [productionStats, setProductionStats] = useState(productionData);
  const [revenueStats, setRevenueStats] = useState(revenueData);
  const [recentJobsData, setRecentJobsData] = useState(recentJobs);
  const [alertsData, setAlertsData] = useState(alerts);
  const [techPerformance, setTechPerformance] = useState(
    realTimeData.laborEfficiency.series
  );
  const navigate = useNavigate();

  // Load dashboard data from API
  const loadDashboardData = async (timeframe = 'month') => {
    setLoading(true);
    try {
      const [
        kpisData,
        productionData,
        revenueData,
        jobsData,
        alertsData,
        techData,
      ] = await Promise.all([
        dashboardService.getKPIs(timeframe),
        dashboardService.getProductionData(),
        dashboardService.getRevenueTrend(timeframe),
        dashboardService.getRecentJobs(5),
        dashboardService.getAlerts(),
        dashboardService.getTechnicianPerformance(timeframe),
      ]);

      setKpis(kpisData);
      setProductionStats(productionData || productionData);
      setRevenueStats(revenueData || revenueData);
      setRecentJobsData(jobsData || recentJobs);
      setAlertsData(alertsData || alerts);
      setTechPerformance(techData || realTimeData.laborEfficiency.series);

      console.log('Dashboard data loaded:', {
        kpisData,
        productionData,
        revenueData,
        jobsData,
        alertsData,
        techData,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep fallback data in case of error
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const handleRefreshData = async () => {
    await dashboardService.refreshData();
    await loadDashboardData();
  };

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Optimize time updates to reduce re-renders
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Memoize the header to prevent unnecessary re-renders
  const headerContent = useMemo(
    () => (
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        mb={4}
      >
        <Box>
          <Typography
            variant='h3'
            sx={{
              fontWeight: 800,
              color: 'white',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              mb: 1,
            }}
          >
            CollisionOS
          </Typography>
          <Typography
            variant='h6'
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}
          >
            Executive Dashboard • {currentTime.toLocaleDateString()} •{' '}
            {currentTime.toLocaleTimeString()}
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          variant='contained'
          onClick={handleRefreshData}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            px: 3,
          }}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </Stack>
    ),
    [currentTime]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        position: 'relative',
      }}
    >
      <ModernBackground />

      <Container maxWidth='xl' sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {headerContent}

        {/* KPI Cards Grid */}
        <BentoGrid cols={12} gap={3}>
          {/* Top Row KPIs */}
          <BentoItem span={{ xs: 12, sm: 6, md: 3 }}>
            <ProfessionalKPICard
              title='Cycle Time (Days)'
              value={realTimeData.cycleTime.current}
              suffix=''
              trend={realTimeData.cycleTime.trend}
              icon={<Timer />}
              color='#3B82F6'
              subtext='vs last week'
            />
          </BentoItem>

          <BentoItem span={{ xs: 12, sm: 6, md: 3 }}>
            <ProfessionalKPICard
              title='Labor Efficiency'
              value={realTimeData.laborEfficiency.current}
              suffix='%'
              trend={12.3}
              icon={<PrecisionManufacturing />}
              color='#10B981'
              subtext='above target'
            />
          </BentoItem>

          <BentoItem span={{ xs: 12, sm: 6, md: 3 }}>
            <ProfessionalKPICard
              title='Revenue Per Tech'
              value={realTimeData.revenuePerTech}
              prefix='$'
              trend={8.7}
              icon={<MonetizationOn />}
              color='#F59E0B'
              subtext='this month'
            />
          </BentoItem>

          <BentoItem span={{ xs: 12, sm: 6, md: 3 }}>
            <ProfessionalKPICard
              title='Utilization Rate'
              value={realTimeData.utilizationRate}
              suffix='%'
              trend={4.2}
              icon={<Assessment />}
              color='#8B5CF6'
              subtext='capacity used'
            />
          </BentoItem>

          {/* Production Status - Large Widget */}
          <BentoItem span={{ xs: 12, lg: 8 }}>
            <ProductionStatusCard />
          </BentoItem>

          {/* Alerts Panel */}
          <BentoItem span={{ xs: 12, lg: 4 }}>
            <AlertsPanel />
          </BentoItem>

          {/* Revenue Chart */}
          <BentoItem span={{ xs: 12, lg: 7 }}>
            <RevenueChart />
          </BentoItem>

          {/* Technician Performance */}
          <BentoItem span={{ xs: 12, lg: 5 }}>
            <TechnicianPerformance />
          </BentoItem>

          {/* BMS Quick Access */}
          <BentoItem span={{ xs: 12, sm: 6, md: 4 }}>
            <GlassCard
              sx={{ height: '100%', cursor: 'pointer' }}
              onClick={() => navigate('/bms-dashboard')}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <CloudUpload sx={{ fontSize: 48, color: '#3B82F6', mb: 2 }} />
                <Typography
                  variant='h6'
                  sx={{ color: 'white', fontWeight: 700, mb: 1 }}
                >
                  BMS Files
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}
                >
                  Upload and manage BMS (Body Management System) files
                </Typography>
                <Button
                  variant='contained'
                  startIcon={<CloudUpload />}
                  onClick={e => {
                    e.stopPropagation();
                    navigate('/bms-dashboard');
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    borderRadius: '12px',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563EB, #1E40AF)',
                    },
                  }}
                >
                  View BMS Dashboard
                </Button>
              </CardContent>
            </GlassCard>
          </BentoItem>

          {/* Recent Jobs Table */}
          <BentoItem span={{ xs: 12, lg: 8 }}>
            <RecentJobsTable />
          </BentoItem>

          {/* Parts Inventory Table */}
          <BentoItem span={{ xs: 12, lg: 4 }}>
            <PartsInventoryTable />
          </BentoItem>

          {/* Technician Schedule Table */}
          <BentoItem span={{ xs: 12, lg: 6 }}>
            <TechnicianScheduleTable />
          </BentoItem>

          {/* Additional Metrics Row */}
          <BentoItem span={{ xs: 12, sm: 4 }}>
            <ProfessionalKPICard
              title='Average RO Value'
              value={realTimeData.averageRO}
              prefix='$'
              trend={5.8}
              icon={<DirectionsCar />}
              color='#EF4444'
              subtext='per repair order'
            />
          </BentoItem>

          <BentoItem span={{ xs: 12, sm: 4 }}>
            <ProfessionalKPICard
              title='Parts Inventory Turns'
              value={realTimeData.partsEfficiency.inventoryTurns}
              suffix=' turns/yr'
              trend={12.5}
              icon={<Inventory />}
              color='#06B6D4'
              subtext='efficiency'
            />
          </BentoItem>

          <BentoItem span={{ xs: 12, sm: 4 }}>
            <ProfessionalKPICard
              title='Touch Time (Days)'
              value={realTimeData.touchTime.current}
              suffix=''
              trend={-8.9}
              icon={<Build />}
              color='#22C55E'
              subtext='active work time'
            />
          </BentoItem>
        </BentoGrid>
      </Container>
    </Box>
  );
};

export default DashboardPage;
