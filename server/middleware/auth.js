const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      // Allow unauthenticated in development for now
      req.user = { id: 'dev-user', shopId: '00000000-0000-4000-8000-000000000001' };
      return next();
    }

    // Validate token format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid JWT format: token does not have 3 segments');
      if (process.env.NODE_ENV === 'development') {
        req.user = { id: 'dev-user', shopId: '00000000-0000-4000-8000-000000000001' };
        return next();
      }
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'collisionos_super_secret_jwt_key_2024_make_it_long_and_random_for_production';
    
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded || { id: 'dev-user', shopId: 'dev-shop' };
    next();
  } catch (e) {
    console.warn('JWT verification failed:', e.message);
    // Soft-fail in dev
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'dev-user', shopId: 'dev-shop' };
      return next();
    }
    
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: e.message 
    });
  }
}

module.exports = { authenticateToken };
