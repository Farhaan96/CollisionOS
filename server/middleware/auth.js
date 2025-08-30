const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      // Allow unauthenticated in development for now
      req.user = { id: 'dev-user', shopId: 'dev-shop' };
      return next();
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET environment variable is required');
      console.error('Please set JWT_SECRET in your .env.local file');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded || { id: 'dev-user', shopId: 'dev-shop' };
    next();
  } catch (e) {
    // Soft-fail in dev
    req.user = { id: 'dev-user', shopId: 'dev-shop' };
    next();
  }
}

module.exports = { authenticateToken };
