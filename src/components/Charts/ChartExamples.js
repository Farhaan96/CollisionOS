import React from 'react';
import { Grid, Box, Typography, Container } from '@mui/material';
import { 
  TrendingUp, 
  AttachMoney, 
  People, 
  Build, 
  DirectionsCar,
  Speed 
} from '@mui/icons-material';
import {
  ExecutiveKPICard,
  RevenueChart,
  ProductionFlowDiagram,
  CircularProgress
} from './index';

// Sample data for demonstrations
const sampleKPIData = {
  revenue: {
    value: 285000,
    previousValue: 245000,
    sparklineData: [180, 195, 210, 225, 240, 258, 275, 285],
    unit: '',
    prefix: '$'
  },
  jobs: {
    value: 47,
    previousValue: 52,
    sparklineData: [45, 48, 50, 52, 49, 46, 48, 47],
    suffix: ' jobs'
  },
  efficiency: {
    value: 92.5,
    previousValue: 88.2,
    sparklineData: [85, 87, 89, 90, 88, 91, 92, 92.5],
    suffix: '%'
  }
};

const sampleRevenueData = [
  { date: '2024-01', revenue: 180000, target: 200000, costs: 120000 },
  { date: '2024-02', revenue: 195000, target: 200000, costs: 125000 },
  { date: '2024-03', revenue: 210000, target: 220000, costs: 130000 },
  { date: '2024-04', revenue: 225000, target: 220000, costs: 135000 },
  { date: '2024-05', revenue: 240000, target: 240000, costs: 140000 },
  { date: '2024-06', revenue: 258000, target: 250000, costs: 145000 },
  { date: '2024-07', revenue: 275000, target: 260000, costs: 150000 },
  { date: '2024-08', revenue: 285000, target: 270000, costs: 152000 }
];

const sampleProductionStages = [
  {
    id: 'intake',
    name: 'Vehicle Intake',
    type: 'intake',
    status: 'active',
    capacity: 8,
    currentLoad: 6,
    currentJobs: 6,
    avgTime: 2,
    queueTime: 0.5,
    technicians: 2,
    nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
  },
  {
    id: 'assessment',
    name: 'Damage Assessment',
    type: 'assessment',
    status: 'active',
    capacity: 4,
    currentLoad: 4,
    currentJobs: 4,
    avgTime: 4,
    queueTime: 1.2,
    technicians: 2,
    bottleneck: true,
    nextAvailable: new Date(Date.now() + 4 * 60 * 60 * 1000)
  },
  {
    id: 'parts',
    name: 'Parts Ordering',
    type: 'parts',
    status: 'at-risk',
    capacity: 6,
    currentLoad: 3,
    currentJobs: 3,
    avgTime: 1.5,
    queueTime: 0.8,
    technicians: 1,
    nextAvailable: new Date(Date.now() + 1 * 60 * 60 * 1000)
  },
  {
    id: 'bodywork',
    name: 'Body Repair',
    type: 'bodywork',
    status: 'active',
    capacity: 5,
    currentLoad: 5,
    currentJobs: 5,
    avgTime: 8,
    queueTime: 2.1,
    technicians: 3,
    nextAvailable: new Date(Date.now() + 8 * 60 * 60 * 1000)
  },
  {
    id: 'painting',
    name: 'Paint & Finish',
    type: 'painting',
    status: 'active',
    capacity: 3,
    currentLoad: 3,
    currentJobs: 3,
    avgTime: 6,
    queueTime: 1.5,
    technicians: 2,
    bottleneck: true,
    nextAvailable: new Date(Date.now() + 6 * 60 * 60 * 1000)
  },
  {
    id: 'quality',
    name: 'Quality Control',
    type: 'quality',
    status: 'on-track',
    capacity: 4,
    currentLoad: 2,
    currentJobs: 2,
    avgTime: 2,
    queueTime: 0.3,
    technicians: 1,
    nextAvailable: new Date(Date.now() + 30 * 60 * 1000)
  },
  {
    id: 'delivery',
    name: 'Customer Delivery',
    type: 'delivery',
    status: 'active',
    capacity: 6,
    currentLoad: 3,
    currentJobs: 3,
    avgTime: 1,
    queueTime: 0.2,
    technicians: 2,
    nextAvailable: new Date(Date.now() + 1 * 60 * 60 * 1000)
  }
];

const sampleConnectionsData = [
  { progress: 85 },
  { progress: 92 },
  { progress: 78 },
  { progress: 88 },
  { progress: 95 },
  { progress: 90 }
];

