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
  useTheme,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Assignment,
  DirectionsCar,
  Person,
  Phone,
  Email,
  AttachMoney,
  CheckCircle,
  LocalShipping,
  Visibility,
  Edit,
  Print,
  Add,
  ShoppingCart,
  RadioButtonUnchecked,
  Search,
  Schedule,
  CheckBox,
  PhotoCamera,
  Description,
  TimelineIcon,
  ArrowBack,
  Home,
  NavigateNext,
  BusinessCenter,
  EmailOutlined,
  LocalPhone,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  KPICard,
  StatusBadge,
  InfoCard,
  ProgressBar,
  TimelineStep,
} from '../../components/ui';
import roService from '../../services/roService';
import { toast } from 'react-hot-toast';
import POCreationDialog from '../../components/PurchaseOrder/POCreationDialog';
import SignatureModal from '../../components/Signature/SignatureModal';
import SignatureDisplay from '../../components/Signature/SignatureDisplay';
import signatureService from '../../services/signatureService';

/**
 * RODetailPage (Redesigned) - Beautiful, comprehensive RO detail interface
 *
 * Features:
 * - Gradient header with key info
 * - Timeline sidebar for repair progress
 * - InfoCard components for structured data
 * - Enhanced parts workflow with StatusBadge
 * - Activity timeline tab
 * - Beautiful styling throughout
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
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureFieldName, setSignatureFieldName] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [shopId] = useState('550e8400-e29b-41d4-a716-446655440000');

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

      const roData = {
        id: result.data.id,
        ro_number: result.data.ro_number,
        status: result.data.status,
        priority: result.data.priority,
        ro_type: result.data.ro_type || 'insurance',
        total_amount: result.data.total_amount || 0,
        opened_at: result.data.opened_at,
        delivered_at: result.data.delivered_at,
        estimated_completion_date: result.data.estimated_completion_date,
        drop_off_date: result.data.drop_off_date,
        created_at: result.data.created_at,
        // Clean field mappings - backend now returns singular names
        customer: result.data.customer || null,
        vehicleProfile: result.data.vehicle || null,
        claimManagement: result.data.claim || null,
      };

      setRO(roData);
    } catch (error) {
      console.error('Failed to load RO details:', error);
      toast.error(`Failed to load repair order: ${error.message}`);
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

      const partsData = (result.data || []).map(part => ({
        id: part.id,
        description: part.description || part.part_description || 'Unknown Part',
        part_number: part.part_number || part.partNumber || '',
        quantity: part.quantity_ordered || part.quantity || 1,
        unit_cost: parseFloat(part.unit_cost || part.unitCost || 0),
        status: part.status || 'needed',
        operation: part.operation || '',
        vendor: part.vendor || null,
        po: part.po || null,
      }));

      setParts(partsData);

      // Group by status
      const grouped = partsData.reduce((acc, part) => {
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
  const workflowProgress = useMemo(() => {
    if (!ro) return 0;

    const statusWeights = {
      estimate: 20,
      in_progress: 50,
      parts_pending: 30,
      completed: 90,
      delivered: 100,
    };

    return statusWeights[ro.status] || 0;
  }, [ro]);

  // Get workflow timeline steps
  const timelineSteps = useMemo(() => {
    if (!ro) return [];

    const steps = [
      {
        title: 'Repair Order Created',
        status: 'completed',
        date: ro.opened_at ? new Date(ro.opened_at).toLocaleString() : null,
        user: 'System',
      },
      {
        title: 'Estimate Provided',
        status: ro.status === 'estimate' ? 'current' : (ro.total_amount > 0 ? 'completed' : 'upcoming'),
        date: ro.created_at ? new Date(ro.created_at).toLocaleString() : null,
      },
      {
        title: 'Repair in Progress',
        status: ro.status === 'in_progress' ? 'current' : (ro.status === 'completed' || ro.status === 'delivered' ? 'completed' : 'upcoming'),
      },
      {
        title: 'Quality Control',
        status: ro.status === 'completed' && !ro.delivered_at ? 'current' : (ro.delivered_at ? 'completed' : 'upcoming'),
      },
      {
        title: 'Delivered to Customer',
        status: ro.status === 'delivered' ? 'completed' : (ro.delivered_at ? 'completed' : 'upcoming'),
        date: ro.delivered_at ? new Date(ro.delivered_at).toLocaleString() : null,
      },
    ];

    return steps;
  }, [ro]);

  // Handle drag and drop for parts
  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const part = parts.find(p => p.id === draggableId);

    if (!part) return;

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

      const statusLabel = partsStatuses.find(s => s.id === newStatus)?.label || newStatus;
      toast.success(`Part moved to ${statusLabel}`);
    } catch (error) {
      console.error('Failed to update part status:', error);
      toast.error(`Failed to update part status: ${error.message}`);
      setParts(originalParts);
      setPartsByStatus(originalGrouped);
    }
  }, [parts, partsByStatus, partsStatuses]);

  // Handle part selection
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
    loadParts();
    setSelectedParts([]);
    toast.success(`Purchase order created successfully!`);
  }, [loadParts]);

  // Handle signature save
  const handleRequestSignature = (fieldName) => {
    setSignatureFieldName(fieldName);
    setShowSignatureDialog(true);
  };

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
                `${theme.palette[statusColor].main}10` :
                'transparent',
              border: snapshot.isDraggingOver ?
                `2px dashed ${theme.palette[statusColor].main}` :
                `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              transition: 'all 0.2s ease',
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: theme.palette[statusColor].main }}>
                  <StatusIcon />
                </Avatar>
              }
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {statusLabel}
                  </Typography>
                  <Chip
                    label={bucketParts.length}
                    size="small"
                    sx={{
                      height: 20,
                      backgroundColor: `${theme.palette[statusColor].main}20`,
                      color: theme.palette[statusColor].main,
                      fontWeight: 700,
                    }}
                  />
                </Box>
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
                            theme.palette.background.paper,
                          border: selectedParts.includes(part.id) ?
                            `2px solid ${theme.palette.primary.main}` :
                            `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: theme.shadows[4],
                          },
                        }}
                        onClick={() => handlePartSelect(part.id)}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          {part.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {part.part_number}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="body2">
                            Qty: {part.quantity}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="primary">
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

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} md={6} lg={2} key={i}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!ro) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">Repair order not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        sx={{ mb: 2 }}
      >
        <Link
          underline="hover"
          color="inherit"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/ro"
          onClick={(e) => { e.preventDefault(); navigate('/ro'); }}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Assignment sx={{ mr: 0.5 }} fontSize="small" />
          Repair Orders
        </Link>
        <Typography color="text.primary">
          {ro.ro_number}
        </Typography>
      </Breadcrumbs>

      {/* Back Button & Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton
          onClick={() => navigate('/ro')}
          sx={{
            backgroundColor: theme.palette.action.hover,
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box flex={1}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5,
            }}
          >
            {ro.ro_number}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="body1" color="text.secondary">
              {ro.vehicleProfile ? `${ro.vehicleProfile.year} ${ro.vehicleProfile.make} ${ro.vehicleProfile.model}` : 'Vehicle'} •
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {ro.customer ? `${ro.customer.first_name} ${ro.customer.last_name}` : 'Customer'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/ro/${roId}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<Phone />}
            onClick={() => window.open(`tel:${ro.customer?.phone}`)}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Call Customer
          </Button>
        </Box>
      </Box>

      {/* Status & Progress Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <StatusBadge status={ro.status} size="large" variant="pill" />
                {ro.priority && ro.priority !== 'normal' && (
                  <Chip
                    label={ro.priority.toUpperCase()}
                    color={ro.priority === 'urgent' ? 'error' : 'warning'}
                    size="small"
                  />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <ProgressBar
                value={workflowProgress}
                label="Workflow Progress"
                color="auto"
                size="large"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 2,
          }}
        >
          <Tab label="Overview" />
          <Tab label={`Parts (${parts.length})`} />
          <Tab label="Timeline" />
          <Tab label={`Signatures (${signatures.length})`} />
          <Tab label="Documents" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Overview */}
          {selectedTab === 0 && (
            <Grid container spacing={3}>
              {/* Left Column - Timeline */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Repair Progress
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Stack spacing={2}>
                    {timelineSteps.map((step, index) => (
                      <TimelineStep
                        key={index}
                        title={step.title}
                        status={step.status}
                        date={step.date}
                        user={step.user}
                        note={step.note}
                        isLast={index === timelineSteps.length - 1}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* Right Column - Info Cards */}
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  {/* Customer Card */}
                  <InfoCard
                    title="Customer Information"
                    icon={<Person />}
                    iconColor={theme.palette.success.main}
                    onEdit={() => navigate(`/customers/${ro.customer?.id}/edit`)}
                    items={[
                      {
                        label: 'Name',
                        value: ro.customer ? `${ro.customer.first_name} ${ro.customer.last_name}` : 'N/A',
                      },
                      {
                        label: 'Phone',
                        value: ro.customer?.phone || 'N/A',
                        icon: <LocalPhone />,
                        href: ro.customer?.phone ? `tel:${ro.customer.phone}` : null,
                      },
                      {
                        label: 'Email',
                        value: ro.customer?.email || 'N/A',
                        icon: <EmailOutlined />,
                        href: ro.customer?.email ? `mailto:${ro.customer.email}` : null,
                      },
                    ]}
                    variant="elevated"
                  />

                  {/* Vehicle Card */}
                  <InfoCard
                    title="Vehicle Information"
                    icon={<DirectionsCar />}
                    iconColor={theme.palette.info.main}
                    items={[
                      {
                        label: 'Vehicle',
                        value: ro.vehicleProfile ? `${ro.vehicleProfile.year} ${ro.vehicleProfile.make} ${ro.vehicleProfile.model}` : 'N/A',
                      },
                      {
                        label: 'VIN',
                        value: ro.vehicleProfile?.vin || 'N/A',
                      },
                      {
                        label: 'Color',
                        value: ro.vehicleProfile?.color || 'N/A',
                      },
                      {
                        label: 'License Plate',
                        value: ro.vehicleProfile?.license_plate || 'N/A',
                      },
                    ]}
                    variant="elevated"
                  />

                  {/* Insurance/Claim Card */}
                  {ro.claimManagement && (
                    <InfoCard
                      title="Insurance & Claim"
                      icon={<BusinessCenter />}
                      iconColor={theme.palette.warning.main}
                      items={[
                        {
                          label: 'Claim Number',
                          value: ro.claimManagement.claim_number || 'N/A',
                        },
                        {
                          label: 'Insurance Company',
                          value: ro.claimManagement.insurance_companies?.name || 'N/A',
                        },
                        {
                          label: 'Deductible',
                          value: `$${parseFloat(ro.claimManagement.deductible || 0).toFixed(2)}`,
                        },
                        {
                          label: 'Adjuster',
                          value: ro.claimManagement.adjuster_name || 'N/A',
                        },
                      ]}
                      variant="elevated"
                    />
                  )}

                  {/* Financial Summary Card */}
                  <InfoCard
                    title="Financial Summary"
                    icon={<AttachMoney />}
                    iconColor={theme.palette.success.dark}
                    items={[
                      {
                        label: 'Total Amount',
                        value: `$${ro.total_amount?.toLocaleString() || '0.00'}`,
                      },
                      {
                        label: 'Parts Cost',
                        value: `$${parts.reduce((sum, p) => sum + (p.unit_cost * p.quantity), 0).toFixed(2)}`,
                      },
                      {
                        label: 'Balance Due',
                        value: `$${ro.total_amount?.toLocaleString() || '0.00'}`,
                      },
                    ]}
                    variant="elevated"
                  />
                </Stack>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Parts Workflow */}
          {selectedTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
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
              <DragDropContext onDragEnd={handleDragEnd}>
                <Grid container spacing={2}>
                  {partsStatuses.map((status) => (
                    <Grid item xs={12} md={6} lg={2} key={status.id}>
                      {renderPartsStatusBucket(status.id, status.label, status.color, status.icon)}
                    </Grid>
                  ))}
                </Grid>
              </DragDropContext>
            </Box>
          )}

          {/* Tab 2: Timeline Activity Feed */}
          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Activity Timeline
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Complete activity feed coming soon. This will show all actions, status changes, notes, and communications.
              </Alert>
            </Box>
          )}

          {/* Tab 3: Signatures */}
          {selectedTab === 3 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Digital Signatures
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => handleRequestSignature('Customer Authorization')}
                  >
                    Customer Signature
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

          {/* Tab 4: Documents */}
          {selectedTab === 4 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Documents & Media
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Document management coming soon. This will include estimates, invoices, photos, and correspondence.
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
