/**
 * Secure AI Query Middleware
 * Provides multi-layer security for AI-powered database queries
 */

const { getSupabaseClient } = require('../config/supabase');
const rateLimit = require('express-rate-limit');

// Rate limiting for AI queries per user
const aiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 AI queries per minute
  message: {
    error: 'Too many AI queries',
    message:
      'You have exceeded the AI query limit. Please wait before making more requests.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default IP-based rate limiting with proper IPv6 support
  skip: req => {
    // Skip rate limiting for health checks
    return req.path.includes('/health');
  },
});

// Validate user-shop relationship at request level
async function validateUserShopAccess(req, res, next) {
  try {
    const { shopId, userId } = req.user || {};

    if (!userId || !shopId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Valid user authentication is required for AI queries.',
      });
    }

    // Skip database validation for development users
    if (process.env.NODE_ENV === 'development' && userId === 'dev-user-123') {
      console.log('🔧 Bypassing user-shop validation for development user');
      const devShopId = process.env.DEV_SHOP_ID;
      if (!devShopId) {
        console.error(
          '❌ DEV_SHOP_ID environment variable is required for development AI queries'
        );
        return res
          .status(500)
          .json({ error: 'Development configuration missing' });
      }
      req.secureUser = {
        userId: userId,
        shopId: devShopId,
        role: req.user.role || 'owner',
      };
      return next();
    }

    // Double-check user-shop relationship in database
    const supabase = getSupabaseClient(false);
    const { data: user, error } = await supabase
      .from('users')
      .select('shop_id, role, deleted_at')
      .eq('id', userId)
      .eq('shop_id', shopId)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      console.error(
        `🚨 Security violation: User ${userId} attempted access to shop ${shopId}`
      );

      // Log security violation
      await logSecurityViolation(
        userId,
        shopId,
        'ai_query',
        'unauthorized_shop_access',
        {
          endpoint: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        }
      );

      return res.status(403).json({
        error: 'Access denied',
        message: "You do not have permission to access this shop's data.",
      });
    }

    // Add user details to request for downstream use
    req.secureUser = {
      userId: user.id || userId,
      shopId: user.shop_id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('❌ User-shop validation error:', error);
    res.status(500).json({
      error: 'Security validation failed',
      message: 'Unable to validate your access permissions.',
    });
  }
}

// Sanitize and validate AI query input
function validateQueryInput(req, res, next) {
  const { query, context = {} } = req.body;

  // Basic query validation
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      error: 'Invalid query',
      message: 'Query must be a non-empty string.',
    });
  }

  // Query length validation
  if (query.length > 1000) {
    return res.status(400).json({
      error: 'Query too long',
      message: 'Query must be less than 1000 characters.',
    });
  }

  // Sanitize query - remove potential injection attempts
  const sanitizedQuery = query
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\b(drop|delete|truncate|alter|create)\s+\w+/i,
    /union\s+select/i,
    /;\s*(drop|delete|truncate)/i,
    /<script/i,
    /javascript:/i,
  ];

  const hasSuspiciousContent = suspiciousPatterns.some(pattern =>
    pattern.test(query)
  );

  if (hasSuspiciousContent) {
    console.error(
      `🚨 Suspicious AI query detected from user ${req.user?.userId}: "${query}"`
    );

    // Log security violation
    logSecurityViolation(
      req.user?.userId,
      req.user?.shopId,
      'ai_query',
      'suspicious_content',
      { query, sanitizedQuery }
    );

    return res.status(400).json({
      error: 'Invalid query content',
      message: 'Query contains potentially unsafe content.',
    });
  }

  // Update request with sanitized data
  req.body.query = sanitizedQuery;
  req.body.context = {
    ...context,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  };

  next();
}

// Audit logging for AI queries
function auditAIQuery(req, res, next) {
  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function (data) {
    const duration = Date.now() - startTime;

    // Log successful AI query
    logAIQuery({
      userId: req.secureUser?.userId,
      shopId: req.secureUser?.shopId,
      query: req.body.query,
      duration,
      success: res.statusCode < 400,
      statusCode: res.statusCode,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    originalSend.call(this, data);
  };

  next();
}

// Security violation logging
async function logSecurityViolation(
  userId,
  shopId,
  actionType,
  violationType,
  details = {}
) {
  try {
    const supabaseAdmin = getSupabaseClient(true);

    await supabaseAdmin.from('security_audit_log').insert({
      user_id: userId,
      attempted_shop_id: shopId,
      table_name: 'ai_query',
      action_type: `${actionType}_${violationType}`,
      details: {
        violation_type: violationType,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Failed to log security violation:', error);
  }
}

// AI query audit logging
async function logAIQuery(queryData) {
  try {
    const supabaseAdmin = getSupabaseClient(true);

    await supabaseAdmin.from('ai_query_audit').insert({
      user_id: queryData.userId,
      shop_id: queryData.shopId,
      query: queryData.query,
      duration_ms: queryData.duration,
      success: queryData.success,
      status_code: queryData.statusCode,
      ip_address: queryData.ip,
      user_agent: queryData.userAgent,
      created_at: queryData.timestamp,
    });
  } catch (error) {
    console.error('❌ Failed to log AI query:', error);
  }
}

// Create audit table if it doesn't exist (to be run in Supabase)
const createAuditTable = `
CREATE TABLE IF NOT EXISTS public.ai_query_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  shop_id UUID REFERENCES public.shops(id),
  query TEXT NOT NULL,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  status_code INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_user_time 
ON public.ai_query_audit(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_audit_shop_time 
ON public.ai_query_audit(shop_id, created_at DESC);

ALTER TABLE public.ai_query_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI audit logs viewable by shop members" ON public.ai_query_audit
    FOR SELECT USING (user_belongs_to_shop(shop_id));
`;

module.exports = {
  aiRateLimit,
  validateUserShopAccess,
  validateQueryInput,
  auditAIQuery,
  logSecurityViolation,
  logAIQuery,
  createAuditTable,
};
