import { Op, Sequelize } from 'sequelize';
import { Decimal } from 'decimal.js';
import { NormalizedPayload, Database, Transaction } from './types';

/**
 * Data normalizer with idempotent upsert logic
 * Ensures data integrity and prevents duplicates on re-imports
 */
class DataNormalizer {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Main upsert function - processes normalized payload
   * @param payload - Normalized data from BMS/EMS parser
   * @returns Promise<JobRecord> - Created or updated job record
   */
  async upsertJob(payload: NormalizedPayload): Promise<any> {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      // Get or create default shop
      const shop = await this.getDefaultShop(transaction);
      
      // Find existing job by identities
      const existingJob = await this.findExistingJob(payload.identities, shop.id, transaction);
      
      if (existingJob && existingJob.isUserModified) {
        // If job exists and has user modifications, create audit log and return existing
        await this.createAuditLog(existingJob.id, 'import_skipped', 
          'Job has user modifications - import skipped', payload.meta, transaction);
        await transaction.commit();
        return existingJob;
      }

      // Create or update customer
      const customer = await this.upsertCustomer(payload.customer, shop.id, transaction);
      
      // Create or update vehicle
      const vehicle = await this.upsertVehicle(payload.vehicle, customer.id, shop.id, transaction);
      
      // Create or update job
      const job = existingJob 
        ? await this.updateJob(existingJob, payload, customer.id, vehicle.id, transaction)
        : await this.createJob(payload, customer.id, vehicle.id, shop.id, transaction);

      // Update parts and labor data
      await this.upsertJobDetails(job.id, payload, transaction);
      
      // Create audit log
      await this.createAuditLog(job.id, existingJob ? 'updated' : 'created', 
        'Job data imported/updated', payload.meta, transaction);

      await transaction.commit();
      return job;
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error in upsertJob:', error);
      throw error;
    }
  }

  /**
   * Find existing job by multiple identities
   */
  private async findExistingJob(identities: any, shopId: string, transaction: Transaction): Promise<any> {
    const whereConditions: any[] = [];
    
    // Search by claim number if available
    if (identities.claim_number) {
      whereConditions.push({ claimNumber: identities.claim_number });
    }
    
    // Search by estimate/RO number if available
    if (identities.ro_number) {
      whereConditions.push({ 
        [Op.or]: [
          { estimateNumber: identities.ro_number },
          { jobNumber: identities.ro_number }
        ]
      });
    }
    
    // Search by VIN if available
    if (identities.vin && whereConditions.length === 0) {
      const vehicle = await this.db.Vehicle.findOne({
        where: { vin: identities.vin, shopId },
        transaction
      });
      
      if (vehicle) {
        whereConditions.push({ vehicleId: vehicle.id });
      }
    }

    if (whereConditions.length === 0) {
      return null; // No identities to search by
    }

    return await this.db.Job.findOne({
      where: {
        shopId,
        [Op.or]: whereConditions
      },
      transaction
    });
  }

  /**
   * Create or update customer with duplicate prevention
   */
  private async upsertCustomer(customerData: any, shopId: string, transaction: Transaction): Promise<any> {
    // Try to find existing customer by multiple criteria
    const searchCriteria: any[] = [];
    
    if (customerData.email && customerData.email !== 'N/A') {
      searchCriteria.push({ email: customerData.email });
    }
    
    if (customerData.phone && customerData.phone !== 'N/A') {
      // Normalize phone number for comparison
      const normalizedPhone = this.normalizePhone(customerData.phone);
      searchCriteria.push({ phone: normalizedPhone });
    }
    
    // For businesses, search by company name
    if (customerData.type === 'organization' && customerData.companyName) {
      searchCriteria.push({ 
        companyName: customerData.companyName,
        customerType: 'business'
      });
    }

    let existingCustomer = null;
    
    if (searchCriteria.length > 0) {
      existingCustomer = await this.db.Customer.findOne({
        where: {
          shopId,
          [Op.or]: searchCriteria
        },
        transaction
      });
    }

    const customerRecord = {
      shopId,
      firstName: customerData.firstName || 'Unknown',
      lastName: customerData.lastName || 'Customer',
      companyName: customerData.companyName || null,
      email: customerData.email && customerData.email !== 'N/A' ? customerData.email : null,
      phone: customerData.phone && customerData.phone !== 'N/A' ? this.normalizePhone(customerData.phone) : null,
      address: customerData.address?.address1 || null,
      city: customerData.address?.city || null,
      state: customerData.address?.stateProvince || null,
      zipCode: customerData.address?.postalCode || null,
      customerType: customerData.type === 'organization' ? 'business' : 'individual',
      customerStatus: 'active',
      gstExempt: !customerData.gst_payable,
      preferredContact: customerData.email ? 'email' : 'phone',
      lastVisitDate: new Date()
    };

    if (existingCustomer) {
      // Update existing customer with new data
      await existingCustomer.update(customerRecord, { transaction });
      return existingCustomer;
    } else {
      // Create new customer
      const customerNumber = await this.generateCustomerNumber(shopId, transaction);
      return await this.db.Customer.create({
        ...customerRecord,
        customerNumber,
        firstVisitDate: new Date()
      }, { transaction });
    }
  }

  /**
   * Create or update vehicle with duplicate prevention
   */
  private async upsertVehicle(vehicleData: any, customerId: string, shopId: string, transaction: Transaction): Promise<any> {
    let existingVehicle = null;

    // Search by VIN if available
    if (vehicleData.vin && vehicleData.vin !== 'N/A') {
      existingVehicle = await this.db.Vehicle.findOne({
        where: {
          shopId,
          vin: vehicleData.vin
        },
        transaction
      });
    }

    const vehicleRecord = {
      shopId,
      customerId,
      vin: vehicleData.vin && vehicleData.vin !== 'N/A' ? vehicleData.vin : null,
      licensePlate: vehicleData.license?.plateNumber || null,
      licenseState: vehicleData.license?.stateProvince || null,
      year: vehicleData.year || 2020,
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      subModel: vehicleData.subModel || null,
      bodyStyle: vehicleData.bodyStyle || null,
      engine: vehicleData.engine || null,
      transmission: vehicleData.transmission || null,
      fuelType: vehicleData.fuelType || null,
      exteriorColor: vehicleData.exteriorColor || null,
      interiorColor: vehicleData.interiorColor || null,
      odometer: vehicleData.odometer || 0,
      odometerUnit: vehicleData.odometerUnit || 'miles',
      condition: vehicleData.condition || null,
      drivable: vehicleData.drivable || true,
      priorDamage: vehicleData.priorDamage || false,
      vehicleStatus: 'active'
    };

    if (existingVehicle) {
      // Update existing vehicle
      await existingVehicle.update(vehicleRecord, { transaction });
      
      // If customer has changed, update the association
      if (existingVehicle.customerId !== customerId) {
        await existingVehicle.update({ customerId }, { transaction });
      }
      
      return existingVehicle;
    } else {
      // Create new vehicle
      return await this.db.Vehicle.create(vehicleRecord, { transaction });
    }
  }

  /**
   * Create new job record
   */
  private async createJob(payload: NormalizedPayload, customerId: string, vehicleId: string, shopId: string, transaction: Transaction): Promise<any> {
    const jobNumber = await this.generateJobNumber(transaction);
    
    // Calculate totals from lines
    const totals = this.calculateTotals(payload.lines);
    
    const jobRecord = {
      shopId,
      jobNumber,
      customerId,
      vehicleId,
      status: 'estimate',
      priority: 'normal',
      jobType: 'collision',
      claimNumber: payload.identities.claim_number || null,
      estimateNumber: payload.identities.ro_number || null,
      deductible: 0, // Will be updated from claim data if available
      totalAmount: totals.grossTotal.toNumber(),
      laborAmount: totals.laborTotal.toNumber(),
      partsAmount: totals.partsTotal.toNumber(),
      materialsAmount: totals.materialsTotal.toNumber(),
      subletAmount: 0,
      taxAmount: 0, // Will be calculated by tax engine
      damageDescription: 'Imported from estimate',
      repairDescription: 'Imported from estimate',
      notes: JSON.stringify({
        sourceSystem: payload.meta.source_system,
        importTimestamp: payload.meta.import_timestamp,
        unknownTags: payload.meta.unknown_tags
      }),
      estimateStatus: 'approved',
      isInsurance: !!payload.identities.claim_number,
      checkInDate: new Date(),
      source: 'import',
      metadata: {
        importSource: payload.meta.source_system,
        originalData: {
          identities: payload.identities,
          unknownTags: payload.meta.unknown_tags
        }
      }
    };

    return await this.db.Job.create(jobRecord, { transaction });
  }

  /**
   * Update existing job record
   */
  private async updateJob(existingJob: any, payload: NormalizedPayload, customerId: string, vehicleId: string, transaction: Transaction): Promise<any> {
    const totals = this.calculateTotals(payload.lines);
    
    const updates = {
      customerId,
      vehicleId,
      claimNumber: payload.identities.claim_number || existingJob.claimNumber,
      estimateNumber: payload.identities.ro_number || existingJob.estimateNumber,
      totalAmount: totals.grossTotal.toNumber(),
      laborAmount: totals.laborTotal.toNumber(),
      partsAmount: totals.partsTotal.toNumber(),
      materialsAmount: totals.materialsTotal.toNumber(),
      notes: JSON.stringify({
        ...JSON.parse(existingJob.notes || '{}'),
        lastImport: payload.meta.import_timestamp,
        importSource: payload.meta.source_system,
        unknownTags: payload.meta.unknown_tags
      }),
      updatedAt: new Date(),
      metadata: {
        ...existingJob.metadata,
        lastImportSource: payload.meta.source_system,
        importHistory: [
          ...(existingJob.metadata?.importHistory || []),
          {
            timestamp: payload.meta.import_timestamp,
            source: payload.meta.source_system,
            unknownTags: payload.meta.unknown_tags
          }
        ]
      }
    };

    await existingJob.update(updates, { transaction });
    return existingJob;
  }

  /**
   * Upsert job details (parts, labor, materials)
   */
  private async upsertJobDetails(jobId: string, payload: NormalizedPayload, transaction: Transaction): Promise<void> {
    // Store line items in job metadata for now
    // In a full implementation, you might have separate tables for JobLines, JobParts, etc.
    
    const existingJob = await this.db.Job.findByPk(jobId, { transaction });
    if (!existingJob) return;

    const jobDetails = {
      lines: payload.lines.map((line: any) => ({
        lineNum: line.lineNum,
        description: line.lineDesc,
        type: line.lineType,
        amount: line.amount.toNumber(),
        taxable: line.taxable,
        partInfo: line.partInfo ? {
          partNumber: line.partInfo.partNumber,
          description: line.partInfo.description,
          price: line.partInfo.price.toNumber(),
          quantity: line.partInfo.quantity,
          partType: line.partInfo.partType
        } : null,
        laborInfo: line.laborInfo ? {
          operation: line.laborInfo.operation,
          hours: line.laborInfo.hours.toNumber(),
          rate: line.laborInfo.rate?.toNumber(),
          laborType: line.laborInfo.laborType
        } : null
      })),
      parts: payload.parts.map((part: any) => ({
        partNumber: part.partNumber,
        description: part.description,
        price: part.price.toNumber(),
        quantity: part.quantity,
        lineNumber: part.lineNumber
      }))
    };

    await existingJob.update({
      metadata: {
        ...existingJob.metadata,
        jobDetails
      }
    }, { transaction });
  }

  /**
   * Calculate totals from estimate lines
   */
  private calculateTotals(lines: any[]): { laborTotal: Decimal; partsTotal: Decimal; materialsTotal: Decimal; grossTotal: Decimal } {
    let laborTotal = new Decimal(0);
    let partsTotal = new Decimal(0);
    let materialsTotal = new Decimal(0);

    for (const line of lines) {
      if (line.partInfo) {
        partsTotal = partsTotal.plus(line.partInfo.price.times(line.partInfo.quantity));
      }
      if (line.laborInfo && line.laborInfo.rate) {
        laborTotal = laborTotal.plus(line.laborInfo.hours.times(line.laborInfo.rate));
      }
      if (line.otherChargesInfo) {
        materialsTotal = materialsTotal.plus(line.otherChargesInfo.price);
      }
    }

    const grossTotal = laborTotal.plus(partsTotal).plus(materialsTotal);

    return {
      laborTotal,
      partsTotal,
      materialsTotal,
      grossTotal
    };
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(jobId: string, action: string, description: string, meta: any, transaction: Transaction): Promise<void> {
    // Store audit log in job history for now
    const job = await this.db.Job.findByPk(jobId, { transaction });
    if (!job) return;

    const auditEntry = {
      timestamp: new Date(),
      action,
      description,
      source: meta.source_system,
      metadata: {
        unknownTags: meta.unknown_tags,
        importTimestamp: meta.import_timestamp
      }
    };

    const history = job.history || [];
    history.push(auditEntry);

    await job.update({ history }, { transaction });
  }

  /**
   * Get or create default shop
   */
  private async getDefaultShop(transaction: Transaction): Promise<any> {
    let shop = await this.db.Shop.findOne({
      where: { isActive: true },
      order: [['createdAt', 'ASC']],
      transaction
    });

    if (!shop) {
      shop = await this.db.Shop.create({
        name: 'Default Auto Body Shop',
        businessName: 'Default Auto Body Shop Ltd.',
        email: 'info@defaultautobody.com',
        phone: '(555) 123-4567',
        address: '123 Main Street',
        city: 'Toronto',
        state: 'Ontario',
        postalCode: 'M5V 3A8',
        country: 'Canada',
        setupCompleted: true,
        isActive: true
      }, { transaction });
    }

    return shop;
  }

  /**
   * Generate unique customer number
   */
  private async generateCustomerNumber(shopId: string, transaction: Transaction): Promise<string> {
    const count = await this.db.Customer.count({
      where: { shopId },
      transaction
    });
    
    return `CUST-${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Generate unique job number
   */
  private async generateJobNumber(transaction: Transaction): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find next available number for today
    const prefix = `${year}${month}${day}`;
    const existingCount = await this.db.Job.count({
      where: {
        jobNumber: {
          [Op.like]: `${prefix}-%`
        }
      },
      transaction
    });
    
    const sequence = (existingCount + 1).toString().padStart(3, '0');
    return `${prefix}-${sequence}`;
  }

  /**
   * Normalize phone number for consistent storage and comparison
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle North American numbers
    if (digits.length === 10) {
      return `(${digits.substr(0, 3)}) ${digits.substr(3, 3)}-${digits.substr(6, 4)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      const areaCode = digits.substr(1, 3);
      const exchange = digits.substr(4, 3);
      const number = digits.substr(7, 4);
      return `+1 (${areaCode}) ${exchange}-${number}`;
    }
    
    // Return original for international numbers
    return phone;
  }
}

/**
 * Factory function to create normalizer instance
 */
async function createNormalizer() {
  try {
    // Dynamic import to handle both ES modules and CommonJS
    let models;
    
    if (typeof require !== 'undefined') {
      // CommonJS environment
      models = require('../../database/models/index.js');
    } else {
      // ES modules environment
      models = await import('../../database/models/index.js');
    }

    return new DataNormalizer(models);
  } catch (error) {
    console.error('Error creating normalizer:', error);
    throw new Error('Failed to initialize data normalizer');
  }
}

export { DataNormalizer, createNormalizer };
export default DataNormalizer;