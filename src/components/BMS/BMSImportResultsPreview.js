import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  Divider,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Preview,
  Edit,
  CheckCircle,
  Error,
  Warning,
  Save,
  Cancel,
  Person,
  DirectionsCar,
  Assignment,
  AttachMoney,
  Build,
  Category,
  ExpandMore,
  ExpandLess,
  Visibility,
  Download,
  FileUpload,
  CloudDone,
  Info,
  Settings,
  Timeline,
  DataObject
} from '@mui/icons-material';

const BMSImportResultsPreview = ({
  extractedData = {},
  validationResults = {},
  onSaveData,
  onEditData,
  onRejectData,
  showBatchSummary = false,
  batchResults = []
}) => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(extractedData);
  const [expandedSections, setExpandedSections] = useState(new Set(['customer']));
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSave, setConfirmSave] = useState(false);

  const handleEdit = (section, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedEdit = (section, subsection, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section]?.[subsection],
          [field]: value
        }
      }
    }));
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const confirmSaveData = useCallback(() => {
    onSaveData?.(editedData);
    setSaveDialogOpen(false);
    setEditMode(false);
  }, [editedData, onSaveData]);

  const getValidationIcon = (isValid, hasWarnings) => {
    if (!isValid) return <Error color="error" />;
    if (hasWarnings) return <Warning color="warning" />;
    return <CheckCircle color="success" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  const steps = [
    {
      label: 'Customer Information',
      description: 'Review and verify customer details',
      section: 'customer'
    },
    {
      label: 'Vehicle Information', 
      description: 'Review and verify vehicle details',
      section: 'vehicle'
    },
    {
      label: 'Job Information',
      description: 'Review and verify job/estimate details', 
      section: 'job'
    },
    {
      label: 'Final Review',
      description: 'Confirm all data before saving',
      section: 'summary'
    }
  ];

  const renderCustomerSection = () => (
    <Card
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box 
          sx={{ 
            p: 3, 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            cursor: 'pointer'
          }}
          onClick={() => toggleSection('customer')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Person sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Customer Information
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {editedData.customer?.name || `${editedData.customer?.firstName || ''} ${editedData.customer?.lastName || ''}`.trim() || 'No customer data'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getValidationIcon(validationResults.customer?.isValid, validationResults.customer?.hasWarnings)}
              {expandedSections.has('customer') ? <ExpandLess /> : <ExpandMore />}
            </Box>
          </Box>
        </Box>

        <Collapse in={expandedSections.has('customer')}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editedData.customer?.firstName || ''}
                  onChange={(e) => handleEdit('customer', 'firstName', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editedData.customer?.lastName || ''}
                  onChange={(e) => handleEdit('customer', 'lastName', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={editedData.customer?.phone || ''}
                  onChange={(e) => handleEdit('customer', 'phone', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editedData.customer?.email || ''}
                  onChange={(e) => handleEdit('customer', 'email', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editedData.customer?.address || ''}
                  onChange={(e) => handleEdit('customer', 'address', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={editedData.customer?.city || ''}
                  onChange={(e) => handleEdit('customer', 'city', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Province/State"
                  value={editedData.customer?.state || editedData.customer?.province || ''}
                  onChange={(e) => handleEdit('customer', 'state', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={editedData.customer?.postalCode || editedData.customer?.zipCode || ''}
                  onChange={(e) => handleEdit('customer', 'postalCode', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
            </Grid>

            {validationResults.customer && (
              <Box sx={{ mt: 2 }}>
                {validationResults.customer.errors?.length > 0 && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Validation Errors:
                    </Typography>
                    <List dense>
                      {validationResults.customer.errors.map((error, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemText primary={error.message} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
                {validationResults.customer.warnings?.length > 0 && (
                  <Alert severity="warning">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Warnings:
                    </Typography>
                    <List dense>
                      {validationResults.customer.warnings.map((warning, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemText primary={warning.message} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderVehicleSection = () => (
    <Card
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box 
          sx={{ 
            p: 3, 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            cursor: 'pointer'
          }}
          onClick={() => toggleSection('vehicle')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DirectionsCar sx={{ color: theme.palette.secondary.main, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Vehicle Information
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`${editedData.vehicle?.year || ''} ${editedData.vehicle?.make || ''} ${editedData.vehicle?.model || ''}`.trim() || 'No vehicle data'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getValidationIcon(validationResults.vehicle?.isValid, validationResults.vehicle?.hasWarnings)}
              {expandedSections.has('vehicle') ? <ExpandLess /> : <ExpandMore />}
            </Box>
          </Box>
        </Box>

        <Collapse in={expandedSections.has('vehicle')}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VIN"
                  value={editedData.vehicle?.vin || ''}
                  onChange={(e) => handleEdit('vehicle', 'vin', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1),
                      fontFamily: 'monospace'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Plate"
                  value={editedData.vehicle?.licensePlate || ''}
                  onChange={(e) => handleEdit('vehicle', 'licensePlate', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Year"
                  value={editedData.vehicle?.year || ''}
                  onChange={(e) => handleEdit('vehicle', 'year', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4.5}>
                <TextField
                  fullWidth
                  label="Make"
                  value={editedData.vehicle?.make || ''}
                  onChange={(e) => handleEdit('vehicle', 'make', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4.5}>
                <TextField
                  fullWidth
                  label="Model"
                  value={editedData.vehicle?.model || ''}
                  onChange={(e) => handleEdit('vehicle', 'model', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color"
                  value={editedData.vehicle?.color || ''}
                  onChange={(e) => handleEdit('vehicle', 'color', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mileage"
                  value={editedData.vehicle?.mileage || ''}
                  onChange={(e) => handleEdit('vehicle', 'mileage', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
            </Grid>

            {validationResults.vehicle && (
              <Box sx={{ mt: 2 }}>
                {validationResults.vehicle.errors?.length > 0 && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Validation Errors:
                    </Typography>
                    <List dense>
                      {validationResults.vehicle.errors.map((error, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemText primary={error.message} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
                {validationResults.vehicle.warnings?.length > 0 && (
                  <Alert severity="warning">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Warnings:
                    </Typography>
                    <List dense>
                      {validationResults.vehicle.warnings.map((warning, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemText primary={warning.message} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderJobSection = () => (
    <Card
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.8)})`,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box 
          sx={{ 
            p: 3, 
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            cursor: 'pointer'
          }}
          onClick={() => toggleSection('job')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)}, ${alpha(theme.palette.success.main, 0.1)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Assignment sx={{ color: theme.palette.success.main, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Job Information
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Claim: {editedData.job?.claimNumber || 'N/A'} • Total: {formatCurrency(editedData.job?.totalAmount)}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getValidationIcon(validationResults.job?.isValid, validationResults.job?.hasWarnings)}
              {expandedSections.has('job') ? <ExpandLess /> : <ExpandMore />}
            </Box>
          </Box>
        </Box>

        <Collapse in={expandedSections.has('job')}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Claim Number"
                  value={editedData.job?.claimNumber || ''}
                  onChange={(e) => handleEdit('job', 'claimNumber', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Policy Number"
                  value={editedData.job?.policyNumber || ''}
                  onChange={(e) => handleEdit('job', 'policyNumber', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance Company"
                  value={editedData.job?.insuranceCompany || ''}
                  onChange={(e) => handleEdit('job', 'insuranceCompany', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Deductible"
                  value={editedData.job?.deductible || ''}
                  onChange={(e) => handleEdit('job', 'deductible', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: editMode ? 'transparent' : alpha(theme.palette.action.selected, 0.1)
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Financial Breakdown */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Financial Breakdown
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Labor', value: editedData.job?.laborTotal, field: 'laborTotal' },
                  { label: 'Parts', value: editedData.job?.partsTotal, field: 'partsTotal' },
                  { label: 'Materials', value: editedData.job?.materialsTotal, field: 'materialsTotal' },
                  { label: 'Total Amount', value: editedData.job?.totalAmount, field: 'totalAmount' }
                ].map((item) => (
                  <Grid item xs={6} sm={3} key={item.field}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        backgroundColor: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                        {formatCurrency(item.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {validationResults.job && (
              <Box sx={{ mt: 2 }}>
                {validationResults.job.errors?.length > 0 && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Validation Errors:
                    </Typography>
                    <List dense>
                      {validationResults.job.errors.map((error, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemText primary={error.message} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
                {validationResults.job.warnings?.length > 0 && (
                  <Alert severity="warning">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Warnings:
                    </Typography>
                    <List dense>
                      {validationResults.job.warnings.map((warning, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemText primary={warning.message} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box>
        <Card
          sx={{
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            }
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
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
                    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  <Preview sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    Import Results Preview
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Review and verify extracted data before saving to database
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editMode}
                      onChange={(e) => setEditMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Edit Mode"
                  sx={{ mr: 2 }}
                />
                
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={onRejectData}
                  sx={{ borderRadius: '12px' }}
                >
                  Reject
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={!confirmSave && validationResults.errors?.length > 0}
                  sx={{
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  Save Data
                </Button>
              </Stack>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={3}>
              {[
                { 
                  label: 'Data Quality', 
                  value: `${Math.round((Object.values(validationResults).filter(v => v.isValid).length / Math.max(Object.keys(validationResults).length, 1)) * 100)}%`,
                  icon: CheckCircle,
                  color: theme.palette.success.main
                },
                { 
                  label: 'Validation Issues', 
                  value: Object.values(validationResults).reduce((sum, v) => sum + (v.errors?.length || 0) + (v.warnings?.length || 0), 0),
                  icon: Warning,
                  color: theme.palette.warning.main
                },
                { 
                  label: 'Total Amount', 
                  value: formatCurrency(editedData.job?.totalAmount),
                  icon: AttachMoney,
                  color: theme.palette.info.main
                },
                { 
                  label: 'Fields Extracted', 
                  value: Object.keys(editedData).length,
                  icon: DataObject,
                  color: theme.palette.secondary.main
                }
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={stat.label}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: alpha(stat.color, 0.05),
                      border: `1px solid ${alpha(stat.color, 0.2)}`,
                      borderRadius: '12px'
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: alpha(stat.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1
                      }}
                    >
                      <stat.icon sx={{ color: stat.color, fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Data Sections */}
      <Box>
        {renderCustomerSection()}
        {renderVehicleSection()}
        {renderJobSection()}
      </Box>

      {/* Save Confirmation Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CloudDone color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Confirm Data Save
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review the data before saving to database
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will create new customer, vehicle, and job records in your database.
          </Alert>

          {Object.values(validationResults).some(v => v.errors?.length > 0) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Some validation errors were found. Please review before saving.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={confirmSave}
                    onChange={(e) => setConfirmSave(e.target.checked)}
                    color="warning"
                  />
                }
                label="I understand and want to save anyway"
                sx={{ mt: 1 }}
              />
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSaveDialogOpen(false)} sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button 
            onClick={confirmSaveData} 
            variant="contained"
            disabled={Object.values(validationResults).some(v => v.errors?.length > 0) && !confirmSave}
            sx={{ borderRadius: '8px' }}
          >
            Save Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BMSImportResultsPreview;