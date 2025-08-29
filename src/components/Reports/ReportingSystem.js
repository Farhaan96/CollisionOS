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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  DatePicker,
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
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Download,
  Print,
  Share,
  Schedule,
  AttachMoney,
  Speed,
  Person,
  DirectionsCar,
  Build,
  Star,
  Warning,
  CheckCircle,
  BarChart,
  PieChart,
  ShowChart,
  TableChart,
  FilterList,
  DateRange,
  Refresh,
  Settings,
  Email,
  Visibility,
  Edit,
  Delete,
  Add,
  PlayArrow,
  Pause,
  AutoGraph,
  Analytics,
  Timeline,
  Business,
  MonetizationOn,
  Engineering,
  Groups,
  Inventory,
  LocalShipping
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';

// Report categories and templates
const REPORT_CATEGORIES = {
  financial: {
    title: 'Financial Reports',
    icon: MonetizationOn,
    color: '#2e7d32',
    templates: [
      { id: 'profit_loss', name: 'Profit & Loss Statement', type: 'financial' },
      { id: 'revenue_analysis', name: 'Revenue Analysis', type: 'financial' },
      { id: 'job_profitability', name: 'Job Profitability', type: 'financial' },
      { id: 'parts_profitability', name: 'Parts Profitability', type: 'financial' }
    ]
  },
  production: {
    title: 'Production Reports',
    icon: Engineering,
    color: '#1976d2',
    templates: [
      { id: 'cycle_time', name: 'Cycle Time Analysis', type: 'production' },
      { id: 'throughput', name: 'Throughput Report', type: 'production' },
      { id: 'bottleneck_analysis', name: 'Bottleneck Analysis', type: 'production' },
      { id: 'capacity_utilization', name: 'Capacity Utilization', type: 'production' }
    ]
  },
  quality: {
    title: 'Quality Reports',
    icon: Star,
    color: '#7b1fa2',
    templates: [
      { id: 'qc_scorecard', name: 'QC Scorecard', type: 'quality' },
      { id: 'defect_analysis', name: 'Defect Analysis', type: 'quality' },
      { id: 'rework_report', name: 'Rework Report', type: 'quality' },
      { id: 'customer_satisfaction', name: 'Customer Satisfaction', type: 'quality' }
    ]
  },
  staff: {
    title: 'Staff Performance',
    icon: Groups,
    color: '#f57c00',
    templates: [
      { id: 'technician_productivity', name: 'Technician Productivity', type: 'staff' },
      { id: 'efficiency_report', name: 'Efficiency Report', type: 'staff' },
      { id: 'training_compliance', name: 'Training Compliance', type: 'staff' },
      { id: 'attendance_report', name: 'Attendance Report', type: 'staff' }
    ]
  },
  operational: {
    title: 'Operational Reports',
    icon: Business,
    color: '#5d4037',
    templates: [
      { id: 'kpi_dashboard', name: 'KPI Dashboard', type: 'operational' },
      { id: 'workflow_analysis', name: 'Workflow Analysis', type: 'operational' },
      { id: 'equipment_utilization', name: 'Equipment Utilization', type: 'operational' },
      { id: 'vendor_performance', name: 'Vendor Performance', type: 'operational' }
    ]
  }
};

// Sample KPI data
const SAMPLE_KPIS = {
  financial: {
    revenue: { value: 485000, target: 500000, trend: 'up', change: 8.5 },
    profit_margin: { value: 18.5, target: 20.0, trend: 'up', change: 2.1 },
    avg_job_value: { value: 3240, target: 3500, trend: 'up', change: 5.2 }
  },
  production: {
    cycle_time: { value: 5.2, target: 4.8, trend: 'down', change: -8.1 },
    throughput: { value: 127, target: 135, trend: 'up', change: 12.4 },
    capacity_utilization: { value: 82.5, target: 85.0, trend: 'up', change: 3.8 }
  },
  quality: {
    qc_score: { value: 94.2, target: 95.0, trend: 'up', change: 1.8 },
    first_time_right: { value: 89.3, target: 92.0, trend: 'up', change: 4.2 },
    customer_satisfaction: { value: 4.7, target: 4.8, trend: 'stable', change: 0.1 }
  },
  staff: {
    efficiency: { value: 91.5, target: 92.0, trend: 'up', change: 2.3 },
    utilization: { value: 87.2, target: 85.0, trend: 'up', change: 1.8 },
    training_compliance: { value: 96.5, target: 100.0, trend: 'up', change: 8.2 }
  }
};

