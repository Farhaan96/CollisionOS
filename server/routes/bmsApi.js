/**
 * Enhanced BMS API Routes
 * RESTful endpoints with authentication, authorization, and rate limiting
 */
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Import services (these would need to be adapted for server-side use)
// For now, using placeholder implementations
const bmsService = require('../services/bmsService');
const bmsValidator = require('../services/bmsValidator');
const batchProcessor = require('../services/bmsBatchProcessor');
const errorReporter = require('../services/bmsErrorReporter');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/bms');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `bms-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['text/xml', 'application/xml'];
    const allowedExtensions = ['.xml'];

    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMime || hasValidExtension) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only BMS XML files are allowed.'),
        false
      );
    }
  },
});

// Rate limiting configurations
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window per IP
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 15 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 uploads per window per IP
  message: {
    error: 'Too many upload requests. Please try again later.',
    retryAfter: 15 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware - NO DEVELOPMENT BYPASSES
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      console.error(
        '❌ JWT_SECRET environment variable is required in production'
      );
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication service unavailable',
      });
    }

    if (!jwtSecret) {
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'JWT secret not configured',
        code: 'JWT_SECRET_MISSING'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Optional authentication middleware - allows requests without auth in development
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, allow in development mode
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV === 'development') {
        req.user = {
          id: 'dev-user',
          shopId: '00000000-0000-4000-8000-000000000001',
          username: 'developer'
        };
        return next();
      }
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'collisionos_super_secret_jwt_key_2024_make_it_long_and_random_for_production';

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
    } catch (error) {
      // If token verification fails, fall back to dev user in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('JWT verification failed, using dev user:', error.message);
        req.user = {
          id: 'dev-user',
          shopId: '00000000-0000-4000-8000-000000000001',
          username: 'developer'
        };
      } else {
        throw error;
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Authorization middleware
const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has required permissions
    if (permissions.length > 0) {
      const hasPermission = permissions.some(permission =>
        req.user.permissions?.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }
    }

    next();
  };
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/bms/upload - Single BMS file upload
 */
router.post(
  '/upload',
  standardRateLimit,
  uploadRateLimit,
  optionalAuth, // Use optional authentication for development support
  upload.single('file'),
  [
    body('validateOnly')
      .optional()
      .isBoolean()
      .withMessage('validateOnly must be boolean'),
    body('autoRetry')
      .optional()
      .isBoolean()
      .withMessage('autoRetry must be boolean'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const uploadId = uuidv4();

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please upload a BMS XML file',
        });
      }

      const { validateOnly = false, autoRetry = true } = req.body;

      // Create processing context
      const context = {
        uploadId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        userId: req.user.id,
        userAgent: req.headers['user-agent'],
        operation: 'single_upload',
        validateOnly,
        autoRetry,
      };

      // Read file content
      const filePath = req.file.path;
      const fileContent = await fs.readFile(filePath, 'utf8');

      let result = {
        uploadId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: 'processing',
      };

      // Validate file
      if (bmsValidator) {
        const validation = await bmsValidator.validateBMSFile(fileContent);
        result.validation = validation;

        if (!validation.isValid) {
          // Log validation errors
          errorReporter.reportError(new Error('BMS validation failed'), {
            ...context,
            validation,
          });

          if (!validateOnly) {
            await fs.unlink(filePath); // Cleanup temp file
            return res.status(400).json({
              ...result,
              status: 'validation_failed',
              error: 'File validation failed',
              message: validation.summary.message,
            });
          }
        }
      }

      // If validation only, return validation results
      if (validateOnly) {
        await fs.unlink(filePath); // Cleanup temp file
        return res.status(200).json({
          ...result,
          status: 'validated',
          message: 'File validation completed',
        });
      }

      // Process BMS file with auto-creation
      try {
        // Use the new auto-creation method
        const processedData = await bmsService.processBMSWithAutoCreation(
          fileContent,
          context
        );

        result = {
          ...result,
          status: 'completed',
          message: 'BMS file processed successfully',
          jobId: processedData.createdJob?.id || processedData.createdJob?.jobNumber || null,
          data: processedData,
          autoCreation: {
            success: processedData.autoCreationSuccess || false,
            error: processedData.autoCreationError || null,
            requiresManualIntervention:
              processedData.requiresManualIntervention || false,
            createdRecords: {
              customer: processedData.createdCustomer
                ? {
                    id: processedData.createdCustomer.id,
                    name:
                      processedData.createdCustomer.firstName +
                      ' ' +
                      processedData.createdCustomer.lastName,
                    email: processedData.createdCustomer.email,
                  }
                : null,
              vehicle: processedData.createdVehicle
                ? {
                    id: processedData.createdVehicle.id,
                    description:
                      `${processedData.createdVehicle.year || ''} ${processedData.createdVehicle.make || ''} ${processedData.createdVehicle.model || ''}`.trim(),
                  }
                : null,
              job: processedData.createdJob
                ? {
                    id: processedData.createdJob.id,
                    jobNumber: processedData.createdJob.jobNumber,
                    status: processedData.createdJob.status,
                  }
                : null,
            },
          },
        };

        // Log successful processing with auto-creation details
        if (processedData.autoCreationSuccess) {
          console.log(
            `[BMS Upload] Successfully processed and created records from ${req.file.originalname} for user ${req.user.id}:`,
            {
              customer: processedData.createdCustomer?.id,
              vehicle: processedData.createdVehicle?.id,
              job: processedData.createdJob?.id,
            }
          );
        } else {
          console.log(
            `[BMS Upload] Processed ${req.file.originalname} but auto-creation failed:`,
            processedData.autoCreationError
          );
        }
      } catch (processingError) {
        // Report processing error
        const errorReport = errorReporter.reportError(processingError, context);

        result = {
          ...result,
          status: 'failed',
          error: errorReport.analysis.userMessage,
          errorId: errorReport.id,
          message: 'Failed to process BMS file',
        };

        // If auto-retry is enabled and error is retryable, schedule retry
        if (autoRetry && errorReport.analysis.retryable) {
          result.retryScheduled = true;
          result.message += ' - Retry scheduled';
        }
      }

      // Cleanup temp file
      await fs.unlink(filePath);

      const statusCode =
        result.status === 'completed'
          ? 200
          : result.status === 'validation_failed'
            ? 400
            : 500;

      res.status(statusCode).json(result);
    } catch (error) {
      console.error('BMS upload error:', error);

      // Cleanup temp file if exists
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      const errorReport = errorReporter.reportError(error, {
        uploadId,
        fileName: req.file?.originalname,
        userId: req.user.id,
        operation: 'single_upload',
      });

      res.status(500).json({
        uploadId,
        status: 'error',
        error: errorReport.analysis.userMessage,
        errorId: errorReport.id,
        message: 'Upload failed due to server error',
      });
    }
  }
);

