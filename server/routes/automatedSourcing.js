/**
 * Automated Sourcing Routes
 * API endpoints for BMS processing with automated parts sourcing
 */

const express = require('express');
const multer = require('multer');
const BMSService = require('../services/bmsService');
const { AutomatedPartsSourcingService } = require('../services/automatedPartsSourcing');
const { BMSValidationService } = require('../services/bmsValidationService');
const { VINDecodingService } = require('../services/vinDecodingService');
const { APIError, ValidationError } = require('../utils/errorHandler');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.mimetype === 'application/xml' || file.originalname.toLowerCase().endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('Only XML files are allowed'), false);
    }
  }
});

// Initialize services
const bmsService = new BMSService();
const automatedSourcing = new AutomatedPartsSourcingService();
const validationService = new BMSValidationService();
const vinDecoder = new VINDecodingService();

/**
 * POST /api/automated-sourcing/process-bms
 * Process BMS file with automated parts sourcing
 */
router.post('/process-bms', upload.single('bmsFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No BMS file provided'
      });
    }

    // Parse sourcing options from request
    const sourcingOptions = {
      enableAutomatedSourcing: req.body.enableAutomatedSourcing !== 'false',
      enhanceWithVinDecoding: req.body.enhanceWithVinDecoding !== 'false',
      generateAutoPO: req.body.generateAutoPO === 'true',
      vendorTimeout: parseInt(req.body.vendorTimeout) || 2000,
      approvalThreshold: parseFloat(req.body.approvalThreshold) || 1000,
      baseMarkup: parseFloat(req.body.baseMarkup) || 0.25,
      preferredVendors: req.body.preferredVendors ? 
        req.body.preferredVendors.split(',').map(v => v.trim()) : [],
      generatePORecommendations: req.body.generatePORecommendations === 'true'
    };

    const context = {
      uploadId: req.body.uploadId || require('uuid').v4(),
      fileName: req.file.originalname,
      userId: req.user?.id || 'anonymous',
      uploadedAt: new Date().toISOString()
    };

    console.log('Processing BMS file with automated sourcing:', req.file.originalname);

    // Process BMS file with automated sourcing
    const result = await bmsService.processBMSWithAutomatedSourcing(
      req.file.buffer.toString('utf-8'),
      context,
      sourcingOptions
    );

    // Add processing metadata
    result.processingMetadata = {
      uploadId: context.uploadId,
      fileName: context.fileName,
      processingTime: result.metadata.processingTime,
      sourcingOptions,
      processedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: result,
      message: 'BMS file processed successfully with automated sourcing'
    });

  } catch (error) {
    console.error('Automated sourcing API error:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        validationErrors: error.details
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'BMS processing with automated sourcing failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/automated-sourcing/validate-bms
 * Validate BMS data for automated sourcing readiness
 */
router.post('/validate-bms', upload.single('bmsFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No BMS file provided'
      });
    }

    const validationLevel = req.body.validationLevel || 'full'; // 'critical', 'warning', 'full'

    // Parse BMS file first
    const parsedData = await bmsService.bmsParser.parseBMS(req.file.buffer.toString('utf-8'));
    
    // Perform validation
    const validationResult = await validationService.validateBMSData(parsedData, {
      level: validationLevel
    });

    // Add specific automated sourcing validation
    const sourcingValidation = validationService.validateForAutomatedSourcing(parsedData);

    res.json({
      success: true,
      data: {
        validation: validationResult,
        automatedSourcingValidation: sourcingValidation,
        recommendedActions: validationResult.recommendations,
        fileName: req.file.originalname,
        validatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('BMS validation API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'BMS validation failed'
    });
  }
});

/**
 * POST /api/automated-sourcing/decode-vin
 * Decode VIN for enhanced vehicle information
 */
router.post('/decode-vin', async (req, res) => {
  try {
    const { vin } = req.body;
    
    if (!vin) {
      return res.status(400).json({
        success: false,
        error: 'VIN is required'
      });
    }

    const decodingOptions = {
      includeRecalls: req.body.includeRecalls === 'true',
      includeSafetyRatings: req.body.includeSafetyRatings === 'true'
    };

    const decodedData = await vinDecoder.decodeVIN(vin, decodingOptions);

    res.json({
      success: true,
      data: decodedData,
      message: 'VIN decoded successfully'
    });

  } catch (error) {
    console.error('VIN decoding API error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'VIN decoding failed'
    });
  }
});

/**
 * POST /api/automated-sourcing/source-parts
 * Run automated sourcing on extracted parts data
 */
