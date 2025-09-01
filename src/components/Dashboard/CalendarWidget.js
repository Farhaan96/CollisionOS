import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Event, Schedule } from '@mui/icons-material';

export const CalendarWidget = () => {
  const events = [
    { id: 1, title: 'Customer Pickup', time: '2:00 PM', type: 'pickup' },
    { id: 2, title: 'Parts Delivery', time: '3:30 PM', type: 'delivery' },
    { id: 3, title: 'Team Meeting', time: '4:00 PM', type: 'meeting' },
  ];

  const getEventColor = type => {
    switch (type) {
      case 'pickup':
        return 'success';
      case 'delivery':
        return 'info';
      case 'meeting':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Event sx={{ mr: 1 }} />
        <Typography variant='h6'>Today's Events</Typography>
      </Box>
      <List sx={{ p: 0 }}>
        {events.map(event => (
          <ListItem key={event.id} sx={{ px: 0, py: 1 }}>
            <ListItemText
              primary={event.title}
              secondary={event.time}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 'medium',
              }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Chip
              label={event.type}
              size='small'
              color={getEventColor(event.type)}
              variant='outlined'
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
