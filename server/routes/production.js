const express = require('express');
const router = express.Router();
const { Job, Customer, Vehicle, User } = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const { auditLogger } = require('../middleware/security');
const rateLimit = require('express-rate-limit');

// Rate limiting for production updates
const productionUpdateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 stage updates per minute
  message: { error: 'Too many production updates. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Production stage configuration and validation
const PRODUCTION_STAGES = {
  intake: {
    name: 'Intake',
    order: 1,
    allowedNext: ['disassembly', 'estimate'],
    timeLimit: 24, // hours
    requirements: ['vehicle_inspection', 'photos_taken'],
  },
  disassembly: {
    name: 'Disassembly',
    order: 2,
    allowedNext: ['body_structure', 'parts_ordered'],
    timeLimit: 48,
    requirements: ['damage_assessment', 'parts_list'],
  },
  parts_ordered: {
    name: 'Parts Ordered',
    order: 3,
    allowedNext: ['body_structure', 'waiting_parts'],
    timeLimit: 168, // 7 days
    requirements: ['parts_quote', 'vendor_orders'],
  },
  waiting_parts: {
    name: 'Waiting for Parts',
    order: 4,
    allowedNext: ['body_structure', 'parts_received'],
    timeLimit: 336, // 14 days
    requirements: ['parts_tracking'],
  },
  parts_received: {
    name: 'Parts Received',
    order: 5,
    allowedNext: ['body_structure'],
    timeLimit: 24,
    requirements: ['parts_inspection', 'quality_check'],
  },
  body_structure: {
    name: 'Body & Structure',
    order: 6,
    allowedNext: ['paint_prep', 'mechanical'],
    timeLimit: 72,
    requirements: ['structural_repairs', 'alignment_check'],
  },
  mechanical: {
    name: 'Mechanical',
    order: 7,
    allowedNext: ['paint_prep', 'electrical'],
    timeLimit: 48,
    requirements: ['mechanical_repairs', 'functionality_test'],
  },
  electrical: {
    name: 'Electrical',
    order: 8,
    allowedNext: ['paint_prep'],
    timeLimit: 24,
    requirements: ['electrical_repairs', 'system_diagnostics'],
  },
  paint_prep: {
    name: 'Paint Prep',
    order: 9,
    allowedNext: ['paint_booth'],
    timeLimit: 48,
    requirements: ['surface_prep', 'primer_applied'],
  },
  paint_booth: {
    name: 'Paint Booth',
    order: 10,
    allowedNext: ['paint_finish'],
    timeLimit: 24,
    requirements: ['base_coat', 'color_match'],
  },
  paint_finish: {
    name: 'Paint Finish',
    order: 11,
    allowedNext: ['reassembly'],
    timeLimit: 24,
    requirements: ['clear_coat', 'paint_cure'],
  },
  reassembly: {
    name: 'Reassembly',
    order: 12,
    allowedNext: ['qc_calibration'],
    timeLimit: 48,
    requirements: ['parts_installed', 'torque_specs'],
  },
  qc_calibration: {
    name: 'Quality Control & Calibration',
    order: 13,
    allowedNext: ['detail'],
    timeLimit: 24,
    requirements: ['safety_inspection', 'adas_calibration'],
  },
  detail: {
    name: 'Detail & Final Inspection',
    order: 14,
    allowedNext: ['ready_pickup'],
    timeLimit: 12,
    requirements: ['cleaning', 'final_photos'],
  },
  ready_pickup: {
    name: 'Ready for Pickup',
    order: 15,
    allowedNext: ['delivered'],
    timeLimit: 72,
    requirements: ['customer_notification', 'invoice_ready'],
  },
  delivered: {
    name: 'Delivered',
    order: 16,
    allowedNext: [],
    timeLimit: null,
    requirements: ['customer_signature', 'payment_complete'],
  },
};

// Simple 8-stage mapping for production board
const SIMPLE_STAGES = {
  estimating: 'intake',
  scheduled: 'intake',
  disassembly: 'disassembly',
  parts_pending: 'waiting_parts',
  in_repair: 'body_structure',
  reassembly: 'reassembly',
  qc: 'qc_calibration',
  complete: 'delivered',
};

// GET /api/production/stages - Get production stage configuration
router.get('/stages', async (req, res) => {
  try {
    res.json({
      stages: PRODUCTION_STAGES,
      totalStages: Object.keys(PRODUCTION_STAGES).length,
      averageCycleTime: 12, // days
      metadata: {
        lastUpdated: new Date().toISOString(),
        stageCount: Object.keys(PRODUCTION_STAGES).length,
      },
    });
  } catch (error) {
    console.error('Error fetching production stages:', error);
    res.status(500).json({ error: 'Failed to fetch production stages' });
  }
});

// POST /api/production/update-stage - Drag-and-drop stage update with validation
router.post('/update-stage', productionUpdateLimit, async (req, res) => {
  try {
    const {
      jobId,
      newStage,
      technicianId,
      notes,
      validationOverride = false,
    } = req.body;
    const userId = req.user?.id;

    if (!jobId || !newStage) {
      return res
        .status(400)
        .json({ error: 'Job ID and new stage are required' });
    }

    // Fetch job with current stage
    const job = await Job.findByPk(jobId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'technician' },
      ],
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const currentStage = job.status;
    const stageConfig = PRODUCTION_STAGES[newStage];
    const currentStageConfig = PRODUCTION_STAGES[currentStage];

    if (!stageConfig) {
      return res.status(400).json({ error: 'Invalid stage specified' });
    }

    // Stage transition validation
    const validationResult = validateStageTransition(
      currentStage,
      newStage,
      job,
      validationOverride
    );
    if (!validationResult.isValid && !validationOverride) {
      return res.status(400).json({
        error: 'Invalid stage transition',
        validation: validationResult,
        canOverride: validationResult.canOverride,
      });
    }

    // Update job stage with transition tracking
    const previousStage = job.status;
    const stageTransitionTime = new Date();

    await job.update({
      status: newStage,
      technicianId: technicianId || job.technicianId,
      lastUpdated: stageTransitionTime,
      stageHistory: [
        ...(job.stageHistory || []),
        {
          from: previousStage,
          to: newStage,
          timestamp: stageTransitionTime,
          userId,
          technicianId,
          notes,
          duration: currentStageConfig
            ? calculateStageDuration(job.lastUpdated, stageTransitionTime)
            : null,
        },
      ],
    });

    // Audit logging
    auditLogger.info('Stage transition', {
      jobId,
      from: previousStage,
      to: newStage,
      userId,
      technicianId,
      timestamp: stageTransitionTime,
      validationOverride,
    });

    // Real-time WebSocket broadcast
    const updatedJob = await Job.findByPk(jobId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'technician' },
      ],
    });

    // Broadcast to all connected clients
    realtimeService.broadcastToAll('stage_updated', {
      jobId,
      job: updatedJob,
      previousStage,
      newStage,
      timestamp: stageTransitionTime,
      userId,
      technicianId,
    });

    // Broadcast to specific shop
    realtimeService.broadcastToShop(job.shopId, 'production_update', {
      type: 'stage_change',
      jobId,
      job: updatedJob,
      change: {
        from: previousStage,
        to: newStage,
        timestamp: stageTransitionTime,
        user: req.user?.name || 'System',
        technician: updatedJob.technician?.name,
      },
    });

    // Check for stage completion requirements
    const completionChecks = await validateStageCompletion(
      updatedJob,
      newStage
    );

    res.json({
      success: true,
      job: updatedJob,
      transition: {
        from: previousStage,
        to: newStage,
        timestamp: stageTransitionTime,
        duration: calculateStageDuration(job.lastUpdated, stageTransitionTime),
      },
      validation: validationResult,
      completionChecks,
      nextStages: stageConfig.allowedNext,
      recommendations: generateStageRecommendations(updatedJob, newStage),
    });
  } catch (error) {
    console.error('Error updating job stage:', error);
    res.status(500).json({ error: 'Failed to update job stage' });
  }
});