const ReportingSystem = ({ onReportGenerate, onReportSchedule }) => {
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('financial');
  const [reportDialog, setReportDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [customReportDialog, setCustomReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    dateRange: 'last_30_days',
    startDate: null,
    endDate: null,
    technician: '',
    department: '',
    jobStatus: '',
    comparison: 'previous_period'
  });
  const [generatedReports, setGeneratedReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample generated reports
  const sampleReports = [
    {
      id: '1',
      name: 'Monthly P&L Report',
      category: 'financial',
      generatedDate: '2024-01-16',
      generatedBy: 'Admin User',
      format: 'PDF',
      size: '2.4 MB',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: '2',
      name: 'Technician Productivity',
      category: 'staff',
      generatedDate: '2024-01-15',
      generatedBy: 'Manager User',
      format: 'Excel',
      size: '1.2 MB',
      status: 'completed',
      downloadUrl: '#'
    }
  ];

  // Sample scheduled reports
  const sampleScheduled = [
    {
      id: '1',
      name: 'Weekly KPI Dashboard',
      category: 'operational',
      frequency: 'weekly',
      nextRun: '2024-01-20',
      recipients: ['manager@shop.com', 'owner@shop.com'],
      format: 'PDF',
      active: true
    }
  ];

  useEffect(() => {
    setGeneratedReports(sampleReports);
    setScheduledReports(sampleScheduled);
  }, []);

  // KPI Dashboard component
  const KPIDashboard = () => {
    const kpiCategories = Object.entries(SAMPLE_KPIS);

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Key Performance Indicators</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Refresh />} size="small">
              Refresh
            </Button>
            <Button startIcon={<FilterList />} size="small">
              Filter
            </Button>
          </Box>
        </Box>

        {kpiCategories.map(([categoryId, kpis]) => {
          const category = REPORT_CATEGORIES[categoryId];
          if (!category) return null;
          
          const CategoryIcon = category.icon;

          return (
            <Card key={categoryId} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: category.color, mr: 2 }}>
                    <CategoryIcon />
                  </Avatar>
                  <Typography variant="h6">{category.title}</Typography>
                </Box>

                <Grid container spacing={3}>
                  {Object.entries(kpis).map(([kpiId, kpi]) => {
                    const isPositiveTrend = kpi.trend === 'up' || (kpi.trend === 'down' && kpiId === 'cycle_time');
                    const trendColor = isPositiveTrend ? theme.palette.success.main : theme.palette.error.main;
                    const TrendIcon = kpi.change > 0 ? TrendingUp : TrendingDown;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={kpiId}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {kpiId.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="h4" fontWeight="bold">
                                {kpiId.includes('margin') || kpiId.includes('efficiency') || kpiId.includes('utilization') || kpiId.includes('compliance') ? 
                                  `${kpi.value}%` :
                                 kpiId.includes('revenue') || kpiId.includes('value') ?
                                  formatCurrency(kpi.value) :
                                 kpiId.includes('satisfaction') ?
                                  `${kpi.value}/5.0` :
                                  kpi.value
                                }
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendIcon sx={{ fontSize: 16, color: trendColor, mr: 0.5 }} />
                                <Typography variant="caption" sx={{ color: trendColor, fontWeight: 'bold' }}>
                                  {Math.abs(kpi.change)}%
                                </Typography>
                              </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                              Target: {
                                kpiId.includes('margin') || kpiId.includes('efficiency') || kpiId.includes('utilization') || kpiId.includes('compliance') ? 
                                  `${kpi.target}%` :
                                kpiId.includes('revenue') || kpiId.includes('value') ?
                                  formatCurrency(kpi.target) :
                                kpiId.includes('satisfaction') ?
                                  `${kpi.target}/5.0` :
                                  kpi.target
                              }
                            </Typography>

                            <Box sx={{ mt: 1, height: 4, backgroundColor: alpha(theme.palette.grey[500], 0.2), borderRadius: 2 }}>
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                                  backgroundColor: (kpi.value / kpi.target) >= 1 ? theme.palette.success.main : theme.palette.warning.main,
                                  borderRadius: 2,
                                  transition: 'width 0.5s ease-in-out'
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  // Report templates component
  const ReportTemplates = () => {
    const category = REPORT_CATEGORIES[selectedCategory];
    const CategoryIcon = category?.icon || Assessment;

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Report Templates</Typography>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setCustomReportDialog(true)}
          >
            Custom Report
          </Button>
        </Box>

        {/* Category selector */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1 }}>
          {Object.entries(REPORT_CATEGORIES).map(([categoryId, cat]) => {
            const CatIcon = cat.icon;
            return (
              <Chip
                key={categoryId}
                icon={<CatIcon />}
                label={cat.title}
                onClick={() => setSelectedCategory(categoryId)}
                color={selectedCategory === categoryId ? 'primary' : 'default'}
                variant={selectedCategory === categoryId ? 'filled' : 'outlined'}
                sx={{ minWidth: 'fit-content' }}
              />
            );
          })}
        </Box>

        {/* Report templates grid */}
        <Grid container spacing={3}>
          {category?.templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${category.color}`,
                    '&:hover': {
                      boxShadow: 4,
                      '& .report-actions': {
                        opacity: 1
                      }
                    }
                  }}
                  onClick={() => {
                    setSelectedReport(template);
                    setReportDialog(true);
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: category.color, mr: 2, width: 40, height: 40 }}>
                        <CategoryIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        {template.name}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Generate detailed {template.name.toLowerCase()} with charts, metrics, and insights.
                    </Typography>

                    <Box 
                      className="report-actions"
                      sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        opacity: 0, 
                        transition: 'opacity 0.2s ease-in-out' 
                      }}
                    >
                      <Button size="small" startIcon={<PlayArrow />}>
                        Generate
                      </Button>
                      <Button size="small" startIcon={<Schedule />}>
                        Schedule
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Generated reports component
  const GeneratedReports = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Generated Reports</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<FilterList />} size="small">
            Filter
          </Button>
          <Button startIcon={<Refresh />} size="small">
            Refresh
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Generated</TableCell>
              <TableCell>Generated By</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {generatedReports.map((report) => {
              const category = Object.values(REPORT_CATEGORIES).find(cat => 
                cat.templates.some(t => t.type === report.category)
              );
              const CategoryIcon = category?.icon || Assessment;

              return (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: category?.color, mr: 2, width: 32, height: 32 }}>
                        <CategoryIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {report.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={category?.title}
                      sx={{
                        backgroundColor: alpha(category?.color || '#666', 0.1),
                        color: category?.color || '#666'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.generatedDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{report.generatedBy}</TableCell>
                  <TableCell>
                    <Chip size="small" label={report.format} variant="outlined" />
                  </TableCell>
                  <TableCell>{report.size}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={report.status.toUpperCase()}
                      color={report.status === 'completed' ? 'success' : 'primary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => {}}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => {}}>
                        <Download />
                      </IconButton>
                      <IconButton size="small" onClick={() => {}}>
                        <Share />
                      </IconButton>
                      <IconButton size="small" onClick={() => {}}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Scheduled reports component
  const ScheduledReports = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Scheduled Reports</Typography>
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => setScheduleDialog(true)}
        >
          Schedule Report
        </Button>
      </Box>

      <Grid container spacing={2}>
        {scheduledReports.map((report) => {
          const category = Object.values(REPORT_CATEGORIES).find(cat => 
            cat.templates.some(t => t.type === report.category)
          );
          const CategoryIcon = category?.icon || Assessment;

          return (
            <Grid item xs={12} md={6} lg={4} key={report.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: category?.color, mr: 2 }}>
                      <CategoryIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {report.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.frequency.toUpperCase()} • {report.format}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={report.active ? 'ACTIVE' : 'PAUSED'}
                      color={report.active ? 'success' : 'default'}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Next run: {format(new Date(report.nextRun), 'MMM dd, yyyy')}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Recipients: {report.recipients.length} email(s)
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<Edit />}>
                      Edit
                    </Button>
                    <Button size="small" startIcon={report.active ? <Pause /> : <PlayArrow />}>
                      {report.active ? 'Pause' : 'Resume'}
                    </Button>
                    <IconButton size="small" onClick={() => {}}>
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  // Report generation dialog
  const ReportGenerationDialog = () => (
    <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Generate Report: {selectedReport?.name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Date Range */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={reportFilters.dateRange}
                onChange={(e) => setReportFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                <MenuItem value="last_3_months">Last 3 Months</MenuItem>
                <MenuItem value="last_6_months">Last 6 Months</MenuItem>
                <MenuItem value="last_12_months">Last 12 Months</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Format */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select defaultValue="pdf">
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="powerpoint">PowerPoint</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Filters */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Additional Filters
            </Typography>
            <FormGroup row>
              <FormControlLabel control={<Checkbox />} label="Include Charts" />
              <FormControlLabel control={<Checkbox />} label="Include Raw Data" />
              <FormControlLabel control={<Checkbox />} label="Period Comparison" />
              <FormControlLabel control={<Checkbox />} label="Executive Summary" />
            </FormGroup>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setReportDialog(false)}>
          Cancel
        </Button>
        <Button 
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={() => {
            setReportDialog(false);
            // Trigger report generation
            if (onReportGenerate) {
              onReportGenerate(selectedReport, reportFilters);
            }
          }}
        >
          Generate Report
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Business Intelligence & Reports</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Analytics />} variant="outlined">
            Advanced Analytics
          </Button>
          <Button startIcon={<Settings />} variant="outlined">
            Report Settings
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="KPI Dashboard" />
        <Tab label="Report Templates" />
        <Tab label="Generated Reports" />
        <Tab label="Scheduled Reports" />
      </Tabs>

      {/* Tab content */}
      <Box>
        {activeTab === 0 && <KPIDashboard />}
        {activeTab === 1 && <ReportTemplates />}
        {activeTab === 2 && <GeneratedReports />}
        {activeTab === 3 && <ScheduledReports />}
      </Box>

      {/* Dialogs */}
      <ReportGenerationDialog />
    </Box>
  );
};

export default ReportingSystem;