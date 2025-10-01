import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Box,
  Typography,
  Divider,
  Grid,
  IconButton,
  Chip,
  useTheme,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ShowChart,
  BarChart,
  PieChart,
  DonutLarge,
} from '@mui/icons-material';

/**
 * ChartSettingsDialog - Configuration dialog for chart settings
 *
 * @param {boolean} open - Whether dialog is open
 * @param {function} onClose - Callback when dialog closes
 * @param {string} chartId - Unique chart identifier for persistence
 * @param {object} defaultSettings - Default settings object
 * @param {function} onSettingsChange - Callback when settings change
 */
export const ChartSettingsDialog = ({
  open,
  onClose,
  chartId,
  defaultSettings = {},
  onSettingsChange,
}) => {
  const theme = useTheme();
  const storageKey = `chart-settings-${chartId}`;

  // Load saved settings or use defaults
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading chart settings:', error);
    }
    return {
      chartType: 'line',
      colorScheme: 'default',
      showLegend: true,
      showGrid: true,
      animated: true,
      gradient: true,
      ...defaultSettings,
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Color schemes
  const colorSchemes = [
    {
      name: 'default',
      label: 'Default',
      colors: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
      ],
    },
    {
      name: 'cool',
      label: 'Cool Blues',
      colors: ['#3B82F6', '#06B6D4', '#8B5CF6'],
    },
    {
      name: 'warm',
      label: 'Warm Colors',
      colors: ['#F59E0B', '#EF4444', '#EC4899'],
    },
    {
      name: 'nature',
      label: 'Nature',
      colors: ['#10B981', '#84CC16', '#14B8A6'],
    },
    {
      name: 'monochrome',
      label: 'Monochrome',
      colors: ['#1F2937', '#6B7280', '#9CA3AF'],
    },
  ];

  // Chart type options
  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: <ShowChart /> },
    { value: 'bar', label: 'Bar Chart', icon: <BarChart /> },
    { value: 'pie', label: 'Pie Chart', icon: <PieChart /> },
    { value: 'doughnut', label: 'Doughnut', icon: <DonutLarge /> },
  ];

  // Handle setting changes
  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save settings
  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    } catch (error) {
      console.error('Error saving chart settings:', error);
    }
  };

  // Export chart data (placeholder - would need actual chart ref)
  const handleExport = () => {
    // In a real implementation, this would use html2canvas or chart.js export
    console.log('Export chart functionality - would download as PNG');
    alert('Export functionality would download the chart as PNG using html2canvas or Chart.js toBase64Image()');
  };

  // Reset to defaults
  const handleReset = () => {
    const defaults = {
      chartType: 'line',
      colorScheme: 'default',
      showLegend: true,
      showGrid: true,
      animated: true,
      gradient: true,
      ...defaultSettings,
    };
    setSettings(defaults);
    localStorage.removeItem(storageKey);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[10],
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          Chart Settings
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 3 }}>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Settings saved successfully!
          </Alert>
        )}

        {/* Chart Type Selection */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Chart Type
          </FormLabel>
          <Grid container spacing={2}>
            {chartTypes.map(type => (
              <Grid item xs={6} key={type.value}>
                <Box
                  onClick={() => handleChange('chartType', type.value)}
                  sx={{
                    p: 2,
                    border: `2px solid ${
                      settings.chartType === type.value
                        ? theme.palette.primary.main
                        : theme.palette.divider
                    }`,
                    borderRadius: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor:
                      settings.chartType === type.value
                        ? `${theme.palette.primary.main}10`
                        : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: `${theme.palette.primary.main}05`,
                    },
                  }}
                >
                  {React.cloneElement(type.icon, {
                    sx: {
                      fontSize: 32,
                      color:
                        settings.chartType === type.value
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                    },
                  })}
                  <Typography
                    variant="body2"
                    fontWeight={settings.chartType === type.value ? 600 : 400}
                  >
                    {type.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        {/* Color Scheme Selection */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Color Scheme
          </FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {colorSchemes.map(scheme => (
              <Box
                key={scheme.name}
                onClick={() => handleChange('colorScheme', scheme.name)}
                sx={{
                  p: 2,
                  border: `2px solid ${
                    settings.colorScheme === scheme.name
                      ? theme.palette.primary.main
                      : theme.palette.divider
                  }`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor:
                    settings.colorScheme === scheme.name
                      ? `${theme.palette.primary.main}10`
                      : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}05`,
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={settings.colorScheme === scheme.name ? 600 : 400}
                >
                  {scheme.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {scheme.colors.map((color, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        backgroundColor: color,
                        border: `2px solid ${theme.palette.background.paper}`,
                        boxShadow: theme.shadows[2],
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        {/* Display Options */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Display Options
          </FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2">Show Legend</Typography>
              <Switch
                checked={settings.showLegend}
                onChange={e => handleChange('showLegend', e.target.checked)}
                color="primary"
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2">Show Grid Lines</Typography>
              <Switch
                checked={settings.showGrid}
                onChange={e => handleChange('showGrid', e.target.checked)}
                color="primary"
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2">Animated</Typography>
              <Switch
                checked={settings.animated}
                onChange={e => handleChange('animated', e.target.checked)}
                color="primary"
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2">Gradient Fill</Typography>
              <Switch
                checked={settings.gradient}
                onChange={e => handleChange('gradient', e.target.checked)}
                color="primary"
                disabled={
                  settings.chartType === 'pie' ||
                  settings.chartType === 'doughnut'
                }
              />
            </Box>
          </Box>
        </FormControl>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleReset} color="error" variant="text">
          Reset to Defaults
        </Button>
        <Button
          onClick={handleExport}
          startIcon={<DownloadIcon />}
          variant="outlined"
        >
          Export PNG
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="text">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChartSettingsDialog;
