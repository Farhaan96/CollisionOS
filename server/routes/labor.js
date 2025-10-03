const express = require('express');
const router = express.Router();
const { Job, User, LaborTimeEntry, WorkOrder } = require('../database/models');
const { realtimeService } = require('../services/realtimeService');
const { auditLogger } = require('../middleware/security');
const rateLimit = require('express-rate-limit');

// Rate limiting for labor tracking
const laborTrackingLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 time entries per minute (start/stop/break)
  message: { error: 'Too many labor tracking requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Labor operation types
const LABOR_OPERATIONS = {
  CLOCK_IN: 'clock_in',
  CLOCK_OUT: 'clock_out',
  START_JOB: 'start_job',
  STOP_JOB: 'stop_job',
  BREAK_START: 'break_start',
  BREAK_END: 'break_end',
  LUNCH_START: 'lunch_start',
  LUNCH_END: 'lunch_end',
  OVERTIME_START: 'overtime_start',
  OVERTIME_END: 'overtime_end',
};

// Skill categories for technician assignment
const TECHNICIAN_SKILLS = {
  structural: {
    name: 'Structural Repair',
    rate: 1.2,
    certification: 'I-CAR Structural',
  },
  paint: {
    name: 'Paint & Refinishing',
    rate: 1.1,
    certification: 'Paint Manufacturer Certified',
  },
  electrical: {
    name: 'Electrical Systems',
    rate: 1.3,
    certification: 'Electrical Systems Certified',
  },
  adas: {
    name: 'ADAS Calibration',
    rate: 1.5,
    certification: 'ADAS Calibration Certified',
  },
  aluminum: {
    name: 'Aluminum Repair',
    rate: 1.4,
    certification: 'Aluminum Specialist',
  },
  frame: {
    name: 'Frame Straightening',
    rate: 1.2,
    certification: 'Frame Specialist',
  },
  mechanical: {
    name: 'Mechanical Repair',
    rate: 1.0,
    certification: 'ASE Certified',
  },
  detail: {
    name: 'Detail & Finishing',
    rate: 0.9,
    certification: 'Detail Specialist',
  },
};

// POST /api/labor/clock-operation - Time clock functionality
router.post('/clock-operation', laborTrackingLimit, async (req, res) => {
  try {
    const { operation, jobId = null, notes = null } = req.body;
    const technicianId = req.user?.id;
    const shopId = req.user?.shopId || 1;

    if (!operation || !Object.values(LABOR_OPERATIONS).includes(operation)) {
      return res
        .status(400)
        .json({ error: 'Valid operation type is required' });
    }

    if (!technicianId) {
      return res
        .status(401)
        .json({ error: 'Technician authentication required' });
    }

    const timestamp = new Date();

    // Get technician details
    const technician = await User.findByPk(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res
        .status(403)
        .json({ error: 'Access restricted to technicians' });
    }

    // Validate job-specific operations
    if (
      [LABOR_OPERATIONS.START_JOB, LABOR_OPERATIONS.STOP_JOB].includes(
        operation
      ) &&
      !jobId
    ) {
      return res
        .status(400)
        .json({ error: 'Job ID required for job-specific operations' });
    }

    // Get current time entry state for technician
    const currentEntry = await LaborTimeEntry.findOne({
      where: {
        technicianId,
        shopId,
        endTime: null, // Active entry
      },
      order: [['startTime', 'DESC']],
    });

    let laborEntry;
    let validationError = null;

    switch (operation) {
      case LABOR_OPERATIONS.CLOCK_IN:
        if (
          currentEntry &&
          currentEntry.operation === LABOR_OPERATIONS.CLOCK_IN
        ) {
          validationError = 'Already clocked in';
          break;
        }
        laborEntry = await LaborTimeEntry.create({
          technicianId,
          shopId,
          jobId: null,
          operation,
          startTime: timestamp,
          notes,
          hourlyRate: technician.hourlyRate || 25.0,
        });
        break;

      case LABOR_OPERATIONS.CLOCK_OUT:
        if (
          !currentEntry ||
          currentEntry.operation !== LABOR_OPERATIONS.CLOCK_IN
        ) {
          validationError = 'Must clock in first';
          break;
        }
        // End any active job work
        await endActiveJobWork(technicianId, timestamp);
        // End clock in session
        await currentEntry.update({
          endTime: timestamp,
          duration: calculateDuration(currentEntry.startTime, timestamp),
          notes: notes || currentEntry.notes,
        });
        laborEntry = currentEntry;
        break;

      case LABOR_OPERATIONS.START_JOB:
        if (
          !currentEntry ||
          currentEntry.operation !== LABOR_OPERATIONS.CLOCK_IN
        ) {
          validationError = 'Must clock in before starting job work';
          break;
        }
        // End any other active job work
        await endActiveJobWork(technicianId, timestamp, jobId);

        const job = await Job.findByPk(jobId);
        if (!job) {
          validationError = 'Job not found';
          break;
        }

        laborEntry = await LaborTimeEntry.create({
          technicianId,
          shopId,
          jobId,
          operation,
          startTime: timestamp,
          notes,
          hourlyRate: technician.hourlyRate || 25.0,
          skillCategory: determineSkillCategory(job.status),
          skillMultiplier: getSkillMultiplier(technician.skills, job.status),
        });
        break;

      case LABOR_OPERATIONS.STOP_JOB:
        const activeJobEntry = await LaborTimeEntry.findOne({
          where: {
            technicianId,
            shopId,
            jobId,
            operation: LABOR_OPERATIONS.START_JOB,
            endTime: null,
          },
        });

        if (!activeJobEntry) {
          validationError = 'No active job work to stop';
          break;
        }

        const duration = calculateDuration(activeJobEntry.startTime, timestamp);
        await activeJobEntry.update({
          endTime: timestamp,
          duration,
          notes: notes || activeJobEntry.notes,
          laborCost: calculateLaborCost(
            duration,
            activeJobEntry.hourlyRate,
            activeJobEntry.skillMultiplier
          ),
        });
        laborEntry = activeJobEntry;
        break;

      case LABOR_OPERATIONS.BREAK_START:
      case LABOR_OPERATIONS.LUNCH_START:
        laborEntry = await LaborTimeEntry.create({
          technicianId,
          shopId,
          jobId: null,
          operation,
          startTime: timestamp,
          notes,
          hourlyRate: 0, // Breaks are unpaid
        });
        break;

      case LABOR_OPERATIONS.BREAK_END:
      case LABOR_OPERATIONS.LUNCH_END:
        const breakOperation =
          operation === LABOR_OPERATIONS.BREAK_END
            ? LABOR_OPERATIONS.BREAK_START
            : LABOR_OPERATIONS.LUNCH_START;

        const activeBreak = await LaborTimeEntry.findOne({
          where: {
            technicianId,
            shopId,
            operation: breakOperation,
            endTime: null,
          },
        });

        if (!activeBreak) {
          validationError = 'No active break to end';
          break;
        }

        await activeBreak.update({
          endTime: timestamp,
          duration: calculateDuration(activeBreak.startTime, timestamp),
        });
        laborEntry = activeBreak;
        break;

      default:
        validationError = 'Unsupported operation';
    }

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Audit logging
    auditLogger.info('Labor time tracking', {
      technicianId,
      operation,
      jobId,
      timestamp,
      entryId: laborEntry.id,
    });

    // Real-time broadcast
    realtimeService.broadcastToShop(shopId, 'labor_tracking', {
      type: operation,
      technicianId,
      technicianName: technician.name,
      jobId,
      timestamp,
      entry: laborEntry,
    });

    // Calculate current shift summary
    const shiftSummary = await calculateShiftSummary(technicianId, shopId);

    res.json({
      success: true,
      operation,
      entry: laborEntry,
      shiftSummary,
      recommendations: generateTimeTrackingRecommendations(
        shiftSummary,
        operation
      ),
    });
  } catch (error) {
    console.error('Error processing labor operation:', error);
    res.status(500).json({ error: 'Failed to process labor operation' });
  }
});

// GET /api/labor/active-sessions - Get all active labor sessions
router.get('/active-sessions', async (req, res) => {
  try {
    const shopId = req.user?.shopId || 1;

    const activeSessions = await LaborTimeEntry.findAll({
      where: {
        shopId,
        endTime: null,
        operation: {
          [require('sequelize').Op.in]: [
            LABOR_OPERATIONS.CLOCK_IN,
            LABOR_OPERATIONS.START_JOB,
            LABOR_OPERATIONS.BREAK_START,
            LABOR_OPERATIONS.LUNCH_START,
          ],
        },
      },
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email', 'hourlyRate', 'skills'],
        },
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'jobNumber', 'status', 'priority'],
          required: false,
        },
      ],
      order: [['startTime', 'DESC']],
    });

    // Group by technician
    const sessionsByTechnician = {};

    activeSessions.forEach(session => {
      const techId = session.technicianId;
      if (!sessionsByTechnician[techId]) {
        sessionsByTechnician[techId] = {
          technician: session.technician,
          sessions: [],
          status: 'offline',
          currentJob: null,
          shiftStart: null,
          totalHours: 0,
        };
      }

      sessionsByTechnician[techId].sessions.push(session);

      // Determine status
      if (session.operation === LABOR_OPERATIONS.CLOCK_IN) {
        sessionsByTechnician[techId].status = 'clocked_in';
        sessionsByTechnician[techId].shiftStart = session.startTime;
      } else if (session.operation === LABOR_OPERATIONS.START_JOB) {
        sessionsByTechnician[techId].status = 'working';
        sessionsByTechnician[techId].currentJob = session.job;
      } else if (
        [LABOR_OPERATIONS.BREAK_START, LABOR_OPERATIONS.LUNCH_START].includes(
          session.operation
        )
      ) {
        sessionsByTechnician[techId].status =
          session.operation === LABOR_OPERATIONS.BREAK_START
            ? 'on_break'
            : 'on_lunch';
      }
    });

    // Calculate shift totals
    for (const techId in sessionsByTechnician) {
      const data = sessionsByTechnician[techId];
      data.totalHours = await calculateTechnicianDayHours(techId, shopId);
      data.productivity = await calculateTechnicianProductivity(techId, shopId);
      data.efficiency = await calculateTechnicianEfficiency(techId);
    }

    res.json({
      activeSessions: Object.values(sessionsByTechnician),
      summary: {
        totalTechnicians: Object.keys(sessionsByTechnician).length,
        clockedIn: Object.values(sessionsByTechnician).filter(t =>
          ['clocked_in', 'working', 'on_break', 'on_lunch'].includes(t.status)
        ).length,
        activelyWorking: Object.values(sessionsByTechnician).filter(
          t => t.status === 'working'
        ).length,
        onBreak: Object.values(sessionsByTechnician).filter(t =>
          ['on_break', 'on_lunch'].includes(t.status)
        ).length,
      },
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// GET /api/labor/productivity/:technicianId - Individual technician productivity tracking
router.get('/productivity/:technicianId', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const { startDate, endDate } = req.query;
    const shopId = req.user?.shopId || 1;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    // Get all labor entries for period
    const laborEntries = await LaborTimeEntry.findAll({
      where: {
        technicianId,
        shopId,
        startTime: {
          [require('sequelize').Op.between]: [start, end],
        },
      },
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'jobNumber', 'status', 'estimatedHours'],
          required: false,
        },
      ],
      order: [['startTime', 'ASC']],
    });

    // Calculate metrics
    const metrics = {
      totalHours: 0,
      billableHours: 0,
      productiveHours: 0,
      breakTime: 0,
      overtimeHours: 0,
      jobsWorked: new Set(),
      averageHourlyRate: 0,
      totalEarnings: 0,
      efficiency: 0,
      utilization: 0,
    };

    let totalRate = 0;
    let rateCount = 0;

    laborEntries.forEach(entry => {
      if (entry.duration) {
        const hours = entry.duration / 60; // Convert minutes to hours

        switch (entry.operation) {
          case LABOR_OPERATIONS.START_JOB:
            metrics.billableHours += hours;
            metrics.productiveHours += hours;
            metrics.totalEarnings += entry.laborCost || 0;
            if (entry.jobId) metrics.jobsWorked.add(entry.jobId);
            break;
          case LABOR_OPERATIONS.BREAK_START:
          case LABOR_OPERATIONS.LUNCH_START:
            metrics.breakTime += hours;
            break;
          case LABOR_OPERATIONS.CLOCK_IN:
            metrics.totalHours += hours;
            break;
        }

        if (entry.hourlyRate > 0) {
          totalRate += entry.hourlyRate;
          rateCount++;
        }
      }
    });

    metrics.jobsWorked = metrics.jobsWorked.size;
    metrics.averageHourlyRate = rateCount > 0 ? totalRate / rateCount : 0;
    metrics.utilization =
      metrics.totalHours > 0
        ? (metrics.productiveHours / metrics.totalHours) * 100
        : 0;
    metrics.efficiency = await calculateDetailedEfficiency(
      technicianId,
      start,
      end
    );

    // Daily breakdown
    const dailyBreakdown = {};
    laborEntries.forEach(entry => {
      const date = entry.startTime.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          totalHours: 0,
          billableHours: 0,
          jobs: new Set(),
          earnings: 0,
        };
      }

      if (entry.duration && entry.operation === LABOR_OPERATIONS.START_JOB) {
        const hours = entry.duration / 60;
        dailyBreakdown[date].billableHours += hours;
        dailyBreakdown[date].earnings += entry.laborCost || 0;
        if (entry.jobId) dailyBreakdown[date].jobs.add(entry.jobId);
      }
    });

    // Convert sets to counts
    Object.values(dailyBreakdown).forEach(day => {
      day.jobs = day.jobs.size;
    });

    // Performance comparison
    const shopAverage = await calculateShopAverageMetrics(shopId, start, end);
    const industryBenchmark = {
      utilization: 75,
      efficiency: 85,
      hoursPerDay: 7.5,
    };

    res.json({
      technicianId,
      period: { start, end },
      metrics,
      dailyBreakdown: Object.values(dailyBreakdown),
      comparison: {
        shopAverage,
        industryBenchmark,
        performance: {
          utilizationVsShop: metrics.utilization - shopAverage.utilization,
          efficiencyVsIndustry:
            metrics.efficiency - industryBenchmark.efficiency,
        },
      },
      recommendations: generateProductivityRecommendations(
        metrics,
        shopAverage,
        industryBenchmark
      ),
    });
  } catch (error) {
    console.error('Error fetching productivity data:', error);
    res.status(500).json({ error: 'Failed to fetch productivity data' });
  }
});