// POST /api/production/batch-update - Batch stage updates for multiple jobs
router.post('/batch-update', productionUpdateLimit, async (req, res) => {
  try {
    const { updates } = req.body; // Array of {jobId, newStage, technicianId, notes}
    const userId = req.user?.id;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    if (updates.length > 10) {
      return res
        .status(400)
        .json({ error: 'Maximum 10 batch updates allowed' });
    }

    const results = [];
    const failures = [];

    // Process each update
    for (const update of updates) {
      try {
        const { jobId, newStage, technicianId, notes } = update;

        const job = await Job.findByPk(jobId);
        if (!job) {
          failures.push({ jobId, error: 'Job not found' });
          continue;
        }

        // Validate transition
        const validationResult = validateStageTransition(
          job.status,
          newStage,
          job
        );
        if (!validationResult.isValid) {
          failures.push({
            jobId,
            error: 'Invalid stage transition',
            validation: validationResult,
          });
          continue;
        }

        // Update job
        const previousStage = job.status;
        const timestamp = new Date();

        await job.update({
          status: newStage,
          technicianId: technicianId || job.technicianId,
          lastUpdated: timestamp,
          stageHistory: [
            ...(job.stageHistory || []),
            {
              from: previousStage,
              to: newStage,
              timestamp,
              userId,
              technicianId,
              notes,
              duration: calculateStageDuration(job.lastUpdated, timestamp),
            },
          ],
        });

        results.push({
          jobId,
          success: true,
          from: previousStage,
          to: newStage,
          timestamp,
        });

        // Real-time broadcast
        realtimeService.broadcastToShop(job.shopId, 'production_batch_update', {
          jobId,
          from: previousStage,
          to: newStage,
          timestamp,
          userId,
        });
      } catch (error) {
        failures.push({ jobId: update.jobId, error: error.message });
      }
    }

    // Audit batch update
    auditLogger.info('Batch stage update', {
      userId,
      totalUpdates: updates.length,
      successful: results.length,
      failed: failures.length,
      timestamp: new Date(),
    });

    res.json({
      success: results.length > 0,
      results,
      failures,
      summary: {
        total: updates.length,
        successful: results.length,
        failed: failures.length,
      },
    });
  } catch (error) {
    console.error('Error in batch stage update:', error);
    res.status(500).json({ error: 'Failed to process batch update' });
  }
});

