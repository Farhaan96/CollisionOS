const express = require('express');
const {
  authenticateToken,
  requireManager,
} = require('../middleware/authSupabase');
const { databaseService } = require('../services/databaseService');
const { realtimeService } = require('../services/realtimeService');
const {
  asyncHandler,
  errors,
  successResponse,
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
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const options = {
      limit: Math.min(parseInt(limit), 100), // Cap at 100
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
    };

    // Build where conditions
    const where = {
      shop_id: req.user.shopId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      // In Supabase, this will be handled differently than Sequelize
      if (databaseService.useSupabase) {
        // Use Supabase text search
        options.select = '*';
        // Note: This would need to be implemented with proper text search in Supabase
      } else {
        // Legacy Sequelize search
        const { Op } = require('sequelize');
        where[Op.or] = [
          { jobNumber: { [Op.iLike]: `%${search}%` } },
          { customerName: { [Op.iLike]: `%${search}%` } },
        ];
      }
    }

    options.where = where;

    try {
      const jobs = await databaseService.query('jobs', options);

      // Transform jobs to include all fields needed by Kanban board
      const transformedJobs = jobs.map(job => ({
        id: job.id,
        jobNumber: job.job_number || job.jobNumber,
        status: job.status,
        priority: job.priority || 'normal',
        customer: {
          name: job.customer_name || job.customerName,
          phone: job.customer_phone || job.customerPhone,
          email: job.customer_email || job.customerEmail,
        },
        vehicle: {
          year: job.vehicle_year || job.vehicleYear,
          make: job.vehicle_make || job.vehicleMake,
          model: job.vehicle_model || job.vehicleModel,
          vin: job.vehicle_vin || job.vehicleVin,
        },
        assignedTechnician: job.assigned_technician
          ? {
              name:
                job.assigned_technician.name || job.assignedTechnician?.name,
              avatar:
                job.assigned_technician.avatar ||
                job.assignedTechnician?.avatar,
            }
          : null,
        daysInShop:
          job.days_in_shop ||
          Math.floor(
            (new Date() - new Date(job.created_at || job.createdAt)) /
              (1000 * 60 * 60 * 24)
          ),
        daysInCurrentStatus:
          job.days_in_current_status ||
          Math.floor(
            (new Date() -
              new Date(
                job.status_changed_at || job.updated_at || job.updatedAt
              )) /
              (1000 * 60 * 60 * 24)
          ),
        progressPercentage:
          job.progress_percentage || getProgressFromStatus(job.status),
        targetDate:
          job.target_date || job.estimated_completion || job.targetDate,
        partsStatus: job.parts_status || job.partsStatus || 'pending',
        insurance: {
          company: job.insurance_company || job.insurance?.company,
          claimNumber: job.insurance_claim || job.insurance?.claimNumber,
        },
        createdAt: job.created_at || job.createdAt,
        updatedAt: job.updated_at || job.updatedAt,
      }));

      // Get total count for pagination
      let total = 0;
      if (databaseService.useSupabase) {
        const countResult = await databaseService.query('jobs', {
          select: 'id',
          where: { shop_id: req.user.shopId },
        });
        total = countResult.length;
      } else {
        const { Job } = require('../database/models');
        total = await Job.count({ where: { shopId: req.user.shopId } });
      }

      successResponse(res, transformedJobs, 'Jobs retrieved successfully', {
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total,
        },
      });
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
      job_number: jobNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      vehicle_make: vehicleInfo.make,
      vehicle_model: vehicleInfo.model,
      vehicle_year: vehicleInfo.year,
      vehicle_vin: vehicleInfo.vin,
      description,
      priority,
      status: 'estimate',
      shop_id: req.user.shopId,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const newJob = await databaseService.insert('jobs', jobData);

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
      const jobs = await databaseService.query('jobs', {
        where: {
          id,
          shop_id: req.user.shopId,
        },
      });

      if (!jobs || jobs.length === 0) {
        throw errors.notFound('Job not found');
      }

      const job = jobs[0];
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
    updateData.updated_at = new Date();
    updateData.updated_by = req.user.id;

    try {
      const updatedJob = await databaseService.update('jobs', updateData, {
        id,
        shop_id: req.user.shopId,
      });

      if (!updatedJob) {
        throw errors.notFound('Job not found');
      }

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
      const jobs = await databaseService.query('jobs', {
        where: { id, shop_id: req.user.shopId },
      });

      if (!jobs || jobs.length === 0) {
        throw errors.notFound('Job not found');
      }

      const currentJob = jobs[0];
      const previousStatus = currentJob.status;

      // Update job status
      const updateData = {
        status,
        updated_at: new Date(),
        updated_by: req.user.id,
      };

      // Add completion timestamp for final status
      if (status === 'delivered') {
        updateData.completed_at = new Date();
      }

      const updatedJob = await databaseService.update('jobs', updateData, {
        id,
        shop_id: req.user.shopId,
      });

      // Log status change if we have a proper audit table
      try {
        await databaseService.insert('job_status_history', {
          job_id: id,
          previous_status: previousStatus,
          new_status: status,
          changed_by: req.user.id,
          notes,
          changed_at: new Date(),
        });
      } catch (auditError) {
        console.warn('Failed to log status change:', auditError.message);
      }

      // Broadcast real-time production update
      realtimeService.broadcastProductionUpdate(
        {
          jobId: id,
          previousStatus,
          newStatus: status,
          jobNumber: updatedJob.job_number || updatedJob.jobNumber,
          updatedBy: req.user.username || req.user.email,
        },
        req.user.shopId
      );

      successResponse(res, updatedJob, `Job moved to ${status} successfully`);
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
 * Generate unique job number for the shop
 * @param {string} shopId - Shop identifier
 * @returns {Promise<string>} Job number
 */
async function generateJobNumber(shopId) {
  const prefix = 'JOB';
  const year = new Date().getFullYear();

  try {
    // Get the highest job number for this year
    let highestNumber = 0;

    if (databaseService.useSupabase) {
      const existingJobs = await databaseService.query('jobs', {
        select: 'job_number',
        where: {
          shop_id: shopId,
        },
        order: [['job_number', 'desc']],
        limit: 1,
      });

      if (existingJobs.length > 0) {
        const lastJobNumber = existingJobs[0].job_number;
        const match = lastJobNumber.match(/JOB(\d+)/);
        if (match) {
          highestNumber = parseInt(match[1]);
        }
      }
    } else {
      const { Job } = require('../database/models');
      const lastJob = await Job.findOne({
        where: { shopId },
        order: [['jobNumber', 'DESC']],
        attributes: ['jobNumber'],
      });

      if (lastJob && lastJob.jobNumber) {
        const match = lastJob.jobNumber.match(/JOB(\d+)/);
        if (match) {
          highestNumber = parseInt(match[1]);
        }
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