/**
 * POST /api/bms/batch-upload - Batch BMS file upload
 */
router.post(
  '/batch-upload',
  standardRateLimit,
  uploadRateLimit,
  authenticate,
  upload.array('files', 10),
  [
    body('pauseOnError').optional().isBoolean(),
    body('maxRetries').optional().isInt({ min: 0, max: 10 }),
    body('validateFirst').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const batchId = uuidv4();

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files provided',
          message: 'Please upload one or more BMS files',
        });
      }

      const {
        pauseOnError = false,
        maxRetries = 3,
        validateFirst = true,
      } = req.body;

      // Create batch processing options
      const batchOptions = {
        pauseOnError,
        maxRetries,
        validateFirst,
        userId: req.user.id,
        userAgent: req.headers['user-agent'],
      };

      // Convert uploaded files to file objects
      const fileObjects = req.files.map(file => ({
        name: file.originalname,
        size: file.size,
        path: file.path,
        originalFile: file,
      }));

      // Create batch job
      const batch = batchProcessor.createBatch(fileObjects, batchOptions);

      // Start processing asynchronously
      batchProcessor.startBatch(batch.id).catch(error => {
        console.error(`Batch ${batch.id} processing failed:`, error);
      });

      res.status(202).json({
        batchId: batch.id,
        status: 'accepted',
        message: 'Batch upload started',
        totalFiles: req.files.length,
        estimatedTime: req.files.length * 5, // Rough estimate: 5 seconds per file
        statusUrl: `/api/bms/batch-status/${batch.id}`,
      });
    } catch (error) {
      console.error('Batch upload error:', error);

      // Cleanup temp files
      if (req.files) {
        await Promise.all(
          req.files.map(file => fs.unlink(file.path).catch(() => {}))
        );
      }

      const errorReport = errorReporter.reportError(error, {
        batchId,
        fileCount: req.files?.length || 0,
        userId: req.user.id,
        operation: 'batch_upload',
      });

      res.status(500).json({
        batchId,
        status: 'error',
        error: errorReport.analysis.userMessage,
        errorId: errorReport.id,
        message: 'Batch upload failed',
      });
    }
  }
);

/**
 * GET /api/bms/batch-status/:batchId - Get batch processing status
 */
router.get(
  '/batch-status/:batchId',
  standardRateLimit,
  authenticate,
  [param('batchId').isUUID().withMessage('Invalid batch ID format')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { batchId } = req.params;
      const status = batchProcessor.getBatchStatus(batchId);

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
  }
);

/**
 * POST /api/bms/batch-control/:batchId/:action - Control batch processing
 */
