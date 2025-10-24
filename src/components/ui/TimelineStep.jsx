import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Circle } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * TimelineStep - Visual timeline step component for repair workflow progress
 *
 * @param {string} title - Step title (e.g., "Estimate Approved")
 * @param {string} status - Step status: 'completed', 'current', 'upcoming'
 * @param {string} date - Date/time string (displayed if completed/current)
 * @param {string} user - User who completed the step
 * @param {string} note - Optional note/comment for the step
 * @param {ReactElement} icon - Optional custom icon (overrides default status icon)
 * @param {boolean} isLast - Whether this is the last step (hides connector line)
 * @param {function} onClick - Optional click handler
 */
const TimelineStep = ({
  title,
  status = 'upcoming',
  date,
  user,
  note,
  icon,
  isLast = false,
  onClick,
}) => {
  const theme = useTheme();

  // Status configurations
  const statusConfig = {
    completed: {
      icon: icon || <CheckCircle />,
      iconColor: theme.palette.success.main,
      iconBgColor: `${theme.palette.success.main}15`,
      titleColor: theme.palette.text.primary,
      dotColor: theme.palette.success.main,
    },
    current: {
      icon: icon || <Circle />,
      iconColor: theme.palette.primary.main,
      iconBgColor: `${theme.palette.primary.main}20`,
      titleColor: theme.palette.primary.main,
      dotColor: theme.palette.primary.main,
      pulse: true,
    },
    upcoming: {
      icon: icon || <RadioButtonUnchecked />,
      iconColor: theme.palette.text.disabled,
      iconBgColor: theme.palette.action.hover,
      titleColor: theme.palette.text.secondary,
      dotColor: theme.palette.divider,
    },
  };

  const config = statusConfig[status] || statusConfig.upcoming;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 2,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          '& .timeline-icon': {
            transform: 'scale(1.1)',
          },
        } : {},
      }}
    >
      {/* Left side: Icon with connector line */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Icon */}
        <Box
          className="timeline-icon"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: config.iconBgColor,
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 1,
            ...(config.pulse && {
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: `0 0 0 0 ${config.iconColor}60`,
                },
                '50%': {
                  boxShadow: `0 0 0 8px ${config.iconColor}00`,
                },
              },
            }),
          }}
        >
          {React.cloneElement(config.icon, {
            sx: { fontSize: 24, color: config.iconColor },
          })}
        </Box>

        {/* Connector line */}
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              minHeight: 40,
              backgroundColor: config.dotColor,
              opacity: status === 'completed' ? 1 : 0.3,
              transition: 'all 0.3s ease',
            }}
          />
        )}
      </Box>

      {/* Right side: Content */}
      <Box
        sx={{
          flex: 1,
          pb: isLast ? 0 : 3,
        }}
      >
        {/* Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: config.titleColor,
            mb: 0.5,
          }}
        >
          {title}
        </Typography>

        {/* Date and User */}
        {(date || user) && (
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={note ? 1 : 0}>
            {date && (
              <Typography variant="body2" color="text.secondary">
                {date}
              </Typography>
            )}
            {date && user && (
              <Typography variant="body2" color="text.disabled">
                •
              </Typography>
            )}
            {user && (
              <Typography variant="body2" color="text.secondary">
                by {user}
              </Typography>
            )}
          </Box>
        )}

        {/* Note/Comment */}
        {note && (
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
              borderLeft: `3px solid ${config.iconColor}`,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              {note}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

TimelineStep.propTypes = {
  title: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['completed', 'current', 'upcoming']),
  date: PropTypes.string,
  user: PropTypes.string,
  note: PropTypes.string,
  icon: PropTypes.element,
  isLast: PropTypes.bool,
  onClick: PropTypes.func,
};

export default TimelineStep;
