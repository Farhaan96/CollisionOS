import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Grid,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  CloudQueue,
  CheckCircle,
  Error,
  Warning,
  Sync,
  CloudOff,
  CloudDone,
  Storage,
  Smartphone,
  DataUsage,
  AttachMoney,
} from '@mui/icons-material';
import { syncService } from '../../services/syncService';

const CloudSyncSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [config, setConfig] = useState({
    enabled: false,
    features: {
      bmsIngestion: false,
      mobileSync: false,
      multiLocation: false,
      fileBackup: false,
      realtimeUpdates: false,
    },
  });

  const [credentials, setCredentials] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: '',
  });

  const [status, setStatus] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [connectionTest, setConnectionTest] = useState(null);

  useEffect(() => {
    loadConfig();
    loadStatus();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await syncService.getConfig();

      if (response.success) {
        setConfig(response.data.config);
        setCostBreakdown(response.data.costBreakdown);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await syncService.getStatus();

      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleToggleSync = async (event) => {
    const enabled = event.target.checked;

    try {
      setSaving(true);

      if (enabled) {
        // Test connection first
        const testResult = await syncService.testConnection();

        if (!testResult.success) {
          alert('Connection test failed. Please check your Supabase credentials.');
          return;
        }

        await syncService.enable();
      } else {
        await syncService.disable();
      }

      setConfig(prev => ({ ...prev, enabled }));
      await loadStatus();
    } catch (error) {
      console.error('Error toggling sync:', error);
      alert(`Failed to ${enabled ? 'enable' : 'disable'} sync: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = async (feature) => {
    const newFeatures = {
      ...config.features,
      [feature]: !config.features[feature],
    };

    try {
      setSaving(true);

      const response = await syncService.updateConfig({
        features: newFeatures,
      });

      if (response.success) {
        setConfig(response.data);

        // Recalculate cost
        const costResponse = await syncService.getCostEstimate(newFeatures);
        if (costResponse.success) {
          setCostBreakdown(costResponse.data);
        }
      }
    } catch (error) {
      console.error('Error updating feature:', error);
      alert(`Failed to update feature: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await syncService.testConnection();

      setConnectionTest({
        success: response.success,
        message: response.message || (response.success ? 'Connection successful!' : 'Connection failed'),
        timestamp: new Date(),
      });
    } catch (error) {
      setConnectionTest({
        success: false,
        message: `Connection error: ${error.message}`,
        timestamp: new Date(),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const response = await syncService.triggerSync();

      alert(`Sync completed! Processed ${response.data.totalProcessed} operations.`);
      await loadStatus();
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      setSaving(true);

      // Update environment variables (requires backend support)
      // For now, show instructions
      alert('Please update your .env file with the Supabase credentials and restart the application.');
    } catch (error) {
      console.error('Error saving credentials:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const features = [
    {
      key: 'bmsIngestion',
      label: 'BMS Ingestion',
      description: 'Process BMS XML files via Supabase Edge Functions',
      icon: <DataUsage />,
      cost: 10,
    },
    {
      key: 'mobileSync',
      label: 'Mobile Sync',
      description: 'Synchronize data with mobile apps (technician & customer)',
      icon: <Smartphone />,
      cost: 15,
    },
    {
      key: 'multiLocation',
      label: 'Multi-Location',
      description: 'Support multiple shop locations with centralized data',
      icon: <Storage />,
      cost: 20,
    },
    {
      key: 'fileBackup',
      label: 'File Backup',
      description: 'Automatic backup of photos and documents to cloud storage',
      icon: <CloudQueue />,
      cost: 25,
    },
    {
      key: 'realtimeUpdates',
      label: 'Real-time Updates',
      description: 'WebSocket-based real-time data synchronization',
      icon: <Sync />,
      cost: 30,
    },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Cloud Sync Settings
      </Typography>

      {/* Master Toggle */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">
              {config.enabled ? (
                <>
                  <CloudDone sx={{ verticalAlign: 'middle', mr: 1, color: 'success.main' }} />
                  Cloud Sync Enabled (Hybrid Mode)
                </>
              ) : (
                <>
                  <CloudOff sx={{ verticalAlign: 'middle', mr: 1, color: 'text.disabled' }} />
                  Local-Only Mode
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {config.enabled
                ? 'Data is synchronized between local SQLite and Supabase cloud'
                : 'All data is stored locally in SQLite only'}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={config.enabled}
                onChange={handleToggleSync}
                disabled={saving}
              />
            }
            label={config.enabled ? 'Enabled' : 'Disabled'}
          />
        </Box>

        {status && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Pending Operations
                </Typography>
                <Typography variant="h6">
                  {status.pendingOperations || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Last Sync
                </Typography>
                <Typography variant="body1">
                  {status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Never'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Queue Size
                </Typography>
                <Typography variant="h6">
                  {status.queue?.queueSize || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<Sync />}
                  onClick={handleTriggerSync}
                  disabled={!config.enabled || syncing}
                  fullWidth
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Connection Test */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection Test
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="contained"
            onClick={handleTestConnection}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : <Sync />}
          >
            Test Supabase Connection
          </Button>

          {connectionTest && (
            <Alert
              severity={connectionTest.success ? 'success' : 'error'}
              icon={connectionTest.success ? <CheckCircle /> : <Error />}
            >
              {connectionTest.message}
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Feature Toggles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cloud Features
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enable specific cloud features. Each feature has an associated monthly cost.
        </Typography>

        <List>
          {features.map((feature) => (
            <ListItem
              key={feature.key}
              secondaryAction={
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.features[feature.key]}
                      onChange={() => handleToggleFeature(feature.key)}
                      disabled={!config.enabled || saving}
                    />
                  }
                  label=""
                />
              }
            >
              <ListItemIcon>{feature.icon}</ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {feature.label}
                    <Chip
                      label={`$${feature.cost}/mo`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={feature.description}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Cost Breakdown */}
      {costBreakdown && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <AttachMoney sx={{ verticalAlign: 'middle', mr: 1 }} />
            Estimated Monthly Cost
          </Typography>

          <Box sx={{ mb: 2 }}>
            {Object.entries(costBreakdown.features).map(([feature, cost]) => (
              <Box key={feature} display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {features.find(f => f.key === feature)?.label}
                </Typography>
                <Typography variant="body2">${cost}/month</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Total Estimated Cost</Typography>
            <Typography variant="h6" color="primary.main">
              ${costBreakdown.total}/month
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Supabase Free Tier includes up to 500MB database, 1GB file storage, and 2GB bandwidth.
            Costs above are estimates for additional usage.
          </Alert>
        </Paper>
      )}

      {/* Supabase Credentials */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supabase Credentials
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Configure your Supabase project credentials. Get these from{' '}
          <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">
            app.supabase.com
          </a>
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Supabase URL"
              value={credentials.supabaseUrl}
              onChange={(e) => setCredentials(prev => ({ ...prev, supabaseUrl: e.target.value }))}
              placeholder="https://your-project.supabase.co"
              helperText="Your Supabase project URL"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Anon Key"
              value={credentials.supabaseAnonKey}
              onChange={(e) => setCredentials(prev => ({ ...prev, supabaseAnonKey: e.target.value }))}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              helperText="Public anon key (safe to expose in frontend)"
              type="password"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Service Role Key"
              value={credentials.supabaseServiceKey}
              onChange={(e) => setCredentials(prev => ({ ...prev, supabaseServiceKey: e.target.value }))}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              helperText="Secret service role key (keep secure, server-side only)"
              type="password"
            />
          </Grid>
        </Grid>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Security Notice:</strong> Credentials must be set in your .env file on the server.
          This UI is for display only. Never commit credentials to version control.
        </Alert>

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={handleSaveCredentials} disabled>
            Save Credentials (Update .env file manually)
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CloudSyncSettings;
