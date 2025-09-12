const Joi = require('joi');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const { ApiResponse } = require('../utils/helpers');

/**
 * Request Validation Middleware
 * Provides comprehensive input validation for API requests
 */

/**
 * Validate request data using Joi schemas
 * @param {Object} schemas - Object containing validation schemas
 * @param {Object} schemas.body - Body validation schema
 * @param {Object} schemas.query - Query validation schema
 * @param {Object} schemas.params - Parameters validation schema
 * @returns {Function} Express middleware function
 */
function validateRequest(schemas = {}) {
  return (req, res, next) => {
    try {
      const validationErrors = [];

      // Validate request body
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true
        });

        if (error) {
          const bodyErrors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }));
          validationErrors.push(...bodyErrors);
        } else {
          req.body = value; // Use validated/sanitized data
        }
      }

      // Validate query parameters
      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, {
          abortEarly: false,
          allowUnknown: true, // Allow additional query params for flexibility
          stripUnknown: false
        });

        if (error) {
          const queryErrors = error.details.map(detail => ({
            field: `query.${detail.path.join('.')}`,
            message: detail.message,
            value: detail.context?.value
          }));
          validationErrors.push(...queryErrors);
        } else {
          req.query = { ...req.query, ...value }; // Merge validated data
        }
      }

      // Validate URL parameters
      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: true
        });

        if (error) {
          const paramErrors = error.details.map(detail => ({
            field: `params.${detail.path.join('.')}`,
            message: detail.message,
            value: detail.context?.value
          }));
          validationErrors.push(...paramErrors);
        } else {
          req.params = value; // Use validated data
        }
      }

      // If validation errors exist, return error response
      if (validationErrors.length > 0) {
        const response = ApiResponse.error(
          'Request validation failed',
          HTTP_STATUS.BAD_REQUEST,
          validationErrors
        );
        return res.status(response.statusCode).json(response);
      }

      // Continue to next middleware
      next();

    } catch (error) {
      console.error('Validation middleware error:', error);
      const response = ApiResponse.error(
        ERROR_MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
      return res.status(response.statusCode).json(response);
    }
  };
}

/**
 * Common validation schemas for reuse across the application
 */
const CommonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid().required().messages({
    'string.uuid': 'Must be a valid UUID',
    'any.required': 'ID is required'
  }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be a whole number',
      'number.min': 'Page must be at least 1',
      'number.max': 'Page cannot exceed 1000'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
  }),

  // Email validation
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  // Password validation
  password: Joi.string().min(8).max(128).required().pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  ).messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),

  // Name validation
  name: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'string.pattern.base': 'Name can only contain letters and spaces',
    'any.required': 'Name is required'
  }),

  // Phone number validation
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(15).messages({
    'string.pattern.base': 'Please provide a valid phone number',
    'string.min': 'Phone number must be at least 10 digits',
    'string.max': 'Phone number cannot exceed 15 digits'
  }),

  // Amount validation (for financial operations)
  amount: Joi.number().positive().precision(2).max(100000000).required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'number.max': 'Amount cannot exceed ₹10 crores',
    'any.required': 'Amount is required'
  }),

  // Date validation
  date: Joi.date().iso().messages({
    'date.base': 'Must be a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
  }),

  // Search query validation
  searchQuery: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Search query must be at least 2 characters',
    'string.max': 'Search query cannot exceed 100 characters'
  }),

  // Risk appetite validation
  riskAppetite: Joi.string().valid('low', 'moderate', 'high').messages({
    'any.only': 'Risk appetite must be one of: low, moderate, high'
  }),

  // Investment type validation
  investmentType: Joi.string().valid('bond', 'fd', 'mf', 'etf').messages({
    'any.only': 'Investment type must be one of: bond, fd, mf, etf'
  })
};

/**
 * Validate file upload
 * @param {Object} options - Validation options
 * @param {Array} options.allowedMimeTypes - Allowed MIME types
 * @param {Number} options.maxSize - Maximum file size in bytes
 * @param {Boolean} options.required - Whether file is required
 * @returns {Function} Express middleware function
 */
function validateFileUpload(options = {}) {
  const {
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxSize = 5 * 1024 * 1024, // 5MB default
    required = false
  } = options;

  return (req, res, next) => {
    try {
      const file = req.file;

      // Check if file is required
      if (required && !file) {
        const response = ApiResponse.error(
          'File upload is required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // If no file and not required, continue
      if (!file) {
        return next();
      }

      // Validate MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        const response = ApiResponse.error(
          `File type not allowed. Supported types: ${allowedMimeTypes.join(', ')}`,
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Validate file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        const response = ApiResponse.error(
          `File size too large. Maximum size allowed: ${maxSizeMB}MB`,
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      next();

    } catch (error) {
      console.error('File validation error:', error);
      const response = ApiResponse.error(
        ERROR_MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
      return res.status(response.statusCode).json(response);
    }
  };
}

/**
 * Sanitize request data to prevent XSS attacks
 * @param {Object} req - Express request object
 * @returns {Object} Sanitized request object
 */
function sanitizeRequest(req, res, next) {
  try {
    // Basic XSS prevention - remove potentially dangerous HTML/JS
    const sanitize = (obj) => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };

    // Sanitize request body, query, and params
    if (req.body) {
      req.body = sanitize(req.body);
    }
    if (req.query) {
      req.query = sanitize(req.query);
    }
    if (req.params) {
      req.params = sanitize(req.params);
    }

    next();

  } catch (error) {
    console.error('Request sanitization error:', error);
    const response = ApiResponse.error(
      ERROR_MESSAGES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_ERROR
    );
    return res.status(response.statusCode).json(response);
  }
}

/**
 * Validate request headers
 * @param {Array} requiredHeaders - Array of required header names
 * @returns {Function} Express middleware function
 */
function validateHeaders(requiredHeaders = []) {
  return (req, res, next) => {
    try {
      const missingHeaders = [];

      requiredHeaders.forEach(header => {
        if (!req.headers[header.toLowerCase()]) {
          missingHeaders.push(header);
        }
      });

      if (missingHeaders.length > 0) {
        const response = ApiResponse.error(
          `Missing required headers: ${missingHeaders.join(', ')}`,
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      next();

    } catch (error) {
      console.error('Header validation error:', error);
      const response = ApiResponse.error(
        ERROR_MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      );
      return res.status(response.statusCode).json(response);
    }
  };
}

module.exports = {
  validateRequest,
  validateFileUpload,
  sanitizeRequest,
  validateHeaders,
  CommonSchemas
};