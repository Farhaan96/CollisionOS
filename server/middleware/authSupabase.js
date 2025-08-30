const jwt = require('jsonwebtoken');
const { getSupabaseClient, isSupabaseEnabled } = require('../config/supabase');
const { User } = require('../database/models'); // Fallback for legacy mode

// Enhanced authentication middleware that supports both Supabase and legacy JWT
const authenticateToken = (options = {}) => {
  const { required = true, roles = [] } = options;
  
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      // Handle missing token
      if (!token) {
        if (process.env.NODE_ENV === 'development' && !required) {
          req.user = { id: 'dev-user', shopId: 'dev-shop', role: 'admin' };
          return next();
        }
        
        if (required) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Access token is missing'
          });
        }
        
        return next();
      }

      let user = null;

      // Try Supabase authentication first if enabled
      if (isSupabaseEnabled) {
        try {
          user = await authenticateWithSupabase(token);
        } catch (supabaseError) {
          console.log('Supabase auth failed, trying legacy auth:', supabaseError.message);
        }
      }

      // Handle development token
      if (!user && process.env.NODE_ENV === 'development' && token === 'dev-token') {
        const devShopId = process.env.DEV_SHOP_ID;
        const devUserId = process.env.DEV_USER_ID || 'dev-user-123';
        
        if (!devShopId) {
          console.error('❌ DEV_SHOP_ID environment variable is required for development authentication');
          console.error('Please set DEV_SHOP_ID in your .env.local file');
        }
        
        user = {
          userId: devUserId,
          shopId: devShopId,
          role: 'owner',
          firstName: 'Admin',
          email: 'admin@dev.com',
          is_active: true
        };
        console.log('🔧 Using development token for AI authentication');
      }

      // Fallback to legacy JWT authentication
      if (!user) {
        try {
          user = await authenticateWithLegacyJWT(token);
        } catch (legacyError) {
          return res.status(401).json({
            error: 'Invalid token',
            message: 'Access token is invalid or expired',
            details: legacyError.message
          });
        }
      }

      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: 'User associated with token does not exist'
        });
      }

      // Check if user is active
      if (user.is_active === false || user.isActive === false) {
        return res.status(401).json({
          error: 'Account disabled',
          message: 'User account has been disabled'
        });
      }

      // Role-based authorization
      const userRole = user.role || user.user_metadata?.role;
      if (roles.length > 0 && !roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${roles.join(', ')}`,
          userRole: userRole
        });
      }

      // Normalize user data for consistent API
      req.user = normalizeUserData(user);
      next();

    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        message: 'Internal authentication error'
      });
    }
  };
};

/**
 * Authenticate using Supabase
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User object
 */
const authenticateWithSupabase = async (token) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase not available');
  }

  // Set the auth token
  await supabase.auth.setSession({
    access_token: token,
    refresh_token: null // We don't need refresh token for server-side validation
  });

  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error) {
    throw new Error(`Supabase auth error: ${error.message}`);
  }

  if (!user) {
    throw new Error('No user found for token');
  }

  // Get additional user profile data from our custom table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.warn('Could not fetch user profile from Supabase:', profileError.message);
  }

  // Merge Supabase user with profile data
  return {
    ...user,
    ...profile,
    // Ensure consistent field names
    userId: user.id,
    shopId: profile?.shop_id || user.user_metadata?.shop_id,
    role: profile?.role || user.user_metadata?.role || 'user',
    is_active: profile?.is_active !== false
  };
};

/**
 * Authenticate using legacy JWT system
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User object
 */
const authenticateWithLegacyJWT = async (token) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'collisionos_super_secret_jwt_key_2024_make_it_long_and_random_for_production';
  
  // Verify JWT token
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'CollisionOS',
      audience: 'CollisionOS-API'
    });
  } catch (tokenError) {
    if (tokenError.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (tokenError.name === 'JsonWebTokenError') {
      throw new Error('Invalid token format');
    }
    throw tokenError;
  }

  // Get user from database
  const user = await User.findByPk(decoded.userId, {
    attributes: ['id', 'username', 'email', 'role', 'isActive', 'shopId', 'department', 'firstName', 'lastName']
  });

  if (!user) {
    throw new Error('User not found in database');
  }

  return {
    ...user.toJSON(),
    userId: user.id
  };
};

/**
 * Normalize user data to consistent format
 * @param {Object} user - User object from any auth system
 * @returns {Object} Normalized user object
 */
const normalizeUserData = (user) => {
  return {
    id: user.id || user.userId,
    userId: user.id || user.userId,
    email: user.email,
    username: user.username || user.user_metadata?.username,
    firstName: user.firstName || user.first_name || user.user_metadata?.first_name,
    lastName: user.lastName || user.last_name || user.user_metadata?.last_name,
    role: user.role || user.user_metadata?.role || 'user',
    shopId: user.shopId || user.shop_id || user.user_metadata?.shop_id,
    department: user.department || user.user_metadata?.department,
    isActive: user.isActive !== false && user.is_active !== false
  };
};

/**
 * Supabase-compatible login function
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Auth result
 */
const loginWithSupabase = async (email, password) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase not available');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  return {
    user: normalizeUserData(data.user),
    session: data.session,
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token
  };
};

/**
 * Supabase-compatible logout function
 */
const logoutWithSupabase = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase not available');
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
};

/**
 * Register new user with Supabase
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
const registerWithSupabase = async (userData) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase not available');
  }

  const { email, password, username, firstName, lastName, role = 'user', shopId } = userData;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name: firstName,
        last_name: lastName,
        role,
        shop_id: shopId
      }
    }
  });

  if (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }

  return {
    user: normalizeUserData(data.user),
    session: data.session
  };
};

// Convenience middlewares for different auth levels
const requireAdmin = authenticateToken({ required: true, roles: ['admin'] });
const requireManager = authenticateToken({ required: true, roles: ['admin', 'manager'] });
const optionalAuth = authenticateToken({ required: false });

module.exports = {
  authenticateToken,
  requireAdmin,
  requireManager,
  optionalAuth,
  loginWithSupabase,
  logoutWithSupabase,
  registerWithSupabase,
  normalizeUserData
};