const ChartExamples = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            textAlign: 'center',
            mb: 4,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Executive Dashboard Components
        </Typography>

        {/* KPI Cards Section */}
        <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3 }}>
          Executive KPI Cards
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={4}>
            <ExecutiveKPICard
              title="Monthly Revenue"
              value={sampleKPIData.revenue.value}
              previousValue={sampleKPIData.revenue.previousValue}
              prefix={sampleKPIData.revenue.prefix}
              sparklineData={sampleKPIData.revenue.sparklineData}
              status="positive"
              comparison="vs last month"
              detailedTooltip="Total revenue including all services, parts, and labor"
              icon={AttachMoney}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ExecutiveKPICard
              title="Active Jobs"
              value={sampleKPIData.jobs.value}
              previousValue={sampleKPIData.jobs.previousValue}
              suffix={sampleKPIData.jobs.suffix}
              sparklineData={sampleKPIData.jobs.sparklineData}
              status="negative"
              comparison="vs last week"
              detailedTooltip="Number of vehicles currently in production"
              icon={DirectionsCar}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ExecutiveKPICard
              title="Shop Efficiency"
              value={sampleKPIData.efficiency.value}
              previousValue={sampleKPIData.efficiency.previousValue}
              suffix={sampleKPIData.efficiency.suffix}
              sparklineData={sampleKPIData.efficiency.sparklineData}
              status="positive"
              comparison="industry avg"
              detailedTooltip="Overall production efficiency including all stages"
              icon={Speed}
              size="medium"
            />
          </Grid>
        </Grid>

        {/* Different sizes */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Different Sizes
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <ExecutiveKPICard
              title="Small KPI"
              value={1250}
              previousValue={1100}
              prefix="$"
              status="positive"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <ExecutiveKPICard
              title="Medium KPI (Default)"
              value={45000}
              previousValue={42000}
              prefix="$"
              status="positive"
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={12} md={3}>
            <ExecutiveKPICard
              title="Large KPI"
              value={125000}
              previousValue={118000}
              prefix="$"
              status="positive"
              size="large"
            />
          </Grid>
        </Grid>

        {/* Revenue Chart Section */}
        <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3 }}>
          Interactive Revenue Chart
        </Typography>
        <Box sx={{ mb: 6 }}>
          <RevenueChart
            data={sampleRevenueData}
            title="Monthly Revenue Performance"
            height={400}
            series={[
              { 
                key: 'revenue', 
                name: 'Actual Revenue', 
                color: '#6366F1' 
              },
              { 
                key: 'target', 
                name: 'Revenue Target', 
                color: '#22C55E', 
                strokeDasharray: '5 5' 
              },
              { 
                key: 'costs', 
                name: 'Operating Costs', 
                color: '#EF4444',
                type: 'bar'
              }
            ]}
            showBrush={true}
            realTimeUpdate={false}
            currency={true}
          />
        </Box>

        {/* Production Flow Diagram */}
        <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3 }}>
          Production Flow Diagram
        </Typography>
        <Box sx={{ mb: 6 }}>
          <ProductionFlowDiagram
            title="Vehicle Production Workflow"
            stages={sampleProductionStages}
            connections={sampleConnectionsData}
            height={450}
            editable={true}
            showMetrics={true}
            onStageClick={(stage) => console.log('Stage clicked:', stage)}
            onStageReorder={(newOrder) => console.log('New stage order:', newOrder)}
          />
        </Box>

        {/* Circular Progress Section */}
        <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3 }}>
          Circular Progress Components
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>Basic Progress</Typography>
              <CircularProgress
                value={75}
                label="Completion Rate"
                size={120}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>With Values</Typography>
              <CircularProgress
                value={1250000}
                maxValue={2000000}
                showPercentage={false}
                showValue={true}
                label="Revenue"
                subtitle="This Quarter"
                size={120}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>Comparison Mode</Typography>
              <CircularProgress
                value={85}
                comparisonValue={72}
                variant="comparison"
                comparisonLabel="Last Month"
                label="Efficiency"
                size={120}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>Multi-Ring</Typography>
              <CircularProgress
                variant="multi"
                size={120}
                rings={[
                  {
                    id: 'jobs',
                    value: 80,
                    color: '#6366F1',
                    tooltip: 'Jobs: 80%'
                  },
                  {
                    id: 'revenue',
                    value: 65,
                    color: '#22C55E',
                    tooltip: 'Revenue: 65%'
                  },
                  {
                    id: 'efficiency',
                    value: 92,
                    color: '#F59E0B',
                    tooltip: 'Efficiency: 92%'
                  }
                ]}
                centerContent={
                  <Box>
                    <Typography variant="h6" component="div">
                      Q4
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Performance
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>
        </Grid>

        {/* Different Styles */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Different Styles & Sizes
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>Thin & Large</Typography>
              <CircularProgress
                value={68}
                thickness="thin"
                size={160}
                label="Quality Score"
                glow={true}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>Thick & Medium</Typography>
              <CircularProgress
                value={42}
                thickness="thick"
                size={120}
                label="Capacity"
                gradient={true}
                color="#E91E63"
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>Custom Content</Typography>
              <CircularProgress
                value={95}
                size={140}
                centerContent={
                  <Box>
                    <Build sx={{ fontSize: 32, color: '#6366F1' }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Shop Status
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ChartExamples;