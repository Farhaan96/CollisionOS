const express = require('express');
const router = express.Router();

// Enhanced query parameter handling for dashboard navigation
const parseTechnicianFilters = (req) => {
  const {
    id,
    view = 'performance',
    metric = 'utilization',
    period = 'current',
    limit = 50,
    offset = 0
  } = req.query;

  return {
    id: id || null,
    view: view.toLowerCase(),
    metric: metric.toLowerCase(),
    period: period.toLowerCase(),
    limit: parseInt(limit),
    offset: parseInt(offset),
    // Response metadata
    _metadata: {
      totalFiltersApplied: Object.values(req.query).filter(v => v && v !== 'all').length,
      viewContext: view,
      metricFocus: metric,
      timeframe: period
    }
  };
};

// Generate technician data
const generateTechnicianData = (filters) => {
  const technicians = [
    {
      id: 'alex-rodriguez',
      name: 'Alex Rodriguez',
      speciality: 'Body Work',
      level: 'Senior',
      avatar: null,
      performance: {
        jobsCompleted: 24,
        jobsInProgress: 3,
        avgCycleTime: 6.2,
        efficiency: 92.5,
        utilization: 87.3,
        qualityScore: 94.1,
        revenue: 42800,
        hoursWorked: 168,
        overtimeHours: 12
      },
      recentJobs: [
        { jobNumber: 'J24-012', vehicle: '2022 Honda Accord', status: 'paint_prep', daysActive: 3 },
        { jobNumber: 'J24-013', vehicle: '2021 Toyota Camry', status: 'body_structure', daysActive: 5 },
        { jobNumber: 'J24-014', vehicle: '2020 Ford F-150', status: 'teardown', daysActive: 1 }
      ]
    },
    {
      id: 'maria-garcia',
      name: 'Maria Garcia',
      speciality: 'Paint & Refinish',
      level: 'Senior',
      avatar: null,
      performance: {
        jobsCompleted: 21,
        jobsInProgress: 2,
        avgCycleTime: 5.8,
        efficiency: 95.2,
        utilization: 91.8,
        qualityScore: 96.2,
        revenue: 38900,
        hoursWorked: 162,
        overtimeHours: 8
      },
      recentJobs: [
        { jobNumber: 'J24-015', vehicle: '2023 BMW 3 Series', status: 'paint_booth', daysActive: 2 },
        { jobNumber: 'J24-016', vehicle: '2019 Chevrolet Silverado', status: 'detail', daysActive: 1 }
      ]
    },
    {
      id: 'james-wilson',
      name: 'James Wilson',
      speciality: 'Mechanical Repair',
      level: 'Intermediate',
      avatar: null,
      performance: {
        jobsCompleted: 19,
        jobsInProgress: 4,
        avgCycleTime: 7.1,
        efficiency: 87.3,
        utilization: 83.5,
        qualityScore: 91.9,
        revenue: 35600,
        hoursWorked: 156,
        overtimeHours: 16
      },
      recentJobs: [
        { jobNumber: 'J24-017', vehicle: '2021 Ford Explorer', status: 'reassembly', daysActive: 4 },
        { jobNumber: 'J24-018', vehicle: '2020 Honda Civic', status: 'parts_receiving', daysActive: 2 },
        { jobNumber: 'J24-019', vehicle: '2022 Nissan Altima', status: 'teardown', daysActive: 1 },
        { jobNumber: 'J24-020', vehicle: '2018 Toyota RAV4', status: 'qc_calibration', daysActive: 6 }
      ]
    },
    {
      id: 'jennifer-davis',
      name: 'Jennifer Davis',
      speciality: 'Frame & Alignment',
      level: 'Senior',
      avatar: null,
      performance: {
        jobsCompleted: 22,
        jobsInProgress: 3,
        avgCycleTime: 6.5,
        efficiency: 90.1,
        utilization: 85.7,
        qualityScore: 93.8,
        revenue: 41200,
        hoursWorked: 160,
        overtimeHours: 10
      },
      recentJobs: [
        { jobNumber: 'J24-021', vehicle: '2023 Jeep Wrangler', status: 'body_structure', daysActive: 7 },
        { jobNumber: 'J24-022', vehicle: '2021 Ram 1500', status: 'paint_prep', daysActive: 3 },
        { jobNumber: 'J24-023', vehicle: '2020 Subaru Outback', status: 'intake', daysActive: 1 }
      ]
    }
  ];

  return technicians;
};

// Apply filtering based on technician ID and view
const applyTechnicianFilters = (technicians, filters) => {
  let filteredTechnicians = [...technicians];

  // Filter by specific technician ID if provided
  if (filters.id) {
    filteredTechnicians = filteredTechnicians.filter(tech => 
      tech.id === filters.id || tech.name.toLowerCase().replace(/\s+/g, '-') === filters.id
    );
  }

  return filteredTechnicians;
};

