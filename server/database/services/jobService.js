const { supabase, supabaseAdmin } = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Job Service - Supabase integration for job/repair order management
 */
class JobService {
  constructor() {
    this.table = 'jobs';
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
      let query = supabase.from(this.table).select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          vehicles (
            id,
            year,
            make,
            model,
            vin,
            license_plate,
            color
          )
        `);

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }
      if (options.customerId) {
        query = query.eq('customer_id', options.customerId);
      }

      // Apply sorting
      if (options.sortBy) {
        query = query.order(options.sortBy, {
          ascending: options.ascending !== false,
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 100) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting jobs:', error);
        throw error;
      }

      return (data || []).map(job => this.transformToFrontend(job));
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
      // Start with minimal required fields only
      const jobRecord = {
        job_number: jobData.jobNumber || this.generateJobNumber(),
        customer_id: jobData.customerId,
        vehicle_id: jobData.vehicleId,
        shop_id:
          jobData.shopId ||
          process.env.DEV_SHOP_ID ||
          '00000000-0000-4000-8000-000000000001',
        status: jobData.status || 'estimate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add optional fields only if they exist in schema
      // if (jobData.description) jobRecord.description = jobData.description; // Column doesn't exist in Supabase
      if (jobData.estimateTotal)
        jobRecord.estimate_total = jobData.estimateTotal;
      // Remove columns that don't exist in schema for now
      // priority, insurance_company, claim_number, deductible, damage_description,
      // parts_needed, labor_hours, paint_hours, target_completion, notes, bms_import_id

      // Use admin client to bypass RLS for system operations
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from(this.table)
        .insert([jobRecord])
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          vehicles (
            id,
            year,
            make,
            model,
            vin,
            license_plate
          )
        `
        )
        .single();

      if (error) {
        console.error('Error creating job:', error);
        throw error;
      }

      console.log('Job created successfully:', data.id);

      // Convert back to frontend format
      return this.transformToFrontend(data);
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
        estimate_total: updateData.estimateTotal,
        description: updateData.description,
        damage_description: updateData.damageDescription,
        parts_needed: updateData.partsNeeded,
        labor_hours: updateData.laborHours,
        paint_hours: updateData.paintHours,
        target_completion: updateData.targetCompletion,
        notes: updateData.notes,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(jobRecord).forEach(key => {
        if (jobRecord[key] === undefined) {
          delete jobRecord[key];
        }
      });

      const { data, error } = await supabase
        .from(this.table)
        .update(jobRecord)
        .eq('id', jobId)
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          vehicles (
            id,
            year,
            make,
            model,
            vin,
            license_plate,
            color
          )
        `
        )
        .single();

      if (error) {
        console.error('Error updating job:', error);
        throw error;
      }

      console.log('Job updated successfully:', jobId);

      // Convert back to frontend format
      return this.transformToFrontend(data);
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
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', jobId)
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          vehicles (
            id,
            year,
            make,
            model,
            vin,
            license_plate,
            color
          )
        `
        )
        .single();

      if (error) {
        console.error('Error moving job:', error);
        throw error;
      }

      console.log(`Job ${jobId} moved to status: ${newStatus}`);

      // Convert back to frontend format
      return this.transformToFrontend(data);
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
      const { data, error } = await supabase
        .from(this.table)
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            state
          ),
          vehicles (
            id,
            year,
            make,
            model,
            vin,
            license_plate,
            color,
            mileage,
            engine
          )
        `
        )
        .eq('id', jobId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error getting job:', error);
        throw error;
      }

      return this.transformToFrontend(data);
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
      const { data, error } = await supabase
        .from(this.table)
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          vehicles (
            id,
            year,
            make,
            model,
            vin,
            license_plate,
            color
          )
        `
        )
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting jobs by status:', error);
        throw error;
      }

      return (data || []).map(job => this.transformToFrontend(job));
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
      const { data, error } = await supabase
        .from(this.table)
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          vehicles (
            id,
            year,
            make,
            model,
            vin,
            license_plate,
            color
          )
        `
        )
        .or(
          `job_number.ilike.%${searchTerm}%,claim_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching jobs:', error);
        throw error;
      }

      return (data || []).map(job => this.transformToFrontend(job));
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
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('Error deleting job:', error);
        throw error;
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
        // description: 'BMS Import Job', // Column doesn't exist in Supabase schema
        estimateTotal: parseFloat(
          bmsData.job?.estimateTotal || bmsData.documentInfo?.totalAmount || 0
        ),
        // Remove fields that don't exist in schema for now
        // priority, insuranceCompany, claimNumber, deductible, damageDescription,
        // partsNeeded, laborHours, paintHours, targetCompletion, notes, bmsImportId
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

    const transformed = {
      id: jobRecord.id,
      jobNumber: jobRecord.job_number || '',
      customerId: jobRecord.customer_id,
      vehicleId: jobRecord.vehicle_id,
      status: jobRecord.status || 'estimate',
      priority: jobRecord.priority || 'normal',
      estimateTotal: parseFloat(jobRecord.estimate_total || 0),
      insuranceCompany: jobRecord.insurance_company || '',
      claimNumber: jobRecord.claim_number || '',
      deductible: parseFloat(jobRecord.deductible || 0),
      description: jobRecord.description || '',
      damageDescription: jobRecord.damage_description || '',
      partsNeeded: jobRecord.parts_needed || [],
      laborHours: parseFloat(jobRecord.labor_hours || 0),
      paintHours: parseFloat(jobRecord.paint_hours || 0),
      targetCompletion: jobRecord.target_completion,
      targetDate: jobRecord.target_completion,
      notes: jobRecord.notes || '',
      bmsImportId: jobRecord.bms_import_id,
      createdAt: jobRecord.created_at,
      updatedAt: jobRecord.updated_at,
      daysInShop: this.calculateDaysInShop(jobRecord.created_at),
      progressPercentage: this.calculateProgressPercentage(jobRecord.status),
    };

    // Add customer information if available
    if (jobRecord.customers) {
      transformed.customer = {
        id: jobRecord.customers.id,
        name: `${jobRecord.customers.first_name || ''} ${jobRecord.customers.last_name || ''}`.trim(),
        firstName: jobRecord.customers.first_name || '',
        lastName: jobRecord.customers.last_name || '',
        email: jobRecord.customers.email || '',
        phone: jobRecord.customers.phone || '',
      };
    }

    // Add vehicle information if available
    if (jobRecord.vehicles) {
      transformed.vehicle = {
        id: jobRecord.vehicles.id,
        year: jobRecord.vehicles.year,
        make: jobRecord.vehicles.make || '',
        model: jobRecord.vehicles.model || '',
        vin: jobRecord.vehicles.vin || '',
        license: jobRecord.vehicles.license_plate || '',
        color: jobRecord.vehicles.color || '',
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
