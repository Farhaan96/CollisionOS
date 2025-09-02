/**
 * Enhanced Error Handling Utilities for CollisionOS API
 */

/**
 * Custom error classes
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends APIError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends APIError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Error logging function
 */
const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  const requestInfo = req
    ? {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous',
      }
    : {};

  const errorInfo = {
    timestamp,
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    stack: error.stack,
    ...requestInfo,
  };

  // Different log levels based on error severity
  if (error.statusCode >= 500) {
    console.error('🚨 Server Error:', errorInfo);
  } else if (error.statusCode >= 400) {
    console.warn('⚠️ Client Error:', errorInfo);
  } else {
    console.info('ℹ️ Info:', errorInfo);
  }

  // TODO: Send to external logging service in production
  // Examples: Winston, Morgan, Sentry, etc.
};

/**
 * Format error response
 */
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    error: error.message || 'An error occurred',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  // Include additional details for validation errors
  if (error.details) {
    response.details = error.details;
  }

  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
};

/**
 * Handle Sequelize database errors
 */
const handleSequelizeError = error => {
  switch (error.name) {
    case 'SequelizeValidationError':
      const validationDetails = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));
      return new ValidationError(
        'Database validation failed',
        validationDetails
      );

    case 'SequelizeUniqueConstraintError':
      const field = error.errors[0]?.path || 'field';
      return new ConflictError(`${field} already exists`);

    case 'SequelizeForeignKeyConstraintError':
      return new ValidationError('Referenced resource does not exist');

    case 'SequelizeConnectionError':
    case 'SequelizeHostNotFoundError':
    case 'SequelizeHostNotReachableError':
      return new APIError(
        'Database connection failed',
        503,
        'DATABASE_CONNECTION_ERROR'
      );

    case 'SequelizeTimeoutError':
      return new APIError(
        'Database operation timed out',
        408,
        'DATABASE_TIMEOUT'
      );

    default:
      return new APIError('Database error', 500, 'DATABASE_ERROR');
  }
};

/**
 * Handle JWT errors
 */
const handleJWTError = error => {
  switch (error.name) {
    case 'TokenExpiredError':
      return new AuthenticationError('Token has expired');

    case 'JsonWebTokenError':
      return new AuthenticationError('Invalid token');

    case 'NotBeforeError':
      return new AuthenticationError('Token not active yet');

    default:
      return new AuthenticationError('Token verification failed');
  }
};

/**
 * Central error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle different error types
  if (err.name?.startsWith('Sequelize')) {
    error = handleSequelizeError(err);
  } else if (
    err.name?.includes('JsonWebToken') ||
    err.name?.includes('Token')
  ) {
    error = handleJWTError(err);
  } else if (!err.isOperational) {
    // Convert non-operational errors to APIError
    error = new APIError(
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log the error
  logError(error, req);

  // Send error response
  const statusCode = error.statusCode || 500;
  const includeStack = process.env.NODE_ENV === 'development';

  res.status(statusCode).json(formatErrorResponse(error, includeStack));
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  logError(error, req);

  res.status(404).json(formatErrorResponse(error));
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Success response formatter
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Paginated response formatter
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  res.json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error factory functions for common scenarios
 */
const errors = {
  // Authentication errors
  invalidCredentials: () =>
    new AuthenticationError('Invalid username or password'),
  tokenExpired: () => new AuthenticationError('Access token has expired'),
  accountDisabled: () => new AuthenticationError('Account has been disabled'),
  rateLimitExceeded: message =>
    new RateLimitError(message || 'Rate limit exceeded'),

  // Authorization errors
  insufficientPermissions: required =>
    new AuthorizationError(`Insufficient permissions. Required: ${required}`),
  shopAccessDenied: () => new AuthorizationError('Access denied for this shop'),

  // Validation errors
  validationError: (message = 'Validation failed') => new ValidationError(message),
  missingField: field => new ValidationError(`${field} is required`),
  invalidField: (field, reason) =>
    new ValidationError(`Invalid ${field}: ${reason}`),

  // Not found errors
  notFound: (message = 'Resource not found') => new NotFoundError(message),
  userNotFound: () => new NotFoundError('User not found'),
  customerNotFound: () => new NotFoundError('Customer not found'),
  jobNotFound: () => new NotFoundError('Job not found'),
  vehicleNotFound: () => new NotFoundError('Vehicle not found'),

  // Conflict errors
  duplicateEmail: () => new ConflictError('Email address already exists'),
  duplicateUsername: () => new ConflictError('Username already exists'),

  // Business logic errors
  jobStatusTransition: (from, to) =>
    new ValidationError(`Cannot transition job from ${from} to ${to}`),
  insufficientInventory: item =>
    new ConflictError(`Insufficient inventory for ${item}`),

  // Database errors
  databaseError: (message = 'Database operation failed') =>
    new APIError(message, 500, 'DATABASE_ERROR'),
  connectionError: () =>
    new APIError('Database connection failed', 503, 'DATABASE_CONNECTION_ERROR'),
  queryError: (message = 'Query execution failed') =>
    new APIError(message, 500, 'DATABASE_QUERY_ERROR'),

  // Generic system errors
  systemError: (message = 'Internal system error') =>
    new APIError(message, 500, 'SYSTEM_ERROR'),
  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new APIError(message, 503, 'SERVICE_UNAVAILABLE'),
};

module.exports = {
  // Error classes
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,

  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,

  // Response formatters
  successResponse,
  paginatedResponse,

  // Utilities
  logError,
  formatErrorResponse,

  // Error factory
  errors,
};
