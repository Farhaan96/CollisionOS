/**
 * Automated Parts Sourcing Service
 * Handles real-time parts classification, vendor integration, and automated sourcing during BMS processing
 */

const { PartsSupplierIntegrationService } = require('./partsSupplierIntegration');
const { APIError, ValidationError } = require('../utils/errorHandler');

class AutomatedPartsSourcingService {
  constructor() {
    this.supplierService = new PartsSupplierIntegrationService();
    this.vinDecoder = new VINDecodingService();
    this.partsDatabase = new PartsDatabase();
    
    // Cache for vendor responses (15 minutes TTL)
    this.vendorCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    
    // Part type hierarchy for substitution logic
    this.partTypeHierarchy = ['OEM', 'Aftermarket', 'Recycled', 'Remanufactured'];
    
    // Vendor priority configuration
    this.vendorPriority = {
      'high_value': ['oem_direct', 'certified_dealer'], // Parts over $500
      'standard': ['aftermarket_premium', 'oem_direct', 'recycled_premium'], // Standard parts
      'bulk': ['aftermarket_standard', 'recycled_standard'] // Common parts
    };
  }

  /**
   * Process automated parts sourcing during BMS ingestion
   * @param {Array} damageLines - Extracted damage lines from BMS
   * @param {Object} vehicleInfo - Vehicle information for context
   * @param {Object} options - Processing options
   */
  async processAutomatedPartsSourcing(damageLines, vehicleInfo, options = {}) {
    try {
      console.log('Starting automated parts sourcing for', damageLines.length, 'parts');
      
      const startTime = Date.now();
      const sourcingResults = [];
      const errors = [];

      // Enhance vehicle info with VIN decoding if available
      let enhancedVehicleInfo = vehicleInfo;
      if (vehicleInfo.vin && options.enhanceWithVinDecoding !== false) {
        try {
          enhancedVehicleInfo = await this.vinDecoder.decode(vehicleInfo.vin);
          enhancedVehicleInfo = { ...vehicleInfo, ...enhancedVehicleInfo };
        } catch (error) {
          console.warn('VIN decoding failed:', error.message);
        }
      }

      // Process parts in batches for performance
      const batchSize = 10;
      for (let i = 0; i < damageLines.length; i += batchSize) {
        const batch = damageLines.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (line) => {
          try {
            return await this.processPartLine(line, enhancedVehicleInfo, options);
          } catch (error) {
            errors.push({
              lineNumber: line.lineNumber || i + 1,
              error: error.message,
              partInfo: line.partName || line.description
            });
            return null;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            sourcingResults.push(result.value);
          }
        });
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        results: sourcingResults,
        errors,
        processingTime,
        vehicleContext: enhancedVehicleInfo,
        statistics: this.generateSourcingStatistics(sourcingResults)
      };

    } catch (error) {
      console.error('Automated parts sourcing failed:', error);
      throw new APIError('Automated parts sourcing failed', 500, { 
        originalError: error.message 
      });
    }
  }

  /**
   * Process individual part line with automated sourcing
   */
  async processPartLine(line, vehicleInfo, options) {
    // 1. Classify and normalize the part
    const classifiedPart = await this.classifyAndNormalizePart(line, vehicleInfo);
    
    // 2. Check vendor availability and pricing
    const vendorResults = await this.checkVendorAvailability(classifiedPart, options);
    
    // 3. Apply business rules and select best option
    const recommendedSource = this.selectBestVendor(vendorResults, classifiedPart, options);
    
    // 4. Generate automated PO data if enabled
    const poData = options.generatePO ? 
      await this.generatePOData(classifiedPart, recommendedSource, options) : null;

    return {
      originalLine: line,
      classifiedPart,
      vendorResults,
      recommendedSource,
      poData,
      processingTimestamp: new Date().toISOString()
    };
  }

  /**
   * Classify and normalize part information
   */
  async classifyAndNormalizePart(line, vehicleInfo) {
    const part = {
      lineNumber: line.lineNumber,
      originalPartNumber: line.partNumber || line.PART_NUMBER,
      oemPartNumber: line.oemPartNumber || line.OEM_PART_NUMBER,
      description: line.description || line.partName || line.PART_NAME,
      quantity: parseInt(line.quantity) || 1,
      operation: line.operationType || line.OPERATION_TYPE || 'Replace',
      originalPrice: parseFloat(line.partCost || line.PART_COST) || 0
    };

    // Normalize part numbers (remove spaces, hyphens, standardize format)
    part.normalizedPartNumber = this.normalizePartNumber(part.originalPartNumber);
    part.normalizedOemPartNumber = this.normalizePartNumber(part.oemPartNumber);

    // Classify part type based on description and part number patterns
    part.classifiedType = this.classifyPartType(part, line);
    
    // Determine part category (body, engine, interior, etc.)
    part.category = this.determinePartCategory(part.description);
    
    // Calculate value tier for vendor selection strategy
    part.valueTier = this.determineValueTier(part.originalPrice);
    
    // Add vehicle-specific context
    part.vehicleContext = {
      year: vehicleInfo.year || vehicleInfo.modelYear,
      make: vehicleInfo.make || vehicleInfo.makeDesc,
      model: vehicleInfo.model || vehicleInfo.modelName,
      subModel: vehicleInfo.subModel || vehicleInfo.subModelDesc,
      vin: vehicleInfo.vin
    };

    // Check parts database for additional information
    try {
      const dbPartInfo = await this.partsDatabase.lookupPart(part);
      if (dbPartInfo) {
        part.enrichedData = dbPartInfo;
        part.alternativePartNumbers = dbPartInfo.alternativeNumbers || [];
        part.manufacturerBrand = dbPartInfo.brand;
      }
    } catch (error) {
      console.warn('Parts database lookup failed:', error.message);
    }

    return part;
  }

  /**
   * Check availability and pricing across multiple vendors
   */
  async checkVendorAvailability(part, options) {
    const vendorResults = [];
    const targetVendors = this.selectTargetVendors(part, options);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(part);
    if (this.vendorCache.has(cacheKey)) {
      const cached = this.vendorCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Using cached vendor data for part:', part.normalizedPartNumber);
        return cached.data;
      }
    }

    // Query vendors in parallel with timeout
    const vendorPromises = targetVendors.map(async (vendorId) => {
      try {
        const timeout = options.vendorTimeout || 2000; // 2 second timeout
        
        const vendorResult = await Promise.race([
          this.queryVendor(vendorId, part),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Vendor timeout')), timeout)
          )
        ]);

        return {
          vendorId,
          success: true,
          ...vendorResult
        };
      } catch (error) {
        console.warn(`Vendor ${vendorId} query failed:`, error.message);
        return {
          vendorId,
          success: false,
          error: error.message,
          fallbackRequired: true
        };
      }
    });

    const results = await Promise.allSettled(vendorPromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        vendorResults.push(result.value);
      }
    });

    // Cache successful results
    if (vendorResults.length > 0) {
      this.vendorCache.set(cacheKey, {
        timestamp: Date.now(),
        data: vendorResults
      });
    }

    return vendorResults;
  }

  /**
   * Select best vendor based on business rules
   */
  selectBestVendor(vendorResults, part, options) {
    const availableOptions = vendorResults.filter(result => 
      result.success && result.available === true
    );

    if (availableOptions.length === 0) {
      return {
        recommended: false,
        reason: 'No vendors have part in stock',
        fallbackActions: this.generateFallbackActions(part, vendorResults)
      };
    }

    // Apply business rules for vendor selection
    let scoredOptions = availableOptions.map(option => {
      let score = 0;
      
      // Price competitiveness (40% weight)
      const prices = availableOptions.map(opt => opt.price).filter(p => p > 0);
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const priceRatio = option.price / avgPrice;
        score += (2 - priceRatio) * 40; // Lower price = higher score
      }
      
      // Vendor reliability (30% weight)
      score += (option.reliability || 0.5) * 30;
      
      // Lead time (20% weight)
      const maxLeadTime = Math.max(...availableOptions.map(opt => opt.leadTime || 0));
      if (maxLeadTime > 0) {
        score += ((maxLeadTime - (option.leadTime || 0)) / maxLeadTime) * 20;
      }
      
      // Part quality/type preference (10% weight)
      const typeScore = this.getPartTypeScore(option.partType, part.classifiedType);
      score += typeScore * 10;

      return { ...option, score };
    });

    // Sort by score (highest first)
    scoredOptions.sort((a, b) => b.score - a.score);
    const bestOption = scoredOptions[0];

    return {
      recommended: true,
      vendor: bestOption,
      alternatives: scoredOptions.slice(1, 3), // Top 2 alternatives
      reasoningFactors: {
        priceCompetitive: bestOption.price <= part.originalPrice * 1.1,
        quickDelivery: (bestOption.leadTime || 0) <= 3,
        preferredVendor: options.preferredVendors?.includes(bestOption.vendorId)
      }
    };
  }

  /**
   * Generate automated purchase order data
   */
  async generatePOData(part, recommendedSource, options) {
    if (!recommendedSource.recommended) {
      return null;
    }

    const vendor = recommendedSource.vendor;
    const poLineItem = {
      partNumber: vendor.partNumber || part.normalizedPartNumber,
      description: part.description,
      quantity: part.quantity,
      unitPrice: vendor.price,
      extendedPrice: vendor.price * part.quantity,
      expectedDelivery: this.calculateDeliveryDate(vendor.leadTime),
      vendorPartNumber: vendor.vendorPartNumber,
      vendorQuoteNumber: vendor.quoteNumber
    };

    // Apply markup based on part type and business rules
    const markup = this.calculateMarkup(part, vendor, options);
    poLineItem.customerPrice = poLineItem.unitPrice * (1 + markup);
    poLineItem.markup = markup;

    // Check if PO requires approval (high-value items)
    const requiresApproval = poLineItem.extendedPrice > (options.approvalThreshold || 1000);

    return {
      vendorId: vendor.vendorId,
      poLineItem,
      requiresApproval,
      autoGenerated: true,
      generatedAt: new Date().toISOString(),
      businessRules: {
        markup,
        approvalRequired: requiresApproval,
        priceValidUntil: vendor.priceValidUntil
      }
    };
  }

  // Helper methods for part classification and vendor management

  normalizePartNumber(partNumber) {
    if (!partNumber) return '';
    return partNumber
      .toString()
      .replace(/[-\s]/g, '')
      .toUpperCase()
      .trim();
  }

  classifyPartType(part, originalLine) {
    const description = (part.description || '').toLowerCase();
    const partType = (originalLine.partType || originalLine.PART_TYPE || '').toLowerCase();
    
    // Check explicit part type first
    if (['oem', 'oe', 'original'].some(type => partType.includes(type))) {
      return 'OEM';
    }
    
    if (['aftermarket', 'am', 'alt'].some(type => partType.includes(type))) {
      return 'Aftermarket';
    }
    
    if (['recycled', 'used', 'lkq'].some(type => partType.includes(type))) {
      return 'Recycled';
    }
    
    if (['remanufactured', 'reman', 'rebuilt'].some(type => partType.includes(type))) {
      return 'Remanufactured';
    }
    
    // Default classification based on description patterns
    if (description.includes('genuine') || description.includes('original')) {
      return 'OEM';
    }
    
    // Default to OEM for safety-critical parts
    const safetyCritical = ['airbag', 'brake', 'suspension', 'steering', 'seatbelt'];
    if (safetyCritical.some(term => description.includes(term))) {
      return 'OEM';
    }
    
    return 'OEM'; // Default to OEM
  }

  determinePartCategory(description) {
    const desc = (description || '').toLowerCase();
    
    const categories = {
      'body': ['bumper', 'fender', 'door', 'hood', 'trunk', 'quarter', 'rocker', 'pillar'],
      'lighting': ['headlight', 'taillight', 'lamp', 'bulb', 'led'],
      'glass': ['windshield', 'window', 'glass'],
      'interior': ['seat', 'dashboard', 'console', 'carpet', 'trim'],
      'mechanical': ['engine', 'transmission', 'brake', 'suspension', 'exhaust'],
      'electrical': ['battery', 'alternator', 'starter', 'wiring', 'sensor'],
      'wheels': ['wheel', 'rim', 'tire', 'hubcap']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  determineValueTier(price) {
    if (price >= 1000) return 'high_value';
    if (price >= 100) return 'standard';
    return 'bulk';
  }

  selectTargetVendors(part, options) {
    const tierVendors = this.vendorPriority[part.valueTier] || this.vendorPriority.standard;
    const preferredVendors = options.preferredVendors || [];
    
    // Combine preferred vendors with tier-appropriate vendors
    const targetVendors = [...new Set([...preferredVendors, ...tierVendors])];
    
    // Limit to max 5 vendors for performance
    return targetVendors.slice(0, 5);
  }

  async queryVendor(vendorId, part) {
    // This would integrate with actual vendor APIs
    // For now, return mock data structure
    return {
      vendorId,
      partNumber: part.normalizedPartNumber,
      vendorPartNumber: `${vendorId.toUpperCase()}-${part.normalizedPartNumber}`,
      available: Math.random() > 0.3, // 70% availability
      quantity: Math.floor(Math.random() * 10) + 1,
      price: part.originalPrice * (0.8 + Math.random() * 0.4), // ±20% price variance
      leadTime: Math.floor(Math.random() * 7) + 1, // 1-7 days
      reliability: 0.7 + Math.random() * 0.3, // 70-100% reliability
      partType: part.classifiedType,
      priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quoteNumber: `Q${Date.now()}${Math.floor(Math.random() * 1000)}`
    };
  }

  getPartTypeScore(vendorType, preferredType) {
    const hierarchy = this.partTypeHierarchy;
    const vendorIndex = hierarchy.indexOf(vendorType);
    const preferredIndex = hierarchy.indexOf(preferredType);
    
    if (vendorIndex === -1 || preferredIndex === -1) return 0.5;
    
    // Higher score for exact match, lower for further from preference
    const distance = Math.abs(vendorIndex - preferredIndex);
    return Math.max(0, 1 - (distance * 0.25));
  }

  calculateDeliveryDate(leadTimeDays) {
    const date = new Date();
    date.setDate(date.getDate() + (leadTimeDays || 1));
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  calculateMarkup(part, vendor, options) {
    const baseMarkup = options.baseMarkup || 0.25; // 25% default
    const categoryMultipliers = {
      'body': 1.0,
      'mechanical': 1.1,
      'electrical': 1.2,
      'interior': 0.9
    };
    
    const categoryMultiplier = categoryMultipliers[part.category] || 1.0;
    return baseMarkup * categoryMultiplier;
  }

  generateCacheKey(part) {
    return `${part.normalizedPartNumber}_${part.vehicleContext.year}_${part.vehicleContext.make}_${part.vehicleContext.model}`;
  }

  generateFallbackActions(part, vendorResults) {
    const actions = [];
    
    // Check for substitutions
    if (part.alternativePartNumbers?.length > 0) {
      actions.push({
        type: 'substitute_part',
        description: 'Try alternative part numbers',
        alternatives: part.alternativePartNumbers
      });
    }
    
    // Suggest manual sourcing
    actions.push({
      type: 'manual_sourcing',
      description: 'Requires manual parts sourcing',
      suggestedVendors: vendorResults
        .filter(r => !r.success)
        .map(r => r.vendorId)
    });
    
    return actions;
  }

  generateSourcingStatistics(results) {
    const total = results.length;
    const successful = results.filter(r => r.recommendedSource.recommended).length;
    const requiresApproval = results.filter(r => r.poData?.requiresApproval).length;
    
    const avgProcessingTime = results.length > 0 ? 
      results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length : 0;
    
    return {
      totalParts: total,
      successfullySourced: successful,
      sourcingSuccessRate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : '0%',
      requiresApproval,
      avgProcessingTime: Math.round(avgProcessingTime)
    };
  }
}

// Mock services for VIN decoding and parts database
class VINDecodingService {
  async decode(vin) {
    // This would integrate with a real VIN decoding API
    return {
      decodedFromVin: true,
      bodyStyle: 'Sedan',
      engineSize: '2.0L',
      transmission: 'Automatic',
      driveType: 'FWD'
    };
  }
}

class PartsDatabase {
  async lookupPart(part) {
    // This would query a comprehensive parts database
    return {
      brand: 'Generic Brand',
      alternativeNumbers: [],
      category: part.category,
      specifications: {}
    };
  }
}

module.exports = { AutomatedPartsSourcingService };