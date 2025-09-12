const jwt = require('jsonwebtoken');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { databaseConfig } = require('../config/database');
const { 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  USER_ROLES,
  API_RATE_LIMITS 
} = require('../utils/constants');
const { ApiResponse, AuthHelper } = require('../utils/helpers');

/**
 * Rate limiter for authentication endpoints
 */
const authRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: API_RATE_LIMITS.AUTH.max,
  duration: API_RATE_LIMITS.AUTH.windowMs / 1000,
  blockDuration: 15 * 60, // Block for 15 minutes after exceeding limit
});

/**
 * Rate limiter for failed login attempts per email
 */
const loginAttemptLimiter = new RateLimiterMemory({
  keyGenerator: (req) => `login_${req.body.email}`,
  points: 5, // Allow 5 failed attempts
  duration: 15 * 60, // Per 15 minutes
  blockDuration: 30 * 60, // Block for 30 minutes after exceeding
});

/**
 * Authentication rate limiting middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authRateLimit = async (req, res, next) => {
  try {
    await authRateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const response = ApiResponse.error(
      'Too many authentication requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
    return res.status(response.statusCode).json(response);
  }
};

/**
 * Login attempt rate limiting middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const loginRateLimit = async (req, res, next) => {
  if (!req.body.email) {
    return next();
  }

  try {
    await loginAttemptLimiter.consume(`login_${req.body.email}`);
    next();
  } catch (rejRes) {
    const response = ApiResponse.error(
      'Too many failed login attempts. Account temporarily locked.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
    return res.status(response.statusCode).json(response);
  }
};

/**
 * JWT token verification middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = ApiResponse.error(
        ERROR_MESSAGES.ACCESS_DENIED,
        HTTP_STATUS.UNAUTHORIZED
      );
      return res.status(response.statusCode).json(response);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = AuthHelper.verifyToken(token, 'access');
    
    // Check if user still exists and is active
    const userQuery = `
      SELECT id, first_name, last_name, email, risk_appetite, 
             is_active, email_verified
      FROM users 
      WHERE id = ? AND is_active = TRUE
    `;
    
    const users = await databaseConfig.executeQuery(userQuery, [decoded.userId]);
    
    if (users.length === 0) {
      const response = ApiResponse.error(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED
      );
      return res.status(response.statusCode).json(response);
    }

    const user = users[0];
    
    // Check if email is verified for sensitive operations (disabled for demo)
    // if (!user.email_verified && req.method !== 'GET') {
    //   const response = ApiResponse.error(
    //     ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
    //     HTTP_STATUS.FORBIDDEN
    //   );
    //   return res.status(response.statusCode).json(response);
    // }

    // Attach user to request object
    req.user = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      riskAppetite: user.risk_appetite,
      isActive: user.is_active,
      emailVerified: user.email_verified
    };

    // Update last activity timestamp (skipped for demo)
    // const updateActivityQuery = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    // await databaseConfig.executeQuery(updateActivityQuery, [user.id]);

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    let response;
    if (error.message.includes('expired')) {
      response = ApiResponse.error(
        'Token expired. Please login again.',
        HTTP_STATUS.UNAUTHORIZED
      );
    } else {
      response = ApiResponse.error(
        ERROR_MESSAGES.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    return res.status(response.statusCode).json(response);
  }
};

/**
 * Admin role verification middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      const response = ApiResponse.error(
        ERROR_MESSAGES.ACCESS_DENIED,
        HTTP_STATUS.UNAUTHORIZED
      );
      return res.status(response.statusCode).json(response);
    }

    // Check if user has admin privileges
    const adminQuery = `
      SELECT role FROM users 
      WHERE id = ? AND role = 'admin' AND is_active = TRUE
    `;
    
    const adminUsers = await databaseConfig.executeQuery(adminQuery, [req.user.id]);
    
    if (adminUsers.length === 0) {
      const response = ApiResponse.error(
        'Admin access required',
        HTTP_STATUS.FORBIDDEN
      );
      return res.status(response.statusCode).json(response);
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error.message);
    const response = ApiResponse.error(
      ERROR_MESSAGES.SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
    return res.status(response.statusCode).json(response);
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    const token = authHeader.substring(7);
    const decoded = AuthHelper.verifyToken(token, 'access');
    
    const userQuery = `
      SELECT id, first_name, last_name, email, risk_appetite, 
             is_active, email_verified
      FROM users 
      WHERE id = ? AND is_active = TRUE
    `;
    
    const users = await databaseConfig.executeQuery(userQuery, [decoded.userId]);
    
    if (users.length > 0) {
      const user = users[0];
      req.user = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        riskAppetite: user.risk_appetite,
        isActive: user.is_active,
        emailVerified: user.email_verified
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    next();
  }
};

/**
 * Session validation middleware - checks if refresh token is still valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const refreshToken = req.headers['x-refresh-token'];
    if (refreshToken) {
      // Verify refresh token exists and is active
      const sessionQuery = `
        SELECT id FROM user_sessions 
        WHERE user_id = ? AND refresh_token = ? 
        AND expires_at > NOW() AND is_active = TRUE
      `;
      
      const sessions = await databaseConfig.executeQuery(
        sessionQuery, 
        [req.user.id, refreshToken]
      );
      
      if (sessions.length === 0) {
        const response = ApiResponse.error(
          'Invalid session. Please login again.',
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }
    }

    next();
  } catch (error) {
    console.error('Session validation error:', error.message);
    const response = ApiResponse.error(
      ERROR_MESSAGES.SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
    return res.status(response.statusCode).json(response);
  }
};

/**
 * Security headers middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * CSRF protection middleware for state-changing operations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }

  // Check for CSRF token in custom header
  const csrfToken = req.headers['x-csrf-token'];
  const expectedToken = req.session?.csrfToken;
  
  if (!csrfToken || csrfToken !== expectedToken) {
    // For now, just log the attempt - in production you might want to reject
    console.warn('CSRF token mismatch:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
  }

  next();
};

/**
 * Activity logging middleware for authentication events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logAuthActivity = (req, res, next) => {
  // Store original send method
  const originalSend = res.send;
  
  res.send = function(body) {
    // Log authentication events
    if (req.originalUrl.includes('/auth/')) {
      const activityLog = {
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        userId: req.user?.id || null
      };
      
      // In production, you might want to store these in a separate audit table
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Auth Activity:', activityLog);
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = {
  authRateLimit,
  loginRateLimit,
  verifyToken,
  requireAdmin,
  optionalAuth,
  validateSession,
  securityHeaders,
  csrfProtection,
  logAuthActivity
};