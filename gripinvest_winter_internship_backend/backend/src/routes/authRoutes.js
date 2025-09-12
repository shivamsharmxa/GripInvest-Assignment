const express = require('express');
const joi = require('joi');
const authController = require('../controllers/authController');
const { 
  authRateLimit, 
  loginRateLimit, 
  verifyToken, 
  securityHeaders,
  logAuthActivity 
} = require('../middleware/auth');
const { HTTP_STATUS, RISK_LEVELS, REGEX_PATTERNS } = require('../utils/constants');
const { ApiResponse, ErrorHandler } = require('../utils/helpers');

const router = express.Router();

// Apply security headers and auth activity logging to all routes
router.use(securityHeaders);
router.use(logAuthActivity);

/**
 * Input validation schemas using Joi
 */
const validationSchemas = {
  // User registration validation
  signup: joi.object({
    firstName: joi.string()
      .min(2)
      .max(50)
      .pattern(REGEX_PATTERNS.NAME)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name must not exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces'
      }),
    
    lastName: joi.string()
      .min(2)
      .max(50)
      .pattern(REGEX_PATTERNS.NAME)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name must not exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces'
      }),
    
    email: joi.string()
      .email()
      .max(255)
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email must not exceed 255 characters'
      }),
    
    password: joi.string()
      .min(8)
      .max(128)
      .pattern(REGEX_PATTERNS.STRONG_PASSWORD)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
      }),
    
    phone: joi.string()
      .pattern(REGEX_PATTERNS.PHONE)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    dateOfBirth: joi.date()
      .max('now')
      .min('1900-01-01')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future',
        'date.min': 'Please provide a valid date of birth'
      }),
    
    riskAppetite: joi.string()
      .valid(...Object.values(RISK_LEVELS))
      .default('moderate')
      .messages({
        'any.only': 'Risk appetite must be low, moderate, or high'
      })
  }),

  // User login validation
  login: joi.object({
    email: joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
      }),
    
    password: joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  // Forgot password validation
  forgotPassword: joi.object({
    email: joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
      })
  }),

  // Reset password validation
  resetPassword: joi.object({
    token: joi.string()
      .required()
      .messages({
        'string.empty': 'Reset token is required'
      }),
    
    otp: joi.string()
      .length(6)
      .pattern(/^\d+$/)
      .required()
      .messages({
        'string.empty': 'OTP is required',
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only numbers'
      }),
    
    newPassword: joi.string()
      .min(8)
      .max(128)
      .pattern(REGEX_PATTERNS.STRONG_PASSWORD)
      .required()
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
      }),
    
    confirmPassword: joi.string()
      .valid(joi.ref('newPassword'))
      .optional()
      .messages({
        'any.only': 'Passwords do not match'
      })
  }),

  // Profile update validation
  updateProfile: joi.object({
    firstName: joi.string()
      .min(2)
      .max(50)
      .pattern(REGEX_PATTERNS.NAME)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name must not exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces'
      }),
    
    lastName: joi.string()
      .min(2)
      .max(50)
      .pattern(REGEX_PATTERNS.NAME)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name must not exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces'
      }),
    
    phone: joi.string()
      .pattern(REGEX_PATTERNS.PHONE)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    dateOfBirth: joi.date()
      .max('now')
      .min('1900-01-01')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future',
        'date.min': 'Please provide a valid date of birth'
      }),
    
    riskAppetite: joi.string()
      .valid(...Object.values(RISK_LEVELS))
      .optional()
      .messages({
        'any.only': 'Risk appetite must be low, moderate, or high'
      }),

    preferences: joi.object({
      notifications: joi.object({
        email: joi.boolean().optional(),
        sms: joi.boolean().optional(),
        marketing: joi.boolean().optional()
      }).optional(),
      ui: joi.object({
        theme: joi.string().valid('light', 'dark', 'auto').optional(),
        language: joi.string().max(5).optional()
      }).optional()
    }).optional()
  }),

  // Email verification validation
  verifyEmail: joi.object({
    token: joi.string()
      .required()
      .messages({
        'string.empty': 'Verification token is required'
      })
  }),

  // Password analysis validation
  analyzePassword: joi.object({
    password: joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required for analysis'
      }),
    
    userContext: joi.object({
      firstName: joi.string().optional(),
      email: joi.string().email().optional()
    }).optional()
  }),

  // Change password validation
  changePassword: joi.object({
    currentPassword: joi.string()
      .required()
      .messages({
        'string.empty': 'Current password is required'
      }),
    
    newPassword: joi.string()
      .min(8)
      .max(128)
      .pattern(REGEX_PATTERNS.STRONG_PASSWORD)
      .required()
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
      }),
    
    confirmPassword: joi.string()
      .valid(joi.ref('newPassword'))
      .optional()
      .messages({
        'any.only': 'Passwords do not match'
      })
  }),

  // Refresh token validation
  refreshToken: joi.object({
    refreshToken: joi.string()
      .optional() // Can be in header or body
  })
};

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      const response = ApiResponse.error(
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        validationErrors
      );

      return res.status(response.statusCode).json(response);
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Authentication Routes Documentation
 */
