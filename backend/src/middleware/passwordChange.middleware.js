const jwt = require('jsonwebtoken');

/**
 * Middleware to check if user needs to change password
 * Blocks access to all routes except password change endpoint
 */
const requirePasswordChange = (req, res, next) => {
  // Skip password change check for:
  // 1. Password change endpoint
  // 2. Logout endpoint (allow users to logout)
  // 3. Health endpoints
  // 4. Login/refresh endpoints
  const allowedPaths = ['/api/auth/password', '/api/auth/logout', '/api/health'];
  const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));

  if (isAllowedPath) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Let auth middleware handle missing tokens
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user requires password change
    if (decoded.requiresPasswordChange) {
      return res.status(423).json({
        error: 'Password change required',
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must change your password before accessing this resource',
        requiresPasswordChange: true
      });
    }

    next();
  } catch (error) {
    // Token is invalid, let auth middleware handle it
    next();
  }
};

module.exports = { requirePasswordChange };
