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

      setRO(result.data);

      // Calculate workflow progress
      const progress = calculateWorkflowProgress(result.data);
      setWorkflowProgress(progress);

    } catch (error) {
      console.error('Failed to load RO details:', error);
      toast.error(`Failed to load repair order: ${error.message}`);
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

      const partsData = result.data || [];
      setParts(partsData);

      // Use grouped data from backend if available, otherwise group locally
      const grouped = result.grouped || partsData.reduce((acc, part) => {
        const status = part.status || 'needed';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(part);
        return acc;
      }, {});

      setPartsByStatus(grouped);

    } catch (error) {
      console.error('Failed to load parts:', error);
      toast.error(`Failed to load parts: ${error.message}`);
    }
  }, [roId]);

  useEffect(() => {
    loadRODetails();
    loadParts();
  }, [loadRODetails, loadParts]);

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
      const result = await roService.updatePartStatus(
        draggableId,
        newStatus,
        `Status changed from ${source.droppableId} to ${newStatus}`
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(`Part moved to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update part status:', error);
      toast.error(`Failed to update part status: ${error.message}`);

      // Revert optimistic update on error
      loadParts();
    }
  }, [parts, loadParts]);

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
                    {ro.customer?.first_name} {ro.customer?.last_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Customer
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{ro.customer?.phone}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{ro.customer?.email}</Typography>
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
                    {ro.vehicleProfile?.year} {ro.vehicleProfile?.make} {ro.vehicleProfile?.model}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vehicle
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>VIN:</strong> {ro.vehicleProfile?.vin}
                </Typography>
                <Typography variant="body2">
                  <strong>Color:</strong> {ro.vehicleProfile?.color}
                </Typography>
                <Typography variant="body2">
                  <strong>Plate:</strong> {ro.vehicleProfile?.license_plate}
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
    if (!ro?.claimManagement) return null;

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
                {ro.claimManagement.claim_number}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Insurance Company
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {ro.claimManagement.insuranceCompany?.name}
                {ro.claimManagement.insuranceCompany?.is_drp && (
                  <Chip label="DRP" size="small" color="success" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Policy Number
              </Typography>
              <Typography variant="body1">
                {ro.claimManagement.policy_number}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Deductible
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${ro.claimManagement.deductible_amount?.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Adjuster
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mt={1}>
                <Typography variant="body1">
                  {ro.claimManagement.adjuster_name}
                </Typography>
                {ro.claimManagement.adjuster_phone && (
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    onClick={() => window.open(`tel:${ro.claimManagement.adjuster_phone}`)}
                  >
                    {ro.claimManagement.adjuster_phone}
                  </Button>
                )}
                {ro.claimManagement.adjuster_email && (
                  <Button
                    size="small"
                    startIcon={<Email />}
                    onClick={() => window.open(`mailto:${ro.claimManagement.adjuster_email}`)}
                  >
                    Email
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Incident Description
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {ro.claimManagement.incident_description}
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
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Repair Timeline
              </Typography>
              <Alert severity="info">
                Timeline component coming soon. This will show the complete
                repair workflow history and upcoming milestones.
              </Alert>
            </Box>
          )}

          {selectedTab === 3 && (
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

          {selectedTab === 4 && (
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
    </Container>
  );
};

export default RODetailPage;