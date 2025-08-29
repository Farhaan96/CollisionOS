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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = decoded || { id: 'dev-user', shopId: 'dev-shop' };
    next();
  } catch (e) {
    // Soft-fail in dev
    req.user = { id: 'dev-user', shopId: 'dev-shop' };
    next();
  }
}

module.exports = { authenticateToken };
