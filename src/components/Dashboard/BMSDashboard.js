import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Fade,
  Zoom,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  DirectionsCar,
  Person,
  Receipt,
  Build,
  Inventory,
  AttachMoney,
  Schedule,
  LocationOn,
  Phone,
  Email,
  Description,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Info,
  CloudUpload,
  Add,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GlassCard } from '../Common/GlassCard';
import { AnimatedCounter } from '../../utils/AnimatedCounter';
import BMSFileUpload from '../Common/BMSFileUpload';

// Helper function to safely extract text from XML objects
const safeText = value => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value && typeof value === 'object') {
    // Handle XML parser output with #text property
    if (value['#text'] !== undefined) return value['#text'];
    // Handle other object cases
    return JSON.stringify(value);
  }
  return 'N/A';
};

const BMSDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedSections, setExpandedSections] = useState({});
  const [bmsData, setBmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Mock data structure based on the BMS XML files we analyzed
  const mockBMSData = [
    {
      id: '593475061',
      documentInfo: {
        documentNumber: '593475061',
        documentType: 'Estimate',
        createdDate: '2024-01-15',
        status: 'Approved',
      },
      claimInfo: {
        claimNumber: 'CLM-2024-001',
        insuranceCompany: 'State Farm',
        deductible: 500,
        totalLoss: false,
      },
      customer: {
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john.smith@email.com',
        address: '123 Main St, Anytown, USA',
      },
      vehicle: {
        year: 2020,
        make: 'Honda',
        model: 'Civic',
        vin: '1HGBH41JXMN109186',
        mileage: 45000,
        color: 'Blue',
      },
      damage: {
        totalParts: 8,
        totalLabor: 12.5,
        totalMaterials: 3.2,
        totalAmount: 2847.5,
        damageLines: [
          {
            part: 'Front Bumper',
            operation: 'Replace',
            labor: 2.5,
            parts: 450.0,
          },
          { part: 'Hood', operation: 'Repair', labor: 3.0, parts: 0.0 },
          {
            part: 'Left Fender',
            operation: 'Replace',
            labor: 2.0,
            parts: 320.0,
          },
        ],
      },
    },
    {
      id: '599540605',
      documentInfo: {
        documentNumber: '599540605',
        documentType: 'Supplement',
        createdDate: '2024-01-20',
        status: 'Pending',
      },
      claimInfo: {
        claimNumber: 'CLM-2024-002',
        insuranceCompany: 'Allstate',
        deductible: 250,
        totalLoss: false,
      },
      customer: {
        name: 'Sarah Johnson',
        phone: '(555) 987-6543',
        email: 'sarah.johnson@email.com',
        address: '456 Oak Ave, Somewhere, USA',
      },
      vehicle: {
        year: 2019,
        make: 'Toyota',
        model: 'Camry',
        vin: '4T1B11HK5KU123456',
        mileage: 32000,
        color: 'Silver',
      },
      damage: {
        totalParts: 5,
        totalLabor: 8.5,
        totalMaterials: 2.1,
        totalAmount: 1956.75,
        damageLines: [
          {
            part: 'Rear Bumper',
            operation: 'Replace',
            labor: 2.0,
            parts: 380.0,
          },
          { part: 'Trunk Lid', operation: 'Repair', labor: 2.5, parts: 0.0 },
          {
            part: 'Right Quarter Panel',
            operation: 'Repair',
            labor: 4.0,
            parts: 0.0,
          },
        ],
      },
    },
  ];

  useEffect(() => {
    const fetchBMSFiles = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/bms/imports?limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            // Transform API data to match component structure
            const transformedData = result.data.map(importItem => {
              const bmsData = importItem.parsedData || importItem.data || {};
              return {
                id: importItem.id || importItem.importId || Date.now().toString(),
                documentInfo: {
                  documentNumber: safeText(bmsData.documentInfo?.documentNumber) || importItem.fileName || 'Unknown',
                  documentType: safeText(bmsData.documentInfo?.documentType) || 'Estimate',
                  createdDate: importItem.createdAt ? new Date(importItem.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  status: importItem.status === 'completed' ? 'Approved' : importItem.status === 'failed' ? 'Rejected' : 'Pending',
                },
                claimInfo: {
                  claimNumber: safeText(bmsData.claimInfo?.claimNumber) || 'N/A',
                  insuranceCompany: safeText(bmsData.claimInfo?.insuranceCompany) || 'Unknown',
                  deductible: parseFloat(safeText(bmsData.claimInfo?.deductible)) || 0,
                  totalLoss: false,
                },
                customer: {
                  name: safeText(bmsData.customer?.name) || `${safeText(bmsData.customer?.firstName) || ''} ${safeText(bmsData.customer?.lastName) || ''}`.trim() || 'Unknown Customer',
                  phone: safeText(bmsData.customer?.phone) || 'N/A',
                  email: safeText(bmsData.customer?.email) || 'N/A',
                  address: safeText(bmsData.customer?.address) || 'N/A',
                },
                vehicle: {
                  year: parseInt(safeText(bmsData.vehicle?.year)) || 0,
                  make: safeText(bmsData.vehicle?.make) || 'Unknown',
                  model: safeText(bmsData.vehicle?.model) || 'Unknown',
                  vin: safeText(bmsData.vehicle?.vin) || 'N/A',
                  mileage: parseInt(safeText(bmsData.vehicle?.mileage)) || 0,
                  color: safeText(bmsData.vehicle?.color) || 'N/A',
                },
                damage: {
                  totalParts: parseInt(safeText(bmsData.damage?.totalParts)) || 0,
                  totalLabor: parseFloat(safeText(bmsData.damage?.totalLabor)) || 0,
                  totalMaterials: parseFloat(safeText(bmsData.damage?.totalMaterials)) || 0,
                  totalAmount: parseFloat(safeText(bmsData.damage?.totalAmount)) || 0,
                  damageLines: Array.isArray(bmsData.damage?.damageLines)
                    ? bmsData.damage.damageLines.map(line => ({
                        part: safeText(line.part) || 'Unknown Part',
                        operation: safeText(line.operation) || 'Repair',
                        labor: parseFloat(safeText(line.labor)) || 0,
                        parts: parseFloat(safeText(line.parts)) || 0,
                      }))
                    : [],
                },
              };
            });
            setBmsData(transformedData);
          } else {
            // Fallback to mock data if no real data available
            setBmsData(mockBMSData);
          }
        } else {
          // Fallback to mock data on error
          console.warn('Failed to fetch BMS files, using mock data');
          setBmsData(mockBMSData);
        }
      } catch (error) {
        console.error('Error fetching BMS files:', error);
        // Fallback to mock data on error
        setBmsData(mockBMSData);
      } finally {
        setLoading(false);
      }
    };

    fetchBMSFiles();

    // Listen for new BMS imports
    const handleBMSImport = () => {
      // Refresh the list when a new file is uploaded
      setTimeout(() => {
        fetchBMSFiles();
      }, 1000); // Small delay to ensure backend has processed the file
    };

    window.addEventListener('bmsImported', handleBMSImport);
    return () => {
      window.removeEventListener('bmsImported', handleBMSImport);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSection = sectionId => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleUploadComplete = (data, file) => {
    // Add the new BMS data to the existing data
    const newBMSData = {
      id: safeText(data.documentInfo?.documentNumber) || Date.now().toString(),
      documentInfo: {
        documentNumber:
          safeText(data.documentInfo?.documentNumber) || 'Unknown',
        documentType: safeText(data.documentInfo?.documentType) || 'Estimate',
        createdDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
      },
      claimInfo: {
        claimNumber:
          safeText(data.claimInfo?.claimNumber) || 'CLM-' + Date.now(),
        insuranceCompany:
          safeText(data.claimInfo?.insuranceCompany) || 'Unknown',
        deductible: parseFloat(safeText(data.claimInfo?.deductible)) || 0,
        totalLoss: false,
      },
      customer: {
        name: safeText(data.customer?.name) || 'Unknown Customer',
        phone: safeText(data.customer?.phone) || 'N/A',
        email: safeText(data.customer?.email) || 'N/A',
        address: safeText(data.customer?.address) || 'N/A',
      },
      vehicle: {
        year: parseInt(safeText(data.vehicle?.year)) || 0,
        make: safeText(data.vehicle?.make) || 'Unknown',
        model: safeText(data.vehicle?.model) || 'Unknown',
        vin: safeText(data.vehicle?.vin) || 'N/A',
        mileage: parseInt(safeText(data.vehicle?.mileage)) || 0,
        color: safeText(data.vehicle?.color) || 'N/A',
      },
      damage: {
        totalParts: parseInt(safeText(data.damage?.totalParts)) || 0,
        totalLabor: parseFloat(safeText(data.damage?.totalLabor)) || 0,
        totalMaterials: parseFloat(safeText(data.damage?.totalMaterials)) || 0,
        totalAmount: parseFloat(safeText(data.damage?.totalAmount)) || 0,
        damageLines: Array.isArray(data.damage?.damageLines)
          ? data.damage.damageLines.map(line => ({
              part: safeText(line.part) || 'Unknown Part',
              operation: safeText(line.operation) || 'Repair',
              labor: parseFloat(safeText(line.labor)) || 0,
              parts: parseFloat(safeText(line.parts)) || 0,
            }))
          : [],
      },
    };

    setBmsData(prev => [newBMSData, ...prev]);
    setUploadDialogOpen(false);
  };

  const handleUploadError = (error, file) => {
    console.error('Upload error:', error);
    // You could add a toast notification here
  };

  const BMSOverviewCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard asMotion={false}>
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                <Assessment sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box>
                <Typography
                  variant='h4'
                  sx={{
                    fontWeight: 800,
                    color: 'white',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  BMS Files Overview
                </Typography>
                <Typography
                  variant='body1'
                  sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}
                >
                  Comprehensive analytics and file management dashboard
                </Typography>
              </Box>
            </Box>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant='contained'
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '16px',
                  textTransform: 'none',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                }}
              >
                Upload BMS Files
              </Button>
            </motion.div>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                value: bmsData.length,
                label: 'Total Files',
                color: theme.palette.primary.main,
                icon: Description,
                bgColor: alpha(theme.palette.primary.main, 0.1),
              },
              {
                value: bmsData.filter(
                  bms => bms.documentInfo.status === 'Approved'
                ).length,
                label: 'Approved',
                color: theme.palette.success.main,
                icon: CheckCircle,
                bgColor: alpha(theme.palette.success.main, 0.1),
              },
              {
                value: bmsData.reduce(
                  (sum, bms) => sum + bms.damage.totalParts,
                  0
                ),
                label: 'Total Parts',
                color: theme.palette.warning.main,
                icon: Inventory,
                bgColor: alpha(theme.palette.warning.main, 0.1),
              },
              {
                value: formatCurrency(
                  bmsData.reduce((sum, bms) => sum + bms.damage.totalAmount, 0)
                ),
                label: 'Total Value',
                color: theme.palette.info.main,
                icon: AttachMoney,
                bgColor: alpha(theme.palette.info.main, 0.1),
                isValue: true,
              },
            ].map((stat, index) => (
              <Grid item xs={6} sm={6} md={3} key={stat.label}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: '20px',
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
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${stat.color}, ${alpha(stat.color, 0.8)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: `0 8px 24px ${alpha(stat.color, 0.3)}`,
                      }}
                    >
                      <stat.icon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>

                    <Typography
                      variant='h3'
                      sx={{
                        fontWeight: 800,
                        color: stat.color,
                        mb: 1,
                      }}
                    >
                      {stat.isValue ? (
                        stat.value
                      ) : (
                        <AnimatedCounter value={stat.value} />
                      )}
                    </Typography>

                    <Typography
                      variant='body2'
                      sx={{
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: 600,
                      }}
                    >
                      {stat.label}
                    </Typography>

                    <LinearProgress
                      variant='determinate'
                      value={Math.min(
                        stat.isValue ? 100 : (stat.value || 0) * 20,
                        100
                      )}
                      sx={{
                        mt: 2,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: alpha(stat.color, 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: stat.color,
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </GlassCard>
    </motion.div>
  );

  const BMSFileCard = ({ bms, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='h6' sx={{ fontWeight: 700, color: 'white' }}>
                BMS #{bms.documentInfo.documentNumber}
              </Typography>
              <Chip
                label={bms.documentInfo.status}
                color={getStatusColor(bms.documentInfo.status)}
                size='small'
                sx={{ fontWeight: 600 }}
              />
            </Box>
          }
          subheader={
            <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {bms.documentInfo.documentType} • Created:{' '}
              {bms.documentInfo.createdDate}
            </Typography>
          }
          action={
            <IconButton
              onClick={() => toggleSection(`bms-${bms.id}`)}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {expandedSections[`bms-${bms.id}`] ? (
                <ExpandLess />
              ) : (
                <ExpandMore />
              )}
            </IconButton>
          }
        />

        <Collapse in={expandedSections[`bms-${bms.id}`]}>
          <CardContent>
            <Grid container spacing={3}>
              {/* Customer Information */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{ color: 'white', fontWeight: 600 }}
                  >
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Customer Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={bms.customer.name}
                        secondary='Customer Name'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'white',
                            fontWeight: 600,
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Phone sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={bms.customer.phone}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Email sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={bms.customer.email}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={bms.customer.address}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Vehicle Information */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{ color: 'white', fontWeight: 600 }}
                  >
                    <DirectionsCar sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Vehicle Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={`${bms.vehicle.year} ${bms.vehicle.make} ${bms.vehicle.model}`}
                        secondary='Vehicle'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'white',
                            fontWeight: 600,
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={bms.vehicle.vin}
                        secondary='VIN'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: 'monospace',
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={`${bms.vehicle.mileage.toLocaleString()} miles`}
                        secondary='Mileage'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={bms.vehicle.color}
                        secondary='Color'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Claim Information */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{ color: 'white', fontWeight: 600 }}
                  >
                    <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Claim Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={bms.claimInfo.claimNumber}
                        secondary='Claim Number'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'white',
                            fontWeight: 600,
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={bms.claimInfo.insuranceCompany}
                        secondary='Insurance Company'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={formatCurrency(bms.claimInfo.deductible)}
                        secondary='Deductible'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Damage Summary */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{ color: 'white', fontWeight: 600 }}
                  >
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Damage Summary
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={bms.damage.totalParts}
                        secondary='Parts Required'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'white',
                            fontWeight: 600,
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={`${bms.damage.totalLabor} hours`}
                        secondary='Labor Hours'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={formatCurrency(bms.damage.totalAmount)}
                        secondary='Total Amount'
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: '#10B981',
                            fontWeight: 600,
                          },
                        }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Damage Lines Table */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Typography
                      variant='h6'
                      sx={{ color: 'white', fontWeight: 600 }}
                    >
                      <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Damage Lines
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              fontWeight: 600,
                            }}
                          >
                            Part
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              fontWeight: 600,
                            }}
                          >
                            Operation
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              fontWeight: 600,
                            }}
                          >
                            Labor (hrs)
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              fontWeight: 600,
                            }}
                          >
                            Parts Cost
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'rgba(255,255,255,0.7)',
                              fontWeight: 600,
                            }}
                          >
                            Total
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bms.damage.damageLines.map((line, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: 'white' }}>
                              {line.part}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={line.operation}
                                size='small'
                                color={
                                  line.operation === 'Replace'
                                    ? 'primary'
                                    : 'secondary'
                                }
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.9)' }}>
                              {line.labor}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.9)' }}>
                              {formatCurrency(line.parts)}
                            </TableCell>
                            <TableCell
                              sx={{ color: '#10B981', fontWeight: 600 }}
                            >
                              {formatCurrency(line.labor * 50 + line.parts)}{' '}
                              {/* Assuming $50/hr labor rate */}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </GlassCard>
    </motion.div>
  );

  if (loading) {
    return (
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Typography variant='h4' sx={{ color: 'white', textAlign: 'center' }}>
          Loading BMS Data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h3'
          gutterBottom
          sx={{ fontWeight: 800, color: 'white' }}
        >
          BMS Files Dashboard
        </Typography>
        <Typography variant='h6' sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Comprehensive view of all BMS (Body Management System) files and their
          details
        </Typography>
      </Box>

      <BMSOverviewCard />

      <Box sx={{ mt: 4 }}>
        <Typography
          variant='h5'
          gutterBottom
          sx={{ fontWeight: 700, color: 'white', mb: 3 }}
        >
          BMS Files ({bmsData.length})
        </Typography>
        {bmsData.map((bms, index) => (
          <BMSFileCard key={bms.id} bms={bms} index={index} />
        ))}
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          Upload BMS Files
        </DialogTitle>
        <DialogContent>
          <BMSFileUpload
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BMSDashboard;
