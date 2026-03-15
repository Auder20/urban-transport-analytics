const rateLimit = require('express-rate-limit');
const cacheService = require('../services/cache.service');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for health checks and internal requests
    return req.path === '/health' || req.path.startsWith('/internal/');
  }
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// GPS data rate limiting (higher limit for real-time data)
const gpsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 GPS requests per minute
  message: {
    error: 'GPS update rate limit exceeded',
    code: 'GPS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Analytics rate limiting
const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 analytics requests per windowMs
  message: {
    error: 'Analytics rate limit exceeded',
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Custom rate limiter using Redis for distributed environments
const createRedisRateLimiter = (windowMs, max, identifier = 'ip') => {
  return async (req, res, next) => {
    try {
      const key = `rate_limit:${identifier}:${req.ip || req.connection.remoteAddress}`;
      const current = await cacheService.get(key) || { count: 0, resetTime: Date.now() + windowMs };
      
      if (Date.now() > current.resetTime) {
        current.count = 0;
        current.resetTime = Date.now() + windowMs;
      }
      
      current.count++;
      
      if (current.count > max) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          code: 'REDIS_RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((current.resetTime - Date.now()) / 1000)
        });
      }
      
      await cacheService.set(key, current, Math.ceil(windowMs / 1000));
      
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - current.count),
        'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
      });
      
      next();
    } catch (error) {
      console.error('Redis rate limiter error:', error);
      // Fallback to allowing the request if Redis is down
      next();
    }
  };
};

module.exports = {
  generalLimiter,
  authLimiter,
  gpsLimiter,
  analyticsLimiter,
  createRedisRateLimiter
};
