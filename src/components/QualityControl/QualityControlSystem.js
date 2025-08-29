import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Tooltip,
  Badge,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Assignment,
  PhotoCamera,
  VideoCall,
  Build,
  Settings,
  QrCode,
  Flag,
  Star,
  ThumbUp,
  Comment,
  Visibility,
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Print,
  Share,
  Download,
  Upload,
  Refresh,
  ExpandMore,
  DirectionsCar,
  Speed,
  Timeline,
  Assessment,
  Security,
  VerifiedUser,
  BugReport,
  Tune,
  Straighten,
  Palette,
  CleaningServices,
  ElectricalServices,
  BuildCircle,
  Engineering,
  Precision,
  Scanner
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { formatCurrency, formatDate } from '../../utils/formatters';

// QC Inspection categories based on Instructions document
const QC_CATEGORIES = {
  structural: {
    title: 'Structural Integrity',
    icon: BuildCircle,
    color: '#d32f2f',
    checkpoints: [
      'Frame alignment verified',
      'Weld quality inspection',
      'Structural adhesive application',
      'Dimensional accuracy check',
      'Safety cage integrity',
      'Mounting points inspection'
    ]
  },
  body: {
    title: 'Body Panel Quality',
    icon: DirectionsCar,
    color: '#1976d2',
    checkpoints: [
      'Panel gap uniformity',
      'Surface finish quality',
      'Alignment accuracy',
      'Door fit and function',
      'Hood/trunk alignment',
      'Trim attachment'
    ]
  },
  paint: {
    title: 'Paint & Finish',
    icon: Palette,
    color: '#7b1fa2',
    checkpoints: [
      'Color match verification',
      'Texture consistency',
      'Coverage completeness',
      'Defect inspection',
      'Clear coat application',
      'Blend line quality'
    ]
  },
  mechanical: {
    title: 'Mechanical Systems',
    icon: Engineering,
    color: '#f57c00',
    checkpoints: [
      'Component functionality',
      'Fastener torque specs',
      'Fluid levels check',
      'Belt/hose inspection',
      'Brake system test',
      'Suspension operation'
    ]
  },
  electrical: {
    title: 'Electrical Systems',
    icon: ElectricalServices,
    color: '#388e3c',
    checkpoints: [
      'Lighting operation',
      'Electronic module function',
      'Wiring harness integrity',
      'Connector security',
      'Battery/charging system',
      'Warning light status'
    ]
  },
  adas: {
    title: 'ADAS Calibration',
    icon: Tune,
    color: '#5d4037',
    checkpoints: [
      'Camera alignment',
      'Radar calibration',
      'Sensor positioning',
      'System functionality',
      'Error code clearance',
      'Road test validation'
    ]
  },
  interior: {
    title: 'Interior Systems',
    icon: Security,
    color: '#455a64',
    checkpoints: [
      'Seat operation',
      'Climate control function',
      'Infotainment system',
      'Interior lighting',
      'Window operation',
      'Door lock function'
    ]
  },
  final: {
    title: 'Final Inspection',
    icon: VerifiedUser,
    color: '#2e7d32',
    checkpoints: [
      'Overall appearance',
      'Cleanliness standard',
      'Customer items returned',
      'Documentation complete',
      'Warranty information',
      'Customer walkthrough prep'
    ]
  }
};

// QC Standards and criteria
const QC_STANDARDS = {
  panel_gaps: { min: 3, max: 6, unit: 'mm', tolerance: 0.5 },
  paint_thickness: { min: 80, max: 200, unit: 'microns', tolerance: 10 },
  color_match: { deltaE: 1.5, tolerance: 0.3 },
  surface_roughness: { max: 0.8, unit: 'Ra', tolerance: 0.1 }
};

// QC Issue severity levels
const SEVERITY_LEVELS = {
  critical: { label: 'Critical', color: '#d32f2f', icon: Error, priority: 1 },
  major: { label: 'Major', color: '#f57c00', icon: Warning, priority: 2 },
  minor: { label: 'Minor', color: '#1976d2', icon: Flag, priority: 3 },
  cosmetic: { label: 'Cosmetic', color: '#388e3c', icon: Visibility, priority: 4 }
};