// Calculate team performance metrics
const calculateTeamMetrics = (technicians) => {
  const totalJobs = technicians.reduce((sum, tech) => sum + tech.performance.jobsCompleted, 0);
  const totalRevenue = technicians.reduce((sum, tech) => sum + tech.performance.revenue, 0);
  const avgUtilization = technicians.reduce((sum, tech) => sum + tech.performance.utilization, 0) / technicians.length;
  const avgQualityScore = technicians.reduce((sum, tech) => sum + tech.performance.qualityScore, 0) / technicians.length;
  const avgCycleTime = technicians.reduce((sum, tech) => sum + tech.performance.avgCycleTime, 0) / technicians.length;

  return {
    totalTechnicians: technicians.length,
    totalJobsCompleted: totalJobs,
    totalRevenue: Math.round(totalRevenue),
    avgUtilization: Math.round(avgUtilization * 10) / 10,
    avgQualityScore: Math.round(avgQualityScore * 10) / 10,
    avgCycleTime: Math.round(avgCycleTime * 10) / 10,
    topPerformer: technicians.sort((a, b) => b.performance.efficiency - a.performance.efficiency)[0].name,
    utilizationLeader: technicians.sort((a, b) => b.performance.utilization - a.performance.utilization)[0].name
  };
};

// Main technicians endpoint
router.get('/', (req, res) => {
  try {
    // Parse query parameters for dashboard navigation
    const filters = parseTechnicianFilters(req);
    
    // Generate technician data
    let technicians = generateTechnicianData(filters);
    
    // Apply filters
    technicians = applyTechnicianFilters(technicians, filters);
    
    // Calculate team metrics
    const teamMetrics = calculateTeamMetrics(technicians);
    
    // Prepare response based on view
    let response = {
      success: true,
      view: filters.view,
      metric: filters.metric,
      period: filters.period,
      generatedAt: new Date().toISOString(),
      filters: {
        applied: filters._metadata.totalFiltersApplied,
        context: filters._metadata.viewContext,
        metricFocus: filters._metadata.metricFocus,
        timeframe: filters._metadata.timeframe
      }
    };

    if (filters.view === 'performance') {
      if (filters.id && technicians.length === 1) {
        // Individual technician performance
        const technician = technicians[0];
        response.data = {
          technician,
          performanceHistory: [
            { period: 'Week 1', efficiency: 89.2, utilization: 82.1, jobs: 6 },
            { period: 'Week 2', efficiency: 92.5, utilization: 87.3, jobs: 7 },
            { period: 'Week 3', efficiency: 90.8, utilization: 85.7, jobs: 5 },
            { period: 'Week 4', efficiency: 94.1, utilization: 88.9, jobs: 6 }
          ],
          comparison: {
            vsTeamAvg: {
              efficiency: `+${Math.round((technician.performance.efficiency - teamMetrics.avgQualityScore) * 10) / 10}%`,
              utilization: `+${Math.round((technician.performance.utilization - teamMetrics.avgUtilization) * 10) / 10}%`
            }
          }
        };
      } else {
        // Team performance overview
        response.data = {
          technicians,
          teamMetrics,
          performanceRanking: technicians.sort((a, b) => b.performance.efficiency - a.performance.efficiency),
          utilizationRanking: technicians.sort((a, b) => b.performance.utilization - a.performance.utilization)
        };
      }
    } else if (filters.view === 'workload') {
      response.data = {
        technicians: technicians.map(tech => ({
          ...tech,
          workloadStatus: tech.performance.jobsInProgress >= 4 ? 'high' : 
                         tech.performance.jobsInProgress >= 2 ? 'medium' : 'low',
          capacity: Math.max(0, 5 - tech.performance.jobsInProgress) // Assume 5 job capacity
        })),
        workloadSummary: {
          totalActiveJobs: technicians.reduce((sum, tech) => sum + tech.performance.jobsInProgress, 0),
          avgJobsPerTechnician: technicians.reduce((sum, tech) => sum + tech.performance.jobsInProgress, 0) / technicians.length,
          overloadedTechnicians: technicians.filter(tech => tech.performance.jobsInProgress >= 4).length,
          availableCapacity: technicians.reduce((sum, tech) => sum + Math.max(0, 5 - tech.performance.jobsInProgress), 0)
        }
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Technicians API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve technician data',
      message: error.message
    });
  }
});

// Individual technician endpoint
router.get('/:id', (req, res) => {
  req.query.id = req.params.id;
  req.query.view = 'performance';
  return router.handle(req, res);
});

// Performance metrics endpoint
router.get('/:id/performance', (req, res) => {
  req.query.id = req.params.id;
  req.query.view = 'performance';
  req.query.metric = 'detailed';
  return router.handle(req, res);
});

module.exports = router;