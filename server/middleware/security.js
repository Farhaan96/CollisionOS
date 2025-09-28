const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Enhanced security headers configuration
const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for Socket.io compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
};

// Enhanced rate limiting with different limits per endpoint type
const createRateLimit = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Different rate limits for different endpoint types
const rateLimits = {
  // Very strict for auth endpoints
  auth: createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'),

  // Moderate for general API usage
  api: createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'),

  // Less restrictive for read operations
  read: createRateLimit(15 * 60 * 1000, 200, 'Too many read requests'),

  // More restrictive for write operations
  write: createRateLimit(15 * 60 * 1000, 50, 'Too many write requests'),

  // Very restrictive for file uploads
  upload: createRateLimit(60 * 60 * 1000, 10, 'Too many file uploads'),
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any keys that contain prohibited characters
  mongoSanitize()(req, res, () => {
    // Sanitize string inputs to prevent XSS
    const sanitizeObject = obj => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'string') {
            obj[key] = xss(obj[key]);
          } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
          }
        });
      } else if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (typeof item === 'object') {
            sanitizeObject(item);
          }
        });
      }
    };

    // Sanitize request body
    if (req.body) {
      sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      sanitizeObject(req.params);
    }

    next();
  });
};

// Security audit logging middleware
const auditLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log security-relevant information
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    shopId: req.user?.shopId || 'unknown',
  };

  // Log failed authentication attempts
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;

    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('🔒 Security Alert - Unauthorized Access Attempt:', {
        ...logData,
        statusCode: res.statusCode,
        responseTime,
      });
    }

    // Log rate limit violations
    if (res.statusCode === 429) {
      console.warn('🚨 Security Alert - Rate Limit Exceeded:', {
        ...logData,
        statusCode: res.statusCode,
        responseTime,
      });
    }

    // Log successful sensitive operations
    if (
      res.statusCode < 300 &&
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
    ) {
      console.info('📝 Audit Log - Data Modification:', {
        ...logData,
        statusCode: res.statusCode,
        responseTime,
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// HTTPS enforcement for production
const httpsOnly = (req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https'
  ) {
    return res.status(400).json({
      error: 'HTTPS required in production',
    });
  }
  next();
};

// Content type validation
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('content-type');
      if (
        contentType &&
        !allowedTypes.some(type => contentType.includes(type))
      ) {
        return res.status(400).json({
          error: 'Invalid content type',
          allowed: allowedTypes,
        });
      }
    }
    next();
  };
};

// Request size limits
const requestSizeLimit = (limit = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSize = parseInt(limit.replace('mb', '')) * 1024 * 1024;

    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: limit,
      });
    }
    next();
  };
};

module.exports = {
  securityHeaders,
  rateLimits,
  sanitizeInput,
  auditLogger,
  httpsOnly,
  validateContentType,
  requestSizeLimit,
};
