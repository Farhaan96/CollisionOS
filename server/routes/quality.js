const express = require('express');
const router = express.Router();

// Enhanced query parameter handling for dashboard navigation
const parseQualityFilters = (req) => {
  const {
    view = 'metrics',
    highlight,
    period = 'current',
    status = 'all',
    technician,
    metric_type,
    limit = 50,
    offset = 0
  } = req.query;

  return {
    view: view.toLowerCase(),
    highlight: highlight || null,
    period: period.toLowerCase(),
    status: status === 'all' ? null : status,
    technician: technician || null,
    metricType: metric_type || null,
    limit: parseInt(limit),
    offset: parseInt(offset),
    // Response metadata
    _metadata: {
      totalFiltersApplied: Object.values(req.query).filter(v => v && v !== 'all').length,
      viewContext: view,
      hasHighlight: !!highlight,
      timeframe: period
    }
  };
};

// Generate quality metrics data
const generateQualityMetrics = (filters) => {
  const baseMetrics = {
    overallQualityScore: 94.2,
    passRate: 96.8,
    reworkRate: 3.2,
    inspectionCount: 248,
    avgInspectionTime: 28.5,
    customerSatisfaction: 4.73
  };

  const inspectionResults = [
    { id: 1, jobNumber: 'J24-001', vehicle: '2022 Honda Accord', technician: 'Alex Rodriguez', score: 95, status: 'passed', date: '2025-08-27', issues: [] },
    { id: 2, jobNumber: 'J24-002', vehicle: '2021 Toyota Camry', technician: 'Maria Garcia', score: 87, status: 'conditional_pass', date: '2025-08-26', issues: ['Minor paint inconsistency'] },
    { id: 3, jobNumber: 'J24-003', vehicle: '2020 Ford F-150', technician: 'James Wilson', score: 98, status: 'passed', date: '2025-08-25', issues: [] },
    { id: 4, jobNumber: 'J24-004', vehicle: '2019 BMW 3 Series', technician: 'Jennifer Davis', score: 92, status: 'passed', date: '2025-08-24', issues: [] },
    { id: 5, jobNumber: 'J24-005', vehicle: '2023 Chevrolet Silverado', technician: 'Alex Rodriguez', score: 74, status: 'failed', date: '2025-08-23', issues: ['Paint color mismatch', 'Panel alignment issue'] }
  ];

  const qualityTrends = [
    { period: 'Week 1', passRate: 94.2, avgScore: 91.5, inspections: 62 },
    { period: 'Week 2', passRate: 96.8, avgScore: 93.2, inspections: 58 },
    { period: 'Week 3', passRate: 97.5, avgScore: 94.8, inspections: 64 },
    { period: 'Week 4', passRate: 95.1, avgScore: 92.7, inspections: 61 }
  ];

  const technicianPerformance = [
    { name: 'Maria Garcia', inspections: 42, passRate: 98.8, avgScore: 95.2, reworkCount: 1 },
    { name: 'Alex Rodriguez', inspections: 38, passRate: 97.4, avgScore: 94.1, reworkCount: 2 },
    { name: 'Jennifer Davis', inspections: 35, passRate: 96.2, avgScore: 93.8, reworkCount: 2 },
    { name: 'James Wilson', inspections: 33, passRate: 94.1, avgScore: 91.9, reworkCount: 3 }
  ];

  const commonIssues = [
    { issue: 'Paint color mismatch', frequency: 12, percentage: 4.8 },
    { issue: 'Panel alignment', frequency: 8, percentage: 3.2 },
    { issue: 'Clear coat imperfections', frequency: 6, percentage: 2.4 },
    { issue: 'Trim fitment', frequency: 4, percentage: 1.6 },
    { issue: 'Interior cleaning', frequency: 3, percentage: 1.2 }
  ];

  return {
    metrics: baseMetrics,
    inspections: inspectionResults,
    trends: qualityTrends,
    technicians: technicianPerformance,
    issues: commonIssues
  };
};

// Apply view-specific filtering logic
const applyQualityViewFilters = (data, filters) => {
  let filteredData = { ...data };

  // Apply view-specific filters
  switch (filters.view) {
    case 'metrics':
      // Standard metrics view - no additional filtering
      break;
    case 'issues':
      filteredData.inspections = data.inspections.filter(inspection => 
        inspection.status === 'failed' || inspection.status === 'conditional_pass'
      );
      break;
    case 'trends':
      // Focus on trend data
      break;
    case 'technician':
      if (filters.technician) {
        filteredData.inspections = data.inspections.filter(inspection => 
          inspection.technician.toLowerCase().includes(filters.technician.toLowerCase())
        );
        filteredData.technicians = data.technicians.filter(tech => 
          tech.name.toLowerCase().includes(filters.technician.toLowerCase())
        );
      }
      break;
  }

  // Apply status filter
  if (filters.status) {
    filteredData.inspections = filteredData.inspections.filter(inspection => 
      inspection.status === filters.status
    );
  }

  // Apply period filter
  if (filters.period === 'current') {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7); // Last week
    filteredData.inspections = filteredData.inspections.filter(inspection => 
      new Date(inspection.date) >= recentDate
    );
  }

  return filteredData;
};

// Apply highlighting logic
const applyQualityHighlighting = (data, highlightId) => {
  if (!highlightId) return data;
  
  return {
    ...data,
    inspections: data.inspections.map(inspection => ({
      ...inspection,
      _highlighted: inspection.id == highlightId || inspection.jobNumber === highlightId,
      _highlightReason: inspection.jobNumber === highlightId ? 'job_number_match' : 'id_match'
    }))
  };
};

// Main quality endpoint with dashboard navigation support
router.get('/', (req, res) => {
  try {
    // Parse query parameters for dashboard navigation
    const filters = parseQualityFilters(req);
    
    // Generate quality data
    let qualityData = generateQualityMetrics(filters);
    
    // Apply view-specific filters
    qualityData = applyQualityViewFilters(qualityData, filters);
    
    // Apply highlighting if requested
    if (filters.highlight) {
      qualityData = applyQualityHighlighting(qualityData, filters.highlight);
    }

    // Prepare response with metadata
    const response = {
      success: true,
      view: filters.view,
      period: filters.period,
      generatedAt: new Date().toISOString(),
      filters: {
        applied: filters._metadata.totalFiltersApplied,
        context: filters._metadata.viewContext,
        hasHighlight: filters._metadata.hasHighlight,
        timeframe: filters._metadata.timeframe
      },
      data: qualityData,
      summary: {
        totalInspections: qualityData.inspections.length,
        passRate: qualityData.metrics.passRate,
        avgScore: qualityData.metrics.overallQualityScore,
        issuesFound: qualityData.inspections.filter(i => i.issues.length > 0).length,
        reworkRequired: qualityData.inspections.filter(i => i.status === 'failed').length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Quality metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quality metrics',
      message: error.message
    });
  }
});

// Specific quality endpoints
router.get('/metrics', (req, res) => {
  req.query.view = 'metrics';
  return router.handle(req, res);
});

router.get('/issues', (req, res) => {
  req.query.view = 'issues';
  return router.handle(req, res);
});

router.get('/trends', (req, res) => {
  req.query.view = 'trends';
  return router.handle(req, res);
});

module.exports = router;