// POST /api/labor/work-order - Create digital work order
router.post('/work-order', async (req, res) => {
  try {
    const {
      jobId,
      operations,
      estimatedHours,
      priority = 'normal',
      specialInstructions = null,
      requiredSkills = [],
      assignedTechnicianId = null,
    } = req.body;

    if (!jobId || !operations || !Array.isArray(operations)) {
      return res
        .status(400)
        .json({ error: 'Job ID and operations array are required' });
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create work order
    const workOrder = await WorkOrder.create({
      jobId,
      shopId: req.user?.shopId || 1,
      operations: operations.map(op => ({
        ...op,
        id: generateOperationId(),
        status: 'pending',
        estimatedTime: op.estimatedTime || 1.0,
        actualTime: null,
        technicianId: null,
      })),
      estimatedTotalHours: estimatedHours,
      priority,
      specialInstructions,
      requiredSkills,
      assignedTechnicianId,
      status: 'created',
      createdBy: req.user?.id,
    });

    // Auto-assign technician if specified
    if (assignedTechnicianId) {
      await assignWorkOrderToTechnician(workOrder.id, assignedTechnicianId);
    } else if (requiredSkills.length > 0) {
      // Auto-suggest technicians based on skills
      const suggestedTechnicians = await findTechniciansBySkills(
        requiredSkills,
        req.user?.shopId
      );
      workOrder.suggestedTechnicians = suggestedTechnicians;
    }

    // Audit logging
    auditLogger.info('Work order created', {
      workOrderId: workOrder.id,
      jobId,
      operationCount: operations.length,
      estimatedHours,
      createdBy: req.user?.id,
    });

    // Real-time broadcast
    realtimeService.broadcastToShop(job.shopId, 'work_order_created', {
      workOrder,
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        customer: job.customer?.name,
      },
    });

    res.status(201).json({
      success: true,
      workOrder,
      recommendations: generateWorkOrderRecommendations(workOrder, job),
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

// Helper Functions
async function endActiveJobWork(technicianId, endTime, excludeJobId = null) {
  const activeJobEntries = await LaborTimeEntry.findAll({
    where: {
      technicianId,
      operation: LABOR_OPERATIONS.START_JOB,
      endTime: null,
      ...(excludeJobId && {
        jobId: { [require('sequelize').Op.ne]: excludeJobId },
      }),
    },
  });

  for (const entry of activeJobEntries) {
    const duration = calculateDuration(entry.startTime, endTime);
    await entry.update({
      endTime,
      duration,
      laborCost: calculateLaborCost(
        duration,
        entry.hourlyRate,
        entry.skillMultiplier || 1.0
      ),
    });
  }
}

function calculateDuration(startTime, endTime) {
  return Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60)); // minutes
}

function calculateLaborCost(
  durationMinutes,
  hourlyRate,
  skillMultiplier = 1.0
) {
  const hours = durationMinutes / 60;
  return Math.round(hours * hourlyRate * skillMultiplier * 100) / 100;
}

function determineSkillCategory(jobStatus) {
  const stageSkillMapping = {
    body_structure: 'structural',
    paint_prep: 'paint',
    paint_booth: 'paint',
    electrical: 'electrical',
    qc_calibration: 'adas',
    mechanical: 'mechanical',
  };
  return stageSkillMapping[jobStatus] || 'general';
}

function getSkillMultiplier(technicianSkills, jobStatus) {
  const requiredSkill = determineSkillCategory(jobStatus);
  const skillData = TECHNICIAN_SKILLS[requiredSkill];

  if (technicianSkills && technicianSkills.includes(requiredSkill)) {
    return skillData?.rate || 1.0;
  }
  return 1.0;
}

async function calculateShiftSummary(technicianId, shopId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = await LaborTimeEntry.findAll({
    where: {
      technicianId,
      shopId,
      startTime: {
        [require('sequelize').Op.gte]: today,
      },
    },
  });

  const summary = {
    clockInTime: null,
    totalHours: 0,
    billableHours: 0,
    breakTime: 0,
    jobsWorked: new Set(),
    earnings: 0,
  };

  entries.forEach(entry => {
    if (entry.operation === LABOR_OPERATIONS.CLOCK_IN) {
      summary.clockInTime = entry.startTime;
    }

    if (entry.duration) {
      const hours = entry.duration / 60;

      if (entry.operation === LABOR_OPERATIONS.START_JOB) {
        summary.billableHours += hours;
        summary.earnings += entry.laborCost || 0;
        if (entry.jobId) summary.jobsWorked.add(entry.jobId);
      } else if (
        [LABOR_OPERATIONS.BREAK_START, LABOR_OPERATIONS.LUNCH_START].includes(
          entry.operation
        )
      ) {
        summary.breakTime += hours;
      }
    }
  });

  summary.jobsWorked = summary.jobsWorked.size;
  summary.totalHours = summary.clockInTime
    ? (new Date() - new Date(summary.clockInTime)) / (1000 * 60 * 60)
    : 0;

  return summary;
}

async function calculateTechnicianDayHours(technicianId, shopId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clockInEntry = await LaborTimeEntry.findOne({
    where: {
      technicianId,
      shopId,
      operation: LABOR_OPERATIONS.CLOCK_IN,
      startTime: { [require('sequelize').Op.gte]: today },
      endTime: null,
    },
  });

  if (!clockInEntry) return 0;

  return (new Date() - new Date(clockInEntry.startTime)) / (1000 * 60 * 60);
}

async function calculateTechnicianProductivity(technicianId, shopId) {
  // Mock productivity calculation
  return {
    hoursWorked: Math.floor(Math.random() * 8) + 1,
    efficiency: Math.floor(Math.random() * 20) + 80,
    jobsCompleted: Math.floor(Math.random() * 5) + 1,
  };
}

async function calculateTechnicianEfficiency(technicianId) {
  // Mock efficiency calculation based on estimated vs actual time
  return Math.floor(Math.random() * 20) + 80; // 80-100%
}

function generateTimeTrackingRecommendations(shiftSummary, operation) {
  const recommendations = [];

  if (shiftSummary.totalHours > 8 && operation === LABOR_OPERATIONS.START_JOB) {
    recommendations.push({
      type: 'overtime_alert',
      message: 'You are approaching overtime hours',
      action: 'Consider completing current task and clocking out',
    });
  }

  if (shiftSummary.breakTime < 0.5 && shiftSummary.totalHours > 4) {
    recommendations.push({
      type: 'break_reminder',
      message: "You haven't taken a break in over 4 hours",
      action: 'Take a 15-minute break to maintain productivity',
    });
  }

  return recommendations;
}

async function calculateDetailedEfficiency(technicianId, startDate, endDate) {
  // Mock detailed efficiency calculation
  return Math.floor(Math.random() * 20) + 80;
}

async function calculateShopAverageMetrics(shopId, startDate, endDate) {
  return {
    utilization: 72.5,
    efficiency: 83.2,
    averageHourlyRate: 28.5,
    jobsPerDay: 2.3,
  };
}

function generateProductivityRecommendations(
  metrics,
  shopAverage,
  industryBenchmark
) {
  const recommendations = [];

  if (metrics.utilization < shopAverage.utilization - 10) {
    recommendations.push({
      type: 'utilization',
      message: 'Utilization is below shop average',
      action: 'Focus on reducing non-productive time',
    });
  }

  if (metrics.efficiency < industryBenchmark.efficiency - 5) {
    recommendations.push({
      type: 'efficiency',
      message: 'Efficiency is below industry standards',
      action: 'Review work processes and consider additional training',
    });
  }

  return recommendations;
}

function generateOperationId() {
  return (
    'OP' +
    Date.now().toString().slice(-6) +
    Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0')
  );
}

async function assignWorkOrderToTechnician(workOrderId, technicianId) {
  // Implementation would update work order assignment
  return true;
}

async function findTechniciansBySkills(requiredSkills, shopId) {
  const technicians = await User.findAll({
    where: {
      shopId,
      role: 'technician',
      isActive: true,
    },
    attributes: ['id', 'name', 'skills', 'hourlyRate'],
  });

  return technicians
    .filter(tech => {
      const techSkills = tech.skills || [];
      return requiredSkills.some(skill => techSkills.includes(skill));
    })
    .map(tech => ({
      id: tech.id,
      name: tech.name,
      skills: tech.skills,
      hourlyRate: tech.hourlyRate,
      matchedSkills: requiredSkills.filter(skill =>
        tech.skills?.includes(skill)
      ),
    }))
    .sort((a, b) => b.matchedSkills.length - a.matchedSkills.length);
}

function generateWorkOrderRecommendations(workOrder, job) {
  const recommendations = [];

  if (workOrder.estimatedTotalHours > 40) {
    recommendations.push({
      type: 'large_job',
      message: 'This is a large job that may require multiple technicians',
      action: 'Consider breaking into smaller work orders',
    });
  }

  if (workOrder.priority === 'rush') {
    recommendations.push({
      type: 'rush_job',
      message: 'Rush job detected',
      action: 'Ensure adequate resources and overtime authorization',
    });
  }

  return recommendations;
}

// GET /api/labor/technician/:technicianId/current - Get current status for technician
router.get('/technician/:technicianId/current', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const shopId = req.user?.shopId || 1;

    // Find clock-in session
    const clockInSession = await LaborTimeEntry.findOne({
      where: {
        technicianId,
        shopId,
        operation: LABOR_OPERATIONS.CLOCK_IN,
        endTime: null,
      },
      order: [['startTime', 'DESC']],
    });

    // Find active job work
    const activeJob = await LaborTimeEntry.findOne({
      where: {
        technicianId,
        shopId,
        operation: LABOR_OPERATIONS.START_JOB,
        endTime: null,
      },
      order: [['startTime', 'DESC']],
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'jobNumber'],
        },
      ],
    });

    // Find active break
    const activeBreak = await LaborTimeEntry.findOne({
      where: {
        technicianId,
        shopId,
        operation: {
          [require('sequelize').Op.in]: [
            LABOR_OPERATIONS.BREAK_START,
            LABOR_OPERATIONS.LUNCH_START,
          ],
        },
        endTime: null,
      },
      order: [['startTime', 'DESC']],
    });

    // Get shift summary
    const shiftSummary = await calculateShiftSummary(technicianId, shopId);

    res.json({
      clockedIn: !!clockInSession,
      session: clockInSession,
      activeJob,
      activeBreak,
      shiftSummary,
    });
  } catch (error) {
    console.error('Error fetching current status:', error);
    res.status(500).json({ error: 'Failed to fetch current status' });
  }
});

