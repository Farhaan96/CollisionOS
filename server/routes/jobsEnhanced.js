const express = require('express');
// TODO: Replace with local auth middleware
// const { authenticateToken, requireManager } = require('../middleware/auth');
const authenticateToken = (req, res, next) => {
  req.user = { userId: 'dev-user', shopId: 'dev-shop', role: 'admin' };
  next();
};
const requireManager = (req, res, next) => {
  req.user = { userId: 'dev-user', shopId: 'dev-shop', role: 'manager' };
  next();
};
const { Job, Customer, Vehicle, User, JobStageHistory } = require('../database/models');
const { queryHelpers } = require('../utils/queryHelpers');
const { Op } = require('sequelize');
const { realtimeService } = require('../services/realtimeService');
const {
  asyncHandler,
  errors,
  successResponse,
  paginatedResponse,
} = require('../utils/errorHandler');
const { validateBody } = require('../middleware/validation');
const router = express.Router();

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs with filtering and pagination
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by job status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of jobs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of jobs to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in job number or customer name
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get(
  '/',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const {
      status,
      limit = 20,
      offset = 0,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build where conditions
    const where = {
      ...queryHelpers.forShop(req.user.shopId),
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { jobNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
      ];
    }

    const options = {
      where,
      limit: Math.min(parseInt(limit), 100), // Cap at 100
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'assignedTechnician',
          attributes: ['id', 'firstName', 'lastName', 'username'],
          required: false,
        },
      ],
    };

    try {
      const { count: total, rows: jobs } = await Job.findAndCountAll(options);

      // Transform jobs to include all fields needed by Kanban board
      const transformedJobs = jobs.map(job => ({
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status,
        priority: job.priority || 'normal',
        customer: {
          name: job.customerName,
          phone: job.customerPhone,
          email: job.customerEmail,
        },
        vehicle: {
          year: job.vehicleYear,
          make: job.vehicleMake,
          model: job.vehicleModel,
          vin: job.vehicleVin,
        },
        assignedTechnician: job.assignedTechnician
          ? {
              name: `${job.assignedTechnician.firstName} ${job.assignedTechnician.lastName}`.trim() || job.assignedTechnician.username,
              avatar: job.assignedTechnician.avatar,
            }
          : null,
        daysInShop: job.daysInShop || Math.floor(
          (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24)
        ),
        daysInCurrentStatus: job.daysInCurrentStatus || Math.floor(
          (new Date() - new Date(job.statusChangedAt || job.updatedAt)) / (1000 * 60 * 60 * 24)
        ),
        progressPercentage: job.progressPercentage || getProgressFromStatus(job.status),
        targetDate: job.targetDate || job.estimatedCompletion,
        partsStatus: job.partsStatus || 'pending',
        insurance: {
          company: job.insuranceCompany,
          claimNumber: job.insuranceClaim,
        },
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      }));

      paginatedResponse(res, transformedJobs, {
        limit: options.limit,
        offset: options.offset,
        total,
      }, 'Jobs retrieved successfully');
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw errors.databaseError('Failed to fetch jobs');
    }
  })
);

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - vehicleInfo
 *             properties:
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerPhone:
 *                 type: string
 *               vehicleInfo:
 *                 type: object
 *                 properties:
 *                   make:
 *                     type: string
 *                   model:
 *                     type: string
 *                   year:
 *                     type: integer
 *                   vin:
 *                     type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  authenticateToken(),
  requireManager,
  asyncHandler(async (req, res) => {
    const {
      customerName,
      customerEmail,
      customerPhone,
      vehicleInfo,
      description,
      priority = 'normal',
    } = req.body;

    // Validate required fields
    if (!customerName || !vehicleInfo) {
      throw errors.validationError(
        'Customer name and vehicle info are required'
      );
    }

    // Generate job number
    const jobNumber = await generateJobNumber(req.user.shopId);

    const jobData = {
      jobNumber,
      customerName,
      customerEmail,
      customerPhone,
      vehicleMake: vehicleInfo.make,
      vehicleModel: vehicleInfo.model,
      vehicleYear: vehicleInfo.year,
      vehicleVin: vehicleInfo.vin,
      description,
      priority,
      status: 'estimate',
      shopId: req.user.shopId,
      createdBy: req.user.id,
    };

    try {
      const newJob = await Job.create(jobData);

      // Broadcast real-time update
      realtimeService.broadcastJobUpdate(newJob, 'created');

      successResponse(res, newJob, 'Job created successfully', null, 201);
    } catch (error) {
      console.error('Error creating job:', error);
      throw errors.databaseError('Failed to create job');
    }
  })
);

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get a specific job by ID
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const job = await Job.findOne({
        where: {
          id,
          ...queryHelpers.forShop(req.user.shopId),
        },
        include: [
          {
            model: User,
            as: 'assignedTechnician',
            attributes: ['id', 'firstName', 'lastName', 'username'],
            required: false,
          },
        ],
      });

      if (!job) {
        throw errors.notFound('Job not found');
      }

      successResponse(res, job, 'Job retrieved successfully');
    } catch (error) {
      console.error('Error fetching job:', error);
      if (error.message === 'Job not found') {
        throw error;
      }
      throw errors.databaseError('Failed to fetch job');
    }
  })
);