// GET /api/production/workload - Current production workload analysis
router.get('/workload', async (req, res) => {
  try {
    const shopId = req.user?.shopId || 1;

    // Get all active jobs grouped by stage
    const jobs = await Job.findAll({
      where: {
        shopId,
        status: { [require('sequelize').Op.notIn]: ['delivered', 'cancelled'] },
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'technician' },
      ],
    });

    // Group jobs by stage
    const workloadByStage = {};
    const bottlenecks = [];
    const recommendations = [];

    Object.keys(PRODUCTION_STAGES).forEach(stage => {
      const stageJobs = jobs.filter(job => job.status === stage);
      const averageStageTime = calculateAverageStageTime(stage);
      const capacity = getStageCapacity(stage);

      workloadByStage[stage] = {
        name: PRODUCTION_STAGES[stage].name,
        jobCount: stageJobs.length,
        capacity,
        utilization: capacity > 0 ? (stageJobs.length / capacity) * 100 : 0,
        averageTime: averageStageTime,
        jobs: stageJobs.map(job => ({
          id: job.id,
          jobNumber: job.jobNumber,
          customer: job.customer?.name,
          vehicle: `${job.vehicle?.year} ${job.vehicle?.make} ${job.vehicle?.model}`,
          daysInStage: calculateDaysInStage(job.lastUpdated),
          priority: job.priority,
          technician: job.technician?.name,
        })),
        isBottleneck: stageJobs.length > capacity * 0.8,
      };

      // Identify bottlenecks
      if (stageJobs.length > capacity * 0.8) {
        bottlenecks.push({
          stage,
          name: PRODUCTION_STAGES[stage].name,
          utilization: workloadByStage[stage].utilization,
          recommendation: generateBottleneckRecommendation(
            stage,
            stageJobs.length,
            capacity
          ),
        });
      }
    });

    // Generate workload recommendations
    const totalCapacity = Object.values(workloadByStage).reduce(
      (sum, stage) => sum + stage.capacity,
      0
    );
    const totalJobs = jobs.length;
    const overallUtilization =
      totalCapacity > 0 ? (totalJobs / totalCapacity) * 100 : 0;

    if (overallUtilization > 85) {
      recommendations.push({
        type: 'capacity_warning',
        message:
          'Shop capacity is near maximum. Consider scheduling adjustments.',
        priority: 'high',
      });
    }

    res.json({
      workloadByStage,
      bottlenecks,
      recommendations,
      summary: {
        totalJobs,
        totalCapacity,
        overallUtilization,
        averageCycleTime: calculateAverageCycleTime(jobs),
        completionRate: calculateCompletionRate(),
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        shopId,
      },
    });
  } catch (error) {
    console.error('Error fetching workload analysis:', error);
    res.status(500).json({ error: 'Failed to fetch workload analysis' });
  }
});