// GET /api/labor/entries/:jobId - Get time entries for a job
router.get('/entries/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const shopId = req.user?.shopId || 1;

    const entries = await LaborTimeEntry.findAll({
      where: {
        jobId,
        shopId,
        operation: LABOR_OPERATIONS.START_JOB,
      },
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['startTime', 'DESC']],
    });

    res.json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// PUT /api/labor/entries/:id - Edit a time entry (supervisor only)
router.put('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, notes, laborCost } = req.body;
    const userRole = req.user?.role || 'technician';

    if (!['supervisor', 'admin', 'owner', 'manager'].includes(userRole)) {
      return res
        .status(403)
        .json({ error: 'Only supervisors can edit time entries' });
    }

    const entry = await LaborTimeEntry.findByPk(id);
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    await entry.update({
      duration: duration || entry.duration,
      notes: notes !== undefined ? notes : entry.notes,
      laborCost: laborCost || entry.laborCost,
    });

    // Audit logging
    auditLogger.info('Time entry edited', {
      entryId: id,
      editedBy: req.user?.id,
      changes: { duration, notes, laborCost },
    });

    res.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Error editing time entry:', error);
    res.status(500).json({ error: 'Failed to edit time entry' });
  }
});

// DELETE /api/labor/entries/:id - Delete a time entry (supervisor only)
router.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'technician';

    if (!['supervisor', 'admin', 'owner', 'manager'].includes(userRole)) {
      return res
        .status(403)
        .json({ error: 'Only supervisors can delete time entries' });
    }

    const entry = await LaborTimeEntry.findByPk(id);
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    await entry.destroy();

    // Audit logging
    auditLogger.info('Time entry deleted', {
      entryId: id,
      deletedBy: req.user?.id,
    });

    res.json({
      success: true,
      message: 'Time entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// GET /api/labor/job-costing/:jobId - Get job costing comparison
router.get('/job-costing/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const shopId = req.user?.shopId || 1;

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get all time entries for this job
    const entries = await LaborTimeEntry.findAll({
      where: {
        jobId,
        shopId,
        operation: LABOR_OPERATIONS.START_JOB,
        endTime: { [require('sequelize').Op.ne]: null },
      },
    });

    // Calculate totals
    let actualHours = 0;
    let actualCost = 0;

    entries.forEach(entry => {
      if (entry.duration) {
        actualHours += entry.duration / 60; // Convert minutes to hours
        actualCost += entry.laborCost || 0;
      }
    });

    // Get estimated hours from job/estimate
    const estimatedHours = job.estimatedHours || 0;
    const estimatedCost = job.estimatedLaborCost || 0;

    res.json({
      jobId,
      jobNumber: job.jobNumber,
      estimatedHours,
      actualHours,
      estimatedCost,
      actualCost,
      variance: actualHours - estimatedHours,
      costVariance: actualCost - estimatedCost,
      isOverBudget: actualHours > estimatedHours,
      efficiency:
        estimatedHours > 0 ? (estimatedHours / actualHours) * 100 : 0,
    });
  } catch (error) {
    console.error('Error fetching job costing:', error);
    res.status(500).json({ error: 'Failed to fetch job costing' });
  }
});

// GET /api/labor/technician/:technicianId/shift-summary - Get current shift summary
router.get('/technician/:technicianId/shift-summary', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const shopId = req.user?.shopId || 1;

    const summary = await calculateShiftSummary(technicianId, shopId);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error fetching shift summary:', error);
    res.status(500).json({ error: 'Failed to fetch shift summary' });
  }
});

module.exports = router;
