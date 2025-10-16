import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Paper,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  useTheme,
  Alert,
  Skeleton,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepIcon,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Assignment,
  DirectionsCar,
  Person,
  Phone,
  Email,
  AccessTime,
  AttachMoney,
  Warning,
  CheckCircle,
  Schedule,
  Build,
  LocalShipping,
  Visibility,
  Edit,
  Print,
  Share,
  Add,
  Remove,
  ShoppingCart,
  Search,
  ExpandMore,
  PhotoCamera,
  Description,
  Timeline as TimelineIcon,
  BusinessCenter,
  LocalPhone,
  EmailOutlined,
  LocationOn,
  CalendarToday,
  Speed,
  Receipt,
  Inventory,
  Construction,
  CheckBox,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import roService from '../../services/roService';
import { toast } from 'react-hot-toast';
import POCreationDialog from '../../components/PurchaseOrder/POCreationDialog';
import SignatureModal from '../../components/Signature/SignatureModal';
import SignatureDisplay from '../../components/Signature/SignatureDisplay';
import signatureService from '../../services/signatureService';

/**
 * RODetailPage - Complete collision repair workflow interface
 *
 * Features:
 * - RO header with claim/customer/vehicle chips
 * - Parts status buckets with drag-and-drop workflow
 * - Multi-select PO creation
 * - Timeline and progress tracking
 * - Insurance information management
 * - Customer communication tools
 * - Photo and document management
 * - Workflow status updates
 */
const RODetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { roId } = useParams();

  const [ro, setRO] = useState(null);
  const [parts, setParts] = useState([]);
  const [partsByStatus, setPartsByStatus] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedParts, setSelectedParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPODialog, setShowPODialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureFieldName, setSignatureFieldName] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [shopId] = useState('550e8400-e29b-41d4-a716-446655440000'); // TODO: Get from auth context

  // Parts workflow statuses
  const partsStatuses = [
    { id: 'needed', label: 'Needed', color: 'error', icon: RadioButtonUnchecked },
    { id: 'sourcing', label: 'Sourcing', color: 'warning', icon: Search },
    { id: 'ordered', label: 'Ordered', color: 'info', icon: ShoppingCart },
    { id: 'backordered', label: 'Backordered', color: 'secondary', icon: Schedule },
    { id: 'received', label: 'Received', color: 'primary', icon: LocalShipping },
    { id: 'installed', label: 'Installed', color: 'success', icon: CheckBox },
  ];

  // Load RO details
  const loadRODetails = useCallback(async () => {
    if (!roId) return;

    setIsLoading(true);
    try {
      const result = await roService.getRepairOrder(roId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Map backend response with comprehensive field mapping
      const roData = {
        // Core RO fields
        id: result.data.id,
        ro_number: result.data.ro_number,
        roNumber: result.data.ro_number, // Alias for compatibility
        status: result.data.status,
        priority: result.data.priority,
        ro_type: result.data.ro_type || 'insurance',
        roType: result.data.ro_type || 'insurance',
        total_amount: result.data.total_amount || 0,
        totalAmount: result.data.total_amount || 0,
        opened_at: result.data.opened_at,
        openedAt: result.data.opened_at,
        delivered_at: result.data.delivered_at,
        deliveredAt: result.data.delivered_at,
        estimated_completion_date: result.data.estimated_completion_date,
        estimatedCompletionDate: result.data.estimated_completion_date,
        drop_off_date: result.data.drop_off_date,
        dropOffDate: result.data.drop_off_date,
        created_at: result.data.created_at,
        createdAt: result.data.created_at,

        // Customer data (normalized from snake_case backend)
        customer: result.data.customers || result.data.customer || null,

        // Vehicle data (normalized from snake_case backend)
        vehicleProfile: result.data.vehicles || result.data.vehicleProfile || null,

        // Claim data (normalized from snake_case backend)
        claimManagement: result.data.claims || result.data.claimManagement || null,
      };

      setRO(roData);

      // Calculate workflow progress
      const progress = calculateWorkflowProgress(roData);
      setWorkflowProgress(progress);

    } catch (error) {
      console.error('Failed to load RO details:', error);
      toast.error(`Failed to load repair order: ${error.message}`);

      // Set error state to prevent infinite loading
      setRO(null);
    } finally {
      setIsLoading(false);
    }
  }, [roId]);

  // Load parts data
  const loadParts = useCallback(async () => {
    if (!roId) return;

    try {
      const result = await roService.getROParts(roId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Map part fields from snake_case to camelCase with proper fallbacks
      const partsData = (result.data || []).map(part => ({
        id: part.id,
        description: part.description || part.part_description || 'Unknown Part',
        part_description: part.description || part.part_description,
        part_number: part.part_number || part.partNumber || '',
        partNumber: part.part_number || part.partNumber,
        quantity: part.quantity_ordered || part.quantity || 1,
        quantity_ordered: part.quantity_ordered || part.quantity || 1,
        quantityOrdered: part.quantity_ordered || part.quantity || 1,
        quantity_received: part.quantity_received || 0,
        quantityReceived: part.quantity_received || 0,
        unit_cost: parseFloat(part.unit_cost || part.unitCost || 0),
        unitCost: parseFloat(part.unit_cost || part.unitCost || 0),
        extended_price: part.extended_price || part.extendedPrice || (parseFloat(part.unit_cost || 0) * (part.quantity_ordered || 1)),
        extendedPrice: part.extended_price || part.extendedPrice || (parseFloat(part.unit_cost || 0) * (part.quantity_ordered || 1)),
        status: part.status || 'needed',
        operation: part.operation || '',
        vendor_id: part.vendor_id || part.vendorId || null,
        vendorId: part.vendor_id || part.vendorId || null,
        po_id: part.po_id || part.poId || null,
        poId: part.po_id || part.poId || null,
        vendor: part.vendor || null,
        po: part.po || null,
      }));

      setParts(partsData);

      // Use grouped data from backend if available, otherwise group locally
      let grouped;
      if (result.grouped_by_status) {
        // Backend already grouped - map to camelCase
        grouped = Object.keys(result.grouped_by_status).reduce((acc, status) => {
          acc[status] = result.grouped_by_status[status].map(part => ({
            id: part.id,
            description: part.description || part.part_description || 'Unknown Part',
            part_description: part.description || part.part_description,
            part_number: part.part_number || part.partNumber || '',
            quantity_ordered: part.quantity_ordered || part.quantity || 1,
            unit_cost: parseFloat(part.unit_cost || part.unitCost || 0),
            status: part.status || 'needed',
            operation: part.operation || '',
            vendor: part.vendor || null,
          }));
          return acc;
        }, {});
      } else {
        // Group locally
        grouped = partsData.reduce((acc, part) => {
          const status = part.status || 'needed';
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(part);
          return acc;
        }, {});
      }

      setPartsByStatus(grouped);

    } catch (error) {
      console.error('Failed to load parts:', error);
      toast.error(`Failed to load parts: ${error.message}`);

      // Set empty state on error
      setParts([]);
      setPartsByStatus({});
    }
  }, [roId]);

  // Load signatures
  const loadSignatures = useCallback(async () => {
    if (!roId) return;

    try {
      const result = await signatureService.getRepairOrderSignatures(roId, true);
      if (result.success) {
        setSignatures(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load signatures:', error);
    }
  }, [roId]);

  useEffect(() => {
    loadRODetails();
    loadParts();
    loadSignatures();
  }, [loadRODetails, loadParts, loadSignatures]);

  // Calculate workflow progress
  const calculateWorkflowProgress = (roData) => {
    if (!roData) return 0;

    const statusWeights = {
      estimate: 20,
      in_progress: 50,
      parts_pending: 30,
      completed: 90,
      delivered: 100,
    };

    return statusWeights[roData.status] || 0;
  };

  // Handle drag and drop for parts workflow
  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const part = parts.find(p => p.id === draggableId);

    if (!part) return;

    // Store original state for rollback on error
    const originalParts = [...parts];
    const originalGrouped = { ...partsByStatus };

    // Optimistically update UI
    const updatedParts = parts.map(p => {
      if (p.id === draggableId) {
        return { ...p, status: newStatus };
      }
      return p;
    });

    setParts(updatedParts);

    // Regroup parts by status
    const grouped = updatedParts.reduce((acc, part) => {
      if (!acc[part.status]) {
        acc[part.status] = [];
      }
      acc[part.status].push(part);
      return acc;
    }, {});

    setPartsByStatus(grouped);

    // Update backend
    try {
      const updateResult = await roService.updatePartStatus(
        draggableId,
        newStatus,
        `Status changed from ${source.droppableId} to ${newStatus}`
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update part status');
      }

      // Show success message with readable status name
      const statusLabel = partsStatuses.find(s => s.id === newStatus)?.label || newStatus;
      toast.success(`Part moved to ${statusLabel}`);
    } catch (error) {
      console.error('Failed to update part status:', error);
      toast.error(`Failed to update part status: ${error.message}`);

      // Rollback optimistic update
      setParts(originalParts);
      setPartsByStatus(originalGrouped);
    }
  }, [parts, partsByStatus, partsStatuses]);

  // Handle part selection for PO creation
  const handlePartSelect = useCallback((partId) => {
    setSelectedParts(prev => {
      if (prev.includes(partId)) {
        return prev.filter(id => id !== partId);
      } else {
        return [...prev, partId];
      }
    });
  }, []);

  // Handle PO creation success
  const handlePOCreated = useCallback((poData) => {
    // Refresh parts data to reflect the new PO assignments
    loadParts();

    // Clear selected parts
    setSelectedParts([]);

    // Show success message already handled in dialog
    toast.success(`Purchase order created successfully!`);
  }, [loadParts]);

  // Handle signature capture
  const handleRequestSignature = (fieldName) => {
    setSignatureFieldName(fieldName);
    setShowSignatureDialog(true);
  };

  // Handle signature save
  const handleSignatureSave = async (signatureData) => {
    try {
      await signatureService.createRepairOrderSignature({
        roId: roId,
        fieldName: signatureFieldName,
        signatureData: signatureData.signatureData,
        width: signatureData.width,
        height: signatureData.height,
        signedBy: signatureData.signedBy,
        signerRole: signatureData.signerRole,
        signerEmail: signatureData.signerEmail,
        signerPhone: signatureData.signerPhone,
        shopId: shopId,
        customerId: ro?.customer?.id || null,
        consentText: signatureData.consentText,
        signatureNotes: signatureData.signatureNotes,
      });

      toast.success('Signature saved successfully!');
      loadSignatures();
      setShowSignatureDialog(false);
    } catch (error) {
      console.error('Failed to save signature:', error);
      toast.error('Failed to save signature');
      throw error;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusInfo = partsStatuses.find(s => s.id === status);
    return statusInfo ? statusInfo.color : 'default';
  };

  // Render RO header with chips
  const renderROHeader = () => {
    if (!ro) return <Skeleton variant="rectangular" height={200} />;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* RO Info */}
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {ro.ro_number}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Repair Order
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  label={ro.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(ro.status)}
                  size="small"
                />
                <Chip
                  label={ro.priority.toUpperCase()}
                  color={ro.priority === 'urgent' ? 'error' : 'default'}
                  size="small"
                />
                <Chip
                  label={ro.ro_type.toUpperCase()}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Grid>

            {/* Customer Info */}
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="medium">
                    {ro.customer?.first_name || ''} {ro.customer?.last_name || ''}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Customer
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{ro.customer?.phone || 'N/A'}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{ro.customer?.email || 'N/A'}</Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Vehicle Info */}
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <DirectionsCar />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="medium">
                    {ro.vehicleProfile?.year || ''} {ro.vehicleProfile?.make || ''} {ro.vehicleProfile?.model || ''}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vehicle
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>VIN:</strong> {ro.vehicleProfile?.vin || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Color:</strong> {ro.vehicleProfile?.color || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Plate:</strong> {ro.vehicleProfile?.license_plate || 'N/A'}
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          {/* Progress Bar */}
          <Box mt={3}>
            <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight="medium">
                Workflow Progress
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {workflowProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={workflowProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Action Buttons */}
          <Box mt={3} display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/ro/${roId}/edit`)}
            >
              Edit RO
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<Phone />}
              onClick={() => window.open(`tel:${ro.customer?.phone}`)}
            >
              Call Customer
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setShowPhotoDialog(true)}
            >
              Photos
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render parts status bucket
  const renderPartsStatusBucket = (statusId, statusLabel, statusColor, statusIcon) => {
    const StatusIcon = statusIcon;
    const bucketParts = partsByStatus[statusId] || [];

    return (
      <Droppable droppableId={statusId} key={statusId}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 300,
              backgroundColor: snapshot.isDraggingOver ?
                theme.palette.action.hover :
                'transparent',
              border: snapshot.isDraggingOver ?
                `2px dashed ${theme.palette.primary.main}` :
                `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: theme.palette[statusColor].main }}>
                  <StatusIcon />
                </Avatar>
              }
              title={
                <Badge badgeContent={bucketParts.length} color={statusColor}>
                  {statusLabel}
                </Badge>
              }
              action={
                statusId === 'needed' && (
                  <IconButton size="small" onClick={() => {}}>
                    <Add />
                  </IconButton>
                )
              }
            />
            <CardContent>
              <Stack spacing={1}>
                {bucketParts.map((part, index) => (
                  <Draggable key={part.id} draggableId={part.id} index={index}>
                    {(provided, snapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          p: 2,
                          backgroundColor: snapshot.isDragging ?
                            theme.palette.action.selected :
                            'transparent',
                          border: selectedParts.includes(part.id) ?
                            `2px solid ${theme.palette.primary.main}` :
                            `1px solid ${theme.palette.divider}`,
                          cursor: 'pointer',
                        }}
                        onClick={() => handlePartSelect(part.id)}
                      >
                        <Typography variant="subtitle2" fontWeight="medium">
                          {part.description}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {part.part_number}
                        </Typography>
                        <Box display="flex" justifyContent="between" alignItems="center" mt={1}>
                          <Typography variant="body2">
                            Qty: {part.quantity_ordered}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            ${part.unit_cost.toFixed(2)}
                          </Typography>
                        </Box>
                        {part.operation && (
                          <Chip
                            label={part.operation}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Droppable>
    );
  };

  // Render parts workflow buckets
  const renderPartsWorkflow = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Grid container spacing={2}>
        {partsStatuses.map((status) => (
          <Grid item xs={12} md={6} lg={2} key={status.id}>
            {renderPartsStatusBucket(status.id, status.label, status.color, status.icon)}
          </Grid>
        ))}
      </Grid>
    </DragDropContext>
  );

  // Render claim information
  const renderClaimInfo = () => {
    if (!ro?.claimManagement) return (
      <Alert severity="info">No claim information associated with this repair order.</Alert>
    );

    const claim = ro.claimManagement;
    const insurance = claim.insurance_companies || claim.insuranceCompany || null;

    return (
      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
              <Description />
            </Avatar>
          }
          title="Insurance Claim Information"
          action={
            <Button size="small" startIcon={<Edit />}>
              Edit
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Claim Number
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {claim.claim_number}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Insurance Company
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {insurance?.name || 'N/A'}
                {insurance?.is_drp && (
                  <Chip label="DRP" size="small" color="success" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Policy Number
              </Typography>
              <Typography variant="body1">
                {claim.policy_number || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Deductible
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${parseFloat(claim.deductible || claim.deductible_amount || 0).toFixed(2)}
              </Typography>
            </Grid>
            {claim.adjuster_name && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Adjuster
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={1}>
                  <Typography variant="body1">
                    {claim.adjuster_name}
                  </Typography>
                  {claim.adjuster_phone && (
                    <Button
                      size="small"
                      startIcon={<Phone />}
                      onClick={() => window.open(`tel:${claim.adjuster_phone}`)}
                    >
                      {claim.adjuster_phone}
                    </Button>
                  )}
                  {claim.adjuster_email && (
                    <Button
                      size="small"
                      startIcon={<Email />}
                      onClick={() => window.open(`mailto:${claim.adjuster_email}`)}
                    >
                      Email
                    </Button>
                  )}
                </Box>
              </Grid>
            )}
            {claim.incident_description && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Incident Description
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {claim.incident_description}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Claim Status
              </Typography>
              <Chip
                label={(claim.claim_status || 'open').toUpperCase()}
                size="small"
                color={claim.claim_status === 'approved' ? 'success' : claim.claim_status === 'denied' ? 'error' : 'warning'}
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Coverage Type
              </Typography>
              <Typography variant="body1">
                {claim.coverage_type || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} md={6} lg={2} key={i}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      {renderROHeader()}

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Parts Workflow" />
          <Tab label="Claim Info" />
          <Tab label="Signatures" />
          <Tab label="Timeline" />
          <Tab label="Photos" />
          <Tab label="Documents" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {selectedTab === 0 && (
            <Box>
              <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="medium">
                  Parts Workflow - Drag to Update Status
                </Typography>
                <Box display="flex" gap={1}>
                  {selectedParts.length > 0 && (
                    <Button
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => setShowPODialog(true)}
                    >
                      Create PO ({selectedParts.length} parts)
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {}}
                  >
                    Add Part
                  </Button>
                </Box>
              </Box>
              {renderPartsWorkflow()}
            </Box>
          )}

          {selectedTab === 1 && renderClaimInfo()}

          {selectedTab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="medium">
                  Digital Signatures
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => handleRequestSignature('Customer Authorization')}
                  >
                    Request Customer Signature
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleRequestSignature('Work Authorization')}
                  >
                    Work Authorization
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleRequestSignature('Delivery Receipt')}
                  >
                    Delivery Receipt
                  </Button>
                </Stack>
              </Box>

              {signatures.length === 0 ? (
                <Alert severity="info">
                  No signatures have been captured yet. Use the buttons above to request a signature.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {signatures.map((signature) => (
                    <Grid item xs={12} md={6} key={signature.id}>
                      <SignatureDisplay
                        signature={signature}
                        showDetails={true}
                        allowZoom={true}
                        variant="detailed"
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Repair Timeline
              </Typography>
              <Alert severity="info">
                Timeline component coming soon. This will show the complete
                repair workflow history and upcoming milestones.
              </Alert>
            </Box>
          )}

          {selectedTab === 4 && (
            <Box>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Photos & Media
              </Typography>
              <Alert severity="info">
                Photo management component coming soon. This will include
                damage photos, progress photos, and before/after comparisons.
              </Alert>
            </Box>
          )}

          {selectedTab === 5 && (
            <Box>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Documents
              </Typography>
              <Alert severity="info">
                Document management component coming soon. This will include
                estimates, invoices, insurance correspondence, and receipts.
              </Alert>
            </Box>
          )}
        </Box>
      </Paper>

      {/* PO Creation Dialog */}
      <POCreationDialog
        open={showPODialog}
        onClose={() => setShowPODialog(false)}
        selectedParts={selectedParts.map(partId => parts.find(p => p.id === partId)).filter(Boolean)}
        roNumber={ro?.ro_number}
        shopId={shopId}
        onPOCreated={handlePOCreated}
      />

      {/* Signature Capture Dialog */}
      <SignatureModal
        open={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        onSave={handleSignatureSave}
        title={`${signatureFieldName} - ${ro?.ro_number || 'Repair Order'}`}
        fieldName={signatureFieldName}
        defaultSignerName={ro?.customer ? `${ro.customer.first_name} ${ro.customer.last_name}` : ''}
        defaultSignerEmail={ro?.customer?.email || ''}
        defaultSignerPhone={ro?.customer?.phone || ''}
        defaultSignerRole="customer"
        requireEmail={false}
        requirePhone={false}
        consentText={
          signatureFieldName === 'Work Authorization'
            ? 'I authorize the repair work as outlined in the estimate and agree to pay the total amount due.'
            : signatureFieldName === 'Delivery Receipt'
            ? 'I acknowledge receipt of my vehicle and certify that all work has been completed to my satisfaction.'
            : 'I acknowledge and agree to the terms outlined in this document.'
        }
      />
    </Container>
  );
};

export default RODetailPage;