// GET /api/production/technician-assignments - Technician workload and assignments
router.get('/technician-assignments', async (req, res) => {
  try {
    const shopId = req.user?.shopId || 1;

    // Get all technicians with their current assignments
    const technicians = await User.findAll({
      where: {
        shopId,
        role: 'technician',
        isActive: true,
      },
    });

    const assignments = [];

    for (const tech of technicians) {
      const currentJobs = await Job.findAll({
        where: {
          shopId,
          technicianId: tech.id,
          status: {
            [require('sequelize').Op.notIn]: ['delivered', 'cancelled'],
          },
        },
        include: [
          { model: Customer, as: 'customer' },
          { model: Vehicle, as: 'vehicle' },
        ],
      });

      const workloadHours = currentJobs.reduce((total, job) => {
        return total + (job.estimatedHours || 0);
      }, 0);

      const efficiency = await calculateTechnicianEfficiency(tech.id);

      assignments.push({
        technician: {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          skills: tech.skills || [],
          hourlyRate: tech.hourlyRate,
        },
        workload: {
          currentJobs: currentJobs.length,
          estimatedHours: workloadHours,
          utilization: calculateUtilization(workloadHours, 40), // 40 hour work week
          efficiency: efficiency,
        },
        jobs: currentJobs.map(job => ({
          id: job.id,
          jobNumber: job.jobNumber,
          customer: job.customer?.name,
          vehicle: `${job.vehicle?.year} ${job.vehicle?.make} ${job.vehicle?.model}`,
          stage: job.status,
          priority: job.priority,
          estimatedHours: job.estimatedHours,
          daysInStage: calculateDaysInStage(job.lastUpdated),
        })),
        availability: {
          isAvailable: workloadHours < 35, // Available if less than 35 hours assigned
          capacity: Math.max(0, 40 - workloadHours),
          nextAvailable: calculateNextAvailableDate(workloadHours),
        },
      });
    }

    // Sort by utilization
    assignments.sort((a, b) => a.workload.utilization - b.workload.utilization);

    res.json({
      assignments,
      summary: {
        totalTechnicians: technicians.length,
        averageUtilization:
          assignments.reduce((sum, a) => sum + a.workload.utilization, 0) /
          assignments.length,
        availableTechnicians: assignments.filter(
          a => a.availability.isAvailable
        ).length,
        overloadedTechnicians: assignments.filter(
          a => a.workload.utilization > 100
        ).length,
      },
      recommendations: generateTechnicianRecommendations(assignments),
    });
  } catch (error) {
    console.error('Error fetching technician assignments:', error);
    res.status(500).json({ error: 'Failed to fetch technician assignments' });
  }
});

// Helper Functions
function validateStageTransition(
  currentStage,
  newStage,
  job,
  override = false
) {
  const currentConfig = PRODUCTION_STAGES[currentStage];
  const newConfig = PRODUCTION_STAGES[newStage];

  if (!currentConfig || !newConfig) {
    return {
      isValid: false,
      reason: 'Invalid stage configuration',
      canOverride: false,
    };
  }

  // Allow backward transitions with override
  if (newConfig.order < currentConfig.order && !override) {
    return {
      isValid: false,
      reason: 'Backward stage transition not allowed without override',
      canOverride: true,
    };
  }

  // Check if transition is in allowed next stages
  if (
    newConfig.order > currentConfig.order &&
    !currentConfig.allowedNext.includes(newStage)
  ) {
    return {
      isValid: false,
      reason: `Cannot transition directly from ${currentConfig.name} to ${newConfig.name}`,
      canOverride: true,
    };
  }

  // Check stage requirements (simplified)
  const missingRequirements = currentConfig.requirements.filter(
    req => !job.completedRequirements?.includes(req)
  );

  if (missingRequirements.length > 0 && !override) {
    return {
      isValid: false,
      reason: 'Missing stage requirements',
      missingRequirements,
      canOverride: true,
    };
  }

  return { isValid: true, reason: 'Valid transition' };
}

