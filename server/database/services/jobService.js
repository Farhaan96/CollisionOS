const { Job, Customer, Vehicle, User } = require('../models');
const { queryHelpers } = require('../../utils/queryHelpers');
const { Op } = require('sequelize');

/**
 * Job Service - Sequelize integration for job/repair order management
 */
class JobService {
  constructor() {
    this.statusFlow = [
      'estimate',
      'approved',
      'parts_ordered',
      'in_progress',
      'painting',
      'quality_check',
      'completed',
    ];
  }

  /**
   * Get all jobs
   */
  async getAllJobs(options = {}) {
    try {
      const where = {};

      // Apply filters
      if (options.status) {
        where.status = options.status;
      }
      if (options.priority) {
        where.priority = options.priority;
      }
      if (options.customerId) {
        where.customerId = options.customerId;
      }

      const queryOptions = {
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'year', 'make', 'model', 'vin', 'licensePlate', 'color'],
          },
        ],
      };

      // Apply sorting
      if (options.sortBy) {
        queryOptions.order = [[options.sortBy, options.ascending !== false ? 'ASC' : 'DESC']];
      } else {
        queryOptions.order = [['createdAt', 'DESC']];
      }

      // Apply pagination
      if (options.limit) {
        queryOptions.limit = options.limit;
      }
      if (options.offset) {
        queryOptions.offset = options.offset;
      }

      const jobs = await Job.findAll(queryOptions);

      return jobs.map(job => this.transformToFrontend(job.toJSON()));
    } catch (error) {
      console.error('JobService.getAllJobs error:', error);
      throw error;
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobData) {
    try {
      // Build job record with camelCase fields
      const jobRecord = {
        jobNumber: jobData.jobNumber || this.generateJobNumber(),
        customerId: jobData.customerId,
        vehicleId: jobData.vehicleId,
        shopId:
          jobData.shopId ||
          process.env.DEV_SHOP_ID ||
          '00000000-0000-4000-8000-000000000001',
        status: jobData.status || 'estimate',
      };

      // Add optional fields
      if (jobData.estimateTotal) {
        jobRecord.totalAmount = jobData.estimateTotal;
      }
      if (jobData.priority) {
        jobRecord.priority = jobData.priority;
      }
      if (jobData.insuranceCompany) {
        // Note: Job model doesn't have insuranceCompany field directly
        // Store in metadata or custom fields if needed
        jobRecord.metadata = { insuranceCompany: jobData.insuranceCompany };
      }
      if (jobData.claimNumber) {
        jobRecord.claimNumber = jobData.claimNumber;
      }
      if (jobData.deductible) {
        jobRecord.deductible = jobData.deductible;
      }
      if (jobData.damageDescription) {
        jobRecord.damageDescription = jobData.damageDescription;
      }
      if (jobData.partsNeeded) {
        // Store as JSON in metadata or custom fields
        jobRecord.metadata = {
          ...(jobRecord.metadata || {}),
          partsNeeded: jobData.partsNeeded
        };
      }
      if (jobData.laborHours) {
        jobRecord.estimatedHours = jobData.laborHours;
      }
      if (jobData.paintHours) {
        // Store in metadata or custom fields
        jobRecord.metadata = {
          ...(jobRecord.metadata || {}),
          paintHours: jobData.paintHours
        };
      }
      if (jobData.targetCompletion) {
        jobRecord.targetDeliveryDate = jobData.targetCompletion;
      }
      if (jobData.notes) {
        jobRecord.notes = jobData.notes;
      }
      if (jobData.bmsImportId) {
        jobRecord.metadata = {
          ...(jobRecord.metadata || {}),
          bmsImportId: jobData.bmsImportId
        };
      }

      const job = await Job.create(jobRecord);

      // Fetch with associations
      const jobWithAssociations = await Job.findByPk(job.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'year', 'make', 'model', 'vin', 'licensePlate'],
          },
        ],
      });

      console.log('Job created successfully:', job.id);

      // Convert back to frontend format
      return this.transformToFrontend(jobWithAssociations.toJSON());
    } catch (error) {
      console.error('JobService.createJob error:', error);
      throw error;
    }
  }

  /**
   * Update existing job
   */
  async updateJob(jobId, updateData) {
    try {
      const jobRecord = {
        status: updateData.status,
        priority: updateData.priority,
        totalAmount: updateData.estimateTotal,
        damageDescription: updateData.damageDescription,
        estimatedHours: updateData.laborHours,
        targetDeliveryDate: updateData.targetCompletion,
        notes: updateData.notes,
      };

      // Handle fields stored in metadata
      if (updateData.partsNeeded || updateData.paintHours) {
        const existingJob = await Job.findByPk(jobId);
        const metadata = existingJob ? existingJob.metadata || {} : {};

        if (updateData.partsNeeded) {
          metadata.partsNeeded = updateData.partsNeeded;
        }
        if (updateData.paintHours) {
          metadata.paintHours = updateData.paintHours;
        }

        jobRecord.metadata = metadata;
      }

      // Remove undefined values
      Object.keys(jobRecord).forEach(key => {
        if (jobRecord[key] === undefined) {
          delete jobRecord[key];
        }
      });

      const [affectedRows] = await Job.update(jobRecord, {
        where: { id: jobId },
      });

      if (affectedRows === 0) {
        throw new Error('Job not found or no changes made');
      }

      const job = await Job.findByPk(jobId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'year', 'make', 'model', 'vin', 'licensePlate', 'color'],
          },
        ],
      });

      console.log('Job updated successfully:', jobId);

      // Convert back to frontend format
      return this.transformToFrontend(job.toJSON());
    } catch (error) {
      console.error('JobService.updateJob error:', error);
      throw error;
    }
  }

  /**
   * Move job to new status
   */
  async moveJobToStatus(jobId, newStatus, notes = '') {
    try {
      // Validate status
      if (!this.statusFlow.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const updateData = {
        status: newStatus,
      };

      if (notes) {
        updateData.notes = notes;
      }

      const [affectedRows] = await Job.update(updateData, {
        where: { id: jobId },
      });

      if (affectedRows === 0) {
        throw new Error('Job not found');
      }

      const job = await Job.findByPk(jobId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'year', 'make', 'model', 'vin', 'licensePlate', 'color'],
          },
        ],
      });

      console.log(`Job ${jobId} moved to status: ${newStatus}`);

      // Convert back to frontend format
      return this.transformToFrontend(job.toJSON());
    } catch (error) {
      console.error('JobService.moveJobToStatus error:', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId) {
    try {
      const job = await Job.findByPk(jobId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'year', 'make', 'model', 'vin', 'licensePlate', 'color', 'mileage', 'engineSize'],
          },
        ],
      });

      if (!job) {
        return null; // Not found
      }

      return this.transformToFrontend(job.toJSON());
    } catch (error) {
      console.error('JobService.getJobById error:', error);
      throw error;
    }
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status) {
    try {
      const jobs = await Job.findAll({
        where: { status },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'year', 'make', 'model', 'vin', 'licensePlate', 'color'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return jobs.map(job => this.transformToFrontend(job.toJSON()));
    } catch (error) {
      console.error('JobService.getJobsByStatus error:', error);
      throw error;
    }
  }

  /**
   * Search jobs
   */
  async searchJobs(searchTerm) {
    try {
      const where = {
        ...queryHelpers.search(
          ['jobNumber', 'claimNumber', 'damageDescription'],
          searchTerm
        ),
      };

      const jobs = await Job.findAll({
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'year', 'make', 'model', 'vin', 'licensePlate', 'color'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return jobs.map(job => this.transformToFrontend(job.toJSON()));
    } catch (error) {
      console.error('JobService.searchJobs error:', error);
      throw error;
    }
  }

  /**
   * Delete job
   */
  async deleteJob(jobId) {
    try {
      const affectedRows = await Job.destroy({
        where: { id: jobId },
      });

      if (affectedRows === 0) {
        throw new Error('Job not found');
      }

      console.log('Job deleted successfully:', jobId);
      return { success: true };
    } catch (error) {
      console.error('JobService.deleteJob error:', error);
      throw error;
    }
  }

  /**
   * Generate job number
   */
  generateJobNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0');
    return `CR-${year}${month}-${random}`;
  }

  /**
   * Create job from BMS data
   */
  async createJobFromBMS(bmsData, customerId, vehicleId) {
    try {
      const jobData = {
        customerId: customerId,
        vehicleId: vehicleId,
        shopId:
          bmsData.shopId ||
          process.env.DEV_SHOP_ID ||
          '00000000-0000-4000-8000-000000000001',
        status: 'estimate',
        estimateTotal: parseFloat(
          bmsData.job?.estimateTotal || bmsData.documentInfo?.totalAmount || 0
        ),
        priority: bmsData.job?.priority || 'normal',
        insuranceCompany: bmsData.job?.insuranceCompany || '',
        claimNumber: bmsData.job?.claimNumber || '',
        deductible: parseFloat(bmsData.job?.deductible || 0),
        damageDescription: bmsData.job?.damageDescription || '',
        partsNeeded: bmsData.job?.partsNeeded || [],
        laborHours: parseFloat(bmsData.job?.laborHours || 0),
        paintHours: parseFloat(bmsData.job?.paintHours || 0),
        targetCompletion: bmsData.job?.targetCompletion || null,
        notes: bmsData.job?.notes || '',
        bmsImportId: bmsData.bmsImportId || null,
      };

      return await this.createJob(jobData);
    } catch (error) {
      console.error('JobService.createJobFromBMS error:', error);
      throw error;
    }
  }

  /**
   * Extract parts information from BMS data
   */
  extractPartsFromBMS(bmsData) {
    try {
      const parts = [];

      // Check different possible locations for parts data
      if (bmsData.damage && Array.isArray(bmsData.damage.parts)) {
        parts.push(
          ...bmsData.damage.parts.map(part => ({
            description: part.description || '',
            partNumber: part.partNumber || part.oem || '',
            quantity: parseInt(part.quantity || 1),
            price: parseFloat(part.price || 0),
            status: 'needed',
          }))
        );
      }

      if (bmsData.documentInfo && Array.isArray(bmsData.documentInfo.parts)) {
        parts.push(
          ...bmsData.documentInfo.parts.map(part => ({
            description: part.description || '',
            partNumber: part.partNumber || part.oem || '',
            quantity: parseInt(part.quantity || 1),
            price: parseFloat(part.price || 0),
            status: 'needed',
          }))
        );
      }

      return parts;
    } catch (error) {
      console.error('Error extracting parts from BMS:', error);
      return [];
    }
  }

  /**
   * Transform database record to frontend format
   */
  transformToFrontend(jobRecord) {
    if (!jobRecord) return null;

    const metadata = jobRecord.metadata || {};

    const transformed = {
      id: jobRecord.id,
      jobNumber: jobRecord.jobNumber || '',
      customerId: jobRecord.customerId,
      vehicleId: jobRecord.vehicleId,
      status: jobRecord.status || 'estimate',
      priority: jobRecord.priority || 'normal',
      estimateTotal: parseFloat(jobRecord.totalAmount || 0),
      insuranceCompany: metadata.insuranceCompany || '',
      claimNumber: jobRecord.claimNumber || '',
      deductible: parseFloat(jobRecord.deductible || 0),
      description: jobRecord.repairDescription || '',
      damageDescription: jobRecord.damageDescription || '',
      partsNeeded: metadata.partsNeeded || [],
      laborHours: parseFloat(jobRecord.estimatedHours || 0),
      paintHours: parseFloat(metadata.paintHours || 0),
      targetCompletion: jobRecord.targetDeliveryDate,
      targetDate: jobRecord.targetDeliveryDate,
      notes: jobRecord.notes || '',
      bmsImportId: metadata.bmsImportId || null,
      createdAt: jobRecord.createdAt,
      updatedAt: jobRecord.updatedAt,
      daysInShop: this.calculateDaysInShop(jobRecord.createdAt),
      progressPercentage: this.calculateProgressPercentage(jobRecord.status),
    };

    // Add customer information if available
    if (jobRecord.customer) {
      transformed.customer = {
        id: jobRecord.customer.id,
        name: `${jobRecord.customer.firstName || ''} ${jobRecord.customer.lastName || ''}`.trim(),
        firstName: jobRecord.customer.firstName || '',
        lastName: jobRecord.customer.lastName || '',
        email: jobRecord.customer.email || '',
        phone: jobRecord.customer.phone || '',
      };
    }

    // Add vehicle information if available
    if (jobRecord.vehicle) {
      transformed.vehicle = {
        id: jobRecord.vehicle.id,
        year: jobRecord.vehicle.year,
        make: jobRecord.vehicle.make || '',
        model: jobRecord.vehicle.model || '',
        vin: jobRecord.vehicle.vin || '',
        license: jobRecord.vehicle.licensePlate || '',
        color: jobRecord.vehicle.color || '',
      };
    }

    // Add insurance object for compatibility
    if (transformed.insuranceCompany || transformed.claimNumber) {
      transformed.insurance = {
        company: transformed.insuranceCompany,
        claimNumber: transformed.claimNumber,
      };
    }

    return transformed;
  }

  /**
   * Calculate days in shop
   */
  calculateDaysInShop(createdAt) {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate progress percentage based on status
   */
  calculateProgressPercentage(status) {
    const statusIndex = this.statusFlow.indexOf(status);
    if (statusIndex === -1) return 0;
    return Math.round((statusIndex / (this.statusFlow.length - 1)) * 100);
  }
}

module.exports = { jobService: new JobService(), JobService };
