const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

// Import parsers and services
const EnhancedBMSParser = require('../services/import/bms_parser.js');
const EMSParser = require('../services/import/ems_parser.js');
const bmsService = require('../services/bmsService');
const bmsValidator = require('../services/bmsValidator');
const bmsBatchProcessor = require('../services/bmsBatchProcessor');

const router = express.Router();

// Ensure upload directory exists
const tempUploadDir = path.join(__dirname, '../../uploads/temp');
fs.mkdir(tempUploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const upload = multer({
  dest: tempUploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow XML files for BMS and TXT files for EMS
    const allowedMimes = [
      'text/xml',
      'application/xml',
      'text/plain',
      'application/octet-stream',
    ];
    const allowedExtensions = ['.xml', '.bms', '.txt', '.ems'];

    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMime || hasValidExtension) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only XML BMS or TXT EMS files are allowed.'
        ),
        false
      );
    }
  },
});

// Rate limiting for import endpoints
const importRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 imports per window per IP
  message: {
    error: 'Too many import requests. Please try again later.',
    retryAfter: 15 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory store for import status
const importStatusStore = new Map();

// Simple test endpoint without any middleware
router.get('/test', (req, res) => {
  res.json({
    message: 'Import routes working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * POST /api/import/bms - Single BMS file import
 */
router.post('/bms', upload.single('file'), async (req, res) => {
  const importId = uuidv4();

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a BMS XML file',
      });
    }

    // Update import status
    importStatusStore.set(importId, {
      id: importId,
      status: 'processing',
      progress: 0,
      fileName: req.file.originalname,
      startTime: new Date(),
      message: 'Starting BMS file processing...',
    });

    // Read file content
    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Update progress
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      progress: 25,
      message: 'Parsing BMS XML data...',
    });

    // Process BMS file using service with auto-creation
    const processedData = await bmsService.processBMSWithAutoCreation(
      fileContent,
      {
        uploadId: importId,
        fileName: req.file.originalname,
        userId: req.user?.id || 'dev-user-123',
        shopId: req.user?.shopId || process.env.DEV_SHOP_ID || 'dev-shop-123',
      }
    );

    // Update progress
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      progress: 75,
      message: 'Processing parsed data...',
    });

    // Clean up temp file
    await fs.unlink(filePath).catch(console.error);

    // Final status update
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      status: 'completed',
      progress: 100,
      message: 'BMS file imported successfully',
      completedAt: new Date(),
      result: processedData,
    });

    // Emit real-time event to refresh customer list
    if (processedData.createdCustomer) {
      // Trigger frontend refresh via WebSocket or polling
      req.app.emit('customer_created', {
        customerId: processedData.createdCustomer.id,
        shopId: processedData.createdCustomer.shop_id
      });
    }

    res.status(200).json({
      success: true,
      importId,
      message: 'BMS file processed successfully',
      data: processedData,
      jobId: processedData.createdJob?.id,
      customerId: processedData.createdCustomer?.id,
    });
  } catch (error) {
    console.error('❌ BMS import error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      fileName: req.file?.originalname,
      filePath: req.file?.path,
    });

    // Update status with error
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      status: 'failed',
      message: error.message,
      error: {
        type: error.constructor.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      failedAt: new Date(),
    });

    // Clean up temp file if it exists
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      importId,
      error: error.message,
      message: 'Failed to process BMS file',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name,
        code: error.code,
      } : undefined,
    });
  }
});

/**
 * POST /api/import/validate - Validate file without importing
 */
router.post('/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a file to validate',
      });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Use the validator service
    const validationResult = await bmsValidator.validateBMSFile(fileContent);

    // Clean up temp file
    await fs.unlink(filePath).catch(console.error);

    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      validation: validationResult,
    });
  } catch (error) {
    console.error('File validation error:', error);

    // Clean up temp file if it exists
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to validate file',
    });
  }
});

/**
 * POST /api/import/ems - Single EMS file import
 */
