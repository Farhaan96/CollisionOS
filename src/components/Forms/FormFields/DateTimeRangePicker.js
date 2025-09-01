import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  Grid,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import {
  CalendarToday,
  Schedule,
  DateRange,
  Today,
  AccessTime,
  Refresh,
  Settings,
  Event,
  EventAvailable,
  EventBusy,
  Alarm,
  AlarmOff,
  Public,
  Language,
  Close,
  Check,
  ArrowForward,
  KeyboardArrowDown,
  Tune,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { premiumDesignSystem } from '../../../theme/premiumDesignSystem';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Preset ranges configuration
const PRESET_RANGES = {
  today: {
    label: 'Today',
    icon: Today,
    getValue: () => ({
      start: dayjs().startOf('day'),
      end: dayjs().endOf('day'),
    }),
  },
  tomorrow: {
    label: 'Tomorrow',
    icon: Event,
    getValue: () => ({
      start: dayjs().add(1, 'day').startOf('day'),
      end: dayjs().add(1, 'day').endOf('day'),
    }),
  },
  thisWeek: {
    label: 'This Week',
    icon: DateRange,
    getValue: () => ({
      start: dayjs().startOf('week'),
      end: dayjs().endOf('week'),
    }),
  },
  nextWeek: {
    label: 'Next Week',
    icon: DateRange,
    getValue: () => ({
      start: dayjs().add(1, 'week').startOf('week'),
      end: dayjs().add(1, 'week').endOf('week'),
    }),
  },
  thisMonth: {
    label: 'This Month',
    icon: CalendarToday,
    getValue: () => ({
      start: dayjs().startOf('month'),
      end: dayjs().endOf('month'),
    }),
  },
  nextMonth: {
    label: 'Next Month',
    icon: CalendarToday,
    getValue: () => ({
      start: dayjs().add(1, 'month').startOf('month'),
      end: dayjs().add(1, 'month').endOf('month'),
    }),
  },
  last7Days: {
    label: 'Last 7 Days',
    icon: DateRange,
    getValue: () => ({
      start: dayjs().subtract(7, 'day').startOf('day'),
      end: dayjs().endOf('day'),
    }),
  },
  last30Days: {
    label: 'Last 30 Days',
    icon: DateRange,
    getValue: () => ({
      start: dayjs().subtract(30, 'day').startOf('day'),
      end: dayjs().endOf('day'),
    }),
  },
  lastQuarter: {
    label: 'Last Quarter',
    icon: DateRange,
    getValue: () => ({
      start: dayjs().subtract(3, 'month').startOf('month'),
      end: dayjs().subtract(1, 'month').endOf('month'),
    }),
  },
  thisYear: {
    label: 'This Year',
    icon: CalendarToday,
    getValue: () => ({
      start: dayjs().startOf('year'),
      end: dayjs().endOf('year'),
    }),
  },
};

// Common timezones
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC',
];

// Date format presets
const DATE_FORMATS = {
  'MM/DD/YYYY': 'MM/DD/YYYY',
  'DD/MM/YYYY': 'DD/MM/YYYY',
  'YYYY-MM-DD': 'YYYY-MM-DD',
  'MMM DD, YYYY': 'MMM DD, YYYY',
  'DD MMM YYYY': 'DD MMM YYYY',
  'MMMM DD, YYYY': 'MMMM DD, YYYY',
};

// Time format presets
const TIME_FORMATS = {
  '12h': 'hh:mm A',
  '24h': 'HH:mm',
};