const QualityControlSystem = ({ jobId, onQCUpdate }) => {
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState(0);
  const [inspections, setInspections] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [inspectionDialog, setInspectionDialog] = useState(false);
  const [issueDialog, setIssueDialog] = useState(false);
  const [calibrationDialog, setCalibrationDialog] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    category: '',
    severity: '',
    status: '',
    technician: ''
  });

  // Sample QC data
  const sampleInspections = [
    {
      id: '1',
      jobId: 'JOB-2024-001',
      jobNumber: 'JOB-001',
      customer: 'John Smith',
      vehicle: { year: 2022, make: 'Toyota', model: 'Camry' },
      category: 'paint',
      status: 'completed',
      inspector: 'Mike Johnson',
      scheduledDate: '2024-01-16',
      completedDate: '2024-01-16',
      score: 95,
      issues: 1,
      photos: 8,
      notes: 'Excellent paint quality overall. Minor buffing needed on rear panel.'
    },
    {
      id: '2',
      jobId: 'JOB-2024-002',
      jobNumber: 'JOB-002',
      customer: 'Sarah Wilson',
      vehicle: { year: 2021, make: 'Honda', model: 'Civic' },
      category: 'structural',
      status: 'in_progress',
      inspector: 'Dave Rodriguez',
      scheduledDate: '2024-01-17',
      completedDate: null,
      score: null,
      issues: 0,
      photos: 12,
      notes: null
    }
  ];

  const sampleIssues = [
    {
      id: '1',
      inspectionId: '1',
      jobId: 'JOB-2024-001',
      category: 'paint',
      severity: 'minor',
      title: 'Slight texture variation',
      description: 'Minor orange peel effect on rear quarter panel',
      location: 'Rear Quarter Panel - Driver Side',
      status: 'open',
      discoveredBy: 'Mike Johnson',
      discoveredDate: '2024-01-16',
      assignedTo: 'Tom Parker',
      estimatedRepairTime: 1.5,
      photos: ['qc_issue_1_1.jpg', 'qc_issue_1_2.jpg'],
      resolution: null
    }
  ];

  useEffect(() => {
    setInspections(sampleInspections);
    setIssues(sampleIssues);
  }, []);

  // QC Dashboard component
  const QCDashboard = () => {
    const totalInspections = inspections.length;
    const completedInspections = inspections.filter(i => i.status === 'completed').length;
    const avgScore = inspections.reduce((sum, i) => sum + (i.score || 0), 0) / completedInspections || 0;
    const totalIssues = issues.length;
    const openIssues = issues.filter(i => i.status === 'open').length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;

    const dashboardCards = [
      {
        title: 'Total Inspections',
        value: totalInspections,
        subtitle: `${completedInspections} completed`,
        color: theme.palette.primary.main,
        icon: <Assessment />
      },
      {
        title: 'Average QC Score',
        value: `${avgScore.toFixed(1)}%`,
        subtitle: 'This month',
        color: theme.palette.success.main,
        icon: <Star />
      },
      {
        title: 'Open Issues',
        value: openIssues,
        subtitle: `${totalIssues} total`,
        color: theme.palette.warning.main,
        icon: <Flag />
      },
      {
        title: 'Critical Issues',
        value: criticalIssues,
        subtitle: 'Requires immediate attention',
        color: theme.palette.error.main,
        icon: <Error />
      }
    ];

    return (
      <Box>
        {/* Dashboard Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {dashboardCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {card.title}
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {card.subtitle}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: card.color,
                        color: 'white',
                        width: 48,
                        height: 48
                      }}
                    >
                      {card.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Inspections */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Inspections</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setInspectionDialog(true)}
              >
                New Inspection
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Inspector</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Issues</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inspections.map((inspection) => {
                    const category = QC_CATEGORIES[inspection.category];
                    const CategoryIcon = category?.icon || Assessment;

                    return (
                      <TableRow key={inspection.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {inspection.jobNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{inspection.customer}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={<CategoryIcon />}
                            label={category?.title}
                            sx={{
                              backgroundColor: alpha(category?.color || '#666', 0.1),
                              color: category?.color || '#666'
                            }}
                          />
                        </TableCell>
                        <TableCell>{inspection.inspector}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={inspection.status.toUpperCase()}
                            color={inspection.status === 'completed' ? 'success' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          {inspection.score ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                                {inspection.score}%
                              </Typography>
                              <Star
                                sx={{
                                  fontSize: 16,
                                  color: inspection.score >= 95 ? '#4caf50' : 
                                         inspection.score >= 85 ? '#ff9800' : '#f44336'
                                }}
                              />
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              In Progress
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={inspection.issues} color="error">
                            <Flag color={inspection.issues > 0 ? 'error' : 'disabled'} />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => {}}>
                            <Visibility />
                          </IconButton>
                          <IconButton size="small" onClick={() => {}}>
                            <Edit />
                          </IconButton>
                          <IconButton size="small" onClick={() => {}}>
                            <Print />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Inspection checklist component
  const InspectionChecklist = () => {
    const [selectedCategory, setSelectedCategory] = useState('structural');
    const [checklistData, setChecklistData] = useState({});
    const [photos, setPhotos] = useState([]);
    const [notes, setNotes] = useState('');

    const handleCheckpointChange = (categoryId, checkpointIndex, checked) => {
      setChecklistData(prev => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          [checkpointIndex]: checked
        }
      }));
    };

    const getCategoryCompletion = (categoryId) => {
      const category = QC_CATEGORIES[categoryId];
      const categoryData = checklistData[categoryId] || {};
      const completed = Object.values(categoryData).filter(Boolean).length;
      return (completed / category.checkpoints.length) * 100;
    };

    const getTotalCompletion = () => {
      const totalCheckpoints = Object.values(QC_CATEGORIES).reduce((sum, cat) => sum + cat.checkpoints.length, 0);
      const completedCheckpoints = Object.values(checklistData).reduce((sum, categoryData) => {
        return sum + Object.values(categoryData).filter(Boolean).length;
      }, 0);
      return (completedCheckpoints / totalCheckpoints) * 100;
    };

    return (
      <Box>
        {/* Progress Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Inspection Progress</Typography>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {getTotalCompletion().toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getTotalCompletion()}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
            
            {/* Category progress */}
            <Grid container spacing={1}>
              {Object.entries(QC_CATEGORIES).map(([categoryId, category]) => {
                const completion = getCategoryCompletion(categoryId);
                const CategoryIcon = category.icon;
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={categoryId}>
                    <Box
                      sx={{
                        p: 1,
                        border: '1px solid',
                        borderColor: selectedCategory === categoryId ? category.color : 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === categoryId ? alpha(category.color, 0.1) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(category.color, 0.05)
                        }
                      }}
                      onClick={() => setSelectedCategory(categoryId)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: category.color,
                            width: 24,
                            height: 24,
                            mr: 1
                          }}
                        >
                          <CategoryIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="caption" noWrap>
                          {category.title}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={completion}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: alpha(category.color, 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: category.color,
                            borderRadius: 2
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {completion.toFixed(0)}%
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* Selected Category Checklist */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: QC_CATEGORIES[selectedCategory].color,
                  mr: 2
                }}
              >
                {React.createElement(QC_CATEGORIES[selectedCategory].icon)}
              </Avatar>
              <Typography variant="h6">
                {QC_CATEGORIES[selectedCategory].title}
              </Typography>
            </Box>

            <FormGroup>
              {QC_CATEGORIES[selectedCategory].checkpoints.map((checkpoint, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={checklistData[selectedCategory]?.[index] || false}
                      onChange={(e) => handleCheckpointChange(selectedCategory, index, e.target.checked)}
                    />
                  }
                  label={checkpoint}
                  sx={{ mb: 1 }}
                />
              ))}
            </FormGroup>

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                startIcon={<PhotoCamera />}
                variant="outlined"
                onClick={() => {}}
              >
                Add Photos ({photos.length})
              </Button>
              <Button
                startIcon={<VideoCall />}
                variant="outlined"
                onClick={() => {}}
              >
                Record Video
              </Button>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Inspector Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Issues tracking component
  const IssuesTracking = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Quality Issues</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIssueDialog(true)}
        >
          Report Issue
        </Button>
      </Box>

      {/* Issues by severity */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(SEVERITY_LEVELS).map(([severityId, severity]) => {
          const severityIssues = issues.filter(i => i.severity === severityId);
          const SeverityIcon = severity.icon;
          
          return (
            <Grid item xs={12} sm={6} md={3} key={severityId}>
              <Card
                sx={{
                  borderLeft: `4px solid ${severity.color}`,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 2 }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: severity.color }}>
                        {severityIssues.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {severity.label} Issues
                      </Typography>
                    </Box>
                    <SeverityIcon sx={{ fontSize: 32, color: severity.color }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Issues list */}
      <Grid container spacing={2}>
        {issues.map((issue) => {
          const severity = SEVERITY_LEVELS[issue.severity];
          const SeverityIcon = severity.icon;
          
          return (
            <Grid item xs={12} md={6} key={issue.id}>
              <Card
                sx={{
                  borderLeft: `4px solid ${severity.color}`,
                  '&:hover': { boxShadow: 2 }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {issue.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {issue.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {issue.location}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={<SeverityIcon />}
                      label={severity.label}
                      sx={{
                        backgroundColor: alpha(severity.color, 0.1),
                        color: severity.color
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Discovered by {issue.discoveredBy}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(issue.discoveredDate)}
                    </Typography>
                  </Box>

                  {issue.assignedTo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                        {issue.assignedTo.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        Assigned to {issue.assignedTo}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      size="small"
                      label={issue.status.toUpperCase()}
                      color={issue.status === 'open' ? 'error' : 'success'}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => {}}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => {}}>
                        <PhotoCamera />
                      </IconButton>
                      <IconButton size="small" onClick={() => {}}>
                        <Comment />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  // ADAS Calibration component
  const AdasCalibration = () => {
    const adasSystems = [
      {
        name: 'Forward Collision Warning',
        status: 'calibrated',
        lastCalibration: '2024-01-15',
        nextDue: '2024-07-15',
        certified: true
      },
      {
        name: 'Lane Departure Warning',
        status: 'needs_calibration',
        lastCalibration: '2023-12-01',
        nextDue: '2024-01-20',
        certified: true
      },
      {
        name: 'Adaptive Cruise Control',
        status: 'calibrated',
        lastCalibration: '2024-01-16',
        nextDue: '2024-07-16',
        certified: true
      }
    ];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          ADAS System Calibration
        </Typography>

        <Grid container spacing={2}>
          {adasSystems.map((system, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {system.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={system.status === 'calibrated' ? 'Calibrated' : 'Needs Calibration'}
                      color={system.status === 'calibrated' ? 'success' : 'error'}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Last: {formatDate(system.lastCalibration)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Next Due: {formatDate(system.nextDue)}
                  </Typography>

                  {system.certified && (
                    <Chip
                      size="small"
                      icon={<VerifiedUser />}
                      label="Certified"
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Button
                    fullWidth
                    variant={system.status === 'needs_calibration' ? 'contained' : 'outlined'}
                    color={system.status === 'needs_calibration' ? 'error' : 'primary'}
                    startIcon={<Tune />}
                  >
                    {system.status === 'needs_calibration' ? 'Calibrate Now' : 'Re-calibrate'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Quality Control</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<Search />}
            variant="outlined"
          >
            Search QC Records
          </Button>
          <Button
            startIcon={<Assessment />}
            variant="outlined"
          >
            QC Reports
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab label="Inspections" />
        <Tab label="Issues" />
        <Tab label="ADAS Calibration" />
        <Tab label="Standards" />
      </Tabs>

      {/* Tab content */}
      <Box>
        {activeTab === 0 && <QCDashboard />}
        {activeTab === 1 && <InspectionChecklist />}
        {activeTab === 2 && <IssuesTracking />}
        {activeTab === 3 && <AdasCalibration />}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              QC Standards & Specifications
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(QC_STANDARDS).map(([standard, specs]) => (
                <Grid item xs={12} sm={6} md={3} key={standard}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        {standard.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Range: {specs.min} - {specs.max} {specs.unit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tolerance: ±{specs.tolerance} {specs.unit}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default QualityControlSystem;