router.post(
  '/batch-control/:batchId/:action',
  standardRateLimit,
  authenticate,
  [
    param('batchId').isUUID().withMessage('Invalid batch ID format'),
    param('action')
      .isIn(['pause', 'resume', 'cancel'])
      .withMessage('Invalid action'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { batchId, action } = req.params;

      let result;
      switch (action) {
        case 'pause':
          result = await batchProcessor.pauseBatch(batchId);
          break;
        case 'resume':
          result = await batchProcessor.resumeBatch(batchId);
          break;
        case 'cancel':
          result = await batchProcessor.cancelBatch(batchId);
          break;
      }

      res.status(200).json({
        success: true,
        message: `Batch ${action} successful`,
        data: result,
      });
    } catch (error) {
      console.error(`Batch ${req.params.action} error:`, error);

      const errorReport = errorReporter.reportError(error, {
        batchId: req.params.batchId,
        action: req.params.action,
        userId: req.user.id,
        operation: 'batch_control',
      });

      res.status(400).json({
        error: errorReport.analysis.userMessage,
        errorId: errorReport.id,
        message: `Failed to ${req.params.action} batch`,
      });
    }
  }
);

/**
 * GET /api/bms/validate - Validate BMS file without importing
 */
router.post(
  '/validate',
  standardRateLimit,
  authenticate,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please upload a BMS file to validate',
        });
      }

      const filePath = req.file.path;
      const fileContent = await fs.readFile(filePath, 'utf8');

      const validation = await bmsValidator.validateBMSFile(fileContent);

      // Cleanup temp file
      await fs.unlink(filePath);

      res.status(200).json({
        success: true,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        validation,
      });
    } catch (error) {
      console.error('File validation error:', error);

      // Cleanup temp file if exists
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      const errorReport = errorReporter.reportError(error, {
        fileName: req.file?.originalname,
        userId: req.user.id,
        operation: 'validation',
      });

      res.status(500).json({
        success: false,
        error: errorReport.analysis.userMessage,
        errorId: errorReport.id,
        message: 'Failed to validate file',
      });
    }
  }
);

/**
 * GET /api/bms/imports - Get import history
 */
router.get(
  '/imports',
  standardRateLimit,
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['completed', 'failed', 'processing'])
      .withMessage('Invalid status'),
    query('userId').optional().isUUID().withMessage('Invalid user ID format'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, userId } = req.query;

      // Get import history (this would be implemented in your import service)
      const imports = await bmsService.getImportHistory({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        userId,
        requestingUserId: req.user.id,
      });

      res.status(200).json({
        success: true,
        data: imports,
      });
    } catch (error) {
      console.error('Get imports error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to retrieve import history',
      });
    }
  }
);

/**
 * GET /api/bms/statistics - Get BMS processing statistics
 */
router.get(
  '/statistics',
  standardRateLimit,
  authenticate,
  [
    query('period')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Invalid period'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Invalid groupBy value'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { period = 'month', groupBy = 'day' } = req.query;

      // Get processing statistics
      const statistics = {
        overall: batchProcessor.getOverallStatistics(),
        errors: errorReporter.getErrorStatistics(),
        period: {
          name: period,
          data: await bmsService.getStatistics(period, groupBy),
        },
      };

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to retrieve statistics',
      });
    }
  }
);

/**
 * GET /api/bms/errors - Get error reports
 */
router.get(
  '/errors',
  standardRateLimit,
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('category')
      .optional()
      .isIn([
        'parsing',
        'validation',
        'database',
        'network',
        'file_io',
        'business_logic',
        'system',
      ]),
    query('resolved').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, severity, category, resolved } = req.query;

      const filters = {};
      if (severity) filters.severity = severity;
      if (category) filters.category = category;
      if (resolved !== undefined) filters.resolved = resolved === 'true';

      const statistics = errorReporter.getErrorStatistics(filters);
      const errors = errorReporter.searchErrors(filters);

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedErrors = errors.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: {
          errors: paginatedErrors,
          statistics,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: errors.length,
            totalPages: Math.ceil(errors.length / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get errors error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to retrieve error reports',
      });
    }
  }
);

/**
 * POST /api/bms/errors/:errorId/resolve - Resolve error
 */
router.post(
  '/errors/:errorId/resolve',
  standardRateLimit,
  authenticate,
  [
    param('errorId')
      .matches(/^error-\d+-[a-z0-9]+$/)
      .withMessage('Invalid error ID format'),
    body('resolution')
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Resolution description required'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { errorId } = req.params;
      const { resolution } = req.body;

      const resolvedError = errorReporter.resolveError(
        errorId,
        resolution,
        req.user.username || req.user.id
      );

      if (!resolvedError) {
        return res.status(404).json({
          error: 'Error not found',
          message: 'The specified error ID does not exist',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Error resolved successfully',
        data: resolvedError,
      });
    } catch (error) {
      console.error('Resolve error error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to resolve error',
      });
    }
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('BMS API error:', error);

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

  const errorReport = errorReporter.reportError(error, {
    endpoint: req.path,
    method: req.method,
    userId: req.user?.id,
    operation: 'api_request',
  });

  res.status(500).json({
    error: 'Internal server error',
    message: errorReport.analysis.userMessage,
    errorId: errorReport.id,
  });
});

module.exports = router;
