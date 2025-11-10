const EnhancedBMSParser = require('./import/bms_parser.js');
const EMSParser = require('./import/ems_parser.js');
const { AutomatedPartsSourcingService } = require('./automatedPartsSourcing');
const estimateDiffService = require('./estimateDiffService');
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
        claimInfo: this.normalizeClaimInfo(parsedData),
        adjuster: parsedData.adjuster || {},
        damage: this.normalizeDamageData(parsedData),
        labor: parsedData.labor || {},
        parts: parsedData.parts || [],
        financial: parsedData.financial || {},
        taxDetails: parsedData.taxDetails || {},
        specialRequirements: parsedData.specialRequirements || {},
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
   * Process BMS XML file with auto-customer creation
   * @param {string} content - XML content
   * @param {Object} context - Processing context
   */
  async processBMSWithAutoCreation(content, context = {}) {
    try {
      console.log('Processing BMS file with auto-customer creation...', context.fileName);

      const startTime = Date.now();
      
      // First do standard BMS parsing
      const parsedData = await this.bmsParser.parseBMS(content);
      
      // Auto-create customer if needed
      const customerResult = await this.autoCreateCustomer(parsedData.customer, context);
      
      // Create job with customer ID
      const jobData = this.createJobFromEstimate(parsedData);
      if (customerResult.customerId) {
        jobData.customerId = customerResult.customerId;
      }

      const processingTime = Date.now() - startTime;

      return {
        importId: context.uploadId || uuidv4(),
        customer: customerResult.customer,
        vehicle: this.normalizeVehicleData(parsedData.vehicle),
        job: jobData,
        documentInfo: parsedData.estimate,
        claimInfo: this.normalizeClaimInfo(parsedData),
        adjuster: parsedData.adjuster || {},
        damage: this.normalizeDamageData(parsedData),
        labor: parsedData.labor || {},
        parts: parsedData.parts || [],
        financial: parsedData.financial || {},
        taxDetails: parsedData.taxDetails || {},
        specialRequirements: parsedData.specialRequirements || {},
        validation: this.validateImportedData(parsedData),
        metadata: {
          ...parsedData.metadata,
          processingTime,
          importId: context.uploadId || uuidv4(),
          customerCreated: customerResult.created,
          customerId: customerResult.customerId,
        },
      };
    } catch (error) {
      console.error('BMS processing with auto-creation error:', error);
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
        claimInfo: this.normalizeClaimInfo(parsedData),
        adjuster: parsedData.adjuster || {},
        damage: this.normalizeDamageData(parsedData),
        labor: parsedData.labor || {},
        parts: parsedData.parts || [],
        financial: parsedData.financial || {},
        taxDetails: parsedData.taxDetails || {},
        specialRequirements: parsedData.specialRequirements || {},
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
        claimInfo: this.normalizeClaimInfo(parsedData),
        adjuster: parsedData.adjuster || {},
        damage: this.normalizeDamageData(parsedData),
        labor: parsedData.labor || {},
        parts: parsedData.parts || [],
        financial: parsedData.financial || {},
        taxDetails: parsedData.taxDetails || {},
        specialRequirements: parsedData.specialRequirements || {},
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
   * Normalize customer data to standard format (ENHANCED - preserves ALL BMS fields)
   */
  normalizeCustomerData(customerData) {
    if (!customerData) return null;

    return {
      // Basic customer info
      firstName:
        customerData.firstName || customerData.name?.split(' ')[0] || '',
      lastName:
        customerData.lastName ||
        customerData.name?.split(' ').slice(1).join(' ') ||
        '',
      name:
        customerData.name ||
        `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),

      // Contact info - preserve multiple phone types
      phone: customerData.phone || customerData.phones?.cell || customerData.phones?.home || customerData.phones?.work || '',
      phones: customerData.phones || { home: '', work: '', cell: '' },
      email: customerData.email || '',

      // Address - combine address fields for Supabase schema
      address: customerData.address || customerData.address1 || '',
      city: customerData.city || '',
      state: customerData.state || customerData.province || '',
      zip_code: customerData.zip || customerData.postalCode || '',
      country: customerData.country || '',

      // Insurance info
      insurance: customerData.insurance || '',
      claimNumber: customerData.claimNumber || '',
      policyNumber: customerData.policyNumber || '',
    };
  }

  /**
   * Map raw fuel type from BMS to valid Supabase enum value
   * Valid values: 'gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid', 'hydrogen', 'other'
   */
  mapFuelType(rawFuelType) {
    if (!rawFuelType) return null;

    const fuelTypeUpper = String(rawFuelType).toUpperCase().trim();

    // Map common BMS fuel type codes to Supabase enum values
    const fuelTypeMap = {
      'G': 'gasoline',
      'GAS': 'gasoline',
      'GASOLINE': 'gasoline',
      'PETROL': 'gasoline',
      'D': 'diesel',
      'DIESEL': 'diesel',
      'E': 'electric',
      'ELECTRIC': 'electric',
      'EV': 'electric',
      'H': 'hybrid',
      'HYBRID': 'hybrid',
      'HEV': 'hybrid',
      'P': 'plug_in_hybrid',
      'PHEV': 'plug_in_hybrid',
      'PLUG-IN HYBRID': 'plug_in_hybrid',
      'PLUG IN HYBRID': 'plug_in_hybrid',
      'HYDROGEN': 'hydrogen',
      'FUEL CELL': 'hydrogen',
      'X': null, // Unknown - will be set to NULL in database
      'UNKNOWN': null,
      'N/A': null
    };

    return fuelTypeMap[fuelTypeUpper] || null; // Default to null if unknown
  }

  /**
   * Normalize vehicle data to standard format (ENHANCED - preserves ALL BMS fields)
   */
  normalizeVehicleData(vehicleData) {
    if (!vehicleData) return null;

    return {
      // Basic YMMT
      year: vehicleData.year || null,
      make: vehicleData.make || '',
      model: vehicleData.model || '',
      trim: vehicleData.trim || '',
      vin: vehicleData.vin || '',
      license: vehicleData.license || '',
      licensePlate: vehicleData.license || '',

      // Odometer
      mileage: vehicleData.mileage || null,
      currentOdometer: vehicleData.mileage || null,

      // Color/Paint
      color: vehicleData.color || '',
      exteriorColor: vehicleData.color || '',
      paintCode: vehicleData.paintCode || '',

      // Powertrain - preserve detailed breakdown with proper fuel type mapping
      engine: vehicleData.engine || '',
      engineCode: vehicleData.engineCode || '',
      engineSize: vehicleData.engine || '',
      transmission: vehicleData.transmission || '',
      transmissionCode: vehicleData.transmissionCode || '',
      drivetrain: vehicleData.drivetrain || '',
      fuelType: this.mapFuelType(vehicleData.fuelType), // Map to valid enum value

      // Condition/Status
      drivable: vehicleData.drivable !== undefined ? vehicleData.drivable : null,

      // ADAS/Special features (to be populated later from specialRequirements)
      hasADASFeatures: null, // Will be set from specialRequirements
      requiresCalibration: null,
    };
  }

  /**
   * Normalize claim information from BMS data (NEW - preserves insurance/claim data)
   */
  normalizeClaimInfo(parsedData) {
    const estimate = parsedData.estimate || {};
    const customer = parsedData.customer || {};
    const adjuster = parsedData.adjuster || {};
    const financial = parsedData.financial || {};
    const vehicle = parsedData.vehicle || {};

    return {
      // Claim identification
      claimNumber: estimate.claimNumber || customer.claimNumber || '',
      policyNumber: estimate.policyNumber || customer.policyNumber || '',
      roNumber: estimate.roNumber || '',

      // Insurance company
      insuranceCompany: customer.insurance || '',

      // Adjuster information
      adjusterName: adjuster.name || '',
      adjusterEmail: adjuster.email || '',
      adjusterPhone: adjuster.phone || '',

      // Deductible information
      deductibleAmount: financial.deductible || 0,
      deductibleWaived: financial.deductibleWaived || false,
      deductibleStatus: financial.deductibleStatus || '',

      // Loss/Damage info
      dateOfLoss: estimate.date || '',
      lossDescription: vehicle.damageDescription || '',

      // Estimate/Document info
      estimateNumber: estimate.estimateNumber || '',
      estimateDate: estimate.date || '',
      estimatingSystem: estimate.estimatingSystem || '',
      bmsVersion: estimate.bmsVersion || '',
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
      status: 'intake',
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
    if (parsedData.labor && parsedData.labor.lines) {
      parsedData.labor.lines.forEach((labor, index) => {
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
    if (parsedData.labor && parsedData.labor.lines) {
      parsedData.labor.lines.forEach(labor => {
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
      parsedData.parts?.length > 0 || parsedData.labor?.lines?.length > 0;
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
   * ENHANCED: Creates complete ecosystem (customer, vehicle, claim, job, parts)
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

      // Import required services (use local database)
      const useSupabase = false; // Supabase removed

      // TODO: Remove supabaseAdmin references, use local database only
      const supabaseAdmin = null;

      const { customerService } = useSupabase
        ? require('../database/services/customerService')
        : require('../database/services/customerService-local');

      const { jobService } = useSupabase
        ? require('../database/services/jobService')
        : require('../database/services/jobService-local');

      const { vehicleService} = useSupabase
        ? require('../database/services/vehicleService')
        : require('../database/services/vehicleService-local');

      const shopService = require('../database/services/shopService-local');

      // Import models for claim and parts creation
      const { ClaimManagement, AdvancedPartsManagement } = require('../database/models');

      let customer = null;
      let vehicle = null;
      let claim = null;
      let job = null;
      let parts = [];

      try {
        // Ensure default shop exists in database
        const defaultShop = await shopService.getOrCreateDefaultShop();

        // Use shop ID from default shop
        const shopId = defaultShop.id;

        // STEP 1: Create/find customer using admin client
        customer = await this.findOrCreateCustomerWithAdmin(
          bmsResult.customer,
          supabaseAdmin,
          shopId
        );

        // STEP 2: Create/find vehicle using admin client
        const vehicleWithShop = { ...bmsResult.vehicle, shop_id: shopId };
        vehicle = await this.findOrCreateVehicleWithAdmin(
          vehicleWithShop,
          customer.id,
          supabaseAdmin
        );

        // STEP 3: Create claim management record (NEW!)
        if (bmsResult.claimInfo && bmsResult.claimInfo.claimNumber) {
          try {
            claim = await ClaimManagement.create({
              shopId: shopId,
              customerId: customer.id,
              vehicleProfileId: vehicle.id,
              claimNumber: bmsResult.claimInfo.claimNumber,
              policyNumber: bmsResult.claimInfo.policyNumber || null,
              adjusterName: bmsResult.claimInfo.adjusterName || null,
              adjusterPhone: bmsResult.claimInfo.adjusterPhone || null,
              adjusterEmail: bmsResult.claimInfo.adjusterEmail || null,
              deductibleAmount: bmsResult.claimInfo.deductibleAmount || 0,
              deductibleWaived: bmsResult.claimInfo.deductibleWaived || false,
              dateClaimOpened: new Date(),
              claimStatus: 'open',
            });
            console.log('✅ Created claim record:', claim.id);
          } catch (claimError) {
            console.error('⚠️ Claim creation failed:', claimError.message);
            // Continue even if claim creation fails
          }
        }

        // STEP 4: Create job/repair order using admin client
        const jobWithShop = { ...bmsResult, shop_id: shopId };
        job = await this.createJobFromBMSWithAdmin(
          jobWithShop,
          customer.id,
          vehicle.id,
          supabaseAdmin
        );

        // STEP 5: Create parts records with status='needed' (NEW!)
        if (bmsResult.parts && Array.isArray(bmsResult.parts) && bmsResult.parts.length > 0) {
          console.log(`Creating ${bmsResult.parts.length} parts records...`);

          for (const part of bmsResult.parts) {
            try {
              // Map part type to valid Supabase enum value
              // Valid: PAN (OEM), PAA (Aftermarket), PAR (Recycled/Used), PAL (Reconditioned), PAM (Alternate), PAE (Existing), PAC (Non-Genuine), SUBLET
              let partType = 'PAN'; // Default to OEM
              const partTypeUpper = (part.partType || '').toUpperCase();

              if (partTypeUpper === 'PAE' || partTypeUpper.includes('EXISTING')) {
                partType = 'PAE';
              } else if (partTypeUpper === 'SUBLET' || partTypeUpper.includes('SUBLET')) {
                partType = 'SUBLET';
              } else if (partTypeUpper === 'PAA') {
                partType = 'PAA';
              } else if (partTypeUpper === 'PAR') {
                partType = 'PAR';
              } else if (partTypeUpper === 'PAL') {
                partType = 'PAL';
              } else if (partTypeUpper === 'PAM') {
                partType = 'PAM';
              } else if (partTypeUpper === 'PAC') {
                partType = 'PAC';
              }

              // Create part using Supabase with correct field names from 001_mitchell_collision_repair_schema.sql
              const partData = {
                ro_id: job.id, // Changed from job_id to ro_id (repair order ID)
                line_number: part.lineNumber || 0,
                description: part.description || part.partName || 'Unknown Part',
                part_number: part.partNumber || null,
                part_type: partType, // Enum type, not string
                part_source_code: part.sourceCode || null,
                quantity: part.quantity || 1,
                part_price: part.price || 0,
                oem_part_price: part.oemPrice || null,
                labor_type: part.laborType || null,
                labor_operation: part.laborOperation || null,
                labor_hours: part.laborHours || 0,
                database_labor_hours: part.databaseLaborHours || null,
                status: 'needed', // THIS IS KEY - auto-populate as "needed"
                is_taxable: part.taxable !== undefined ? part.taxable : true,
                is_sublet: partType === 'SUBLET',
              };

              const { data: partRecord, error: partError } = await supabaseAdmin
                .from('parts')
                .insert([partData])
                .select()
                .single();

              if (partError) {
                throw partError;
              }

              parts.push(partRecord);
            } catch (partError) {
              console.error(`⚠️ Failed to create part ${part.partNumber}:`, partError.message);
              // Continue with next part even if one fails
            }
          }
          console.log(`✅ Created ${parts.length} parts records with status='needed'`);
        }

        console.log('🎉 BMS auto-creation successful:', {
          customerId: customer.id,
          vehicleId: vehicle.id,
          claimId: claim?.id,
          jobId: job.id,
          partsCount: parts.length,
        });

        return {
          ...bmsResult,
          createdCustomer: customer,
          createdVehicle: vehicle,
          createdClaim: claim,
          createdJob: job,
          createdParts: parts,
          autoCreationSuccess: true,
          ecosystemComplete: true,
          readyForScheduling: true,
          readyForCommunication: customer.email || customer.phone,
          readyForPartsSourcing: parts.length > 0,
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
   * Find existing customer or create new one using legacy database
   */
  async findOrCreateCustomerLegacy(customerData, shopId = null) {
    try {
      const { Customer } = require('../database/models');
      
      // Try to find existing customer by email first
      if (customerData.email) {
        const existingCustomer = await Customer.findOne({
          where: { email: customerData.email }
        });
        
        if (existingCustomer) {
          console.log('Found existing customer by email:', existingCustomer.id);
          return existingCustomer;
        }
      }

      // Try to find by phone
      if (customerData.phone) {
        const existingCustomer = await Customer.findOne({
          where: { phone: customerData.phone }
        });
        
        if (existingCustomer) {
          console.log('Found existing customer by phone:', existingCustomer.id);
          return existingCustomer;
        }
      }

      // Try to find by name (exact match)
      if (customerData.firstName && customerData.lastName) {
        const existingCustomer = await Customer.findOne({
          where: {
            firstName: customerData.firstName,
            lastName: customerData.lastName
          }
        });
        
        if (existingCustomer) {
          console.log('Found existing customer by name:', existingCustomer.id);
          return existingCustomer;
        }
      }

      // Create new customer
      console.log('Creating new customer:', customerData.firstName, customerData.lastName);
      
      const newCustomer = await Customer.create({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        city: customerData.city || null,
        state: customerData.state || null,
        zip: customerData.zip || null,
        shopId: shopId || 'default-shop'
      });

      console.log('Created new customer:', newCustomer.id);
      return newCustomer;
      
    } catch (error) {
      console.error('Error in findOrCreateCustomerLegacy:', error);
      throw error;
    }
  }

  /**
   * Find existing customer or create new one using admin client (bypasses RLS)
   */
  async findOrCreateCustomerWithAdmin(customerData, supabaseAdmin, shopId = null) {
    try {
      // Use legacy database when Supabase is not available
      if (!supabaseAdmin) {
        return await this.findOrCreateCustomerLegacy(customerData, shopId);
      }

      // Try to find existing customer by email first
      if (customerData.email) {
        const { data: existingCustomers } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('shop_id', shopId)
          .eq('email', customerData.email);
        
        if (existingCustomers && existingCustomers.length > 0) {
          console.log('Found existing customer by email:', existingCustomers[0].id);
          return existingCustomers[0];
        }
      }

      // Try to find by phone
      if (customerData.phone) {
        const { data: existingCustomers } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('shop_id', shopId)
          .eq('phone', customerData.phone);
        
        if (existingCustomers && existingCustomers.length > 0) {
          console.log('Found existing customer by phone:', existingCustomers[0].id);
          return existingCustomers[0];
        }
      }

      // Try to find by name (exact match)
      if (customerData.firstName && customerData.lastName) {
        const { data: existingCustomers } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('shop_id', shopId)
          .eq('first_name', customerData.firstName)
          .eq('last_name', customerData.lastName);
        
        if (existingCustomers && existingCustomers.length > 0) {
          console.log('Found existing customer by name:', existingCustomers[0].id);
          return existingCustomers[0];
        }
      }

      // Create new customer with shop context
      console.log('Creating new customer:', customerData.firstName, customerData.lastName, 'for shop:', shopId);

      // Filter out fields that don't exist in the database schema
      const { 
        zip,           // Removed - use zip_code instead
        insurance,     // Not in customers table
        phones,        // Not in customers table (stored as phone/mobile)
        claimNumber,   // Not in customers table
        policyNumber,  // Not in customers table
        deductible,    // In vehicles table, not customers
        address1,      // Combined into address field
        address2,      // Combined into address field
        province,      // Mapped to state field
        postalCode,    // Mapped to zip_code field
        name,          // Redundant - using first_name/last_name
        ...restData    // Everything else (but we need to map carefully)
      } = customerData;

      // Map fields to match exact Supabase schema (lines 247-281 of 01_initial_schema.sql)
      // Truncate phone numbers to 20 characters max to fit database constraint
      const truncatePhone = (phone) => {
        if (!phone) return null;
        // Remove all non-digits except + at start
        const cleaned = phone.replace(/[^\d+]/g, '');
        // Truncate to 20 chars if needed
        return cleaned.length > 20 ? cleaned.substring(0, 20) : cleaned;
      };

      const mappedCustomerData = {
        customer_number: `C${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`, // Unique number (max 11 chars)
        first_name: customerData.firstName || '',
        last_name: customerData.lastName || '',
        email: customerData.email || null,  // NULL not empty string
        phone: truncatePhone(customerData.phone),  // Truncate to 20 chars
        mobile: truncatePhone(customerData.mobile),  // Truncate to 20 chars
        address: customerData.address || null,
        city: customerData.city || null,
        state: customerData.state || null,
        zip_code: customerData.zip_code || null,  // Use normalized field
        country: customerData.country || 'Canada',  // Default from schema
        customer_type: 'individual',  // From enum: individual, business, insurance, fleet
        customer_status: 'active',    // From enum: active, inactive, prospect, vip
        is_active: true,
        shop_id: shopId
      };

      // Remove empty strings - convert to null for database
      Object.keys(mappedCustomerData).forEach(key => {
        if (mappedCustomerData[key] === '' || mappedCustomerData[key] === 'N/A') {
          mappedCustomerData[key] = null;
        }
      });

      const { data: newCustomer, error } = await supabaseAdmin
        .from('customers')
        .insert([mappedCustomerData])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        throw error;
      }

      console.log('✅ Customer created:', {
        id: newCustomer.id,
        shop_id: newCustomer.shop_id,
        name: `${newCustomer.first_name} ${newCustomer.last_name}`
      });

      // Verify customer is immediately readable
      const { data: verifyRead } = await supabaseAdmin
        .from('customers')
        .select('id, first_name, last_name')
        .eq('id', newCustomer.id)
        .single();
      console.log('✅ Verify customer readable:', verifyRead);

      return newCustomer;
    } catch (error) {
      console.error('Error in findOrCreateCustomerWithAdmin:', error);
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

      // Fix email validation - convert empty string to null
      if (customerDataForDB.email === '' || customerDataForDB.email === 'N/A') {
        customerDataForDB.email = null;
      }

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
   * Find existing vehicle or create new one using admin client (bypasses RLS)
   */
  async findOrCreateVehicleWithAdmin(vehicleData, customerId, supabaseAdmin) {
    try {
      // Use legacy database when Supabase is not available
      if (!supabaseAdmin) {
        const { vehicleService } = require('../database/services/vehicleService-local');
        return await vehicleService.findOrCreateVehicle(vehicleData, customerId);
      }

      // Try to find existing vehicle by VIN first
      if (vehicleData.vin) {
        const { data: existingVehicles } = await supabaseAdmin
          .from('vehicles')
          .select('*')
          .eq('shop_id', vehicleData.shop_id)
          .eq('vin', vehicleData.vin);
        
        if (existingVehicles && existingVehicles.length > 0) {
          console.log('Found existing vehicle by VIN:', existingVehicles[0].id);
          return existingVehicles[0];
        }
      }

      // Try to find by license plate
      if (vehicleData.license_plate) {
        const { data: existingVehicles } = await supabaseAdmin
          .from('vehicles')
          .select('*')
          .eq('shop_id', vehicleData.shop_id)
          .eq('license_plate', vehicleData.license_plate);
        
        if (existingVehicles && existingVehicles.length > 0) {
          console.log('Found existing vehicle by license plate:', existingVehicles[0].id);
          return existingVehicles[0];
        }
      }

      // Create new vehicle
      console.log('Creating new vehicle:', vehicleData.year, vehicleData.make, vehicleData.model);

      // Map to exact Supabase vehicles schema - only include fields that exist
      const mappedVehicleData = {
        customer_id: customerId,
        shop_id: vehicleData.shop_id,
        vin: vehicleData.vin || null,
        license_plate: vehicleData.licensePlate || vehicleData.license || null,
        state: vehicleData.state || null,
        year: vehicleData.year || null,
        make: vehicleData.make || null,
        model: vehicleData.model || null,
        trim: vehicleData.trim || null,
        body_style: vehicleData.bodyStyle || null,
        color: vehicleData.color || null,
        color_code: vehicleData.colorCode || vehicleData.paintCode || null,
        engine_size: vehicleData.engineSize || vehicleData.engine || null,
        engine_type: vehicleData.engineType || null,
        transmission: vehicleData.transmission || null,
        fuel_type: this.mapFuelType(vehicleData.fuelType), // Use mapper for valid enum value
        mileage: vehicleData.mileage || vehicleData.currentOdometer || null,
        mileage_unit: 'kilometers',
        insurance_company: null,
        policy_number: null,
        claim_number: null,
        deductible: null,
        vehicle_status: 'active',
        is_active: true
      };

      // Remove null fields to use database defaults
      Object.keys(mappedVehicleData).forEach(key => {
        if (mappedVehicleData[key] === undefined) {
          delete mappedVehicleData[key];
        }
      });

      const { data: newVehicle, error } = await supabaseAdmin
        .from('vehicles')
        .insert([mappedVehicleData])
        .select()
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        throw error;
      }

      console.log('Created new vehicle:', newVehicle.id);
      return newVehicle;
    } catch (error) {
      console.error('Error in findOrCreateVehicleWithAdmin:', error);
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
   * Find or create insurance company
   */
  async findOrCreateInsuranceCompany(insuranceCompanyName, shopId, supabaseAdmin) {
    try {
      // Try to find existing insurance company by name
      const { data: existingInsuranceCompanies } = await supabaseAdmin
        .from('insurance_companies')
        .select('*')
        .eq('shop_id', shopId)
        .eq('name', insuranceCompanyName);

      if (existingInsuranceCompanies && existingInsuranceCompanies.length > 0) {
        console.log('Found existing insurance company:', existingInsuranceCompanies[0].id);
        return existingInsuranceCompanies[0];
      }

      // Create new insurance company
      console.log('Creating new insurance company:', insuranceCompanyName);
      const insuranceCompanyData = {
        shop_id: shopId,
        name: insuranceCompanyName,
        short_name: insuranceCompanyName,
        is_active: true,
      };

      const { data: newInsuranceCompany, error } = await supabaseAdmin
        .from('insurance_companies')
        .insert([insuranceCompanyData])
        .select()
        .single();

      if (error) {
        console.error('Error creating insurance company:', error);
        throw error;
      }

      console.log('✅ Created insurance company:', newInsuranceCompany.id);
      return newInsuranceCompany;
    } catch (error) {
      console.error('Error in findOrCreateInsuranceCompany:', error);
      throw error;
    }
  }

  /**
   * Create repair order from BMS data using admin client (bypasses RLS)
   * NOTE: Supabase uses repair_orders table (NOT jobs)
   * repair_orders requires a claim_id reference to claims table
   */
  async createJobFromBMSWithAdmin(bmsResult, customerId, vehicleId, supabaseAdmin) {
    try {
      // STEP 0: Find or create insurance company
      const insuranceCompanyName = bmsResult.claimInfo?.insuranceCompany || 'ICBC';
      const insuranceCompany = await this.findOrCreateInsuranceCompany(
        insuranceCompanyName,
        bmsResult.shop_id,
        supabaseAdmin
      );

      // STEP 1: Check if this claim already exists (for version tracking)
      const claimNumber = bmsResult.claimInfo?.claimNumber || `CLAIM-${Date.now()}`;

      let existingClaim = null;
      let isRevision = false;
      let previousVersionData = null;

      // Try to find existing claim by claim_number
      const { data: existingClaims } = await supabaseAdmin
        .from('claims')
        .select('*')
        .eq('claim_number', claimNumber);

      if (existingClaims && existingClaims.length > 0) {
        existingClaim = existingClaims[0];
        isRevision = true;
        console.log(`📝 Found existing claim ${claimNumber} - This is a REVISION/SUPPLEMENT`);

        // Get the previous version's BMS data for comparison
        const { data: latestVersion } = await supabaseAdmin
          .from('estimate_versions')
          .select('*')
          .eq('claim_id', existingClaim.id)
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        if (latestVersion) {
          previousVersionData = latestVersion.bms_data;
          console.log(`📊 Found previous version ${latestVersion.version_number} for comparison`);
        }
      }

      // STEP 2: Create or update insurance claim record
      let newClaim;

      if (isRevision) {
        // Update existing claim (keep the original record, just update dates)
        const { data: updatedClaim, error: updateError } = await supabaseAdmin
          .from('claims')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingClaim.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating insurance claim:', updateError);
          throw updateError;
        }

        newClaim = updatedClaim;
        console.log('Updated existing claim:', newClaim.id);
      } else {
        // Create new claim in the `claims` table (not `insurance_claims`)
        // The claims table requires shop_id and insurance_company_id
        const claimData = {
          shop_id: bmsResult.shop_id,
          claim_number: claimNumber,
          insurance_company_id: insuranceCompany.id, // Use the insurance company we just found/created
          customer_id: customerId,
          vehicle_id: vehicleId,
          incident_date: bmsResult.claimInfo?.dateOfLoss ? new Date(bmsResult.claimInfo.dateOfLoss).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          reported_date: new Date().toISOString().split('T')[0],
          claim_status: 'open',
          policy_number: bmsResult.claimInfo?.policyNumber || null,
          deductible: bmsResult.claimInfo?.deductibleAmount || 0,
          adjuster_name: bmsResult.claimInfo?.adjusterName || null,
          adjuster_email: bmsResult.claimInfo?.adjusterEmail || null,
          adjuster_phone: bmsResult.claimInfo?.adjusterPhone || null,
          incident_description: bmsResult.claimInfo?.lossDescription || null,
        };

        const { data: createdClaim, error: claimError } = await supabaseAdmin
          .from('claims')
          .insert([claimData])
          .select()
          .single();

        if (claimError) {
          console.error('Error creating insurance claim:', claimError);
          throw claimError;
        }

        newClaim = createdClaim;
        console.log('Created new insurance claim:', newClaim.id);
      }

      // STEP 3: Now create the repair order (linked to the claim)
      // Use the shop RO number from BMS if available, otherwise generate one
      const roNumber = bmsResult.documentInfo?.shopRoNumber ||
                       bmsResult.claimInfo?.roNumber ||
                       bmsResult.documentInfo?.roNumber ||
                       `RO-${Date.now()}`;

      // Ultra-minimal roData - only REQUIRED fields that MUST exist in Supabase
      // The Supabase repair_orders table is extremely bare-bones
      const roData = {
        claim_id: newClaim.id, // REQUIRED FK
        customer_id: customerId,
        vehicle_id: vehicleId,
        ro_number: roNumber,
        shop_id: bmsResult.shop_id, // REQUIRED - shop context
      };

      const { data: newRO, error: roError } = await supabaseAdmin
        .from('repair_orders')
        .insert([roData])
        .select()
        .single();

      if (roError) {
        console.error('Error creating repair order:', roError);
        throw roError;
      }

      console.log('Created new repair order:', newRO.id);

      // STEP 3: Save estimate version and calculate diff if this is a revision
      try {
        let diff = null;
        let revisionReason = 'initial';

        if (isRevision && previousVersionData) {
          // This is a supplement/revision - compare with previous version
          diff = estimateDiffService.compareBMSEstimates(bmsResult, previousVersionData);
          revisionReason = 'supplement';

          console.log(`📊 Estimate diff calculated:`, {
            totalChange: diff.summary.totalChange,
            percentChange: diff.summary.percentChange.toFixed(2) + '%',
            lineItemsAdded: diff.summary.lineItemsAdded,
            lineItemsRemoved: diff.summary.lineItemsRemoved,
            lineItemsModified: diff.summary.lineItemsModified,
          });
        }

        // Save the estimate version to database
        const versionResult = await estimateDiffService.saveEstimateVersion(
          newClaim.id,
          newRO.id,
          bmsResult,
          diff,
          revisionReason
        );

        if (versionResult.success) {
          console.log(`✅ Saved estimate version ${versionResult.versionNumber} for claim ${newClaim.id}`);

          if (diff) {
            console.log(`📝 Version ${versionResult.versionNumber} is a ${revisionReason}:`);
            console.log(`   Total change: $${diff.summary.totalChange.toFixed(2)} (${diff.summary.percentChange.toFixed(1)}%)`);
            console.log(`   Parts added: ${diff.parts.added.length}`);
            console.log(`   Parts removed: ${diff.parts.removed.length}`);
            console.log(`   Parts modified: ${diff.parts.modified.length}`);
          }
        }

        // Attach version info to the RO object for API response
        newRO.estimateVersion = {
          versionNumber: versionResult.versionNumber,
          isRevision: isRevision,
          revisionReason: revisionReason,
          diff: diff ? diff.summary : null,
        };

      } catch (versionError) {
        console.error('⚠️ Failed to save estimate version (non-fatal):', versionError.message);
        // Don't fail the whole upload if version tracking fails
      }

      return newRO;
    } catch (error) {
      console.error('Error in createJobFromBMSWithAdmin:', error);
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

  /**
   * Auto-create customer with duplicate detection
   * @param {Object} customerData - Parsed customer data
   * @param {Object} context - Processing context
   */
  async autoCreateCustomer(customerData, context = {}) {
    try {
      if (!customerData || (!customerData.firstName && !customerData.lastName)) {
        console.log('No customer data to create');
        return { customer: customerData, customerId: null, created: false };
      }

      // Check for existing customer by phone, email, or name
      const existingCustomer = await this.findExistingCustomer(customerData);
      
      if (existingCustomer) {
        console.log('Found existing customer:', existingCustomer.id);
        return { 
          customer: existingCustomer, 
          customerId: existingCustomer.id, 
          created: false 
        };
      }

      // Create new customer
      const newCustomer = await this.createCustomerFromBMS(customerData, context);
      
      console.log('Created new customer:', newCustomer.id);
      
      // Emit real-time event for customer creation
      if (context.shopId) {
        this.emitCustomerCreated(newCustomer, context.shopId);
      }
      
      return { 
        customer: newCustomer, 
        customerId: newCustomer.id, 
        created: true 
      };
    } catch (error) {
      console.error('Error in auto-customer creation:', error);
      return { customer: customerData, customerId: null, created: false };
    }
  }

  /**
   * Find existing customer by phone, email, or name
   * @param {Object} customerData - Customer data to search for
   */
  async findExistingCustomer(customerData) {
    try {
      // This would typically query the database
      // For now, return null to always create new customers
      // In production, implement proper database queries
      return null;
    } catch (error) {
      console.error('Error finding existing customer:', error);
      return null;
    }
  }

  /**
   * Create customer from BMS data
   * @param {Object} customerData - Parsed customer data
   * @param {Object} context - Processing context
   */
  async createCustomerFromBMS(customerData, context = {}) {
    try {
      const customer = {
        id: uuidv4(),
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || customerData.emails?.primary || '',
        phone: customerData.phone || customerData.phones?.home || customerData.phones?.cell || '',
        address: customerData.address || customerData.addresses?.home || '',
        city: customerData.city || '',
        state: customerData.state || customerData.province || '',
        postalCode: customerData.postalCode || customerData.zip || '',
        country: customerData.country || 'Canada',
        customerType: 'individual',
        customerStatus: 'active',
        source: 'bms_import',
        createdBy: context.userId || 'system',
        shopId: context.shopId || 'default-shop',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Additional BMS-specific fields
        claimNumber: customerData.claimNumber || '',
        policyNumber: customerData.policyNumber || '',
        insurance: customerData.insurance || '',
        phones: customerData.phones || {},
        addresses: customerData.addresses || {},
        emails: customerData.emails || {}
      };

      // In production, save to database here
      console.log('Customer created from BMS:', customer);
      
      return customer;
    } catch (error) {
      console.error('Error creating customer from BMS:', error);
      throw error;
    }
  }

  /**
   * Emit customer created event for real-time updates
   * @param {Object} customer - Created customer
   * @param {string} shopId - Shop ID
   */
  emitCustomerCreated(customer, shopId) {
    try {
      // Emit event for real-time updates
      if (typeof window !== 'undefined') {
        // Frontend event
        window.dispatchEvent(new CustomEvent('customersUpdated', {
          detail: { customer, action: 'created', shopId }
        }));
      }
      
      // Backend WebSocket event would be emitted here
      console.log('Customer created event emitted for shop:', shopId);
    } catch (error) {
      console.error('Error emitting customer created event:', error);
    }
  }
}

module.exports = new BMSService();
