const EnhancedBMSParser = require('./import/bms_parser.js');
const EMSParser = require('./import/ems_parser.js');
const { AutomatedPartsSourcingService } = require('./automatedPartsSourcing');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

/**
 * BMS Service - Handles BMS/EMS file processing and data management
 */
class BMSService {
  constructor() {
    this.bmsParser = new EnhancedBMSParser();
    this.emsParser = new EMSParser();
    this.automatedSourcing = new AutomatedPartsSourcingService();
    this.importHistory = new Map();
  }

  /**
   * Process BMS XML file
   */
  async processBMSFile(content, context = {}) {
    try {
      console.log('Processing BMS file...', context.fileName);

      const startTime = Date.now();
      const parsedData = await this.bmsParser.parseBMS(content);
      const processingTime = Date.now() - startTime;

      // Create import record
      const importRecord = {
        id: context.uploadId || uuidv4(),
        fileName: context.fileName,
        fileType: 'BMS',
        status: 'completed',
        startTime: new Date(startTime),
        endTime: new Date(),
        processingTime,
        userId: context.userId,
        data: parsedData,
      };

      this.importHistory.set(importRecord.id, importRecord);

      return {
        importId: importRecord.id,
        customer: this.normalizeCustomerData(parsedData.customer),
        vehicle: this.normalizeVehicleData(parsedData.vehicle),
        job: this.createJobFromEstimate(parsedData),
        documentInfo: parsedData.estimate,
        claimInfo: parsedData.claim || {},
        damage: this.normalizeDamageData(parsedData),
        validation: this.validateImportedData(parsedData),
        metadata: {
          ...parsedData.metadata,
          processingTime,
          importId: importRecord.id,
        },
      };
    } catch (error) {
      console.error('BMS processing error:', error);
      throw new Error(`BMS file processing failed: ${error.message}`);
    }
  }

  /**
   * Process BMS XML file with automated parts sourcing
   * @param {string} content - XML content
   * @param {Object} context - Processing context
   * @param {Object} sourcingOptions - Automated sourcing options
   */
  async processBMSWithAutomatedSourcing(content, context = {}, sourcingOptions = {}) {
    try {
      console.log('Processing BMS file with automated sourcing...', context.fileName);

      const startTime = Date.now();
      
      // First do standard BMS parsing
      const parsedData = await this.bmsParser.parseBMS(content);
      
      // Check if automated sourcing should be applied
      const shouldRunAutomatedSourcing = 
        sourcingOptions.enableAutomatedSourcing !== false && 
        parsedData.parts && 
        parsedData.parts.length > 0;

      let automatedSourcingResults = null;
      
      if (shouldRunAutomatedSourcing) {
        console.log('Running automated parts sourcing for', parsedData.parts.length, 'parts');
        
        try {
          automatedSourcingResults = await this.automatedSourcing.processAutomatedPartsSourcing(
            parsedData.parts,
            parsedData.vehicle,
            {
              enhanceWithVinDecoding: sourcingOptions.enhanceWithVinDecoding !== false,
              generatePO: sourcingOptions.generateAutoPO === true,
              vendorTimeout: sourcingOptions.vendorTimeout || 2000,
              preferredVendors: sourcingOptions.preferredVendors,
              approvalThreshold: sourcingOptions.approvalThreshold || 1000,
              baseMarkup: sourcingOptions.baseMarkup || 0.25,
              insuranceCompany: parsedData.estimate?.insuranceCompany,
              claimInfo: parsedData.estimate?.claimInfo
            }
          );
        } catch (sourcingError) {
          console.error('Automated sourcing failed:', sourcingError);
          automatedSourcingResults = {
            success: false,
            error: sourcingError.message,
            fallbackMode: true
          };
        }
      }

      const processingTime = Date.now() - startTime;

      // Create enhanced import record
      const importRecord = {
        id: context.uploadId || uuidv4(),
        fileName: context.fileName,
        fileType: 'BMS',
        status: 'completed',
        startTime: new Date(startTime),
        endTime: new Date(),
        processingTime,
        userId: context.userId,
        data: parsedData,
        automatedSourcing: automatedSourcingResults,
        sourcingOptions,
      };

      this.importHistory.set(importRecord.id, importRecord);

      // Generate enhanced result with sourcing data
      const result = {
        importId: importRecord.id,
        customer: this.normalizeCustomerData(parsedData.customer),
        vehicle: this.normalizeVehicleData(parsedData.vehicle),
        job: this.createJobFromEstimate(parsedData),
        documentInfo: parsedData.estimate,
        claimInfo: parsedData.claim || {},
        damage: this.normalizeDamageData(parsedData),
        validation: this.validateImportedData(parsedData),
        metadata: {
          ...parsedData.metadata,
          processingTime,
          importId: importRecord.id,
        },
        // Enhanced with automated sourcing data
        automatedSourcing: automatedSourcingResults ? {
          enabled: true,
          ...automatedSourcingResults,
          recommendations: this.generateSourcingRecommendations(automatedSourcingResults, sourcingOptions)
        } : {
          enabled: false,
          reason: 'No parts found or sourcing disabled'
        }
      };

      // Add sourced parts data if available
      if (automatedSourcingResults?.success && automatedSourcingResults.results) {
        result.sourcedParts = this.formatSourcedPartsForUI(automatedSourcingResults.results);
        result.purchaseOrderRecommendations = this.generatePORecommendations(automatedSourcingResults.results);
      }

      return result;

    } catch (error) {
      console.error('BMS processing with automated sourcing error:', error);
      throw new Error(`BMS file processing with automated sourcing failed: ${error.message}`);
    }
  }