function calculateStageDuration(startTime, endTime) {
  if (!startTime || !endTime) return null;
  return Math.round(
    (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60)
  ); // hours
}

function calculateDaysInStage(lastUpdated) {
  if (!lastUpdated) return 0;
  return Math.floor(
    (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24)
  );
}

function calculateAverageStageTime(stage) {
  // Mock calculation - in real implementation, query historical data
  const baseTimes = {
    intake: 4,
    disassembly: 8,
    body_structure: 24,
    paint_prep: 16,
    paint_booth: 8,
    reassembly: 16,
    qc_calibration: 4,
    detail: 2,
  };
  return baseTimes[stage] || 8;
}

function getStageCapacity(stage) {
  // Mock capacity based on shop configuration
  const capacities = {
    intake: 5,
    disassembly: 3,
    body_structure: 4,
    paint_prep: 3,
    paint_booth: 2,
    reassembly: 4,
    qc_calibration: 2,
    detail: 3,
  };
  return capacities[stage] || 2;
}

async function validateStageCompletion(job, stage) {
  const requirements = PRODUCTION_STAGES[stage].requirements;
  const completed = job.completedRequirements || [];

  return {
    required: requirements,
    completed: completed,
    missing: requirements.filter(req => !completed.includes(req)),
    completionRate: (completed.length / requirements.length) * 100,
  };
}

function generateStageRecommendations(job, stage) {
  const recommendations = [];
  const stageConfig = PRODUCTION_STAGES[stage];

  // Time-based recommendations
  const daysInStage = calculateDaysInStage(job.lastUpdated);
  if (stageConfig.timeLimit && daysInStage > stageConfig.timeLimit / 24) {
    recommendations.push({
      type: 'time_warning',
      message: `Job has been in ${stageConfig.name} longer than expected`,
      action: 'Review progress and consider escalation',
    });
  }

  // Next stage preparation
  if (stageConfig.allowedNext.length > 0) {
    recommendations.push({
      type: 'next_stage',
      message: `Prepare for next stage: ${stageConfig.allowedNext.map(s => PRODUCTION_STAGES[s].name).join(' or ')}`,
      action: 'Verify requirements completion',
    });
  }

  return recommendations;
}

function generateBottleneckRecommendation(stage, count, capacity) {
  if (count > capacity * 1.2) {
    return 'Consider adding additional resources or overtime';
  } else if (count > capacity) {
    return 'Monitor closely and optimize workflow';
  }
  return 'Within acceptable limits';
}

async function calculateTechnicianEfficiency(technicianId) {
  // Mock efficiency calculation
  return Math.floor(Math.random() * 20) + 80; // 80-100% efficiency
}

function calculateUtilization(assignedHours, totalHours) {
  return totalHours > 0 ? (assignedHours / totalHours) * 100 : 0;
}

function calculateNextAvailableDate(currentWorkload) {
  const hoursPerDay = 8;
  const daysUntilAvailable = Math.ceil(
    Math.max(0, currentWorkload - 40) / hoursPerDay
  );
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysUntilAvailable);
  return nextDate.toISOString().split('T')[0];
}

function calculateAverageCycleTime(jobs) {
  if (jobs.length === 0) return 0;
  const completedJobs = jobs.filter(job => job.status === 'delivered');
  if (completedJobs.length === 0) return 0;

  const totalDays = completedJobs.reduce((sum, job) => {
    if (job.createdAt && job.deliveredAt) {
      return (
        sum +
        Math.floor(
          (new Date(job.deliveredAt) - new Date(job.createdAt)) /
            (1000 * 60 * 60 * 24)
        )
      );
    }
    return sum;
  }, 0);

  return Math.round(totalDays / completedJobs.length);
}

function calculateCompletionRate() {
  // Mock completion rate
  return 85.5;
}

function generateTechnicianRecommendations(assignments) {
  const recommendations = [];
  const overloaded = assignments.filter(a => a.workload.utilization > 100);
  const underutilized = assignments.filter(a => a.workload.utilization < 60);

  if (overloaded.length > 0) {
    recommendations.push({
      type: 'workload_balance',
      message: `${overloaded.length} technician(s) are overloaded`,
      action: 'Consider redistributing work or scheduling overtime',
    });
  }

  if (underutilized.length > 0) {
    recommendations.push({
      type: 'capacity_utilization',
      message: `${underutilized.length} technician(s) have additional capacity`,
      action: 'Consider assigning additional work or cross-training',
    });
  }

  return recommendations;
}

