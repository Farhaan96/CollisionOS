import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { ModernBackground } from '../../components/Common/ModernBackground';
import { BentoGrid, BentoItem } from '../../components/Layout/BentoGrid';
import { KpiCard } from '../../components/Dashboard/KpiCard';
import { GlassCard } from '../../components/Common/GlassCard';

// Sample KPI data as shown in the instructions
const sampleKpis = [
  {
    label: 'Active Jobs',
    value: 42,
    deltaPct: 8,
    forecastNote: 'Expected +12% next week',
    series: [
      { name: 'd1', value: 32 },
      { name: 'd2', value: 30 },
      { name: 'd3', value: 35 },
      { name: 'd4', value: 34 },
      { name: 'd5', value: 36 },
      { name: 'd6', value: 38 },
      { name: 'd7', value: 42 },
    ],
  },
  {
    label: 'Parts On Order',
    value: 123,
    deltaPct: -5,
    forecastNote: 'Anomaly risk ↓',
    series: [
      { name: 'd1', value: 100 },
      { name: 'd2', value: 120 },
      { name: 'd3', value: 115 },
      { name: 'd4', value: 112 },
      { name: 'd5', value: 110 },
      { name: 'd6', value: 118 },
      { name: 'd7', value: 123 },
    ],
  },
  {
    label: 'Cycle Time (days)',
    value: 9,
    deltaPct: -3,
    forecastNote: 'Target 8 days',
    series: [
      { name: 'd1', value: 11 },
      { name: 'd2', value: 10 },
      { name: 'd3', value: 10 },
      { name: 'd4', value: 9 },
      { name: 'd5', value: 9 },
      { name: 'd6', value: 9 },
      { name: 'd7', value: 9 },
    ],
  },
];

export const ExampleDashboard = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: t => t.custom.gradients.background,
      }}
    >
      <ModernBackground />
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 800, mb: 3 }}>
          CollisionOS — Executive Overview
        </Typography>

        {/* KPI Row */}
        <BentoGrid cols={12} gap={2}>
          {sampleKpis.map((k, i) => (
            <BentoItem key={i} span={{ xs: 12, md: 4 }}>
              <KpiCard kpi={k} />
            </BentoItem>
          ))}

          {/* Wide primary analytics card (3x2 on md+) */}
          <BentoItem span={{ xs: 12, md: 8 }}>
            <GlassCard sx={{ minHeight: 320 }}>
              <Typography variant='h6' sx={{ mb: 1.5, fontWeight: 700 }}>
                Throughput — Last 30 Days
              </Typography>
              <Box sx={{ opacity: 0.8 }}>
                Replace with your main chart (Recharts/visx). Add annotations,
                drill‑downs, and animated transitions.
              </Box>
            </GlassCard>
          </BentoItem>

          {/* Quick actions (2x1) */}
          <BentoItem span={{ xs: 12, md: 4 }}>
            <GlassCard
              sx={{
                minHeight: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography>
                Quick Actions: New RO • Book Calibration • Order Parts
              </Typography>
            </GlassCard>
          </BentoItem>

          {/* Alerts (1x3 vertical stack on md+) */}
          <BentoItem span={{ xs: 12, md: 4 }}>
            <GlassCard sx={{ minHeight: 160, mb: 2 }}>
              Live Alerts — Anomalies & SLAs
            </GlassCard>
            <GlassCard sx={{ minHeight: 160, mb: 2 }}>
              Today's Appointments
            </GlassCard>
            <GlassCard sx={{ minHeight: 160 }}>
              Late Parts / Escalations
            </GlassCard>
          </BentoItem>
        </BentoGrid>
      </Container>
    </Box>
  );
};

export default ExampleDashboard;