/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: Update a job
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *               estimatedCompletion:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Add metadata
    updateData.updatedBy = req.user.id;

    try {
      const [affectedCount, updatedJobs] = await Job.update(updateData, {
        where: {
          id,
          ...queryHelpers.forShop(req.user.shopId),
        },
        returning: true,
      });

      if (affectedCount === 0) {
        throw errors.notFound('Job not found');
      }

      const updatedJob = updatedJobs[0];

      // Broadcast real-time update
      realtimeService.broadcastJobUpdate(updatedJob, 'updated');

      successResponse(res, updatedJob, 'Job updated successfully');
    } catch (error) {
      console.error('Error updating job:', error);
      if (error.message === 'Job not found') {
        throw error;
      }
      throw errors.databaseError('Failed to update job');
    }
  })
);

/**
 * @swagger
 * /jobs/{id}/move:
 *   post:
 *     summary: Move a job to a new status
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status for the job
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status change
 *     responses:
 *       200:
 *         description: Job status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/move',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      throw errors.validationError('Status is required');
    }

    const validStatuses = [
      'estimate',
      'intake',
      'blueprint',
      'parts_ordering',
      'parts_receiving',
      'body_structure',
      'paint_prep',
      'paint_booth',
      'reassembly',
      'quality_control',
      'calibration',
      'detail',
      'ready_pickup',
      'delivered',
    ];

    if (!validStatuses.includes(status)) {
      throw errors.validationError('Invalid status');
    }

    try {
      // Get current job
      const currentJob = await Job.findOne({
        where: {
          id,
          ...queryHelpers.forShop(req.user.shopId),
        },
      });

      if (!currentJob) {
        throw errors.notFound('Job not found');
      }

      const previousStatus = currentJob.status;

      // Update job status
      const updateData = {
        status,
        updatedBy: req.user.id,
      };

      // Add completion timestamp for final status
      if (status === 'delivered') {
        updateData.completedAt = new Date();
      }

      await currentJob.update(updateData);

      // Log status change if we have a proper audit table
      try {
        await JobStageHistory.create({
          jobId: id,
          previousStatus,
          newStatus: status,
          changedBy: req.user.id,
          notes,
        });
      } catch (auditError) {
        console.warn('Failed to log status change:', auditError.message);
      }

      // Reload job to get updated data
      await currentJob.reload();

      // Broadcast real-time production update
      realtimeService.broadcastProductionUpdate(
        {
          jobId: id,
          previousStatus,
          newStatus: status,
          jobNumber: currentJob.jobNumber,
          updatedBy: req.user.username || req.user.email,
        },
        req.user.shopId
      );

      successResponse(res, currentJob, `Job moved to ${status} successfully`);
    } catch (error) {
      console.error('Error moving job:', error);
      if (error.message === 'Job not found') {
        throw error;
      }
      throw errors.databaseError('Failed to move job');
    }
  })
);

/**
 * @swagger
 * /jobs/{id}/status:
 *   patch:
 *     summary: Update job status with validation and history tracking
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status for the job
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status change
 *     responses:
 *       200:
 *         description: Job status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/status',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      throw errors.validationError('Status is required');
    }

    // Valid status transitions map
    const validTransitions = {
      estimate: ['intake', 'estimating', 'cancelled'],
      estimating: ['awaiting_approval', 'cancelled'],
      awaiting_approval: ['approved', 'rejected', 'cancelled'],
      approved: ['awaiting_parts', 'in_production', 'cancelled'],
      intake: ['estimating', 'awaiting_parts', 'in_production', 'cancelled'],
      awaiting_parts: ['in_production', 'cancelled'],
      in_production: [
        'body_structure',
        'paint_prep',
        'paint_booth',
        'reassembly',
        'quality_check',
        'ready',
        'cancelled',
      ],
      body_structure: ['paint_prep', 'quality_check', 'cancelled'],
      paint_prep: ['paint_booth', 'quality_check', 'cancelled'],
      paint_booth: ['reassembly', 'quality_check', 'cancelled'],
      reassembly: ['quality_check', 'ready', 'cancelled'],
      quality_check: ['ready', 'in_production', 'cancelled'],
      ready: ['delivered'],
      delivered: ['closed'],
      cancelled: [],
      closed: [],
    };

    try {
      // Get current job
      const currentJob = await Job.findOne({
        where: {
          id,
          ...queryHelpers.forShop(req.user.shopId),
        },
      });

      if (!currentJob) {
        throw errors.notFound('Job not found');
      }

      const previousStatus = currentJob.status;

      // Validate status transition
      const allowedTransitions = validTransitions[previousStatus] || [];
      if (!allowedTransitions.includes(status)) {
        throw errors.validationError(
          `Invalid transition from ${previousStatus} to ${status}. Allowed: ${allowedTransitions.join(', ')}`
        );
      }

      // Update job status
      const updateData = {
        status,
        updatedBy: req.user.id,
        statusChangedAt: new Date(),
      };

      // Add completion timestamp for final statuses
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      } else if (status === 'closed') {
        updateData.closedAt = new Date();
      }

      await currentJob.update(updateData);

      // Log status change in history table
      try {
        await JobStageHistory.create({
          jobId: id,
          previousStatus,
          newStatus: status,
          changedBy: req.user.id,
          notes,
          shopId: req.user.shopId,
        });
      } catch (auditError) {
        console.warn('Failed to log status change:', auditError.message);
      }

      // Reload job to get updated data
      await currentJob.reload();

      // Broadcast real-time update
      realtimeService.broadcastJobUpdate(
        {
          jobId: id,
          previousStatus,
          newStatus: status,
          jobNumber: currentJob.jobNumber,
          updatedBy: req.user.username || req.user.email,
          notes,
        },
        req.user.shopId
      );

      successResponse(
        res,
        {
          ...currentJob.toJSON(),
          status_history: [
            {
              previous_status: previousStatus,
              new_status: status,
              changed_at: new Date(),
              notes,
            },
          ],
        },
        `Job status updated to ${status} successfully`
      );
    } catch (error) {
      console.error('Error updating job status:', error);
      if (
        error.message === 'Job not found' ||
        error.message.includes('Invalid transition')
      ) {
        throw error;
      }
      throw errors.databaseError('Failed to update job status');
    }
  })
);

/**
 * @swagger
 * /jobs/{id}/history:
 *   get:
 *     summary: Get job status history timeline
 *     tags: [Jobs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job history retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id/history',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Verify job exists and belongs to shop
      const job = await Job.findOne({
        where: {
          id,
          ...queryHelpers.forShop(req.user.shopId),
        },
      });

      if (!job) {
        throw errors.notFound('Job not found');
      }

      // Get status history
      let history = [];
      try {
        history = await JobStageHistory.findAll({
          where: { jobId: id },
          order: [['changedAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'changedByUser',
              attributes: ['id', 'username', 'firstName', 'lastName'],
              required: false,
            },
          ],
        });
      } catch (historyError) {
        console.warn('Failed to retrieve status history:', historyError.message);
        // Return empty history if table doesn't exist yet
        history = [];
      }

      // Transform history for frontend
      const transformedHistory = history.map(entry => ({
        id: entry.id,
        previousStatus: entry.previousStatus,
        newStatus: entry.newStatus,
        changedAt: entry.changedAt,
        changedBy: entry.changedBy,
        changedByUser: entry.changedByUser ? {
          id: entry.changedByUser.id,
          username: entry.changedByUser.username,
          name: `${entry.changedByUser.firstName || ''} ${entry.changedByUser.lastName || ''}`.trim(),
        } : null,
        notes: entry.notes,
        duration: calculateStatusDuration(entry),
      }));

      successResponse(res, transformedHistory, 'Job history retrieved successfully');
    } catch (error) {
      console.error('Error fetching job history:', error);
      if (error.message === 'Job not found') {
        throw error;
      }
      throw errors.databaseError('Failed to fetch job history');
    }
  })
);

/**
 * Calculate progress percentage based on job status
 * @param {string} status - Current job status
 * @returns {number} Progress percentage (0-100)
 */
