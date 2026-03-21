const jwt = require('jsonwebtoken');
const cacheService = require('../services/cache.service');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access token required', 
        code: 'MISSING_TOKEN' 
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user session is active in Redis
      const sessionKey = `session:${decoded.userId}`;
      const userSession = await cacheService.get(sessionKey);
      
      if (userSession === null) {
        return res.status(401).json({ 
          error: 'Session expired or revoked', 
          code: 'SESSION_NOT_FOUND' 
        });
      }

      req.user = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Invalid token', 
        code: 'INVALID_TOKEN' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error', 
      code: 'AUTH_ERROR' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        code: 'AUTH_REQUIRED' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        code: 'INSUFFICIENT_PERMISSIONS' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sessionKey = `session:${decoded.userId}`;
      const userSession = await cacheService.get(sessionKey);
      
      if (userSession !== null) {
        req.user = decoded;
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = { authMiddleware, requireRole, optionalAuth };