  /**
   * Generate sourcing recommendations for UI
   */
  generateSourcingRecommendations(sourcingResults, options) {
    if (!sourcingResults.success || !sourcingResults.results) {
      return null;
    }

    const results = sourcingResults.results;
    const successful = results.filter(r => r.recommendedSource.recommended);
    const failed = results.filter(r => !r.recommendedSource.recommended);
    
    const recommendations = {
      summary: {
        totalParts: results.length,
        successfullySourced: successful.length,
        requiresManualSourcing: failed.length,
        sourcingSuccessRate: results.length > 0 ? 
          ((successful.length / results.length) * 100).toFixed(1) + '%' : '0%'
      },
      actions: []
    };

    // Add action recommendations
    if (successful.length > 0) {
      const autoGeneratePO = successful.filter(r => r.poData && !r.poData.requiresApproval);
      const requiresApproval = successful.filter(r => r.poData && r.poData.requiresApproval);
      
      if (autoGeneratePO.length > 0) {
        recommendations.actions.push({
          type: 'auto_generate_po',
          description: `Auto-generate purchase orders for ${autoGeneratePO.length} parts`,
          count: autoGeneratePO.length,
          estimatedValue: autoGeneratePO.reduce((sum, part) => 
            sum + (part.poData?.poLineItem?.extendedPrice || 0), 0
          )
        });
      }
      
      if (requiresApproval.length > 0) {
        recommendations.actions.push({
          type: 'review_for_approval',
          description: `Review ${requiresApproval.length} high-value parts for approval`,
          count: requiresApproval.length,
          estimatedValue: requiresApproval.reduce((sum, part) => 
            sum + (part.poData?.poLineItem?.extendedPrice || 0), 0
          )
        });
      }
    }
    
    if (failed.length > 0) {
      recommendations.actions.push({
        type: 'manual_sourcing',
        description: `${failed.length} parts require manual sourcing`,
        count: failed.length,
        reasons: failed.map(part => part.recommendedSource.reason).filter((v, i, a) => a.indexOf(v) === i)
      });
    }

    return recommendations;
  }

  /**
   * Format sourced parts data for UI consumption
   */
  formatSourcedPartsForUI(results) {
    return results.map(result => ({
      originalPart: {
        lineNumber: result.originalLine.lineNumber,
        description: result.originalLine.description || result.originalLine.partName,
        partNumber: result.originalLine.partNumber,
        quantity: result.originalLine.quantity || 1,
        originalPrice: result.originalLine.partCost || result.originalLine.price || 0
      },
      classification: result.classifiedPart.classifiedType,
      category: result.classifiedPart.category,
      priority: result.classifiedPart.priority,
      sourcing: {
        success: result.recommendedSource.recommended,
        vendor: result.recommendedSource.recommended ? {
          id: result.recommendedSource.vendor.vendorId,
          partNumber: result.recommendedSource.vendor.partNumber,
          price: result.recommendedSource.vendor.price,
          availability: result.recommendedSource.vendor.available,
          leadTime: result.recommendedSource.vendor.leadTime,
          reliability: result.recommendedSource.vendor.reliability
        } : null,
        alternatives: result.recommendedSource.alternatives || [],
        reason: result.recommendedSource.reason || 'Successfully sourced'
      },
      poData: result.poData || null,
      processingTimestamp: result.processingTimestamp
    }));
  }

