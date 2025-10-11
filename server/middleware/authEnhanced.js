const jwt = require('jsonwebtoken');
const { User } = require('../database/models');

// JWT Secret from environment variables - NO FALLBACKS IN PRODUCTION
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validate required environment variables
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateAccessToken = payload => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'CollisionOS',
    audience: 'CollisionOS-API',
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = payload => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'CollisionOS',
    audience: 'CollisionOS-API',
  });
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = token => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'CollisionOS',
    audience: 'CollisionOS-API',
  });
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = token => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'CollisionOS',
    audience: 'CollisionOS-API',
  });
};

/**
 * Enhanced authentication middleware
 * @param {Object} options - Authentication options
 * @param {boolean} options.required - Whether authentication is required
 * @param {Array<string>} options.roles - Required user roles
 * @returns {Function} Express middleware function
 */
const authenticateToken = (options = {}) => {
  const { required = true, roles = [] } = options;

  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token =
        authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : null;

      // Handle missing token
      if (!token) {
        if (process.env.NODE_ENV === 'development' && !required) {
          // Allow unauthenticated access in development for optional routes
          req.user = { id: 'dev-user', shopId: '00000000-0000-4000-8000-000000000001', role: 'admin' };
          return next();
        }

        if (required) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Access token is missing',
          });
        }

        return next();
      }

      // Handle dev-token in development mode
      if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
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

      // Verify and decode token
      let decoded;
      try {
        // Check if token has proper format (should have 3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Token contains an invalid number of segments');
        }

        decoded = verifyAccessToken(token);
      } catch (tokenError) {
        console.warn(`Authentication failed: ${tokenError.message}`, {
          token: token.substring(0, 20) + '...',
          error: tokenError.name
        });

        // In development with optional auth, allow invalid tokens to pass through
        if (process.env.NODE_ENV === 'development' && !required) {
          console.log('Development mode: allowing invalid token to pass through');
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

        if (tokenError.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Token expired',
            message: 'Access token has expired',
            expiredAt: tokenError.expiredAt,
          });
        }

        if (tokenError.name === 'JsonWebTokenError' || tokenError.message.includes('invalid number of segments')) {
          return res.status(401).json({
            error: 'Invalid token',
            message: 'Access token is malformed or invalid',
          });
        }

        console.error('Unexpected token error:', tokenError);
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Token validation failed',
        });
      }

      // Validate user exists and is active
      const user = await User.findByPk(decoded.userId, {
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
        return res.status(401).json({
          error: 'User not found',
          message: 'User associated with token does not exist',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account disabled',
          message: 'User account has been disabled',
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
        tokenIat: decoded.iat,
        tokenExp: decoded.exp,
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
 * Refresh token endpoint middleware
 */
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Refresh token is missing from request body',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Refresh token expired',
          message: 'Please log in again',
        });
      }

      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid',
      });
    }

    // Validate user still exists and is active
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'shopId'],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or disabled',
        message: 'Please log in again',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      shopId: user.shopId,
    });

    // Optionally generate new refresh token for token rotation
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      shopId: user.shopId,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error',
    });
  }
};

/**
 * Multi-factor authentication middleware (placeholder for future implementation)
 */
const requireMFA = (req, res, next) => {
  // TODO: Implement MFA verification
  // For now, just pass through
  next();
};

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
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenHandler,
  requireMFA,
  authRateLimit,
};
