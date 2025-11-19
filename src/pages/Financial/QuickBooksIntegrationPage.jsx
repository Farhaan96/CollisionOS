import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  useTheme,
} from '@mui/material';
import {
  AccountBalance,
  CheckCircle,
  Warning,
  Link as LinkIcon,
  LinkOff,
} from '@mui/icons-material';
import axios from 'axios';

/**
 * QuickBooksIntegrationPage - QuickBooks OAuth setup and sync management
 */
const QuickBooksIntegrationPage = () => {
  const theme = useTheme();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/quickbooks/status');
      if (response.data.success) {
        setConnection(response.data.connection || (response.data.connected ? {
          companyInfo: response.data.companyInfo,
          lastSyncAt: response.data.lastSync,
        } : null));
      }
    } catch (err) {
      console.error('Error loading QuickBooks status:', err);
      // Connection might not exist, that's okay
      setConnection(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/quickbooks/connect');
      if (response.data.success) {
        // Redirect to QuickBooks OAuth page
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      console.error('Error connecting QuickBooks:', err);
      setError(err.response?.data?.error || 'Failed to connect QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect QuickBooks?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/quickbooks/disconnect');
      if (response.data.success) {
        setSuccess('QuickBooks disconnected successfully');
        setTimeout(() => setSuccess(null), 3000);
        setConnection(null);
      }
    } catch (err) {
      console.error('Error disconnecting QuickBooks:', err);
      setError(err.response?.data?.error || 'Failed to disconnect QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncInvoices = async () => {
    try {
      setSyncing(true);
      const response = await axios.post('/api/quickbooks/sync/invoices');
      if (response.data.success) {
        setSuccess(`Synced ${response.data.synced || 0} invoices to QuickBooks`);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Error syncing invoices:', err);
      setError(err.response?.data?.error || 'Failed to sync invoices');
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !connection) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
          QuickBooks Integration
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Connect and sync your accounting data with QuickBooks Online
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Connection Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  QuickBooks Online
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {connection ? 'Connected' : 'Not Connected'}
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={connection ? <CheckCircle /> : <Warning />}
              label={connection ? 'Connected' : 'Not Connected'}
              color={connection ? 'success' : 'default'}
            />
          </Box>

          {connection ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Company Name
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 600 }}>
                    {connection.companyInfo?.CompanyName || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body2' color='text.secondary'>
                    Last Sync
                  </Typography>
                  <Typography variant='body1'>
                    {connection.lastSyncAt
                      ? new Date(connection.lastSyncAt).toLocaleString()
                      : 'Never'}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant='outlined'
                  startIcon={<LinkOff />}
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  Disconnect
                </Button>
                <Button
                  variant='contained'
                  onClick={handleSyncInvoices}
                  disabled={syncing}
                  startIcon={syncing ? <CircularProgress size={20} /> : <LinkIcon />}
                >
                  {syncing ? 'Syncing...' : 'Sync Invoices'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Connect your QuickBooks Online account to automatically sync invoices, payments, and
                customer data.
              </Typography>
              <Button
                variant='contained'
                startIcon={<LinkIcon />}
                onClick={handleConnect}
                disabled={loading}
              >
                Connect QuickBooks
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync Information */}
      {connection && (
        <Card>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
              Sync Settings
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              QuickBooks integration will automatically sync:
            </Typography>
            <Box component='ul' sx={{ pl: 3 }}>
              <li>
                <Typography variant='body2'>Invoices (when generated)</Typography>
              </li>
              <li>
                <Typography variant='body2'>Payments (when recorded)</Typography>
              </li>
              <li>
                <Typography variant='body2'>Customer data (on creation/update)</Typography>
              </li>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default QuickBooksIntegrationPage;

