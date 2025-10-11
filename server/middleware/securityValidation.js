/**
 * Enhanced Security Validation Middleware
 * 
 * Implements comprehensive input validation and sanitization:
 * - Joi schema validation for all endpoints
 * - XSS protection and sanitization
 * - SQL injection prevention
 * - File upload security
 * - Request size limits
 * - Content type validation
 */

const Joi = require('joi');
const xss = require('xss');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * XSS sanitization options
 */
const xssOptions = {
  whiteList: {
    // Allow only safe HTML tags
    p: [],
    br: [],
    strong: [],
    em: [],
    b: [],
    i: [],
    u: []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

/**
 * Sanitize input to prevent XSS attacks
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return xss(input, xssOptions);
  } else if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

/**
 * Sanitize request body middleware
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
};

/**
 * Validate request size
 */
const validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request size exceeds limit of ${maxSize}`,
        code: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) return 1024 * 1024; // Default 1MB
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  return Math.floor(value * units[unit]);
};

/**
 * Validate content type
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    const contentType = req.get('content-type');
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content type must be one of: ${allowedTypes.join(', ')}`,
        code: 'INVALID_CONTENT_TYPE'
      });
    }
    
    next();
  };
};

/**
 * File upload security configuration
 */
const createSecureUpload = (options = {}) => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/xml', 'application/xml'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.xml'],
    destination = 'uploads/'
  } = options;

  // Ensure destination directory exists
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generate secure filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${timestamp}_${randomString}${ext}`;
      cb(null, filename);
    }
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`File type ${ext} not allowed`), false);
    }
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`MIME type ${file.mimetype} not allowed`), false);
    }
    
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: 5 // Maximum 5 files per request
    }
  });
};

/**
 * Common validation schemas
 */
const schemas = {
  // User validation
  user: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    role: Joi.string().valid('owner', 'manager', 'technician', 'receptionist').required()
  }),

  // Repair Order validation
  repairOrder: Joi.object({
    roNumber: Joi.string().pattern(/^RO-\d{4}-\d{4}$/).required(),
    status: Joi.string().valid('estimate', 'in_progress', 'parts_pending', 'completed', 'delivered').required(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').required(),
    customerId: Joi.string().uuid().required(),
    vehicleId: Joi.string().uuid().required(),
    claimId: Joi.string().uuid().optional(),
    totalAmount: Joi.number().positive().optional(),
    notes: Joi.string().max(1000).optional()
  }),

  // Customer validation
  customer: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\(\d{3}\) \d{3}-\d{4}$/).optional(),
    address: Joi.string().max(200).optional(),
    city: Joi.string().max(50).optional(),
    state: Joi.string().max(50).optional(),
    zipCode: Joi.string().max(10).optional(),
    country: Joi.string().max(50).default('Canada')
  }),

  // Vehicle validation
  vehicle: Joi.object({
    vin: Joi.string().length(17).pattern(/^[A-HJ-NPR-Z0-9]{17}$/).required(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    make: Joi.string().min(1).max(50).required(),
    model: Joi.string().min(1).max(50).required(),
    trim: Joi.string().max(100).optional(),
    plate: Joi.string().max(20).optional(),
    color: Joi.string().max(50).optional(),
    odometer: Joi.number().integer().min(0).optional()
  }),

  // Parts validation
  part: Joi.object({
    partNumber: Joi.string().min(1).max(100).required(),
    description: Joi.string().min(1).max(500).required(),
    operation: Joi.string().valid('replace', 'repair', 'refinish', 'remove', 'install').required(),
    brandType: Joi.string().valid('OEM', 'Aftermarket', 'Used', 'Refurbished').required(),
    quantityNeeded: Joi.number().integer().min(1).required(),
    unitCost: Joi.number().positive().required(),
    supplierId: Joi.string().uuid().required()
  }),

  // Search validation
  search: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1),
    status: Joi.string().valid('estimate', 'in_progress', 'parts_pending', 'completed', 'delivered').optional(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional()
  }),

  // Pagination validation
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'ro_number', 'status').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Generic validation middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // Replace the original property with sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Rate limiting for different endpoint types
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Predefined rate limits
const rateLimits = {
  // General API rate limit
  general: createRateLimit(15 * 60 * 1000, 1000, 'Too many requests from this IP'),
  
  // Authentication rate limit
  auth: createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'),
  
  // File upload rate limit
  upload: createRateLimit(60 * 60 * 1000, 10, 'Too many file uploads'),
  
  // Search rate limit
  search: createRateLimit(1 * 60 * 1000, 30, 'Too many search requests'),
  
  // Sensitive operations rate limit
  sensitive: createRateLimit(15 * 60 * 1000, 10, 'Too many sensitive operations')
};

/**
 * SQL injection prevention middleware
 */
const preventSQLInjection = (req, res, next) => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/i,
    /(UNION\s+SELECT)/i,
    /(DROP\s+TABLE)/i,
    /(DELETE\s+FROM)/i,
    /(INSERT\s+INTO)/i,
    /(UPDATE\s+SET)/i
  ];

  const checkInput = (input) => {
    if (typeof input === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
          throw new Error('SQL injection attempt detected');
        }
      }
    } else if (typeof input === 'object' && input !== null) {
      for (const value of Object.values(input)) {
        checkInput(value);
      }
    }
  };

  try {
    checkInput(req.body);
    checkInput(req.query);
    checkInput(req.params);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid input detected',
      code: 'INVALID_INPUT'
    });
  }
};

module.exports = {
  sanitizeBody,
  validateRequestSize,
  validateContentType,
  createSecureUpload,
  validate,
  schemas,
  rateLimits,
  preventSQLInjection,
  sanitizeInput
};