function getProgressFromStatus(status) {
  const statusProgressMap = {
    estimate: 5,
    intake: 10,
    blueprint: 20,
    teardown: 20,
    parts_ordering: 25,
    parts_receiving: 35,
    body_structure: 50,
    paint_prep: 65,
    paint_booth: 75,
    reassembly: 85,
    quality_control: 90,
    qc_calibration: 90,
    calibration: 92,
    detail: 95,
    ready_pickup: 98,
    delivered: 100,
  };
  return statusProgressMap[status] || 0;
}

/**
 * Calculate duration spent in a status
 * @param {object} historyEntry - Status history entry
 * @returns {string} Duration string
 */
function calculateStatusDuration(historyEntry) {
  // This would need the next status change time to calculate duration
  // For now, return a placeholder
  return 'N/A';
}

/**
 * Generate unique job number for the shop
 * @param {string} shopId - Shop identifier
 * @returns {Promise<string>} Job number
 */
async function generateJobNumber(shopId) {
  const prefix = 'JOB';

  try {
    // Get the highest job number for this shop
    const lastJob = await Job.findOne({
      where: { shopId },
      order: [['jobNumber', 'DESC']],
      attributes: ['jobNumber'],
    });

    let highestNumber = 0;
    if (lastJob && lastJob.jobNumber) {
      const match = lastJob.jobNumber.match(/JOB(\d+)/);
      if (match) {
        highestNumber = parseInt(match[1]);
      }
    }

    const nextNumber = highestNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating job number:', error);
    // Fallback to timestamp-based number
    return `${prefix}${Date.now().toString().slice(-6)}`;
  }
}

module.exports = router;