router.post('/source-parts', async (req, res) => {
  try {
    const { parts, vehicleInfo, sourcingOptions = {} } = req.body;

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parts array is required and cannot be empty'
      });
    }

    if (!vehicleInfo) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle information is required'
      });
    }

    console.log('Running automated sourcing for', parts.length, 'parts');

    const results = await automatedSourcing.processAutomatedPartsSourcing(
      parts,
      vehicleInfo,
      {
        enhanceWithVinDecoding: sourcingOptions.enhanceWithVinDecoding !== false,
        generatePO: sourcingOptions.generateAutoPO === true,
        vendorTimeout: sourcingOptions.vendorTimeout || 2000,
        preferredVendors: sourcingOptions.preferredVendors || [],
        approvalThreshold: sourcingOptions.approvalThreshold || 1000,
        baseMarkup: sourcingOptions.baseMarkup || 0.25
      }
    );

    res.json({
      success: true,
      data: results,
      message: `Automated sourcing completed for ${parts.length} parts`
    });

  } catch (error) {
    console.error('Parts sourcing API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Automated parts sourcing failed'
    });
  }
});

/**
 * GET /api/automated-sourcing/vendor-status
 * Get vendor availability and status information
 */
router.get('/vendor-status', async (req, res) => {
  try {
    // This would typically check vendor API availability
    const vendorStatus = {
      timestamp: new Date().toISOString(),
      vendors: [
        {
          id: 'oem_direct',
          name: 'OEM Direct',
          status: 'online',
          responseTime: 1200,
          reliability: 0.95,
          lastCheck: new Date().toISOString()
        },
        {
          id: 'aftermarket_premium',
          name: 'Premium Aftermarket',
          status: 'online',
          responseTime: 800,
          reliability: 0.92,
          lastCheck: new Date().toISOString()
        },
        {
          id: 'recycled_premium',
          name: 'Premium Recycled',
          status: 'online',
          responseTime: 1500,
          reliability: 0.88,
          lastCheck: new Date().toISOString()
        },
        {
          id: 'aftermarket_standard',
          name: 'Standard Aftermarket',
          status: 'online',
          responseTime: 900,
          reliability: 0.85,
          lastCheck: new Date().toISOString()
        }
      ]
    };

    res.json({
      success: true,
      data: vendorStatus
    });

  } catch (error) {
    console.error('Vendor status API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendor status'
    });
  }
});

/**
 * GET /api/automated-sourcing/processing-history
 * Get processing history and statistics
 */
router.get('/processing-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get processing history from BMS service
    const history = Array.from(bmsService.importHistory.values())
      .filter(record => record.automatedSourcing)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(offset, offset + limit)
      .map(record => ({
        id: record.id,
        fileName: record.fileName,
        processingTime: record.processingTime,
        startTime: record.startTime,
        endTime: record.endTime,
        userId: record.userId,
        automatedSourcing: {
          enabled: record.automatedSourcing.enabled,
          success: record.automatedSourcing.success,
          statistics: record.automatedSourcing.statistics,
          processingTime: record.automatedSourcing.processingTime
        }
      }));

    // Calculate summary statistics
    const totalProcessed = Array.from(bmsService.importHistory.values())
      .filter(record => record.automatedSourcing).length;

    const successfulProcessing = Array.from(bmsService.importHistory.values())
      .filter(record => record.automatedSourcing?.success).length;

    const avgProcessingTime = history.length > 0 ?
      history.reduce((sum, record) => sum + record.processingTime, 0) / history.length : 0;

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          total: totalProcessed,
          limit,
          offset,
          hasMore: offset + limit < totalProcessed
        },
        statistics: {
          totalProcessed,
          successfulProcessing,
          successRate: totalProcessed > 0 ? (successfulProcessing / totalProcessed * 100).toFixed(1) + '%' : '0%',
          avgProcessingTime: Math.round(avgProcessingTime)
        }
      }
    });

  } catch (error) {
    console.error('Processing history API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get processing history'
    });
  }
});

/**
 * DELETE /api/automated-sourcing/clear-cache
 * Clear VIN decoding and vendor caches
 */
router.delete('/clear-cache', async (req, res) => {
  try {
    // Clear VIN cache
    vinDecoder.clearCache();
    
    // Clear vendor cache (if implemented)
    if (automatedSourcing.clearCache) {
      automatedSourcing.clearCache();
    }

    res.json({
      success: true,
      message: 'Caches cleared successfully'
    });

  } catch (error) {
    console.error('Cache clearing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear caches'
    });
  }
});

// Error handling middleware specific to this router
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  console.error('Automated sourcing route error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

module.exports = router;