  /**
   * Generate purchase order recommendations
   */
  generatePORecommendations(results) {
    const poRecommendations = [];
    const vendorGroups = {};

    // Group parts by vendor
    results.forEach(result => {
      if (result.recommendedSource.recommended && result.poData) {
        const vendorId = result.poData.vendorId;
        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = {
            vendorId,
            parts: [],
            totalValue: 0,
            highestPriority: 0,
            requiresApproval: false
          };
        }

        vendorGroups[vendorId].parts.push(result);
        vendorGroups[vendorId].totalValue += result.poData.poLineItem.extendedPrice;
        vendorGroups[vendorId].highestPriority = Math.max(
          vendorGroups[vendorId].highestPriority,
          result.classifiedPart.priority || 0
        );
        vendorGroups[vendorId].requiresApproval = 
          vendorGroups[vendorId].requiresApproval || result.poData.requiresApproval;
      }
    });

    // Create PO recommendations
    for (const [vendorId, group] of Object.entries(vendorGroups)) {
      poRecommendations.push({
        vendorId,
        itemCount: group.parts.length,
        totalValue: group.totalValue,
        priority: group.highestPriority,
        requiresApproval: group.requiresApproval,
        recommendedAction: group.requiresApproval ? 'review_and_approve' : 'auto_generate',
        estimatedDelivery: Math.max(...group.parts.map(p => p.poData?.poLineItem?.leadTime || 0)),
        parts: group.parts.map(part => ({
          partNumber: part.classifiedPart.normalizedPartNumber,
          description: part.classifiedPart.description,
          quantity: part.classifiedPart.quantity,
          unitPrice: part.poData.poLineItem.unitPrice,
          extendedPrice: part.poData.poLineItem.extendedPrice
        }))
      });
    }

    // Sort by priority (highest first)
    poRecommendations.sort((a, b) => b.priority - a.priority);

