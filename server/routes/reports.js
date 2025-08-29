const express = require('express');
const router = express.Router();

// Enhanced query parameter handling for dashboard navigation
const parseReportFilters = (req) => {
  const {
    type = 'revenue',
    period = 'monthly',
    metric,
    status = 'all',
    view = 'summary',
    start_date,
    end_date,
    technician_id,
    customer_id,
    format = 'json'
  } = req.query;

  return {
    type: type.toLowerCase(),
    period: period.toLowerCase(),
    metric: metric || null,
    status: status === 'all' ? null : status,
    view: view.toLowerCase(),
    startDate: start_date ? new Date(start_date) : null,
    endDate: end_date ? new Date(end_date) : null,
    technicianId: technician_id || null,
    customerId: customer_id || null,
    format: format.toLowerCase(),
    // Response metadata
    _metadata: {
      totalFiltersApplied: Object.values(req.query).filter(v => v && v !== 'all').length,
      reportContext: type,
      timeframe: period
    }
  };
};

// Generate mock report data based on type
const generateReportData = (filters) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  switch (filters.type) {
    case 'revenue':
      return generateRevenueReport(filters, currentMonth, currentYear);
    case 'cycle-time':
      return generateCycleTimeReport(filters);
    case 'financial':
      return generateFinancialReport(filters, currentMonth, currentYear);
    case 'insurance':
      return generateInsuranceReport(filters);
    case 'technician-performance':
      return generateTechnicianReport(filters);
    case 'customer-satisfaction':
      return generateSatisfactionReport(filters);
    default:
      return { data: [], summary: {} };
  }
};

// Generate revenue report
const generateRevenueReport = (filters, currentMonth, currentYear) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (filters.period === 'monthly') {
    const data = months.slice(0, currentMonth + 1).map((month, index) => ({
      period: month,
      revenue: Math.round((12000 + Math.random() * 8000) * 100) / 100,
      jobs: Math.floor(8 + Math.random() * 12),
      avgTicket: Math.round((1200 + Math.random() * 800) * 100) / 100
    }));
    
    return {
      data,
      summary: {
        totalRevenue: data.reduce((sum, d) => sum + d.revenue, 0),
        totalJobs: data.reduce((sum, d) => sum + d.jobs, 0),
        avgMonthlyRevenue: data.reduce((sum, d) => sum + d.revenue, 0) / data.length,
        growth: Math.round((Math.random() * 20 - 10) * 100) / 100 + '%'
      }
    };
  }
  
  return { data: [], summary: {} };
};

// Generate cycle time analytics report
const generateCycleTimeReport = (filters) => {
  const stages = [
    { stage: 'Estimate', avgDays: 1.2, target: 1.0 },
    { stage: 'Teardown', avgDays: 2.5, target: 2.0 },
    { stage: 'Parts Ordering', avgDays: 1.8, target: 1.5 },
    { stage: 'Body Work', avgDays: 4.2, target: 3.5 },
    { stage: 'Paint', avgDays: 3.1, target: 2.8 },
    { stage: 'Reassembly', avgDays: 2.3, target: 2.0 },
    { stage: 'QC/Detail', avgDays: 1.5, target: 1.2 }
  ];

  return {
    data: stages,
    summary: {
      totalAvgCycleTime: stages.reduce((sum, s) => sum + s.avgDays, 0),
      totalTargetTime: stages.reduce((sum, s) => sum + s.target, 0),
      efficiency: Math.round((stages.reduce((sum, s) => sum + s.target, 0) / stages.reduce((sum, s) => sum + s.avgDays, 0)) * 100),
      bottlenecks: stages.filter(s => s.avgDays > s.target * 1.2).map(s => s.stage)
    }
  };
};

// Generate financial performance report
const generateFinancialReport = (filters, currentMonth, currentYear) => {
  const data = {
    revenue: {
      total: 156780.50,
      labor: 94068.30,
      parts: 62712.20,
      growth: '+12.5%'
    },
    costs: {
      laborCosts: 47034.15,
      partsCosts: 43897.54,
      overhead: 18813.06,
      total: 109744.75
    },
    profitMargin: {
      gross: 47035.75,
      grossPercent: 30.0,
      net: 28221.45,
      netPercent: 18.0
    },
    metrics: {
      avgTicketValue: 1647.38,
      jobsCompleted: 95,
      revenuePerTechnician: 31356.10,
      laborEfficiency: 85.2
    }
  };

  return {
    data,
    summary: {
      totalProfit: data.profitMargin.net,
      profitMargin: data.profitMargin.netPercent,
      revenueGrowth: data.revenue.growth,
      avgTicket: data.metrics.avgTicketValue
    }
  };
};

