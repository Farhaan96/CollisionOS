import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Alert,
  Button,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Slide,
  alpha,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  Download,
  Visibility,
  Settings,
  Analytics,
  TrendingUp,
  Speed,
  Assessment,
  DataObject,
  Timeline,
  AutoAwesome,
  Insights,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import BMSFileUpload from '../../components/Common/BMSFileUpload';
import GlassCard from '../../components/Common/GlassCard';
import ModernCard from '../../components/Common/ModernCard';
import BMSImportDashboard from '../../components/BMS/BMSImportDashboard';
import BMSImportResultsPreview from '../../components/BMS/BMSImportResultsPreview';
import BMSDataValidationUI from '../../components/BMS/BMSDataValidationUI';

const BMSImportPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [importStats, setImportStats] = useState({
    totalFiles: 0,
    successfulImports: 0,
    failedImports: 0,
    totalCustomers: 0,
    totalVehicles: 0,
    totalJobs: 0,
    totalValue: 0,
  });
  const [recentImports, setRecentImports] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    storage: 'available',
    processing: 'ready',
  });
  const [currentImportData, setCurrentImportData] = useState(null);
  const [validationResults, setValidationResults] = useState({});
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [qualityScores, setQualityScores] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const handleUploadComplete = (data, file) => {
    console.log('Upload completed:', data, file);

    // Set processing status
    setProcessingStatus('completed');

    // Update current import data for preview
    setCurrentImportData({
      customer: data.customer,
      vehicle: data.vehicle,
      job: data.job,
      documentInfo: data.documentInfo,
      claimInfo: data.claimInfo,
      damage: data.damage,
    });

    // Set validation results if available
    if (data.validation) {
      setValidationResults(data.validation);

      // Calculate quality scores based on validation results
      const scores = {
        customer: calculateSectionQualityScore(data.validation.customer),
        vehicle: calculateSectionQualityScore(data.validation.vehicle),
        job: calculateSectionQualityScore(data.validation.job),
        overall: calculateOverallQualityScore(data.validation),
      };
      setQualityScores(scores);
    }

    // Show preview for user review
    setShowPreview(true);

    // Update import statistics
    setImportStats(prev => ({
      ...prev,
      totalFiles: prev.totalFiles + 1,
      successfulImports: prev.successfulImports + 1,
      totalCustomers: prev.totalCustomers + (data.customer ? 1 : 0),
      totalVehicles: prev.totalVehicles + (data.vehicle ? 1 : 0),
      totalJobs: prev.totalJobs + (data.job ? 1 : 0),
      totalValue:
        prev.totalValue +
        (data.job?.totalAmount || data.damage?.totalAmount || 0),
    }));

    // Add to recent imports
    const importRecord = {
      id: Date.now(),
      fileName: file.name,
      timestamp: new Date(),
      customer: data.customer,
      vehicle: data.vehicle,
      job: data.job,
      status: 'success',
    };

    setRecentImports(prev => [importRecord, ...prev.slice(0, 9)]); // Keep last 10

    // Trigger a page refresh to ensure customers show up immediately
    // In a real app, you'd want to refresh specific data stores instead
    if (data.autoCreationSuccess && (data.createdCustomer || data.createdJob)) {
      setTimeout(() => {
        // Emit a custom event that customer lists can listen to
        window.dispatchEvent(
          new CustomEvent('customersUpdated', {
            detail: {
              newCustomer: data.createdCustomer,
              newJob: data.createdJob,
              source: 'bms-import',
            },
          })
        );
      }, 1000);
    }
  };

  const handleUploadError = (error, file) => {
    setImportStats(prev => ({
      ...prev,
      totalFiles: prev.totalFiles + 1,
      failedImports: prev.failedImports + 1,
    }));

    const importRecord = {
      id: Date.now(),
      fileName: file.name,
      timestamp: new Date(),
      error: error,
      status: 'error',
    };

    setRecentImports(prev => [importRecord, ...prev.slice(0, 9)]);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'connected':
      case 'available':
      case 'ready':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'disconnected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'connected':
      case 'available':
      case 'ready':
        return <CheckCircle color='success' />;
      case 'warning':
        return <Warning color='warning' />;
      case 'error':
      case 'disconnected':
        return <Error color='error' />;
      default:
        return <Info color='info' />;
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = date => {
    return new Date(date).toLocaleString();
  };

  // Helper functions for quality score calculation
  const calculateSectionQualityScore = sectionValidation => {
    if (!sectionValidation) return 100;

    const {
      errors = [],
      warnings = [],
      fieldValidations = {},
    } = sectionValidation;
    const totalIssues = errors.length + warnings.length * 0.5; // Weight warnings less than errors
    const totalFields = Object.keys(fieldValidations).length || 1;

    const score = Math.max(0, 100 - (totalIssues / totalFields) * 20);
    return Math.round(score);
  };

  const calculateOverallQualityScore = validationResults => {
    const sections = Object.values(validationResults);
    if (sections.length === 0) return 100;

    const scores = sections.map(section =>
      calculateSectionQualityScore(section)
    );
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  // Enhanced event handlers
  const handleSaveImportData = data => {
    console.log('Saving import data:', data);

    // Here you would normally save to database
    // For now, just update the recent imports and hide preview
    const importRecord = {
      id: Date.now(),
      fileName: 'imported_data.xml',
      timestamp: new Date(),
      customer: data.customer,
      vehicle: data.vehicle,
      job: data.job,
      status: 'saved',
    };

    setRecentImports(prev => [importRecord, ...prev.slice(0, 9)]);
    setShowPreview(false);
    setCurrentImportData(null);
    setProcessingStatus('idle');
  };

  const handleRejectImportData = () => {
    setShowPreview(false);
    setCurrentImportData(null);
    setProcessingStatus('idle');
    setValidationResults({});
    setQualityScores({});
  };

  const handleViewValidationDetails = (result, index) => {
    console.log('Viewing validation details:', result, index);
    setShowValidationDetails(true);
  };

  const handleFixValidationIssue = issue => {
    console.log('Fixing validation issue:', issue);
    // Implement auto-fix logic here
  };

  const handleOverrideValidation = issue => {
    console.log('Overriding validation:', issue);
    // Implement validation override logic here
  };

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
              p: 2,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <CloudUpload sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography
              variant='h3'
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              BMS File Import
            </Typography>
          </Box>

          <Typography
            variant='h6'
            color='text.secondary'
            sx={{ maxWidth: 600, mx: 'auto', opacity: 0.9 }}
          >
            Import Mitchell Estimating BMS XML files to automatically create
            customers, vehicles, and jobs with intelligent data parsing
          </Typography>

          <Stack
            direction='row'
            spacing={2}
            justifyContent='center'
            sx={{ mt: 3 }}
          >
            <Chip
              icon={<Speed />}
              label='Fast Processing'
              variant='outlined'
              sx={{
                borderColor: alpha(theme.palette.success.main, 0.3),
                color: theme.palette.success.main,
                fontWeight: 600,
              }}
            />
            <Chip
              icon={<AutoAwesome />}
              label='Auto Parse'
              variant='outlined'
              sx={{
                borderColor: alpha(theme.palette.info.main, 0.3),
                color: theme.palette.info.main,
                fontWeight: 600,
              }}
            />
            <Chip
              icon={<Assessment />}
              label='Real-time Analytics'
              variant='outlined'
              sx={{
                borderColor: alpha(theme.palette.warning.main, 0.3),
                color: theme.palette.warning.main,
                fontWeight: 600,
              }}
            />
          </Stack>
        </Box>
      </motion.div>

      {/* Enhanced System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            {
              key: 'database',
              icon: DataObject,
              label: 'Database',
              status: systemStatus.database,
            },
            {
              key: 'storage',
              icon: Analytics,
              label: 'Storage',
              status: systemStatus.storage,
            },
            {
              key: 'processing',
              icon: Speed,
              label: 'Processing',
              status: systemStatus.processing,
            },
          ].map((item, index) => (
            <Grid xs={12} md={4} key={item.key}>
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <GlassCard asMotion={false}>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <item.icon
                            sx={{
                              color: theme.palette.primary.main,
                              fontSize: 24,
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant='h6'
                            sx={{ fontWeight: 700, mb: 0.5 }}
                          >
                            {item.label}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            System Component
                          </Typography>
                        </Box>
                      </Box>

                      {getStatusIcon(item.status)}
                    </Box>

                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status)}
                      variant='filled'
                      sx={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        borderRadius: '12px',
                        px: 2,
                      }}
                    />
                  </CardContent>
                </GlassCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Enhanced Import Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='h5'
            gutterBottom
            sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}
          >
            <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
            Import Analytics Dashboard
          </Typography>

          <Grid container spacing={3}>
            {[
              {
                title: 'Total Files',
                value: importStats.totalFiles,
                icon: Description,
                color: theme.palette.primary.main,
                bgColor: alpha(theme.palette.primary.main, 0.1),
                trend: '+12%',
              },
              {
                title: 'Successful Imports',
                value: importStats.successfulImports,
                icon: CheckCircle,
                color: theme.palette.success.main,
                bgColor: alpha(theme.palette.success.main, 0.1),
                trend: '+8%',
              },
              {
                title: 'Failed Imports',
                value: importStats.failedImports,
                icon: Error,
                color: theme.palette.error.main,
                bgColor: alpha(theme.palette.error.main, 0.1),
                trend: '-3%',
              },
              {
                title: 'Total Value',
                value: formatCurrency(importStats.totalValue),
                icon: TrendingUp,
                color: theme.palette.info.main,
                bgColor: alpha(theme.palette.info.main, 0.1),
                trend: '+15%',
              },
            ].map((stat, index) => (
              <Grid xs={12} sm={6} md={3} key={stat.title}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                >
                  <ModernCard
                    variant='glass'
                    hover={true}
                    sx={{
                      background: `linear-gradient(135deg, ${stat.bgColor}, ${alpha(stat.color, 0.05)})`,
                      border: `1px solid ${alpha(stat.color, 0.2)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${stat.color}, ${alpha(stat.color, 0.5)})`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '16px',
                            background: `linear-gradient(135deg, ${stat.color}, ${alpha(stat.color, 0.8)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 8px 24px ${alpha(stat.color, 0.3)}`,
                          }}
                        >
                          <stat.icon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>

                        <Chip
                          label={stat.trend}
                          size='small'
                          sx={{
                            backgroundColor: alpha(stat.color, 0.1),
                            color: stat.color,
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        />
                      </Box>

                      <Typography
                        variant='h3'
                        sx={{
                          fontWeight: 800,
                          color: stat.color,
                          mb: 1,
                          lineHeight: 1,
                        }}
                      >
                        {typeof stat.value === 'number' && stat.value === 0
                          ? '0'
                          : stat.value}
                      </Typography>

                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontWeight: 600 }}
                      >
                        {stat.title}
                      </Typography>

                      <Box
                        sx={{
                          mt: 2,
                          height: 2,
                          borderRadius: 1,
                          background: alpha(stat.color, 0.2),
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${Math.min((stat.value || 0) * 10, 100)}%`,
                            background: stat.color,
                            borderRadius: 1,
                            animation: 'grow 1s ease-out',
                          }}
                        />
                      </Box>
                    </CardContent>
                  </ModernCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div>

      {/* Enhanced Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Grid container spacing={4}>
          {/* Enhanced Upload Section */}
          <Grid xs={12} lg={8}>
            <GlassCard asMotion={false}>
              <CardContent sx={{ p: 0 }}>
                {/* Header */}
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    >
                      <CloudUpload sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant='h5'
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        Upload BMS Files
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Import and process Mitchell Estimating BMS XML files
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Upload Component */}
                <Box sx={{ p: 3 }}>
                  <BMSFileUpload
                    onUploadComplete={handleUploadComplete}
                    onError={handleUploadError}
                  />
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Enhanced Recent Imports */}
          <Grid xs={12} lg={4}>
            <GlassCard asMotion={false}>
              <CardContent sx={{ p: 0 }}>
                {/* Header */}
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.2)}, ${alpha(theme.palette.info.main, 0.1)})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Timeline
                          sx={{ color: theme.palette.info.main, fontSize: 24 }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant='h6'
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          Recent Imports
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Latest processing activity
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={recentImports.length}
                      size='small'
                      sx={{
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>

                {/* Recent Imports List */}
                <Box sx={{ p: 3 }}>
                  {recentImports.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: alpha(theme.palette.text.secondary, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <Description
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: 32,
                          }}
                        />
                      </Box>
                      <Typography
                        variant='h6'
                        color='text.secondary'
                        gutterBottom
                      >
                        No Recent Imports
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Upload BMS files to see import history here
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {recentImports.map((importRecord, index) => (
                        <motion.div
                          key={importRecord.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Paper
                            sx={{
                              p: 2.5,
                              borderRadius: '12px',
                              background:
                                importRecord.status === 'success'
                                  ? alpha(theme.palette.success.main, 0.05)
                                  : alpha(theme.palette.error.main, 0.05),
                              border: `1px solid ${
                                importRecord.status === 'success'
                                  ? alpha(theme.palette.success.main, 0.2)
                                  : alpha(theme.palette.error.main, 0.2)
                              }`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateX(4px)',
                                boxShadow: `0 4px 12px ${alpha(
                                  importRecord.status === 'success'
                                    ? theme.palette.success.main
                                    : theme.palette.error.main,
                                  0.15
                                )}`,
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  background:
                                    importRecord.status === 'success'
                                      ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                                      : `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {importRecord.status === 'success' ? (
                                  <CheckCircle
                                    sx={{ color: 'white', fontSize: 16 }}
                                  />
                                ) : (
                                  <Error
                                    sx={{ color: 'white', fontSize: 16 }}
                                  />
                                )}
                              </Box>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant='subtitle2'
                                  sx={{ fontWeight: 600, mb: 0.5 }}
                                >
                                  {importRecord.fileName}
                                </Typography>

                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  display='block'
                                  sx={{ mb: 1 }}
                                >
                                  {formatDate(importRecord.timestamp)}
                                </Typography>

                                {importRecord.status === 'success' &&
                                  importRecord.customer && (
                                    <Typography
                                      variant='caption'
                                      sx={{
                                        color: theme.palette.success.main,
                                        fontWeight: 500,
                                        display: 'block',
                                      }}
                                    >
                                      ✓ {importRecord.customer.firstName}{' '}
                                      {importRecord.customer.lastName}
                                    </Typography>
                                  )}

                                {importRecord.status === 'error' && (
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      color: theme.palette.error.main,
                                      fontWeight: 500,
                                      display: 'block',
                                    }}
                                  >
                                    ✗ {importRecord.error}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        </motion.div>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      </motion.div>

      {/* Enhanced BMS Import Dashboard */}
      <AnimatePresence>
        {processingStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <BMSImportDashboard
              importStatus={processingStatus}
              validationResults={
                validationResults ? Object.values(validationResults) : []
              }
              qualityScores={qualityScores}
              processingStats={{
                filesProcessed: 1,
                processingTime: 2.5,
              }}
              onViewDetails={handleViewValidationDetails}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Results Preview */}
      <AnimatePresence>
        {showPreview && currentImportData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <BMSImportResultsPreview
              extractedData={currentImportData}
              validationResults={validationResults}
              onSaveData={handleSaveImportData}
              onRejectData={handleRejectImportData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Validation UI */}
      <AnimatePresence>
        {showValidationDetails &&
          validationResults &&
          Object.keys(validationResults).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <BMSDataValidationUI
                validationResults={validationResults}
                onFixIssue={handleFixValidationIssue}
                onOverrideValidation={handleOverrideValidation}
                showDetailedView={true}
                allowOverrides={true}
              />
            </motion.div>
          )}
      </AnimatePresence>

      {/* Information Section */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid xs={12} md={6}>
          <GlassCard>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                About BMS Files
              </Typography>
              <Typography variant='body2' paragraph>
                BMS (Body Management System) files are XML documents created by
                Mitchell Estimating software that contain detailed auto body
                repair estimates. These files include:
              </Typography>
              <Box component='ul' sx={{ pl: 2 }}>
                <Typography component='li' variant='body2'>
                  Customer and vehicle information
                </Typography>
                <Typography component='li' variant='body2'>
                  Detailed damage assessments
                </Typography>
                <Typography component='li' variant='body2'>
                  Parts and labor specifications
                </Typography>
                <Typography component='li' variant='body2'>
                  Pricing and totals
                </Typography>
                <Typography component='li' variant='body2'>
                  Insurance and claim details
                </Typography>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid xs={12} md={6}>
          <GlassCard>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                Import Process
              </Typography>
              <Typography variant='body2' paragraph>
                When you upload a BMS file, the system will:
              </Typography>
              <Box component='ol' sx={{ pl: 2 }}>
                <Typography component='li' variant='body2'>
                  Parse the XML structure and extract all relevant data
                </Typography>
                <Typography component='li' variant='body2'>
                  Create or update customer records
                </Typography>
                <Typography component='li' variant='body2'>
                  Create or update vehicle records
                </Typography>
                <Typography component='li' variant='body2'>
                  Create job/estimate records with all line items
                </Typography>
                <Typography component='li' variant='body2'>
                  Import parts, labor, and materials information
                </Typography>
                <Typography component='li' variant='body2'>
                  Calculate totals and apply business rules
                </Typography>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Support Information */}
      <Alert severity='info' sx={{ mt: 4 }}>
        <Typography variant='body2'>
          <strong>Need help?</strong> BMS files must be in the standard Mitchell
          Estimating XML format. If you're experiencing issues, please ensure
          your files are valid BMS XML documents and contact support if needed.
        </Typography>
      </Alert>
    </Container>
  );
};

export default BMSImportPage;
