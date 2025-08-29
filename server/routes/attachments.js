const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const photoUploadService = require('../services/photoUploadService');
const { Attachment } = require('../database/models');

const router = express.Router();

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 uploads per window
  message: {
    error: 'Too many upload attempts. Please wait before uploading more files.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Use memory storage for processing

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp', 
      'image/gif',
      'image/heic',
      'image/heif',
      'image/tiff'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only image files are allowed.`));
    }
  }
});

// Validation middleware
const validateUpload = [
  body('jobId').optional().isUUID().withMessage('Invalid job ID format'),
  body('estimateId').optional().isUUID().withMessage('Invalid estimate ID format'), 
  body('customerId').optional().isUUID().withMessage('Invalid customer ID format'),
  body('vehicleId').optional().isUUID().withMessage('Invalid vehicle ID format'),
  body('category').optional().isIn([
    'damage_assessment', 'before_damage', 'during_repair', 'after_repair', 
    'supplement', 'parts_received', 'quality_check', 'delivery',
    'customer_signature', 'insurance_doc', 'invoice', 'estimate', 
    'blueprint', 'warranty', 'other'
  ]).withMessage('Invalid category'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('title').optional().isLength({ max: 255 }).withMessage('Title too long'),
  body('vehiclePart').optional().isLength({ max: 100 }).withMessage('Vehicle part description too long'),
  body('damageType').optional().isLength({ max: 100 }).withMessage('Damage type description too long'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location description too long'),
  body('visibleToCustomer').optional().isBoolean().withMessage('visibleToCustomer must be boolean'),
  body('visibleToInsurance').optional().isBoolean().withMessage('visibleToInsurance must be boolean'),
  body('accessLevel').optional().isIn(['public', 'internal', 'restricted', 'confidential'])
    .withMessage('Invalid access level')
];

const validateGetAttachments = [
  param('jobId').isUUID().withMessage('Invalid job ID format'),
  query('category').optional().isIn([
    'damage_assessment', 'before_damage', 'during_repair', 'after_repair',
    'supplement', 'parts_received', 'quality_check', 'delivery',
    'customer_signature', 'insurance_doc', 'invoice', 'estimate',
    'blueprint', 'warranty', 'other'
  ]).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /api/attachments/upload:
 *   post:
 *     summary: Upload single or multiple photos
 *     tags: [Attachments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               jobId:
 *                 type: string
 *                 format: uuid
 *               estimateId:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *                 enum: [damage_assessment, before_damage, during_repair, after_repair, supplement, parts_received, quality_check, delivery, customer_signature, insurance_doc, invoice, estimate, blueprint, warranty, other]
 *               description:
 *                 type: string
 *               title:
 *                 type: string
 *               vehiclePart:
 *                 type: string
 *               damageType:
 *                 type: string
 *               location:
 *                 type: string
 *               visibleToCustomer:
 *                 type: boolean
 *               visibleToInsurance:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid request or file validation failed
 *       413:
 *         description: File too large
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/upload', 
  uploadLimiter,
  upload.array('files', 10),
  validateUpload,
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      // Prepare metadata from request body
      const metadata = {
        jobId: req.body.jobId,
        estimateId: req.body.estimateId,
        customerId: req.body.customerId,
        vehicleId: req.body.vehicleId,
        partsOrderId: req.body.partsOrderId,
        category: req.body.category || 'other',
        title: req.body.title,
        description: req.body.description,
        vehiclePart: req.body.vehiclePart,
        damageType: req.body.damageType,
        location: req.body.location,
        visibleToCustomer: req.body.visibleToCustomer !== undefined ? 
          req.body.visibleToCustomer === 'true' : true,
        visibleToInsurance: req.body.visibleToInsurance !== undefined ? 
          req.body.visibleToInsurance === 'true' : false,
        accessLevel: req.body.accessLevel || 'internal',
        uploadedBy: req.user.id,
        shopId: req.user.shopId
      };

      let result;

      // Handle single or multiple file upload
      if (req.files.length === 1) {
        result = await photoUploadService.uploadPhoto(req.files[0], metadata);
        result.type = 'single';
      } else {
        result = await photoUploadService.uploadMultiplePhotos(req.files, metadata);
        result.type = 'multiple';
      }

      res.json({
        success: true,
        data: result,
        message: req.files.length === 1 ? 
          'Photo uploaded successfully' : 
          `${req.files.length} photos processed (${result.summary.successful} successful, ${result.summary.failed} failed)`
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'File too large. Maximum size is 10MB per file.'
        });
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 10 files per request.'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Upload failed',
        details: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/attachments/categories:
 *   get:
 *     summary: Get supported attachment categories
 *     tags: [Attachments]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', (req, res) => {
  const categories = photoUploadService.getSupportedCategories();
  res.json({
    success: true,
    data: categories
  });
});

/**
 * @swagger
 * /api/attachments/{jobId}:
 *   get:
 *     summary: Get all attachments for a job
 *     tags: [Attachments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [damage_assessment, before_damage, during_repair, after_repair, supplement, parts_received, quality_check, delivery, customer_signature, insurance_doc, invoice, estimate, blueprint, warranty, other]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Attachments retrieved successfully
 *       404:
 *         description: Job not found
 */
router.get('/:jobId',
  validateGetAttachments,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { category, limit, offset } = req.query;

      const options = {
        category,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : 0
      };

      const result = await photoUploadService.getJobAttachments(jobId, options);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get attachments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve attachments',
        details: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/attachments/file/{id}:
 *   get:
 *     summary: Get specific attachment file
 *     tags: [Attachments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: thumbnail
 *         schema:
 *           type: boolean
 *           description: Return thumbnail version if available
 *     responses:
 *       200:
 *         description: File served successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       403:
 *         description: Access denied
 */
router.get('/file/:id',
  param('id').isUUID().withMessage('Invalid attachment ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { thumbnail } = req.query;

      const attachment = await photoUploadService.getAttachment(id);

      // Check access permissions
      if (attachment.accessLevel === 'restricted' && req.user.role === 'technician') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      if (attachment.accessLevel === 'confidential' && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Determine which file to serve
      const filePath = thumbnail && attachment.thumbnailPath ? 
        path.join(process.cwd(), attachment.thumbnailPath) :
        path.join(process.cwd(), attachment.filePath);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'File not found on disk'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalFileName}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');

      // Stream the file
      res.sendFile(filePath);

    } catch (error) {
      console.error('File serve error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Attachment not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to serve file',
        details: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/attachments/{id}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Attachments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       404:
 *         description: Attachment not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id',
  param('id').isUUID().withMessage('Invalid attachment ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get attachment to check permissions
      const attachment = await photoUploadService.getAttachment(id);

      // Only allow deletion by uploader, managers, or admins
      if (attachment.uploadedBy !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only delete your own attachments.'
        });
      }

      const result = await photoUploadService.deleteAttachment(id);

      res.json({
        success: true,
        message: 'Attachment deleted successfully'
      });

    } catch (error) {
      console.error('Delete attachment error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Attachment not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete attachment',
        details: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/attachments/bulk-upload:
 *   post:
 *     summary: Bulk upload multiple files with batch processing
 *     tags: [Attachments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               jobId:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *               bulkDescription:
 *                 type: string
 *                 description: Description applied to all files
 *     responses:
 *       200:
 *         description: Bulk upload completed
 *       400:
 *         description: Invalid request
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/bulk-upload',
  uploadLimiter,
  upload.array('files', 10),
  validateUpload,
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided for bulk upload'
        });
      }

      const metadata = {
        jobId: req.body.jobId,
        estimateId: req.body.estimateId,
        category: req.body.category || 'other',
        description: req.body.bulkDescription,
        uploadedBy: req.user.id,
        shopId: req.user.shopId,
        visibleToCustomer: req.body.visibleToCustomer !== undefined ? 
          req.body.visibleToCustomer === 'true' : true,
        accessLevel: req.body.accessLevel || 'internal'
      };

      const result = await photoUploadService.uploadMultiplePhotos(req.files, metadata);

      res.json({
        success: true,
        data: result,
        message: `Bulk upload completed: ${result.summary.successful} successful, ${result.summary.failed} failed`
      });

    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Bulk upload failed',
        details: error.message
      });
    }
  }
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large',
        details: 'Maximum file size is 10MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        details: 'Maximum 10 files per request'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
        details: 'Use "files" as the field name'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      details: 'Only image files are allowed'
    });
  }

  next(error);
});

module.exports = router;