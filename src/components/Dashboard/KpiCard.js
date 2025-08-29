import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { GlassCard } from '../Common/GlassCard';
import { AnimatedCounter } from '../../utils/AnimatedCounter';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export const KpiCard = ({ kpi, height = 120 }) => {
  const Up = kpi.deltaPct && kpi.deltaPct >= 0;
  return (
    <GlassCard sx={{ overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>{kpi.label}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: .5 }}>
            <AnimatedCounter value={kpi.value} />
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Chip size="small" color={Up ? 'success' : 'error'}
              icon={Up ? <TrendingUpIcon/> : <TrendingDownIcon/>}
              label={`${Up ? '+' : ''}${kpi.deltaPct ?? 0}%`} />
            {kpi.forecastNote && (
              <Typography variant="caption" sx={{ opacity: 0.75 }}>{kpi.forecastNote}</Typography>
            )}
          </Stack>
        </Box>
        <Box sx={{ width: '45%', height, minWidth: 0, overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kpi.series ?? []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Area type="monotone" dataKey="value" strokeOpacity={0.9} fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </GlassCard>
  );
};

export default KpiCard;