const express = require('express');
const router = express.Router();
const { mapJobToFrontend } = require('../utils/fieldMapper');
const { RepairOrderManagement: RepairOrder, Customer, VehicleProfile, ClaimManagement: Claim } = require('../database/models');
// TODO: Replace with local database auth middleware
// const { authenticateToken } = require('../middleware/auth');
const authenticateToken = (options = {}) => {
  return (req, res, next) => {
    req.user = { userId: 'dev-user', shopId: 'dev-shop', role: 'admin' };
    next();
  };
};

// Enhanced query parameter handling for dashboard navigation
const parseJobFilters = req => {
  const {
    view = 'all',
    status = 'all',
    highlight,
    filter,
    forecast = false,
    priority,
    technician,
    days_range,
    customer_id,
    urgent = false,
  } = req.query;

  return {
    view: view.toLowerCase(),
    status: status === 'all' ? null : status,
    highlight: highlight || null,
    filter: filter || null,
    forecast: forecast === 'true',
    priority: priority || null,
    technician: technician || null,
    daysRange: days_range ? parseInt(days_range) : null,
    customerId: customer_id || null,
    urgent: urgent === 'true',
    // Response metadata
    _metadata: {
      totalFiltersApplied: Object.values(req.query).filter(
        v => v && v !== 'all'
      ).length,
      viewContext: view,
      hasHighlight: !!highlight,
    },
  };
};

// Apply view-specific filtering logic
const applyJobViewFilters = (jobs, filters) => {
  let filteredJobs = [...jobs];

  // Apply view-specific filters
  switch (filters.view) {
    case 'active-repairs':
      filteredJobs = filteredJobs.filter(
        job => !['delivered', 'cancelled', 'estimate'].includes(job.status)
      );
      break;
    case 'ready-for-pickup':
      filteredJobs = filteredJobs.filter(job => job.status === 'ready_pickup');
      break;
    case 'capacity':
      // For capacity view, include workload distribution
      break;
    case 'production':
      filteredJobs = filteredJobs.filter(job =>
        ['body_structure', 'paint_prep', 'paint_booth', 'reassembly'].includes(
          job.status
        )
      );
      break;
    case 'quality':
      filteredJobs = filteredJobs.filter(job =>
        ['qc_calibration', 'detail'].includes(job.status)
      );
      break;
  }

  // Apply status filter
  if (filters.status) {
    filteredJobs = filteredJobs.filter(job => job.status === filters.status);
  }

  // Apply priority filter
  if (filters.priority) {
    filteredJobs = filteredJobs.filter(
      job => job.priority === filters.priority
    );
  }

  // Apply urgent filter
  if (filters.urgent) {
    filteredJobs = filteredJobs.filter(
      job => job.priority === 'urgent' || job.priority === 'rush'
    );
  }

  // Apply technician filter
  if (filters.technician) {
    filteredJobs = filteredJobs.filter(
      job =>
        job.technician &&
        job.technician.name
          .toLowerCase()
          .includes(filters.technician.toLowerCase())
    );
  }

  // Apply days range filter
  if (filters.daysRange) {
    filteredJobs = filteredJobs.filter(
      job => job.daysInShop <= filters.daysRange
    );
  }

  // Apply customer filter
  if (filters.customerId) {
    filteredJobs = filteredJobs.filter(
      job => job.customerId === filters.customerId
    );
  }

  // Apply date-based filters
  if (filters.filter === 'today') {
    const today = new Date().toDateString();
    filteredJobs = filteredJobs.filter(
      job => new Date(job.lastUpdated).toDateString() === today
    );
  } else if (filters.filter === 'overdue') {
    filteredJobs = filteredJobs.filter(job => job.daysInShop > 14);
  } else if (filters.filter === 'delayed') {
    filteredJobs = filteredJobs.filter(
      job => job.partsStatus === 'pending' || job.daysInCurrentStatus > 5
    );
  }

  return filteredJobs;
};

// Apply highlighting logic
const applyJobHighlighting = (jobs, highlightId) => {
  if (!highlightId) return jobs;

  return jobs.map(job => ({
    ...job,
    _highlighted: job.jobNumber === highlightId || job.id === highlightId,
    _highlightReason:
      job.jobNumber === highlightId ? 'job_number_match' : 'id_match',
  }));
};

