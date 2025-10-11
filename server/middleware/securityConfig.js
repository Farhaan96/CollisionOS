/**
 * Security Configuration for CollisionOS
 * 
 * Centralized security configuration for all routes:
 * - Authentication requirements
 * - Authorization rules
 * - Input validation schemas
 * - Rate limiting configuration
 * - Security headers
 */

const { authenticateToken, requirePermission, requireShopAccess, requireRole } = require('./securityAuth');
const { validate, schemas, rateLimits, sanitizeBody, preventSQLInjection } = require('./securityValidation');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Security configuration for different route types
 */
const securityConfig = {
  // Public routes (no authentication required)
  public: {
    middleware: [
      sanitizeBody,
      preventSQLInjection,
      rateLimits.general
    ]
  },

  // Authenticated routes (require valid JWT)
  authenticated: {
    middleware: [
      sanitizeBody,
      preventSQLInjection,
      authenticateToken,
      requireShopAccess,
      rateLimits.general
    ]
  },

  // Admin routes (require admin role)
  admin: {
    middleware: [
      sanitizeBody,
      preventSQLInjection,
      authenticateToken,
      requireShopAccess,
      requireRole(['owner', 'manager']),
      rateLimits.sensitive
    ]
  },

  // File upload routes
  upload: {
    middleware: [
      sanitizeBody,
      preventSQLInjection,
      authenticateToken,
      requireShopAccess,
      requirePermission(['files:upload']),
      rateLimits.upload
    ]
  },

  // Search routes
  search: {
    middleware: [
      sanitizeBody,
      preventSQLInjection,
      authenticateToken,
      requireShopAccess,
      rateLimits.search
    ]
  },

  // Financial routes (high security)
  financial: {
    middleware: [
      sanitizeBody,
      preventSQLInjection,
      authenticateToken,
      requireShopAccess,
      requireRole(['owner', 'manager']),
      requirePermission(['financial:read', 'financial:write']),
      rateLimits.sensitive
    ]
  }
};

/**
 * Route-specific security requirements
 */
const routeSecurity = {
  // Authentication routes
  '/api/auth/login': 'public',
  '/api/auth/register': 'public',
  '/api/auth/refresh': 'authenticated',
  '/api/auth/logout': 'authenticated',

  // User management
  '/api/users': 'admin',
  '/api/users/:id': 'admin',

  // Customer management
  '/api/customers': 'authenticated',
  '/api/customers/:id': 'authenticated',

  // Vehicle management
  '/api/vehicles': 'authenticated',
  '/api/vehicles/:id': 'authenticated',

  // Repair orders
  '/api/repair-orders': 'authenticated',
  '/api/repair-orders/:id': 'authenticated',
  '/api/repair-orders/search': 'search',

  // Parts management
  '/api/parts': 'authenticated',
  '/api/parts/:id': 'authenticated',

  // Purchase orders
  '/api/purchase-orders': 'authenticated',
  '/api/purchase-orders/:id': 'authenticated',

  // BMS import
  '/api/bms/upload': 'upload',
  '/api/bms/validate': 'upload',
  '/api/bms/batch': 'upload',

  // Financial routes
  '/api/payments': 'financial',
  '/api/invoices': 'financial',
  '/api/expenses': 'financial',

  // Dashboard and analytics
  '/api/dashboard': 'authenticated',
  '/api/analytics': 'authenticated',

  // File uploads
  '/api/attachments': 'upload',
  '/api/documents': 'upload'
};

/**
 * Get security configuration for a route
 */
const getSecurityConfig = (route) => {
  // Find matching route pattern
  for (const [pattern, config] of Object.entries(routeSecurity)) {
    if (route.match(new RegExp(pattern.replace(/:\w+/g, '[^/]+')))) {
      return securityConfig[config] || securityConfig.authenticated;
    }
  }
  
  // Default to authenticated for unknown routes
  return securityConfig.authenticated;
};

/**
 * Apply security middleware to a route
 */
const applySecurity = (route, router) => {
  const config = getSecurityConfig(route);
  
  // Apply all middleware from the configuration
  config.middleware.forEach(middleware => {
    router.use(middleware);
  });
  
  return router;
};

/**
 * Global security middleware
 */
const globalSecurity = [
  // Security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false
  }),

  // CORS configuration
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }),

  // Request size limits
  require('express').json({ limit: '10mb' }),
  require('express').urlencoded({ extended: true, limit: '10mb' }),

  // Basic sanitization
  sanitizeBody,
  preventSQLInjection
];

/**
 * Validation schemas for common operations
 */
const validationSchemas = {
  // User operations
  createUser: schemas.user,
  updateUser: schemas.user.fork(['password'], (schema) => schema.optional()),

  // Repair order operations
  createRepairOrder: schemas.repairOrder,
  updateRepairOrder: schemas.repairOrder.fork(['roNumber'], (schema) => schema.optional()),

  // Customer operations
  createCustomer: schemas.customer,
  updateCustomer: schemas.customer,

  // Vehicle operations
  createVehicle: schemas.vehicle,
  updateVehicle: schemas.vehicle,

  // Parts operations
  createPart: schemas.part,
  updatePart: schemas.part,

  // Search operations
  search: schemas.search,
  pagination: schemas.pagination
};

/**
 * Apply validation to a route
 */
const applyValidation = (route, schema) => {
  return validate(schema);
};

/**
 * Complete security setup for a route
 */
const secureRoute = (route, method, handler, validationSchema = null) => {
  const router = require('express').Router();
  
  // Apply global security
  globalSecurity.forEach(middleware => {
    router.use(middleware);
  });
  
  // Apply route-specific security
  applySecurity(route, router);
  
  // Apply validation if schema provided
  if (validationSchema) {
    router.use(applyValidation(route, validationSchema));
  }
  
  // Add the handler
  router[method.toLowerCase()]('/', handler);
  
  return router;
};

module.exports = {
  securityConfig,
  routeSecurity,
  getSecurityConfig,
  applySecurity,
  globalSecurity,
  validationSchemas,
  applyValidation,
  secureRoute
};