router.get('/', (_req, res) => {
  const response = ApiResponse.success('Authentication API v1.0.0', {
    version: '1.0.0',
    description: 'Grip Invest Authentication API with AI-powered security features',
    endpoints: {
      'POST /signup': {
        description: 'Register a new user account',
        authentication: false,
        rateLimit: '10 requests per 15 minutes per IP',
        features: ['Email verification', 'Password strength validation', 'Risk assessment']
      },
      'POST /login': {
        description: 'Authenticate user and get access tokens',
        authentication: false,
        rateLimit: '5 failed attempts per email per 15 minutes',
        features: ['JWT tokens', 'Session management', 'Behavioral analysis']
      },
      'POST /forgot-password': {
        description: 'Initiate password reset process',
        authentication: false,
        rateLimit: '10 requests per 15 minutes per IP',
        features: ['Email with OTP', 'Security logging']
      },
      'POST /reset-password': {
        description: 'Complete password reset with token and OTP',
        authentication: false,
        features: ['Token validation', 'Session invalidation']
      },
      'GET /profile': {
        description: 'Get authenticated user profile',
        authentication: true,
        features: ['Portfolio summary', 'Preferences', 'Statistics']
      },
      'PUT /profile': {
        description: 'Update user profile and preferences',
        authentication: true,
        features: ['Risk appetite update', 'Notification preferences']
      },
      'POST /logout': {
        description: 'Logout and invalidate sessions',
        authentication: true,
        features: ['Session cleanup', 'Security logging']
      },
      'POST /verify-email': {
        description: 'Verify email address with token',
        authentication: false,
        features: ['Email confirmation', 'Account activation']
      },
      'POST /refresh-token': {
        description: 'Refresh access token using refresh token',
        authentication: false,
        features: ['Token rotation', 'Session validation']
      },
      'POST /analyze-password': {
        description: 'AI-powered password strength analysis',
        authentication: false,
        rateLimit: '20 requests per minute per IP',
        features: ['AI analysis', 'Strength scoring', 'Improvement suggestions']
      },
      'GET /security-recommendations': {
        description: 'Get personalized security recommendations',
        authentication: true,
        features: ['AI-powered recommendations', 'Risk assessment', 'Best practices']
      },
      'GET /risk-analysis': {
        description: 'Get user behavior risk analysis',
        authentication: true,
        features: ['Behavioral analysis', 'Fraud detection', 'Activity monitoring']
      },
      'POST /change-password': {
        description: 'Change password for authenticated user',
        authentication: true,
        features: ['Current password verification', 'Session invalidation']
      },
      'GET /sessions': {
        description: 'Get active user sessions',
        authentication: true,
        features: ['Session management', 'Device tracking']
      },
      'DELETE /sessions/:sessionId': {
        description: 'Revoke specific session',
        authentication: true,
        features: ['Remote logout', 'Session control']
      }
    },
    securityFeatures: [
      'Rate limiting',
      'Input validation',
      'JWT tokens',
      'AI-powered password analysis',
      'Behavioral risk analysis',
      'Session management',
      'Email verification',
      'Security recommendations'
    ]
  });

  res.status(response.statusCode).json(response);
});

// Public routes (no authentication required)
router.post('/signup', 
  authRateLimit,
  validateInput(validationSchemas.signup),
  ErrorHandler.asyncHandler(authController.signup)
);

router.post('/login', 
  authRateLimit,
  loginRateLimit,
  validateInput(validationSchemas.login),
  ErrorHandler.asyncHandler(authController.login)
);

router.post('/forgot-password', 
  authRateLimit,
  validateInput(validationSchemas.forgotPassword),
  ErrorHandler.asyncHandler(authController.forgotPassword)
);

router.post('/reset-password', 
  authRateLimit,
  validateInput(validationSchemas.resetPassword),
  ErrorHandler.asyncHandler(authController.resetPassword)
);

router.post('/verify-email', 
  authRateLimit,
  validateInput(validationSchemas.verifyEmail),
  ErrorHandler.asyncHandler(authController.verifyEmail)
);

router.post('/refresh-token', 
  authRateLimit,
  validateInput(validationSchemas.refreshToken),
  ErrorHandler.asyncHandler(authController.refreshToken)
);

// AI-powered features (public)
router.post('/analyze-password', 
  authRateLimit,
  validateInput(validationSchemas.analyzePassword),
  ErrorHandler.asyncHandler(authController.analyzePassword)
);

// Protected routes (authentication required)
router.get('/profile', 
  verifyToken,
  ErrorHandler.asyncHandler(authController.getProfile)
);

router.put('/profile', 
  verifyToken,
  validateInput(validationSchemas.updateProfile),
  ErrorHandler.asyncHandler(authController.updateProfile)
);

router.post('/logout', 
  verifyToken,
  ErrorHandler.asyncHandler(authController.logout)
);

router.get('/security-recommendations', 
  verifyToken,
  ErrorHandler.asyncHandler(authController.getSecurityRecommendations)
);

router.get('/risk-analysis', 
  verifyToken,
  ErrorHandler.asyncHandler(authController.getRiskAnalysis)
);

router.post('/change-password', 
  verifyToken,
  validateInput(validationSchemas.changePassword),
  ErrorHandler.asyncHandler(authController.changePassword)
);

router.get('/sessions', 
  verifyToken,
  ErrorHandler.asyncHandler(authController.getSessions)
);

router.delete('/sessions/:sessionId', 
  verifyToken,
  ErrorHandler.asyncHandler(authController.revokeSession)
);

// Health check for authentication service
router.get('/health', (_req, res) => {
  const response = ApiResponse.success('Authentication service is healthy', {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'Connected',
      aiService: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY ? 'Available' : 'Disabled',
      emailService: process.env.SMTP_HOST ? 'Configured' : 'Disabled'
    },
    features: {
      rateLimiting: 'Active',
      inputValidation: 'Active',
      jwtTokens: 'Active',
      aiPasswordAnalysis: 'Active',
      behaviorAnalysis: 'Active',
      sessionManagement: 'Active'
    }
  });

  res.status(response.statusCode).json(response);
});

// Error handling for undefined routes
router.use('*', (req, res) => {
  const response = ApiResponse.error(
    `Authentication endpoint not found: ${req.method} ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND
  );
  res.status(response.statusCode).json(response);
});

module.exports = router;