// Generate insurance report
const generateInsuranceReport = (filters) => {
  const insurers = [
    { name: 'State Farm', jobs: 23, revenue: 38750.00, avgClaim: 1684.78, status: 'excellent' },
    { name: 'GEICO', jobs: 18, revenue: 31200.00, avgClaim: 1733.33, status: 'good' },
    { name: 'Progressive', jobs: 15, revenue: 24600.00, avgClaim: 1640.00, status: 'good' },
    { name: 'Allstate', jobs: 12, revenue: 19800.00, avgClaim: 1650.00, status: 'fair' },
    { name: 'USAA', jobs: 8, revenue: 14400.00, avgClaim: 1800.00, status: 'excellent' }
  ];

  return {
    data: insurers,
    summary: {
      totalInsuranceJobs: insurers.reduce((sum, i) => sum + i.jobs, 0),
      totalInsuranceRevenue: insurers.reduce((sum, i) => sum + i.revenue, 0),
      avgClaimValue: insurers.reduce((sum, i) => sum + i.avgClaim, 0) / insurers.length,
      topInsurer: insurers[0].name
    }
  };
};

// Generate technician performance report
const generateTechnicianReport = (filters) => {
  const technicians = [
    { name: 'Alex Rodriguez', jobsCompleted: 24, avgCycleTime: 6.2, efficiency: 92.5, revenue: 42800 },
    { name: 'Maria Garcia', jobsCompleted: 21, avgCycleTime: 5.8, efficiency: 95.2, revenue: 38900 },
    { name: 'James Wilson', jobsCompleted: 19, avgCycleTime: 7.1, efficiency: 87.3, revenue: 35600 },
    { name: 'Jennifer Davis', jobsCompleted: 22, avgCycleTime: 6.5, efficiency: 90.1, revenue: 41200 }
  ];

  return {
    data: technicians,
    summary: {
      totalTechnicians: technicians.length,
      avgJobsCompleted: technicians.reduce((sum, t) => sum + t.jobsCompleted, 0) / technicians.length,
      avgCycleTime: technicians.reduce((sum, t) => sum + t.avgCycleTime, 0) / technicians.length,
      topPerformer: technicians.sort((a, b) => b.efficiency - a.efficiency)[0].name
    }
  };
};

// Generate customer satisfaction report
const generateSatisfactionReport = (filters) => {
  const data = {
    overall: {
      rating: 4.67,
      totalResponses: 234,
      responseRate: 78.5
    },
    categories: [
      { category: 'Quality of Work', rating: 4.8, responses: 234 },
      { category: 'Timeliness', rating: 4.5, responses: 234 },
      { category: 'Communication', rating: 4.7, responses: 234 },
      { category: 'Value', rating: 4.6, responses: 234 }
    ],
    trends: [
      { month: 'Jun', rating: 4.5 },
      { month: 'Jul', rating: 4.6 },
      { month: 'Aug', rating: 4.67 }
    ]
  };

  return {
    data,
    summary: {
      overallRating: data.overall.rating,
      totalResponses: data.overall.totalResponses,
      responseRate: data.overall.responseRate,
      highestCategory: data.categories.sort((a, b) => b.rating - a.rating)[0].category
    }
  };
};

// Main reports endpoint with dashboard navigation support
router.get('/', (req, res) => {
  try {
    // Parse query parameters for dashboard navigation
    const filters = parseReportFilters(req);
    
    // Generate report data based on filters
    const reportData = generateReportData(filters);
    
    // Prepare response with metadata
    const response = {
      success: true,
      reportType: filters.type,
      period: filters.period,
      generatedAt: new Date().toISOString(),
      filters: {
        applied: filters._metadata.totalFiltersApplied,
        context: filters._metadata.reportContext,
        timeframe: filters._metadata.timeframe
      },
      ...reportData
    };
    
    res.json(response);
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

// Specific report type endpoints for dashboard widgets
router.get('/revenue', (req, res) => {
  req.query.type = 'revenue';
  router.handle(req, res);
});

router.get('/cycle-time', (req, res) => {
  req.query.type = 'cycle-time';
  router.handle(req, res);
});

router.get('/financial', (req, res) => {
  req.query.type = 'financial';
  router.handle(req, res);
});

router.get('/insurance', (req, res) => {
  req.query.type = 'insurance';
  router.handle(req, res);
});

module.exports = router;