// ============================================================
// SIMPLE PRODUCTION BOARD API ENDPOINTS
// ============================================================

/**
 * GET /api/production/board
 * Get all jobs for the simple 8-stage production board
 */
router.get('/board', async (req, res) => {
  try {
    const shopId = req.user?.shopId || 1;

    // Get all active jobs
    const jobs = await Job.findAll({
      where: {
        shopId,
        status: { [require('sequelize').Op.notIn]: ['cancelled', 'archived'] },
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'technician' },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Transform jobs for frontend
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      roNumber: job.jobNumber || `RO-${job.id}`,
      customerName: job.customer
        ? `${job.customer.firstName || ''} ${job.customer.lastName || ''}`
        : 'Unknown Customer',
      vehicle: job.vehicle
        ? `${job.vehicle.year || ''} ${job.vehicle.make || ''} ${job.vehicle.model || ''}`
        : 'Unknown Vehicle',
      vin: job.vehicle?.vin || '',
      stage: mapToSimpleStage(job.status),
      priority: job.priority || 'normal',
      technician: job.technician?.name || null,
      technicianId: job.technicianId || null,
      daysInShop: calculateDaysInStage(job.createdAt),
      progress: calculateProgress(job),
      estimatedValue: parseFloat(job.estimatedTotal || 0),
      photo: null, // TODO: Add photo support
    }));

    res.json({
      success: true,
      jobs: transformedJobs,
      metadata: {
        total: transformedJobs.length,
        shopId,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching production board:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production board',
      message: error.message,
    });
  }
});

/**
 * PUT /api/production/board/:jobId/status
 * Update job status (drag-and-drop handler)
 */
router.put('/board/:jobId/status', productionUpdateLimit, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    // Map simple stage to detailed stage
    const detailedStage = SIMPLE_STAGES[status] || status;

    // Find and update job
    const job = await Job.findByPk(jobId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'technician' },
      ],
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const previousStatus = job.status;
    const transitionTime = new Date();

    // Determine movement type
    const stageOrder = {
      estimating: 1,
      scheduled: 2,
      disassembly: 3,
      parts_pending: 4,
      in_repair: 5,
      reassembly: 6,
      qc: 7,
      complete: 8,
    };
    const fromOrder = stageOrder[previousStatus] || 0;
    const toOrder = stageOrder[status] || 0;
    
    let movementType = 'forward';
    if (toOrder < fromOrder) movementType = 'backward';
    else if (toOrder > fromOrder + 1) movementType = 'skip';
    else if (toOrder === fromOrder) movementType = 'parallel';

    // Get previous stage history to calculate duration
    const JobStageHistory = require('../database/models').JobStageHistory;
    const lastHistory = await JobStageHistory.findOne({
      where: { jobId, shopId: job.shopId },
      order: [['transitionTime', 'DESC']],
    });

    const stageStartTime = lastHistory?.transitionTime || job.createdAt || transitionTime;
    const stageDuration = Math.round((transitionTime - new Date(stageStartTime)) / 1000 / 60); // minutes

    // Update job
    await job.update({
      status: detailedStage,
      lastUpdated: transitionTime,
    });

    // Create stage history entry
    try {
      await JobStageHistory.create({
        shopId: job.shopId,
        jobId,
        fromStage: previousStatus,
        toStage: detailedStage,
        movementType,
        movementReason: 'normal_progression',
        transitionTime,
        stageStartTime: lastHistory?.transitionTime || job.createdAt,
        stageEndTime: transitionTime,
        stageDuration,
        technicianId: job.technicianId || req.user?.id,
        authorizedBy: req.user?.id,
        notes: req.body.notes || null,
      });
    } catch (historyError) {
      console.warn('Failed to create stage history:', historyError.message);
    }

    // Audit logging
    auditLogger.info('Production board status update', {
      jobId,
      from: previousStatus,
      to: detailedStage,
      userId: req.user?.id,
      timestamp: transitionTime,
      movementType,
    });

    // Real-time WebSocket broadcast
    if (realtimeService) {
      realtimeService.broadcastToShop(job.shopId, 'production_board_update', {
        jobId,
        from: previousStatus,
        to: detailedStage,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        status: detailedStage,
        simpleStage: status,
        previousStatus,
      },
      message: 'Job status updated successfully',
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job status',
      message: error.message,
    });
  }
});