const DateTimeRangePicker = ({
  value = { start: null, end: null },
  onChange = () => {},
  onRangeChange = () => {},
  mode = 'range', // 'single', 'range'
  includeTime = false,
  enableTimeZone = false,
  timeZone = dayjs.tz.guess(),
  enablePresets = true,
  presetRanges = Object.keys(PRESET_RANGES),
  blockedDates = [],
  blockedTimeRanges = [],
  dateFormat = 'MM/DD/YYYY',
  timeFormat = '12h',
  minDate = null,
  maxDate = null,
  label = 'Select Date',
  placeholder = 'Choose date range...',
  disabled = false,
  error = null,
  helperText = null,
  required = false,
  clearable = true,
  variant = 'outlined',
  size = 'medium',
  fullWidth = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [internalValue, setInternalValue] = useState(value);
  const [tempValue, setTempValue] = useState(value);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [currentStep, setCurrentStep] = useState('start'); // 'start', 'end', 'time'
  const [showSettings, setShowSettings] = useState(false);
  const [customTimeZone, setCustomTimeZone] = useState(timeZone);
  const [customDateFormat, setCustomDateFormat] = useState(dateFormat);
  const [customTimeFormat, setCustomTimeFormat] = useState(timeFormat);
  const [anchorEl, setAnchorEl] = useState(null);

  // Sync with external value
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(internalValue)) {
      setInternalValue(value);
      setTempValue(value);
    }
  }, [value]);

  // Format display value
  const displayValue = useMemo(() => {
    if (!internalValue.start) return '';

    const formatString = includeTime
      ? `${customDateFormat} ${TIME_FORMATS[customTimeFormat]}`
      : customDateFormat;

    const formatDate = date => {
      const dayjsDate = enableTimeZone
        ? dayjs(date).tz(customTimeZone)
        : dayjs(date);
      return dayjsDate.format(formatString);
    };

    if (mode === 'single') {
      return formatDate(internalValue.start);
    }

    if (
      internalValue.end &&
      !dayjs(internalValue.start).isSame(internalValue.end, 'day')
    ) {
      return `${formatDate(internalValue.start)} - ${formatDate(internalValue.end)}`;
    }

    return formatDate(internalValue.start);
  }, [
    internalValue,
    mode,
    includeTime,
    customDateFormat,
    customTimeFormat,
    enableTimeZone,
    customTimeZone,
  ]);

  // Check if date is blocked
  const isDateBlocked = useCallback(
    date => {
      if (!date) return false;

      const dayObject = dayjs(date);

      // Check against blocked dates
      return blockedDates.some(blockedDate => {
        if (
          typeof blockedDate === 'string' ||
          typeof blockedDate === 'number'
        ) {
          return dayObject.isSame(dayjs(blockedDate), 'day');
        }

        if (blockedDate.start && blockedDate.end) {
          return dayObject.isBetween(
            dayjs(blockedDate.start),
            dayjs(blockedDate.end),
            'day',
            '[]'
          );
        }

        return false;
      });
    },
    [blockedDates]
  );

  // Check if time is blocked
  const isTimeBlocked = useCallback(
    datetime => {
      if (!datetime || !blockedTimeRanges.length) return false;

      const dayObject = dayjs(datetime);

      return blockedTimeRanges.some(timeRange => {
        const startTime = dayjs(timeRange.start);
        const endTime = dayjs(timeRange.end);

        // If it's a daily recurring block, check time only
        if (timeRange.recurring === 'daily') {
          const checkTime = dayObject.format('HH:mm');
          const blockStart = startTime.format('HH:mm');
          const blockEnd = endTime.format('HH:mm');

          return checkTime >= blockStart && checkTime <= blockEnd;
        }

        // Otherwise check full datetime
        return dayObject.isBetween(startTime, endTime, 'minute', '[]');
      });
    },
    [blockedTimeRanges]
  );

  // Handle preset selection
  const handlePresetSelect = useCallback(
    presetKey => {
      const preset = PRESET_RANGES[presetKey];
      if (!preset) return;

      const range = preset.getValue();
      const newValue = {
        start: enableTimeZone ? range.start.tz(customTimeZone) : range.start,
        end:
          mode === 'range'
            ? enableTimeZone
              ? range.end.tz(customTimeZone)
              : range.end
            : null,
      };

      setSelectedPreset(presetKey);
      setTempValue(newValue);
      setInternalValue(newValue);
      onChange(newValue);
      onRangeChange(newValue.start, newValue.end);
      setShowPicker(false);
    },
    [mode, enableTimeZone, customTimeZone, onChange, onRangeChange]
  );

  // Handle date/time change
  const handleDateTimeChange = useCallback(
    (newDate, field = 'start') => {
      if (!newDate) return;

      const newValue = { ...tempValue };

      // Convert to proper timezone if enabled
      const processedDate = enableTimeZone
        ? dayjs(newDate).tz(customTimeZone)
        : dayjs(newDate);

      // Check if date is blocked
      if (isDateBlocked(processedDate)) {
        return;
      }

      // Check if time is blocked (if time is included)
      if (includeTime && isTimeBlocked(processedDate)) {
        return;
      }

      newValue[field] = processedDate;

      // For range mode, ensure start is before end
      if (
        mode === 'range' &&
        field === 'start' &&
        newValue.end &&
        processedDate.isAfter(newValue.end)
      ) {
        newValue.end = processedDate.endOf('day');
      }

      if (
        mode === 'range' &&
        field === 'end' &&
        newValue.start &&
        processedDate.isBefore(newValue.start)
      ) {
        newValue.start = processedDate.startOf('day');
      }

      setTempValue(newValue);
      setSelectedPreset(null);
    },
    [
      tempValue,
      mode,
      enableTimeZone,
      customTimeZone,
      isDateBlocked,
      isTimeBlocked,
      includeTime,
    ]
  );

  // Apply changes
  const applyChanges = useCallback(() => {
    setInternalValue(tempValue);
    onChange(tempValue);
    onRangeChange(tempValue.start, tempValue.end);
    setShowPicker(false);
  }, [tempValue, onChange, onRangeChange]);

  // Cancel changes
  const cancelChanges = useCallback(() => {
    setTempValue(internalValue);
    setShowPicker(false);
  }, [internalValue]);

  // Clear selection
  const clearSelection = useCallback(() => {
    const newValue = { start: null, end: null };
    setInternalValue(newValue);
    setTempValue(newValue);
    setSelectedPreset(null);
    onChange(newValue);
    onRangeChange(null, null);
  }, [onChange, onRangeChange]);

  // Toggle picker
  const togglePicker = useCallback(
    event => {
      if (disabled) return;
      setAnchorEl(event.currentTarget);
      setShowPicker(!showPicker);
      setTempValue(internalValue);
    },
    [disabled, showPicker, internalValue]
  );

  return (
    <Box sx={{ ...sx }}>
      {/* Main Input */}
      <TextField
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        label={label}
        placeholder={placeholder}
        value={displayValue}
        onClick={togglePicker}
        disabled={disabled}
        error={!!error}
        helperText={error || helperText}
        required={required}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              {mode === 'range' ? <DateRange /> : <CalendarToday />}
            </Box>
          ),
          endAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {enableTimeZone && (
                <Tooltip title={`Timezone: ${customTimeZone}`}>
                  <Public sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Tooltip>
              )}

              {includeTime && (
                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              )}

              {clearable && displayValue && (
                <IconButton size='small' onClick={clearSelection}>
                  <Close fontSize='small' />
                </IconButton>
              )}

              <IconButton size='small' onClick={() => setShowSettings(true)}>
                <Settings fontSize='small' />
              </IconButton>
            </Box>
          ),
          sx: {
            cursor: 'pointer',
            '& input': { cursor: 'pointer' },
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: premiumDesignSystem.shadows.glass.soft,
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
              boxShadow: premiumDesignSystem.shadows.colored.primary,
            },
          },
        }}
        {...props}
      />

      {/* Date/Time Picker Popover */}
      <Popover
        open={showPicker}
        anchorEl={anchorEl}
        onClose={() => setShowPicker(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 0,
            maxWidth: isMobile ? '100vw' : 600,
            boxShadow: premiumDesignSystem.shadows.glass.elevated,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Presets */}
            {enablePresets && (
              <Grid item xs={12} md={4}>
                <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                  Quick Select
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {presetRanges.map(presetKey => {
                    const preset = PRESET_RANGES[presetKey];
                    if (!preset) return null;

                    const IconComponent = preset.icon;

                    return (
                      <Button
                        key={presetKey}
                        variant={
                          selectedPreset === presetKey
                            ? 'contained'
                            : 'outlined'
                        }
                        size='small'
                        startIcon={<IconComponent />}
                        onClick={() => handlePresetSelect(presetKey)}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          '&:hover': {
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </Box>
              </Grid>
            )}

            {/* Date Pickers */}
            <Grid item xs={12} md={enablePresets ? 8 : 12}>
              <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                {mode === 'range' ? 'Select Date Range' : 'Select Date'}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Start Date */}
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {mode === 'range' ? 'Start Date' : 'Date'}
                  </Typography>
                  <DatePicker
                    value={tempValue.start}
                    onChange={date => handleDateTimeChange(date, 'start')}
                    minDate={minDate}
                    maxDate={maxDate}
                    shouldDisableDate={isDateBlocked}
                    format={customDateFormat}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Box>

                {/* End Date (Range mode only) */}
                {mode === 'range' && (
                  <Box>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ mb: 1, display: 'block' }}
                    >
                      End Date
                    </Typography>
                    <DatePicker
                      value={tempValue.end}
                      onChange={date => handleDateTimeChange(date, 'end')}
                      minDate={tempValue.start || minDate}
                      maxDate={maxDate}
                      shouldDisableDate={isDateBlocked}
                      format={customDateFormat}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Time Pickers */}
                {includeTime && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ mb: 1, display: 'block' }}
                    >
                      Time
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={mode === 'range' ? 6 : 12}>
                        <Typography
                          variant='caption'
                          sx={{ mb: 0.5, display: 'block' }}
                        >
                          {mode === 'range' ? 'Start Time' : 'Time'}
                        </Typography>
                        <TimePicker
                          value={tempValue.start}
                          onChange={time => handleDateTimeChange(time, 'start')}
                          format={TIME_FORMATS[customTimeFormat]}
                          shouldDisableTime={isTimeBlocked}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                            },
                          }}
                        />
                      </Grid>

                      {mode === 'range' && (
                        <Grid item xs={6}>
                          <Typography
                            variant='caption'
                            sx={{ mb: 0.5, display: 'block' }}
                          >
                            End Time
                          </Typography>
                          <TimePicker
                            value={tempValue.end}
                            onChange={time => handleDateTimeChange(time, 'end')}
                            format={TIME_FORMATS[customTimeFormat]}
                            shouldDisableTime={isTimeBlocked}
                            minTime={tempValue.start}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small',
                              },
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}

                {/* Timezone Display */}
                {enableTimeZone && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      icon={<Language />}
                      label={`Timezone: ${customTimeZone}`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Actions */}
          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              variant='outlined'
              onClick={clearSelection}
              startIcon={<Close />}
              disabled={!tempValue.start}
            >
              Clear
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant='outlined' onClick={cancelChanges}>
                Cancel
              </Button>

              <Button
                variant='contained'
                onClick={applyChanges}
                startIcon={<Check />}
                disabled={!tempValue.start}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Box>
      </Popover>

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Date & Time Settings</DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Date Format */}
            <FormControl fullWidth>
              <InputLabel>Date Format</InputLabel>
              <Select
                value={customDateFormat}
                onChange={e => setCustomDateFormat(e.target.value)}
                label='Date Format'
              >
                {Object.entries(DATE_FORMATS).map(([key, format]) => (
                  <MenuItem key={key} value={format}>
                    {format} ({dayjs().format(format)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Time Format */}
            {includeTime && (
              <FormControl fullWidth>
                <InputLabel>Time Format</InputLabel>
                <Select
                  value={customTimeFormat}
                  onChange={e => setCustomTimeFormat(e.target.value)}
                  label='Time Format'
                >
                  <MenuItem value='12h'>
                    12 Hour ({dayjs().format('hh:mm A')})
                  </MenuItem>
                  <MenuItem value='24h'>
                    24 Hour ({dayjs().format('HH:mm')})
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Timezone */}
            {enableTimeZone && (
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={customTimeZone}
                  onChange={e => setCustomTimeZone(e.target.value)}
                  label='Timezone'
                >
                  {COMMON_TIMEZONES.map(tz => (
                    <MenuItem key={tz} value={tz}>
                      {tz} ({dayjs().tz(tz).format('Z')})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DateTimeRangePicker;
