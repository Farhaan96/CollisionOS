const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    if (!dataToValidate && source !== 'query') {
      return res.status(400).json({
        error: 'Validation failed',
        message: `No ${source} data provided`,
        details: [],
      });
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Collect all validation errors
      stripUnknown: true, // Remove unknown properties
      convert: true, // Convert strings to numbers where appropriate
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request validation failed',
        details,
      });
    }

    // Replace the original data with the validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Validate request parameters (URL params)
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateParams = schema => validate(schema, 'params');

/**
 * Validate request body
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateBody = schema => validate(schema, 'body');

/**
 * Validate query parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = schema => validate(schema, 'query');

/**
 * Common parameter schemas
 */
const commonSchemas = {
  // ID parameter validation
  idParam: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required',
    }),
  }),

  // Pagination query parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Search query parameters
  search: Joi.object({
    q: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query cannot exceed 255 characters',
      'any.required': 'Search query is required',
    }),
  }),

  // Date range query parameters
  dateRange: Joi.object({
    dateFrom: Joi.date().iso().optional(),

    dateTo: Joi.date()
      .iso()
      .when('dateFrom', {
        is: Joi.exist(),
        then: Joi.date().min(Joi.ref('dateFrom')).required(),
        otherwise: Joi.date().optional(),
      })
      .messages({
        'date.min': 'End date must be after start date',
      }),
  }),

  // File upload validation
  fileUpload: Joi.object({
    file: Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string()
        .valid(
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .required(),
      size: Joi.number()
        .max(10 * 1024 * 1024)
        .required(), // 10MB max
      buffer: Joi.binary().required(),
    }).required(),
  }),
};

/**
 * Combine multiple validation schemas
 * @param  {...Joi.Schema} schemas - Joi validation schemas to combine
 * @returns {Joi.Schema} Combined schema
 */
const combineSchemas = (...schemas) => {
  return schemas.reduce((combined, schema) => {
    return combined.concat(schema);
  });
};

/**
 * Validation error handler
 * This should be used as error handling middleware
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
      details: err.details || [],
    });
  }
  next(err);
};

/**
 * Custom validation functions
 */
const customValidations = {
  // VIN validation
  vin: Joi.string()
    .length(17)
    .pattern(/^[A-HJ-NPR-Z0-9]{17}$/)
    .messages({
      'string.length': 'VIN must be exactly 17 characters',
      'string.pattern.base': 'Invalid VIN format',
    }),

  // Phone number validation
  phone: Joi.string()
    .pattern(/^[\+]?[\d\s\-\(\)]{10,15}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),

  // ZIP code validation
  zipCode: Joi.string()
    .pattern(/^[\d\-\s]{5,10}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid ZIP code',
    }),

  // Password validation
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      )
    )
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    }),

  // Username validation
  username: Joi.string().alphanum().min(3).max(50).messages({
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 50 characters',
  }),

  // Email validation
  email: Joi.string().email().max(255).messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email cannot exceed 255 characters',
  }),
};

module.exports = {
  validate,
  validateParams,
  validateBody,
  validateQuery,
  commonSchemas,
  combineSchemas,
  validationErrorHandler,
  customValidations,
};
