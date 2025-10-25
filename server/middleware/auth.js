const { User } = require('../database/models');

/**
 * Session-based authentication middleware
 * @param {Object} options - Authentication options
 * @param {boolean} options.required - Whether authentication is required
 * @param {Array<string>} options.roles - Required user roles
 * @returns {Function} Express middleware function
 */
const authenticateToken = (options = {}) => {
  const { required = true, roles = [] } = options;

  return async (req, res, next) => {
    try {
      // Check if user is authenticated via session
      if (!req.session || !req.session.userId) {
        // Development mode bypass for optional routes
        if (process.env.NODE_ENV === 'development' && !required) {
          req.user = {
            id: 'dev-user',
            userId: 'dev-user',
            username: 'admin',
            shopId: '00000000-0000-4000-8000-000000000001',
            role: 'admin',
            email: 'admin@collisionos.com',
          };
          return next();
        }

        if (required) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource',
          });
        }

        return next();
      }

      // Validate user exists and is active
      const user = await User.findByPk(req.session.userId, {
        attributes: [
          'id',
          'username',
          'email',
          'role',
          'isActive',
          'shopId',
          'department',
        ],
      });

      if (!user) {
        // Clear invalid session
        req.session.destroy();
        return res.status(401).json({
          error: 'User not found',
          message: 'Session is invalid. Please log in again.',
        });
      }

      if (!user.isActive) {
        // Clear session for disabled user
        req.session.destroy();
        return res.status(401).json({
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.',
        });
      }

      // Role-based authorization
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${roles.join(', ')}`,
          userRole: user.role,
        });
      }

      // Attach user information to request
      req.user = {
        id: user.id,
        userId: user.id, // For backward compatibility
        username: user.username,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
        department: user.department,
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        message: 'Internal authentication error',
      });
    }
  };
};

/**
 * Admin-only authentication middleware
 */
const requireAdmin = authenticateToken({ required: true, roles: ['admin'] });

/**
 * Manager-level authentication middleware (admin or manager)
 */
const requireManager = authenticateToken({
  required: true,
  roles: ['admin', 'manager'],
});

/**
 * Optional authentication middleware
 */
const optionalAuth = authenticateToken({ required: false });

/**
 * Rate limiting for authentication attempts
 */
const authRateLimit = {
  // Track failed attempts by IP
  attempts: new Map(),

  // Check if IP is rate limited
  isRateLimited: ip => {
    const attempts = authRateLimit.attempts.get(ip);
    if (!attempts) return false;

    const { count, lastAttempt } = attempts;
    const now = Date.now();
    const timeDiff = now - lastAttempt;

    // Reset after 15 minutes
    if (timeDiff > 15 * 60 * 1000) {
      authRateLimit.attempts.delete(ip);
      return false;
    }

    // Rate limit after 5 failed attempts
    return count >= 5;
  },

  // Record failed attempt
  recordFailedAttempt: ip => {
    const existing = authRateLimit.attempts.get(ip);
    const now = Date.now();

    if (!existing) {
      authRateLimit.attempts.set(ip, { count: 1, lastAttempt: now });
    } else {
      const timeDiff = now - existing.lastAttempt;

      // Reset count if more than 15 minutes passed
      if (timeDiff > 15 * 60 * 1000) {
        authRateLimit.attempts.set(ip, { count: 1, lastAttempt: now });
      } else {
        authRateLimit.attempts.set(ip, {
          count: existing.count + 1,
          lastAttempt: now,
        });
      }
    }
  },

  // Clear attempts for successful login
  clearAttempts: ip => {
    authRateLimit.attempts.delete(ip);
  },
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireManager,
  optionalAuth,
  authRateLimit,
};