// Sample data generator for development
const generateMockJobs = () => {
  const statuses = [
    'estimate',
    'intake',
    'teardown',
    'parts_ordering',
    'parts_receiving',
    'body_structure',
    'paint_prep',
    'paint_booth',
    'reassembly',
    'qc_calibration',
    'detail',
    'ready_pickup',
    'delivered',
  ];
  const priorities = ['low', 'normal', 'high', 'urgent', 'rush'];
  const customers = [
    { name: 'John Smith', phone: '(555) 123-4567', email: 'john@email.com' },
    {
      name: 'Sarah Johnson',
      phone: '(555) 234-5678',
      email: 'sarah@email.com',
    },
    { name: 'Mike Wilson', phone: '(555) 345-6789', email: 'mike@email.com' },
    { name: 'Lisa Brown', phone: '(555) 456-7890', email: 'lisa@email.com' },
    { name: 'David Lee', phone: '(555) 567-8901', email: 'david@email.com' },
  ];
  const vehicles = [
    { year: 2020, make: 'Toyota', model: 'Camry', vin: '1HGBH41JXMN109186' },
    { year: 2019, make: 'Honda', model: 'Accord', vin: '2HGBH41JXMN109187' },
    { year: 2021, make: 'Ford', model: 'F-150', vin: '3HGBH41JXMN109188' },
    {
      year: 2018,
      make: 'Chevrolet',
      model: 'Silverado',
      vin: '4HGBH41JXMN109189',
    },
    { year: 2022, make: 'BMW', model: '3 Series', vin: '5HGBH41JXMN109190' },
  ];
  const technicians = [
    { name: 'Alex Rodriguez', avatar: null },
    { name: 'Maria Garcia', avatar: null },
    { name: 'James Wilson', avatar: null },
    { name: 'Jennifer Davis', avatar: null },
  ];
  const partsStatuses = ['pending', 'ordered', 'partial', 'all_received'];

  return Array.from({ length: 25 }).map((_, i) => {
    const customer = customers[i % customers.length];
    const vehicle = vehicles[i % vehicles.length];
    const technician = technicians[i % technicians.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const partsStatus =
      partsStatuses[Math.floor(Math.random() * partsStatuses.length)];

    // Calculate days in shop (0-30 random)
    const daysInShop = Math.floor(Math.random() * 30);
    const daysInCurrentStatus = Math.floor(Math.random() * 7) + 1;

    // Calculate progress percentage based on status
    const statusProgressMap = {
      estimate: 5,
      intake: 10,
      teardown: 20,
      parts_ordering: 25,
      parts_receiving: 35,
      body_structure: 50,
      paint_prep: 65,
      paint_booth: 75,
      reassembly: 85,
      qc_calibration: 90,
      detail: 95,
      ready_pickup: 98,
      delivered: 100,
    };
    const progressPercentage =
      statusProgressMap[status] + Math.floor(Math.random() * 10) - 5;

    // Generate target date (5-20 days from now)
    const targetDate = new Date();
    targetDate.setDate(
      targetDate.getDate() + Math.floor(Math.random() * 15) + 5
    );

    return {
      id: `job-${i + 1}`,
      jobNumber: `JOB-${1000 + i + 1}`,
      status: status,
      priority: priority,
      customer: customer,
      vehicle: vehicle,
      assignedTechnician: technician,
      daysInShop: daysInShop,
      daysInCurrentStatus: daysInCurrentStatus,
      progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
      targetDate: targetDate.toISOString(),
      partsStatus: partsStatus,
      insurance: {
        company: ['State Farm', 'GEICO', 'Progressive', 'Allstate'][
          Math.floor(Math.random() * 4)
        ],
        claimNumber: `CLM-${100000 + i}`,
      },
      createdAt: new Date(
        Date.now() - daysInShop * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
};

// Enhanced GET endpoint with dashboard navigation support
router.get('/', authenticateToken(), async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID is required',
      });
    }

    // Parse query parameters for dashboard navigation
    const filters = parseJobFilters(req);

    // Build Sequelize where clause
    const whereClause = { shop_id: shopId };
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    // Query repair orders from local database using Sequelize with associations
    const jobs = await RepairOrder.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email'],
          required: false
        },
        {
          model: VehicleProfile,
          as: 'vehicleProfile',
          attributes: ['id', 'vin', 'year', 'make', 'model', 'trim'],
          required: false
        },
        {
          model: Claim,
          as: 'claimManagement',
          attributes: ['id', 'claimNumber', 'claimStatus'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    // Transform database jobs to match expected format
    let transformedJobs = (jobs || []).map(job => {
      const jobData = job.get({ plain: true });
      const customer = jobData.customer || {};
      const vehicle = jobData.vehicleProfile || {};
      const claim = jobData.claimManagement || {};

      return {
        id: jobData.id,
        jobNumber: jobData.repairOrderNumber || `RO-${jobData.id}`,
        status: jobData.roStatus || 'estimate',
        priority: jobData.isPriority ? 'high' : 'normal',
        customer: {
          name: customer.firstName && customer.lastName
            ? `${customer.firstName} ${customer.lastName}`
            : 'Unknown Customer',
          phone: customer.phone || '',
          email: customer.email || '',
        },
        vehicle: vehicle.vin ? {
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim
        } : null,
        assignedTechnician: null, // TODO: Add technician relationship
        daysInShop: jobData.dateCreated ? Math.floor((Date.now() - new Date(jobData.dateCreated)) / (1000 * 60 * 60 * 24)) : 0,
        daysInCurrentStatus: 0, // TODO: Calculate from status history
        progressPercentage: jobData.productionPercentComplete || (jobData.roStatus === 'delivered' ? 100 : 10),
        targetDate: jobData.promisedDeliveryDate || null,
        partsStatus: jobData.allPartsReceived ? 'received' : 'pending',
        insurance: {
          company: '', // TODO: Get from claim relationship
          claimNumber: claim.claimNumber || '',
        },
        createdAt: jobData.dateCreated,
        updatedAt: jobData.updatedAt,
        lastUpdated: jobData.updatedAt || jobData.dateCreated,
      };
    });

    // Apply view-specific and other filters to transformed jobs
    transformedJobs = applyJobViewFilters(transformedJobs, filters);

    // Apply highlighting if requested
    if (filters.highlight) {
      transformedJobs = applyJobHighlighting(transformedJobs, filters.highlight);
    }

    // Sort based on view context
    if (filters.view === 'capacity') {
      transformedJobs.sort((a, b) => b.daysInShop - a.daysInShop);
    } else if (filters.urgent) {
      transformedJobs.sort((a, b) => {
        const urgencyOrder = { rush: 0, urgent: 1, high: 2, normal: 3, low: 4 };
        return urgencyOrder[a.priority] - urgencyOrder[b.priority];
      });
    } else {
      transformedJobs.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    }

    // Calculate capacity metrics if requested
    let capacityMetrics = null;
    if (filters.view === 'capacity' || filters.forecast) {
      const stageDistribution = transformedJobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {});

      const avgCycleTime =
        transformedJobs.reduce((sum, job) => sum + job.daysInShop, 0) / transformedJobs.length || 0;

      capacityMetrics = {
        totalActiveJobs: transformedJobs.filter(
          j => !['delivered', 'cancelled'].includes(j.status)
        ).length,
        stageDistribution,
        avgCycleTime: Math.round(avgCycleTime * 10) / 10,
        bottlenecks: Object.entries(stageDistribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([stage, count]) => ({ stage, count })),
        utilizationRate: Math.min(95, Math.round((transformedJobs.length / 30) * 100)), // Assume 30 job capacity
      };
    }

    // Map jobs to frontend format
    const mappedJobs = transformedJobs.map(job => {
      // Convert mock data structure to proper format
      return {
        id: job.id,
        roNumber: job.jobNumber,
        customer: job.customer?.name || 'Unknown',
        phone: job.customer?.phone || '',
        vehicle: job.vehicle
          ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`.trim()
          : 'Unknown Vehicle',
        status: job.status,
        priority: job.priority,
        dueDate: job.targetDate,
        insurer: job.insurance?.company || '',
        estimator: job.assignedTechnician?.name || '',
        claimNumber: job.insurance?.claimNumber || '',
        rentalCoverage: false, // Default value
      };
    });

    // Prepare response with metadata
    const response = {
      success: true,
      data: mappedJobs,
      pagination: {
        total: mappedJobs.length,
        page: 1,
        limit: mappedJobs.length,
        hasMore: false,
      },
      filters: {
        applied: filters._metadata.totalFiltersApplied,
        context: filters._metadata.viewContext,
        hasHighlight: filters._metadata.hasHighlight,
      },
    };

    // Add capacity metrics if available
    if (capacityMetrics) {
      response.capacity = capacityMetrics;
    }

    // Add forecast data if requested
    if (filters.forecast) {
      const nextWeekJobs = transformedJobs.filter(job => {
        const targetDate = new Date(job.targetDate);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return targetDate <= nextWeek;
      });

      response.forecast = {
        nextWeekDeliveries: nextWeekJobs.length,
        upcomingPickups: transformedJobs.filter(j => j.status === 'ready_pickup').length,
        overdueJobs: transformedJobs.filter(j => j.daysInShop > 14).length,
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message,
    });
  }
});

// Get single job
router.get('/:id', (req, res) => {
  try {
    const jobs = generateMockJobs();
    const job = jobs.find(j => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Update a job
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // In a real app, this would update the database
    console.log(`Updating job ${id} with data:`, updateData);

    // Return success with updated job data
    res.json({
      success: true,
      job: {
        id,
        ...updateData,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Move a job to a new status
router.post('/:id/move', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const validStatuses = [
      'estimate',
      'intake',
      'teardown',
      'parts_ordering',
      'parts_receiving',
      'body_structure',
      'paint_prep',
      'paint_booth',
      'reassembly',
      'qc_calibration',
      'detail',
      'ready_pickup',
      'delivered',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // In a real app, this would update the database
    console.log(`Moving job ${id} to status ${status}`, { notes });

    // Return success with updated job
    res.json({
      success: true,
      job: {
        id,
        status,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          {
            status,
            changedAt: new Date().toISOString(),
            notes,
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error moving job:', error);
    res.status(500).json({ error: 'Failed to move job' });
  }
});

module.exports = router;
