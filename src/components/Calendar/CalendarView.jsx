import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ViewDay,
  ViewWeek,
  ViewModule,
  CalendarToday,
  Build,
  Person,
  DirectionsCar,
} from '@mui/icons-material';

// Setup moment localizer for react-big-calendar
const localizer = momentLocalizer(moment);

/**
 * CalendarView Component
 * Displays appointments in a calendar format with day/week/month views
 * Supports drag-and-drop rescheduling
 */
const CalendarView = ({
  appointments = [],
  onSelectAppointment,
  onSelectSlot,
  onEventDrop,
  loading = false,
  view = 'week',
  onViewChange,
}) => {
  const theme = useTheme();
  const [calendarView, setCalendarView] = useState(view);

  // Transform appointments to react-big-calendar events format
  const events = useMemo(() => {
    return appointments.map(apt => ({
      id: apt.id,
      title: `${apt.customer || 'Unknown'} - ${apt.vehicle || 'Vehicle'}`,
      start: new Date(apt.scheduledTime || apt.startDate),
      end: new Date(apt.endTime || apt.scheduledTime || apt.startDate),
      resource: {
        ...apt,
        type: apt.type || 'appointment',
        status: apt.status || 'scheduled',
        technician: apt.technician || apt.technicianName,
      },
    }));
  }, [appointments]);

  // Handle view change
  const handleViewChange = useCallback((newView) => {
    setCalendarView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  }, [onViewChange]);

  // Event style getter - color-code by type and status
  const eventStyleGetter = useCallback((event) => {
    const { type, status } = event.resource || {};

    let backgroundColor = theme.palette.primary.main;
    let borderColor = theme.palette.primary.dark;

    // Color by type
    if (type === 'drop-off' || type === 'Drop-off') {
      backgroundColor = theme.palette.info.main;
      borderColor = theme.palette.info.dark;
    } else if (type === 'pickup' || type === 'Pickup') {
      backgroundColor = theme.palette.success.main;
      borderColor = theme.palette.success.dark;
    } else if (type === 'inspection' || type === 'Inspection') {
      backgroundColor = theme.palette.warning.main;
      borderColor = theme.palette.warning.dark;
    } else if (type === 'ro_milestone' || type === 'production') {
      backgroundColor = theme.palette.secondary.main;
      borderColor = theme.palette.secondary.dark;
    }

    // Adjust opacity based on status
    if (status === 'completed') {
      backgroundColor = alpha(backgroundColor, 0.5);
    } else if (status === 'cancelled') {
      backgroundColor = theme.palette.error.main;
      borderColor = theme.palette.error.dark;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '4px',
        opacity: status === 'cancelled' ? 0.6 : 1,
        color: theme.palette.getContrastText(backgroundColor),
        fontSize: '0.875rem',
        padding: '2px 6px',
      },
    };
  }, [theme]);

  // Custom event component for better display
  const EventComponent = ({ event }) => {
    const { type, status, technician } = event.resource || {};

    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
          {event.title}
        </Typography>
        {technician && (
          <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
            {technician}
          </Typography>
        )}
        {type && (
          <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
            {type}
          </Typography>
        )}
      </Box>
    );
  };

  // Handle event drag and drop
  const handleEventDrop = useCallback(({ event, start, end }) => {
    if (onEventDrop) {
      onEventDrop({
        appointmentId: event.id,
        newStartDate: start,
        newEndDate: end,
        appointment: event.resource,
      });
    }
  }, [onEventDrop]);

  // Handle selecting a time slot
  const handleSelectSlot = useCallback((slotInfo) => {
    if (onSelectSlot) {
      onSelectSlot({
        start: slotInfo.start,
        end: slotInfo.end,
        slots: slotInfo.slots,
      });
    }
  }, [onSelectSlot]);

  // Handle selecting an event
  const handleSelectEvent = useCallback((event) => {
    if (onSelectAppointment) {
      onSelectAppointment(event.resource);
    }
  }, [onSelectAppointment]);

  return (
    <Paper sx={{ p: 2 }}>
      {/* View Toggle */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Calendar View
        </Typography>
        <ToggleButtonGroup
          value={calendarView}
          exclusive
          onChange={(e, newView) => newView && handleViewChange(newView)}
          size="small"
        >
          <ToggleButton value="day" aria-label="day view">
            <ViewDay sx={{ mr: 0.5 }} fontSize="small" />
            Day
          </ToggleButton>
          <ToggleButton value="week" aria-label="week view">
            <ViewWeek sx={{ mr: 0.5 }} fontSize="small" />
            Week
          </ToggleButton>
          <ToggleButton value="month" aria-label="month view">
            <ViewModule sx={{ mr: 0.5 }} fontSize="small" />
            Month
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Legend */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Chip
          icon={<DirectionsCar />}
          label="Drop-off"
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.info.main, 0.2),
            color: theme.palette.info.dark,
            borderLeft: `3px solid ${theme.palette.info.main}`,
          }}
        />
        <Chip
          icon={<CalendarToday />}
          label="Pickup"
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.2),
            color: theme.palette.success.dark,
            borderLeft: `3px solid ${theme.palette.success.main}`,
          }}
        />
        <Chip
          icon={<Person />}
          label="Inspection"
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.warning.main, 0.2),
            color: theme.palette.warning.dark,
            borderLeft: `3px solid ${theme.palette.warning.main}`,
          }}
        />
        <Chip
          icon={<Build />}
          label="Production"
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.secondary.main, 0.2),
            color: theme.palette.secondary.dark,
            borderLeft: `3px solid ${theme.palette.secondary.main}`,
          }}
        />
      </Box>

      {/* Calendar */}
      <Box
        sx={{
          height: 'calc(100vh - 350px)',
          minHeight: '500px',
          '& .rbc-calendar': {
            fontFamily: theme.typography.fontFamily,
          },
          '& .rbc-header': {
            padding: theme.spacing(1),
            fontWeight: 600,
            borderBottom: `2px solid ${theme.palette.divider}`,
          },
          '& .rbc-today': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
          '& .rbc-off-range-bg': {
            backgroundColor: alpha(theme.palette.action.disabledBackground, 0.3),
          },
          '& .rbc-toolbar': {
            padding: theme.spacing(1, 0),
            marginBottom: theme.spacing(2),
            '& button': {
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
              '&.rbc-active': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              },
            },
          },
          '& .rbc-event': {
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '0.875rem',
          },
          '& .rbc-event-label': {
            fontSize: '0.75rem',
          },
          '& .rbc-time-slot': {
            minHeight: '40px',
          },
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          view={calendarView}
          onView={handleViewChange}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          selectable
          resizable
          draggableAccessor={(event) => event.resource?.status !== 'completed' && event.resource?.status !== 'cancelled'}
          defaultDate={new Date()}
          popup
          step={30}
          timeslots={2}
          tooltipAccessor={(event) => {
            const { type, status, technician, notes } = event.resource || {};
            return `${event.title}\nType: ${type || 'N/A'}\nStatus: ${status || 'N/A'}\nTechnician: ${technician || 'Unassigned'}${notes ? '\nNotes: ' + notes : ''}`;
          }}
        />
      </Box>

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Typography>Loading calendar...</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CalendarView;
