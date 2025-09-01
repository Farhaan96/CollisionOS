import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Button,
  IconButton,
  Chip,
  Avatar,
  Badge,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  Receipt,
  Build,
  Photo,
  Description,
  AttachMoney,
  Phone,
  Email,
  LocationOn,
  Schedule,
  Warning,
  CheckCircle,
  Info,
  ExpandMore,
  Assignment,
  Business,
  Inventory,
  LocalShipping,
  Timeline,
  CallMade,
  Message,
  Print,
  Share,
  Edit,
  MoreVert,
  Refresh,
  Flag,
  Star,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Engineering,
  Group,
  Camera,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../Common/SortableItem';

/**
 * RODetail - Comprehensive Repair Order Management interface
 * Central hub for collision repair workflow
 */
const RODetail = ({ roId, onClose, onUpdate, className, ...props }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(0);
  const [roData, setRoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parts, setParts] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);

  // DnD sensors for parts workflow
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mock RO data - replace with actual API call
  const mockRoData = {
    id: 'RO-2024-001234',
    claimNumber: 'CL-789456',
    status: 'in_progress',
    priority: 'normal',
    createdAt: '2024-08-15',
    promiseDate: '2024-08-25',
    daysInShop: 8,
    slaStatus: 'at_risk', // 'on_track', 'at_risk', 'overdue'

    // Customer Information
    customer: {
      id: 'CUST-001',
      name: 'John Smith',
      phone: '(555) 123-4567',
      email: 'john.smith@email.com',
      address: '123 Main Street, Anytown, ST 12345',
      preferredContact: 'phone',
      notes: 'Prefers morning contact hours',
    },

    // Vehicle Information
    vehicle: {
      vin: 'JTNKARJE5P3001234',
      year: 2023,
      make: 'Toyota',
      model: 'Camry',
      color: 'Midnight Black',
      mileage: 15420,
      plate: 'ABC-123',
      engineType: '2.5L 4-Cylinder',
      transmission: 'Automatic CVT',
    },

    // Insurance Information
    insurance: {
      company: 'State Farm',
      adjuster: 'Sarah Wilson',
      adjusterPhone: '(555) 987-6543',
      policyNumber: 'SF-12345678',
      claimNumber: 'CL-789456',
      deductible: 500,
      coverage: 'Full Coverage',
    },

    // Financial Summary
    financial: {
      estimatedTotal: 4250.0,
      approvedAmount: 3850.0,
      invoicedAmount: 2100.0,
      paidAmount: 1500.0,
      variance: -400.0,
      supplements: [
        {
          id: 'SUPP-001',
          amount: 650.0,
          status: 'pending',
          reason: 'Additional damage found',
          submittedAt: '2024-08-18',
        },
      ],
    },

    // Production Status
    production: {
      currentStage: 'body_work',
      stageProgress: 65,
      assignedTechnicians: [
        {
          id: 'TECH-001',
          name: 'Mike Rodriguez',
          specialization: 'Body Repair',
          hoursWorked: 12.5,
          efficiency: 94,
        },
        {
          id: 'TECH-002',
          name: 'Lisa Chen',
          specialization: 'Paint',
          hoursWorked: 0,
          efficiency: 98,
        },
      ],
      laborHours: {
        estimated: 28.5,
        actual: 12.5,
        remaining: 16.0,
      },
    },
  };

  // Mock parts data with workflow states
  const mockPartsData = [
    {
      id: 'PART-001',
      partNumber: '53101-06180',
      description: 'Hood Assembly',
      quantity: 1,
      unitPrice: 450.0,
      totalPrice: 450.0,
      vendor: 'Toyota Parts Direct',
      status: 'needed',
      expectedDelivery: null,
      notes: '',
    },
    {
      id: 'PART-002',
      partNumber: '53111-06050',
      description: 'Front Bumper Cover',
      quantity: 1,
      unitPrice: 320.0,
      totalPrice: 320.0,
      vendor: 'OEM Parts Supply',
      status: 'ordered',
      expectedDelivery: '2024-08-22',
      poNumber: 'PO-2024-0156',
      notes: 'Color match required - Midnight Black',
    },
    {
      id: 'PART-003',
      partNumber: '81150-06420',
      description: 'Headlight Assembly - Left',
      quantity: 1,
      unitPrice: 285.0,
      totalPrice: 285.0,
      vendor: 'Auto Parts Warehouse',
      status: 'backordered',
      expectedDelivery: '2024-09-05',
      backorderReason: 'Manufacturing delay',
      notes: 'LED type - verify compatibility',
    },
    {
      id: 'PART-004',
      partNumber: '90942-02052',
      description: 'Gasket, Hood Seal',
      quantity: 1,
      unitPrice: 12.5,
      totalPrice: 12.5,
      vendor: 'Local Parts Store',
      status: 'received',
      receivedDate: '2024-08-19',
      notes: '',
    },
    {
      id: 'PART-005',
      partNumber: '90311-38029',
      description: 'Bolt, Bumper Mount',
      quantity: 8,
      unitPrice: 3.25,
      totalPrice: 26.0,
      vendor: 'Fastener Supply Co',
      status: 'installed',
      installedDate: '2024-08-20',
      installedBy: 'TECH-001',
      notes: 'Torque spec: 25 Nm',
    },
  ];

  // Load RO data
  useEffect(() => {
    const loadRoData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setRoData(mockRoData);
        setParts(mockPartsData);
      } catch (error) {
        console.error('Error loading RO data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoData();
  }, [roId]);

  // Parts workflow buckets
  const partsBuckets = useMemo(() => {
    const buckets = {
      needed: { title: 'Needed', items: [], color: '#f44336' },
      ordered: { title: 'Ordered', items: [], color: '#ff9800' },
      backordered: { title: 'Backordered', items: [], color: '#9c27b0' },
      received: { title: 'Received', items: [], color: '#2196f3' },
      installed: { title: 'Installed', items: [], color: '#4caf50' },
      returned: { title: 'Returned', items: [], color: '#607d8b' },
    };

    parts.forEach(part => {
      if (buckets[part.status]) {
        buckets[part.status].items.push(part);
      }
    });

    return buckets;
  }, [parts]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle part drag end
  const handlePartDragEnd = event => {
    const { active, over } = event;

    if (!over) return;

    const activePartId = active.id;
    const newStatus = over.id;

    const updatedParts = parts.map(part =>
      part.id === activePartId ? { ...part, status: newStatus } : part
    );

    setParts(updatedParts);

    // In real app, would make API call to update part status
    console.log(`Moved part ${activePartId} to ${newStatus}`);
  };

  // Handle part selection for PO creation
  const handlePartSelect = partId => {
    setSelectedParts(prev =>
      prev.includes(partId)
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  // Create PO from selected parts
  const handleCreatePO = () => {
    const selectedPartsData = parts.filter(part =>
      selectedParts.includes(part.id)
    );
    console.log('Creating PO for parts:', selectedPartsData);
    setShowCreatePO(true);
  };

  // Quick actions
  const handleQuickAction = action => {
    switch (action) {
      case 'call_customer':
        window.open(`tel:${roData.customer.phone}`);
        break;
      case 'email_customer':
        window.open(`mailto:${roData.customer.email}`);
        break;
      case 'update_priority':
        // Show priority update dialog
        console.log('Update priority');
        break;
      case 'hold_job':
        // Show hold dialog
        console.log('Hold job');
        break;
      case 'print_ro':
        window.print();
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  // Get SLA indicator color
  const getSLAColor = status => {
    switch (status) {
      case 'on_track':
        return 'success';
      case 'at_risk':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Loading Repair Order...
        </Typography>
      </Box>
    );
  }

  if (!roData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant='h6' color='error'>
          Repair Order not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={className} {...props}>
      {/* Header Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
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
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant='h5' sx={{ fontWeight: 600 }}>
              {roData.id}
            </Typography>

            <Chip
              label={`Claim: ${roData.claimNumber}`}
              variant='outlined'
              icon={<Receipt />}
              clickable
              onClick={() => console.log('View claim details')}
            />

            <Chip
              label={roData.customer.name}
              variant='outlined'
              icon={<Person />}
              clickable
              onClick={() => handleQuickAction('call_customer')}
            />

            <Chip
              label={`${roData.vehicle.year} ${roData.vehicle.make} ${roData.vehicle.model}`}
              variant='outlined'
              icon={<DirectionsCar />}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => handleQuickAction('call_customer')}>
              <Phone />
            </IconButton>
            <IconButton onClick={() => handleQuickAction('email_customer')}>
              <Email />
            </IconButton>
            <IconButton onClick={() => handleQuickAction('print_ro')}>
              <Print />
            </IconButton>
            <IconButton onClick={e => setMenuAnchor(e.currentTarget)}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Status Badges and Financial Summary */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Chip
              label={`SLA: ${roData.slaStatus.replace('_', ' ')}`}
              color={getSLAColor(roData.slaStatus)}
              size='small'
            />
            <Chip
              label={`Priority: ${roData.priority}`}
              color={
                roData.priority === 'high'
                  ? 'error'
                  : roData.priority === 'normal'
                    ? 'primary'
                    : 'default'
              }
              size='small'
            />
            <Chip
              label={`Day ${roData.daysInShop} in shop`}
              variant='outlined'
              size='small'
            />
            <Chip
              label={`Due: ${roData.promiseDate}`}
              variant='outlined'
              size='small'
              icon={<Schedule />}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant='caption' color='text.secondary'>
                Est. / Approved / Invoiced
              </Typography>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                ${roData.financial.estimatedTotal.toLocaleString()} / $
                {roData.financial.approvedAmount.toLocaleString()} / $
                {roData.financial.invoicedAmount.toLocaleString()}
              </Typography>
              {roData.financial.variance !== 0 && (
                <Typography
                  variant='body2'
                  color={
                    roData.financial.variance > 0
                      ? 'success.main'
                      : 'error.main'
                  }
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  {roData.financial.variance > 0 ? (
                    <TrendingUp fontSize='small' />
                  ) : (
                    <TrendingDown fontSize='small' />
                  )}
                  ${Math.abs(roData.financial.variance).toLocaleString()}{' '}
                  variance
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabbed Interface */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons='auto'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Build />} label='Parts' />
          <Tab icon={<Engineering />} label='Production' />
          <Tab icon={<Message />} label='Communications' />
          <Tab icon={<Photo />} label='Photos' />
          <Tab icon={<Description />} label='Documents' />
          <Tab icon={<AttachMoney />} label='Financial' />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {/* Parts Tab */}
          {activeTab === 0 && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography
                  variant='h6'
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Build />
                  Parts Workflow Management
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant='outlined'
                    size='small'
                    disabled={selectedParts.length === 0}
                    onClick={handleCreatePO}
                  >
                    Create PO ({selectedParts.length})
                  </Button>
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={() => console.log('Add part')}
                    startIcon={<Build />}
                  >
                    Add Part
                  </Button>
                </Box>
              </Box>

              {/* Parts Status Buckets */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePartDragEnd}
              >
                <Grid container spacing={2}>
                  {Object.entries(partsBuckets).map(([status, bucket]) => (
                    <Grid item xs={12} sm={6} md={4} lg={2} key={status}>
                      <Paper
                        sx={{
                          p: 2,
                          minHeight: 200,
                          backgroundColor: `${bucket.color}08`,
                          border: `2px dashed ${bucket.color}40`,
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                        >
                          <Typography
                            variant='subtitle1'
                            sx={{ fontWeight: 600, color: bucket.color }}
                          >
                            {bucket.title}
                          </Typography>
                          <Chip
                            label={bucket.items.length}
                            size='small'
                            sx={{
                              ml: 1,
                              backgroundColor: bucket.color,
                              color: 'white',
                            }}
                          />
                        </Box>

                        <SortableContext
                          items={bucket.items.map(p => p.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Box id={status} sx={{ minHeight: 150 }}>
                            {bucket.items.map(part => (
                              <SortableItem key={part.id} id={part.id}>
                                <Card
                                  sx={{
                                    mb: 1,
                                    cursor: 'move',
                                    '&:hover': { boxShadow: 2 },
                                  }}
                                >
                                  <CardContent
                                    sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1,
                                      }}
                                    >
                                      <input
                                        type='checkbox'
                                        checked={selectedParts.includes(
                                          part.id
                                        )}
                                        onChange={() =>
                                          handlePartSelect(part.id)
                                        }
                                        onClick={e => e.stopPropagation()}
                                      />
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                          variant='body2'
                                          sx={{ fontWeight: 600 }}
                                        >
                                          {part.description}
                                        </Typography>
                                        <Typography
                                          variant='caption'
                                          color='text.secondary'
                                          noWrap
                                        >
                                          {part.partNumber}
                                        </Typography>
                                        <Typography
                                          variant='caption'
                                          sx={{ display: 'block' }}
                                        >
                                          Qty: {part.quantity} • $
                                          {part.totalPrice}
                                        </Typography>
                                        {part.vendor && (
                                          <Typography
                                            variant='caption'
                                            color='text.secondary'
                                          >
                                            {part.vendor}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </SortableItem>
                            ))}
                          </Box>
                        </SortableContext>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </DndContext>
            </Box>
          )}

          {/* Production Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Production Status
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant='subtitle1' gutterBottom>
                        Current Stage:{' '}
                        {roData.production.currentStage.replace('_', ' ')}
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={roData.production.stageProgress}
                        sx={{ mb: 2, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant='body2' color='text.secondary'>
                        {roData.production.stageProgress}% Complete
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant='subtitle1' gutterBottom>
                        Labor Hours
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2'>Estimated:</Typography>
                        <Typography variant='body2'>
                          {roData.production.laborHours.estimated}h
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2'>Actual:</Typography>
                        <Typography variant='body2'>
                          {roData.production.laborHours.actual}h
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant='body2'>Remaining:</Typography>
                        <Typography variant='body2'>
                          {roData.production.laborHours.remaining}h
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Assigned Technicians */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant='subtitle1' gutterBottom>
                        Assigned Technicians
                      </Typography>
                      <List>
                        {roData.production.assignedTechnicians.map(tech => (
                          <ListItem key={tech.id}>
                            <ListItemIcon>
                              <Avatar>
                                <Engineering />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={tech.name}
                              secondary={`${tech.specialization} • ${tech.hoursWorked}h worked • ${tech.efficiency}% efficiency`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Communications Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Customer Communications
              </Typography>
              <Typography variant='body2'>
                Communication history and tools will be displayed here.
              </Typography>
            </Box>
          )}

          {/* Photos Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Damage Documentation & Progress Photos
              </Typography>
              <Typography variant='body2'>
                Photo gallery and upload functionality will be displayed here.
              </Typography>
            </Box>
          )}

          {/* Documents Tab */}
          {activeTab === 4 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Estimates, Approvals & Documents
              </Typography>
              <Typography variant='body2'>
                Document management interface will be displayed here.
              </Typography>
            </Box>
          )}

          {/* Financial Tab */}
          {activeTab === 5 && (
            <Box>
              <Typography variant='h6' gutterBottom>
                Financial Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant='subtitle1' gutterBottom>
                        Cost Breakdown
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2'>Parts:</Typography>
                        <Typography variant='body2'>$1,450.00</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2'>Labor:</Typography>
                        <Typography variant='body2'>$2,400.00</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant='body2'>Materials:</Typography>
                        <Typography variant='body2'>$400.00</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontWeight: 600,
                        }}
                      >
                        <Typography variant='body1'>Total:</Typography>
                        <Typography variant='body1'>
                          ${roData.financial.estimatedTotal.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant='subtitle1' gutterBottom>
                        Supplements
                      </Typography>
                      {roData.financial.supplements.map(supplement => (
                        <Box key={supplement.id} sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography variant='body2'>
                              {supplement.reason}
                            </Typography>
                            <Typography variant='body2'>
                              ${supplement.amount.toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant='caption' color='text.secondary'>
                            {supplement.status} • {supplement.submittedAt}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleQuickAction('update_priority')}>
          <Flag sx={{ mr: 1 }} fontSize='small' />
          Update Priority
        </MenuItem>
        <MenuItem onClick={() => handleQuickAction('hold_job')}>
          <Warning sx={{ mr: 1 }} fontSize='small' />
          Hold Job
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleQuickAction('print_ro')}>
          <Print sx={{ mr: 1 }} fontSize='small' />
          Print RO
        </MenuItem>
        <MenuItem onClick={() => handleQuickAction('share')}>
          <Share sx={{ mr: 1 }} fontSize='small' />
          Share
        </MenuItem>
      </Menu>

      {/* Create PO Dialog */}
      <Dialog
        open={showCreatePO}
        onClose={() => setShowCreatePO(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 2 }}>
            Creating PO for {selectedParts.length} selected parts
          </Typography>
          {/* PO creation form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreatePO(false)}>Cancel</Button>
          <Button variant='contained'>Create PO</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RODetail;