    return poRecommendations;
  }

  /**
   * Process EMS text file
   */
  async processEMSFile(content, context = {}) {
    try {
      console.log('Processing EMS file...', context.fileName);

      const startTime = Date.now();
      const parsedData = await this.emsParser.parseEMS(content);
      const processingTime = Date.now() - startTime;

      // Create import record
      const importRecord = {
        id: context.uploadId || uuidv4(),
        fileName: context.fileName,
        fileType: 'EMS',
        status: 'completed',
        startTime: new Date(startTime),
        endTime: new Date(),
        processingTime,
        userId: context.userId,
        data: parsedData,
      };

      this.importHistory.set(importRecord.id, importRecord);

      return {
        importId: importRecord.id,
        customer: this.normalizeCustomerData(parsedData.customer),
        vehicle: this.normalizeVehicleData(parsedData.vehicle),
        job: this.createJobFromEstimate(parsedData),
        documentInfo: parsedData.estimate,
        claimInfo: parsedData.claim || {},
        damage: this.normalizeDamageData(parsedData),
        validation: this.validateImportedData(parsedData),
        metadata: {
          ...parsedData.metadata,
          processingTime,
          importId: importRecord.id,
        },
      };
    } catch (error) {
      console.error('EMS processing error:', error);
      throw new Error(`EMS file processing failed: ${error.message}`);
    }
  }

  /**
   * Normalize customer data to standard format
   */
  normalizeCustomerData(customerData) {
    if (!customerData) return null;

    return {
      firstName:
        customerData.firstName || customerData.name?.split(' ')[0] || '',
      lastName:
        customerData.lastName ||
        customerData.name?.split(' ').slice(1).join(' ') ||
        '',
      name:
        customerData.name ||
        `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
      phone: customerData.phone || '',
      email: customerData.email || '',
      address: customerData.address || '',
      city: customerData.city || '',
      state: customerData.state || '',
      zip: customerData.zip || '',
      insurance: customerData.insurance || '',
    };
  }

  /**
   * Normalize vehicle data to standard format
   */
  normalizeVehicleData(vehicleData) {
    if (!vehicleData) return null;

    return {
      year: vehicleData.year || null,
      make: vehicleData.make || '',
      model: vehicleData.model || '',
      vin: vehicleData.vin || '',
      license: vehicleData.license || '',
      mileage: vehicleData.mileage || null,
      color: vehicleData.color || '',
      engine: vehicleData.engine || '',
      transmission: vehicleData.transmission || '',
    };
  }

  /**
   * Create job/estimate from parsed data
   */
  createJobFromEstimate(parsedData) {
    const jobId = uuidv4();
    const jobNumber =
      parsedData.estimate?.estimateNumber ||
      parsedData.estimate?.roNumber ||
      `JOB-${Date.now()}`;

    return {
      id: jobId,
      jobNumber,
      status: 'estimate',
      estimateNumber: parsedData.estimate?.estimateNumber || jobNumber,
      roNumber: parsedData.estimate?.roNumber || null,
      dateCreated: new Date().toISOString(),
      totalAmount: this.calculateTotalAmount(parsedData),
      partsCount: parsedData.parts?.length || 0,
      laborCount: parsedData.labor?.length || 0,
      lineItemsCount: parsedData.lineItems?.length || 0,
    };
  }

  /**
   * Normalize damage/repair data
   */
  normalizeDamageData(parsedData) {
    const damageLines = [];

    // Add parts as damage lines
    if (parsedData.parts) {
      parsedData.parts.forEach((part, index) => {
        damageLines.push({
          id: uuidv4(),
          lineNumber: part.lineNumber || index + 1,
          type: 'part',
          description: part.description || '',
          partNumber: part.partNumber || '',
          quantity: part.quantity || 1,
          unitPrice: part.price || 0,
          extendedPrice: (part.price || 0) * (part.quantity || 1),
          category: 'Parts',
        });
      });
    }

    // Add labor as damage lines
    if (parsedData.labor) {
      parsedData.labor.forEach((labor, index) => {
        damageLines.push({
          id: uuidv4(),
          lineNumber:
            labor.lineNumber || (parsedData.parts?.length || 0) + index + 1,
          type: 'labor',
          description: labor.description || labor.operation || '',
          operation: labor.operation || '',
          hours: labor.hours || 0,
          rate: labor.rate || 0,
          extendedPrice:
            labor.extended || (labor.hours || 0) * (labor.rate || 0),
          category: 'Labor',
        });
      });
    }

    return {
      damageLines,
      totalLines: damageLines.length,
      totalAmount: this.calculateTotalAmount(parsedData),
      partsTotal: this.calculatePartsTotal(parsedData),
      laborTotal: this.calculateLaborTotal(parsedData),
      taxTotal:
        (parsedData.financial?.laborTax || 0) +
        (parsedData.financial?.partsTax || 0),
    };
  }

  /**
   * Calculate total amount from parsed data
   */
  calculateTotalAmount(parsedData) {
    if (parsedData.financial?.total) {
      return parsedData.financial.total;
    }

    const partsTotal = this.calculatePartsTotal(parsedData);
    const laborTotal = this.calculateLaborTotal(parsedData);
    const laborTax = parsedData.financial?.laborTax || 0;
    const partsTax = parsedData.financial?.partsTax || 0;
    const taxTotal = laborTax + partsTax;

    return partsTotal + laborTotal + taxTotal;
  }

  /**
   * Calculate parts total
   */
  calculatePartsTotal(parsedData) {
    if (parsedData.financial?.partsTotal) {
      return parsedData.financial.partsTotal;
    }

    let total = 0;
    if (parsedData.parts) {
      parsedData.parts.forEach(part => {
        total += (part.price || 0) * (part.quantity || 1);
      });
    }

    return total;
  }

  /**
   * Calculate labor total
   */
  calculateLaborTotal(parsedData) {
    if (parsedData.financial?.laborTotal) {
      return parsedData.financial.laborTotal;
    }

    let total = 0;
    if (parsedData.labor) {
      parsedData.labor.forEach(labor => {
        total += labor.extended || (labor.hours || 0) * (labor.rate || 0);
      });
    }

    return total;
  }

  /**
   * Validate imported data
   */
  validateImportedData(parsedData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100,
    };

    // Check customer data
    if (!parsedData.customer?.name) {
      validation.warnings.push('Customer name is missing');
      validation.score -= 10;
    }

    // Check vehicle data
    if (!parsedData.vehicle?.make || !parsedData.vehicle?.model) {
      validation.warnings.push('Vehicle make/model is missing');
      validation.score -= 10;
    }

    if (!parsedData.vehicle?.year) {
      validation.warnings.push('Vehicle year is missing');
      validation.score -= 5;
    }

    // Check financial data
    const totalAmount = this.calculateTotalAmount(parsedData);
    if (totalAmount <= 0) {
      validation.errors.push('Total amount must be greater than zero');
      validation.isValid = false;
      validation.score -= 20;
    }

    // Check parts and labor
    const hasPartsOrLabor =
      parsedData.parts?.length > 0 || parsedData.labor?.length > 0;
    if (!hasPartsOrLabor) {
      validation.warnings.push('No parts or labor items found');
      validation.score -= 15;
    }

    return validation;
  }

  /**
   * Get import history with pagination
   */
  async getImportHistory(options = {}) {
    const {
      page = 1,
      limit = 20,
      status = null,
      userId = null,
      requestingUserId,
    } = options;

    let imports = Array.from(this.importHistory.values());

    // Filter by status
    if (status) {
      imports = imports.filter(imp => imp.status === status);
    }

    // Filter by user (if not admin)
    if (userId) {
      imports = imports.filter(imp => imp.userId === userId);
    }

    // Sort by date (newest first)
    imports.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Paginate
    const total = imports.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedImports = imports.slice(start, end);

    return {
      imports: paginatedImports,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get processing statistics
   */
  async getStatistics(period = 'month', groupBy = 'day') {
    const imports = Array.from(this.importHistory.values());
    const now = new Date();
    let startDate;

    // Calculate period start date
    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Filter imports within period
    const periodImports = imports.filter(
      imp => new Date(imp.startTime) >= startDate
    );

    // Calculate statistics
    const stats = {
      totalImports: periodImports.length,
      successfulImports: periodImports.filter(imp => imp.status === 'completed')
        .length,
      failedImports: periodImports.filter(imp => imp.status === 'failed')
        .length,
      avgProcessingTime: 0,
      totalProcessingTime: 0,
      fileTypes: {},
      dailyBreakdown: [],
    };

    // Calculate processing time averages
    const completedImports = periodImports.filter(
      imp => imp.status === 'completed'
    );
    if (completedImports.length > 0) {
      stats.totalProcessingTime = completedImports.reduce(
        (sum, imp) => sum + imp.processingTime,
        0
      );
      stats.avgProcessingTime =
        stats.totalProcessingTime / completedImports.length;
    }

    // Count file types
    periodImports.forEach(imp => {
      stats.fileTypes[imp.fileType] = (stats.fileTypes[imp.fileType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get import by ID
   */
  getImportById(importId) {
    return this.importHistory.get(importId) || null;
  }

  /**
   * Delete import record
   */
  deleteImport(importId) {
    return this.importHistory.delete(importId);
  }

  /**
   * Clear old import records (older than specified days)
   */
  cleanupOldImports(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    for (const [id, importRecord] of this.importHistory.entries()) {
      if (new Date(importRecord.startTime) < cutoffDate) {
        this.importHistory.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Process BMS file and automatically create/update customers and jobs
   */
  async processBMSWithAutoCreation(content, context = {}) {
    try {
      // First, process the BMS file normally
      const bmsResult = await this.processBMSFile(content, context);

      if (!bmsResult.customer || !bmsResult.vehicle) {
        throw new Error(
          'BMS file must contain valid customer and vehicle information'
        );
      }

      // Import required services
      const {
        customerService,
      } = require('../database/services/customerService');
      const { jobService } = require('../database/services/jobService');
      const { vehicleService } = require('../database/services/vehicleService');

      let customer = null;
      let vehicle = null;
      let job = null;

      try {
        // Extract shop context from context or use default UUID format
        const shopId =
          context.shopId ||
          context.userId?.split('-shop')[0] ||
          process.env.DEV_SHOP_ID ||
          '00000000-0000-4000-8000-000000000001';

        // Check if customer exists (by email, phone, or name)
        customer = await this.findOrCreateCustomer(
          bmsResult.customer,
          customerService,
          shopId
        );

        // Check if vehicle exists (by VIN) - pass shop context
        const vehicleWithShop = { ...bmsResult.vehicle, shopId: shopId };
        vehicle = await this.findOrCreateVehicle(
          vehicleWithShop,
          customer.id,
          vehicleService
        );

        // Create job/repair order - pass shop context
        const jobWithShop = { ...bmsResult, shopId: shopId };
        job = await this.createJobFromBMS(
          jobWithShop,
          customer.id,
          vehicle.id,
          jobService
        );

        console.log('BMS auto-creation successful:', {
          customerId: customer.id,
          vehicleId: vehicle.id,
          jobId: job.id,
        });

        return {
          ...bmsResult,
          createdCustomer: customer,
          createdVehicle: vehicle,
          createdJob: job,
          autoCreationSuccess: true,
        };
      } catch (dbError) {
        console.error(
          'Database operations failed during BMS processing:',
          dbError
        );

        // Return original BMS result with error info
        return {
          ...bmsResult,
          autoCreationSuccess: false,
          autoCreationError: dbError.message,
          requiresManualIntervention: true,
        };
      }
    } catch (error) {
      console.error('BMS processing with auto-creation failed:', error);
      throw error;
    }
  }

  /**
   * Find existing customer or create new one
   */
  async findOrCreateCustomer(customerData, customerService, shopId = null) {
    try {
      // Try to find existing customer by email first
      if (customerData.email) {
        const existingCustomers = await customerService.findCustomers(
          { email: customerData.email },
          shopId
        );
        if (existingCustomers.length > 0) {
          console.log(
            'Found existing customer by email:',
            existingCustomers[0].id
          );
          return existingCustomers[0];
        }
      }

      // Try to find by phone
      if (customerData.phone) {
        const existingCustomers = await customerService.findCustomers(
          { phone: customerData.phone },
          shopId
        );
        if (existingCustomers.length > 0) {
          console.log(
            'Found existing customer by phone:',
            existingCustomers[0].id
          );
          return existingCustomers[0];
        }
      }

      // Try to find by name (exact match)
      if (customerData.firstName && customerData.lastName) {
        const existingCustomers = await customerService.findCustomers(
          { firstName: customerData.firstName, lastName: customerData.lastName },
          shopId
        );
        if (existingCustomers.length > 0) {
          console.log(
            'Found existing customer by name:',
            existingCustomers[0].id
          );
          return existingCustomers[0];
        }
      }

      // Create new customer with shop context
      console.log(
        'Creating new customer:',
        customerData.firstName,
        customerData.lastName,
        'for shop:',
        shopId
      );

      // Filter out fields that don't exist in the database schema
      const { zip, insurance, ...customerDataForDB } = customerData;

      const customerWithShop = {
        ...customerDataForDB,
        shopId,
      };
      return await customerService.createCustomer(customerWithShop, shopId);
    } catch (error) {
      console.error('Error in findOrCreateCustomer:', error);
      throw error;
    }
  }

  /**
   * Find existing vehicle or create new one
   */
  async findOrCreateVehicle(vehicleData, customerId, vehicleService) {
    try {
      return await vehicleService.findOrCreateVehicle(vehicleData, customerId);
    } catch (error) {
      console.error('Error in findOrCreateVehicle:', error);
      throw error;
    }
  }

  /**
   * Create job from BMS data
   */
  async createJobFromBMS(bmsResult, customerId, vehicleId, jobService) {
    try {
      return await jobService.createJobFromBMS(
        bmsResult,
        customerId,
        vehicleId
      );
    } catch (error) {
      console.error('Error in createJobFromBMS:', error);
      throw error;
    }
  }
}

module.exports = new BMSService();
