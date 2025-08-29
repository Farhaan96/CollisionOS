import React, { useMemo, useCallback } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Avatar } from '@mui/material';
import { Warning, Error, Info, CheckCircle } from '@mui/icons-material';

// Memoized alert type mappings for better performance
const ALERT_ICON_MAP = {
  'warning': Warning,
  'error': Error,
  'info': Info,
  'success': CheckCircle,
  'default': Info
};

const ALERT_COLOR_MAP = {
  'warning': 'warning',
  'error': 'error',
  'info': 'info',
  'success': 'success',
  'default': 'default'
};

export const AlertsPanel = React.memo(({ alerts = [] }) => {
  // Memoize alert functions to prevent recreation on each render
  const getAlertIcon = useCallback((type) => {
    const IconComponent = ALERT_ICON_MAP[type] || ALERT_ICON_MAP.default;
    return <IconComponent />;
  }, []);

  const getAlertColor = useCallback((type) => {
    return ALERT_COLOR_MAP[type] || ALERT_COLOR_MAP.default;
  }, []);

  // Memoize the alert display data to prevent unnecessary recalculations
  const displayAlerts = useMemo(() => alerts.slice(0, 5), [alerts]);

  if (!alerts || alerts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No alerts
        </Typography>
      </Box>
    );
  }

  // Memoized alert list item component for better performance
  const AlertListItem = useCallback(({ alert, index }) => (
    <ListItem key={alert.id || index} sx={{ px: 0, py: 1 }}>
      <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: `${getAlertColor(alert.type)}.main` }}>
        {getAlertIcon(alert.type)}
      </Avatar>
      <ListItemText
        primary={alert.title || `Alert ${index + 1}`}
        secondary={alert.message || `Alert message ${index + 1}`}
        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
      <Chip
        label={alert.type || 'info'}
        size="small"
        color={getAlertColor(alert.type)}
        variant="outlined"
      />
    </ListItem>
  ), [getAlertIcon, getAlertColor]);

  return (
    <List sx={{ p: 0 }}>
      {displayAlerts.map((alert, index) => (
        <AlertListItem key={alert.id || `alert-${index}`} alert={alert} index={index} />
      ))}
    </List>
  );
});