/**
 * GET /api/production/board/metrics
 * Get production board metrics
 */
router.get('/board/metrics', async (req, res) => {
  try {
    const shopId = req.user?.shopId || 1;

    // Get all active jobs
    const jobs = await Job.findAll({
      where: {
        shopId,
        status: { [require('sequelize').Op.notIn]: ['cancelled', 'archived'] },
      },
      include: [{ model: Customer, as: 'customer' }],
    });

    // Calculate metrics
    const totalJobs = jobs.length;
    const avgCycleTime = jobs.length > 0
      ? Math.round(
          jobs.reduce((sum, job) => sum + calculateDaysInStage(job.createdAt), 0) /
            jobs.length
        )
      : 0;

    // Get completed jobs this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const completedThisWeek = await Job.count({
      where: {
        shopId,
        status: 'delivered',
        updatedAt: { [require('sequelize').Op.gte]: oneWeekAgo },
      },
    });

    const completedJobs = await Job.findAll({
      where: {
        shopId,
        status: 'delivered',
        updatedAt: { [require('sequelize').Op.gte]: oneWeekAgo },
      },
    });

    const revenueThisWeek = completedJobs.reduce(
      (sum, job) => sum + parseFloat(job.invoicedTotal || 0),
      0
    );

    res.json({
      success: true,
      metrics: {
        totalJobs,
        avgCycleTime,
        completedThisWeek,
        revenueThisWeek,
      },
      metadata: {
        shopId,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching board metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
      message: error.message,
    });
  }
});

/**
 * PUT /api/production/board/:jobId/assign
 * Assign technician to job
 */
router.put('/board/:jobId/assign', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { technicianId } = req.body;

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    await job.update({
      technicianId,
      lastUpdated: new Date(),
    });

    // Real-time broadcast
    if (realtimeService) {
      realtimeService.broadcastToShop(job.shopId, 'technician_assigned', {
        jobId,
        technicianId,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Technician assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning technician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign technician',
      message: error.message,
    });
  }
});

/**
 * PUT /api/production/board/:jobId/priority
 * Change job priority
 */
router.put('/board/:jobId/priority', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { priority } = req.body;

    if (!['normal', 'urgent', 'rush'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority. Must be normal, urgent, or rush',
      });
    }

    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    await job.update({
      priority,
      lastUpdated: new Date(),
    });

    // Real-time broadcast
    if (realtimeService) {
      realtimeService.broadcastToShop(job.shopId, 'priority_changed', {
        jobId,
        priority,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Priority updated successfully',
    });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update priority',
      message: error.message,
    });
  }
});

// Helper function to map detailed stage to simple stage
function mapToSimpleStage(detailedStage) {
  // Reverse mapping
  const reverseMap = {
    intake: 'estimating',
    estimate: 'estimating',
    disassembly: 'disassembly',
    parts_ordered: 'parts_pending',
    waiting_parts: 'parts_pending',
    parts_received: 'parts_pending',
    body_structure: 'in_repair',
    mechanical: 'in_repair',
    electrical: 'in_repair',
    paint_prep: 'in_repair',
    paint_booth: 'in_repair',
    paint_finish: 'in_repair',
    reassembly: 'reassembly',
    qc_calibration: 'qc',
    detail: 'qc',
    ready_pickup: 'complete',
    delivered: 'complete',
  };

  return reverseMap[detailedStage] || 'estimating';
}

// Helper function to calculate progress
function calculateProgress(job) {
  const stageProgress = {
    intake: 5,
    estimate: 10,
    disassembly: 20,
    parts_ordered: 25,
    waiting_parts: 30,
    parts_received: 35,
    body_structure: 50,
    mechanical: 55,
    electrical: 60,
    paint_prep: 65,
    paint_booth: 75,
    paint_finish: 80,
    reassembly: 85,
    qc_calibration: 90,
    detail: 95,
    ready_pickup: 98,
    delivered: 100,
  };

  return stageProgress[job.status] || 0;
}

module.exports = router;