router.post('/ems', upload.single('file'), async (req, res) => {
  const importId = uuidv4();

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload an EMS text file',
      });
    }

    // Update import status
    importStatusStore.set(importId, {
      id: importId,
      status: 'processing',
      progress: 0,
      fileName: req.file.originalname,
      startTime: new Date(),
      message: 'Starting EMS file processing...',
    });

    // Read file content
    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Update progress
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      progress: 25,
      message: 'Parsing EMS text data...',
    });

    // Process EMS file using service
    const processedData = await bmsService.processEMSFile(fileContent, {
      uploadId: importId,
      fileName: req.file.originalname,
      userId: req.user?.id,
    });

    // Update progress
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      progress: 75,
      message: 'Processing parsed data...',
    });

    // Clean up temp file
    await fs.unlink(filePath).catch(console.error);

    // Final status update
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      status: 'completed',
      progress: 100,
      message: 'EMS file imported successfully',
      completedAt: new Date(),
      result: processedData,
    });

    res.status(200).json({
      success: true,
      importId,
      message: 'EMS file processed successfully',
      data: processedData,
    });
  } catch (error) {
    console.error('EMS import error:', error);

    // Update status with error
    importStatusStore.set(importId, {
      ...importStatusStore.get(importId),
      status: 'failed',
      message: error.message,
      error: {
        type: error.constructor.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      failedAt: new Date(),
    });

    // Clean up temp file if it exists
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      importId,
      error: error.message,
      message: 'Failed to process EMS file',
    });
  }
});

/**
 * POST /api/import/batch - Batch file import
 */
router.post('/batch', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please upload one or more BMS/EMS files',
      });
    }

    // Create batch
    const fileObjects = req.files.map(file => ({
      name: file.originalname,
      size: file.size,
      path: file.path,
      originalFile: file,
    }));

    const batchOptions = {
      pauseOnError: req.body.pauseOnError === 'true',
      maxRetries: parseInt(req.body.maxRetries) || 3,
      validateFirst: req.body.validateFirst !== 'false',
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
    };

    const batch = bmsBatchProcessor.createBatch(fileObjects, batchOptions);

    // Start processing asynchronously
    bmsBatchProcessor.startBatch(batch.id).catch(error => {
      console.error(`Batch ${batch.id} processing failed:`, error);
    });

    res.status(202).json({
      success: true,
      batchId: batch.id,
      message: 'Batch upload started',
      totalFiles: req.files.length,
      estimatedTime: req.files.length * 5, // Rough estimate: 5 seconds per file
      statusUrl: `/api/import/batch-status/${batch.id}`,
    });
  } catch (error) {
    console.error('Batch upload error:', error);

    // Cleanup temp files
    if (req.files) {
      await Promise.all(
        req.files.map(file => fs.unlink(file.path).catch(() => {}))
      );
    }

    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Batch upload failed',
    });
  }
});

/**
 * GET /api/import/batch-status/:batchId - Get batch processing status
 */
router.get('/batch-status/:batchId', (req, res) => {
  try {
    const { batchId } = req.params;
    const status = bmsBatchProcessor.getBatchStatus(batchId);

    if (!status) {
      return res.status(404).json({
        error: 'Batch not found',
        message: 'The specified batch ID does not exist',
      });
    }

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get batch status error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve batch status',
    });
  }
});

/**
 * GET /api/import/status/:id - Get import status by ID
 */
router.get('/status/:id', (req, res) => {
  const importId = req.params.id;

  if (!importStatusStore.has(importId)) {
    return res.status(404).json({
      error: 'Import not found',
      message: 'The specified import ID does not exist or has expired',
    });
  }

  const status = importStatusStore.get(importId);

  res.status(200).json({
    success: true,
    data: status,
  });
});

/**
 * GET /api/import/history - Get import history
 */
router.get('/history', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status; // Filter by status if provided

  // Convert import status store to array and sort by start time
  let imports = Array.from(importStatusStore.values()).sort(
    (a, b) => new Date(b.startTime) - new Date(a.startTime)
  );

  // Filter by status if provided
  if (status) {
    imports = imports.filter(imp => imp.status === status);
  }

  // Calculate pagination
  const total = imports.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  const paginatedImports = imports.slice(start, end);

  res.status(200).json({
    success: true,
    data: {
      imports: paginatedImports,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

// Cleanup old import status records (run periodically)
setInterval(
  () => {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, status] of importStatusStore.entries()) {
      const age = now - new Date(status.startTime);
      if (age > maxAge) {
        importStatusStore.delete(id);
      }
    }
  },
  60 * 60 * 1000
); // Run every hour

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Import API error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds 50MB limit',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 10 files allowed per upload',
      });
    }
  }

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
});

module.exports = router; // Force restart 2
