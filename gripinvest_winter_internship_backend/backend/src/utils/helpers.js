const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { 
  REGEX_PATTERNS, 
  VALIDATION_RULES, 
  HTTP_STATUS,
  ERROR_MESSAGES 
} = require('./constants');

class ApiResponse {
  constructor(success, message, data = null, statusCode = HTTP_STATUS.OK, errors = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    if (errors) {
      this.errors = errors;
    }
  }

  static success(message, data = null, statusCode = HTTP_STATUS.OK) {
    return new ApiResponse(true, message, data, statusCode);
  }

  static error(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    return new ApiResponse(false, message, null, statusCode, errors);
  }
}

class ValidationHelper {
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, message: 'Email is required' };
    }
    
    if (!REGEX_PATTERNS.EMAIL.test(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }
    
    if (email.length > VALIDATION_RULES.EMAIL_MAX_LENGTH) {
      return { isValid: false, message: 'Email is too long' };
    }
    
    return { isValid: true };
  }

  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return { 
        isValid: false, 
        message: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters` 
      };
    }
    
    if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
      return { 
        isValid: false, 
        message: `Password must be less than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters` 
      };
    }
    
    if (!REGEX_PATTERNS.STRONG_PASSWORD.test(password)) {
      return { 
        isValid: false, 
        message: 'Password must contain uppercase, lowercase, number and special character' 
      };
    }
    
    return { isValid: true };
  }

  static validateName(name, fieldName = 'Name') {
    if (!name || typeof name !== 'string') {
      return { isValid: false, message: `${fieldName} is required` };
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length < VALIDATION_RULES.NAME_MIN_LENGTH || 
        trimmedName.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
      return { 
        isValid: false, 
        message: `${fieldName} must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters` 
      };
    }
    
    if (!REGEX_PATTERNS.NAME.test(trimmedName)) {
      return { 
        isValid: false, 
        message: `${fieldName} can only contain letters and spaces` 
      };
    }
    
    return { isValid: true };
  }

  static validatePhone(phone) {
    if (!phone) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    if (!REGEX_PATTERNS.PHONE.test(phone)) {
      return { isValid: false, message: 'Invalid phone number format' };
    }
    
    return { isValid: true };
  }

  static validateInvestmentAmount(amount, minAmount, maxAmount) {
    if (!amount || isNaN(amount)) {
      return { isValid: false, message: 'Investment amount is required and must be a number' };
    }
    
    const numAmount = parseFloat(amount);
    
    if (numAmount < minAmount) {
      return { 
        isValid: false, 
        message: `Minimum investment amount is ₹${minAmount.toLocaleString('en-IN')}` 
      };
    }
    
    if (maxAmount && numAmount > maxAmount) {
      return { 
        isValid: false, 
        message: `Maximum investment amount is ₹${maxAmount.toLocaleString('en-IN')}` 
      };
    }
    
    return { isValid: true };
  }

  static validateUUID(id, fieldName = 'ID') {
    if (!id) {
      return { isValid: false, message: `${fieldName} is required` };
    }
    
    // Allow both UUID and simple alphanumeric IDs for demo purposes
    if (typeof id !== 'string' || id.trim().length === 0) {
      return { isValid: false, message: `${fieldName} must be a valid string` };
    }
    
    const trimmedId = id.trim();
    
    // Check if it's a valid UUID or simple alphanumeric ID (for demo)
    const isUUID = REGEX_PATTERNS.UUID.test(trimmedId);
    const isSimpleId = /^[a-zA-Z0-9\-_]{1,50}$/.test(trimmedId);
    
    if (!isUUID && !isSimpleId) {
      return { isValid: false, message: `Invalid ${fieldName} format` };
    }
    
    return { isValid: true };
  }
}

class AuthHelper {
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateToken(payload, type = 'access', expiresIn = null) {
    const secret = type === 'refresh' 
      ? process.env.JWT_REFRESH_SECRET 
      : process.env.JWT_SECRET;
    
    const options = {
      issuer: 'gripinvest',
      audience: 'gripinvest-users',
      algorithm: 'HS256'
    };

    if (expiresIn) {
      options.expiresIn = expiresIn;
    } else {
      options.expiresIn = type === 'refresh' 
        ? process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        : process.env.JWT_EXPIRES_IN || '24h';
    }

    return jwt.sign({ ...payload, type }, secret, options);
  }

  static verifyToken(token, type = 'access') {
    const secret = type === 'refresh' 
      ? process.env.JWT_REFRESH_SECRET 
      : process.env.JWT_SECRET;
    
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }
}

class FormatHelper {
  static formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  static formatPercentage(value, decimals = 2) {
    return `${parseFloat(value).toFixed(decimals)}%`;
  }

  static formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'Asia/Kolkata'
    };
    
    return new Intl.DateTimeFormat('en-IN', { ...defaultOptions, ...options })
      .format(new Date(date));
  }

  static formatDateTime(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    };
    
    return new Intl.DateTimeFormat('en-IN', { ...defaultOptions, ...options })
      .format(new Date(date));
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  static generateUUID() {
    return uuidv4();
  }
}

class CalculationHelper {
  static calculateReturns(principal, rate, timeInMonths, compoundingFrequency = 'annually') {
    const frequencies = {
      'daily': 365,
      'monthly': 12,
      'quarterly': 4,
      'annually': 1
    };
    
    const n = frequencies[compoundingFrequency] || 1;
    const t = timeInMonths / 12; // Convert months to years
    const r = rate / 100; // Convert percentage to decimal
    
    // Compound Interest Formula: A = P(1 + r/n)^(nt)
    const amount = principal * Math.pow((1 + r / n), (n * t));
    const returns = amount - principal;
    
    return {
      principal: parseFloat(principal.toFixed(2)),
      finalAmount: parseFloat(amount.toFixed(2)),
      returns: parseFloat(returns.toFixed(2)),
      returnsPercentage: parseFloat(((returns / principal) * 100).toFixed(2))
    };
  }

  static calculateMaturityDate(startDate, tenureInMonths) {
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + tenureInMonths);
    return maturityDate;
  }

  static calculatePortfolioMetrics(investments) {
    if (!investments || investments.length === 0) {
      return {
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        returnsPercentage: 0,
        riskScore: 0
      };
    }

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
    const totalReturns = currentValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    
    // Calculate risk score based on investment types and risk levels
    const riskWeights = { low: 1, moderate: 2, high: 3 };
    const weightedRisk = investments.reduce((sum, inv) => {
      const weight = riskWeights[inv.risk_level] || 2;
      return sum + (weight * inv.amount);
    }, 0);
    const riskScore = totalInvested > 0 ? weightedRisk / totalInvested : 0;

    return {
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      currentValue: parseFloat(currentValue.toFixed(2)),
      totalReturns: parseFloat(totalReturns.toFixed(2)),
      returnsPercentage: parseFloat(returnsPercentage.toFixed(2)),
      riskScore: parseFloat(riskScore.toFixed(2))
    };
  }
}

class ErrorHandler {
  static handleError(error, operation = 'Operation') {
    console.error(`${operation} failed:`, error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return ApiResponse.error(
        'Duplicate entry found',
        HTTP_STATUS.CONFLICT
      );
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return ApiResponse.error(
        'Referenced record not found',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    if (error.name === 'ValidationError') {
      return ApiResponse.error(
        error.message,
        HTTP_STATUS.BAD_REQUEST,
        error.details
      );
    }
    
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(
        ERROR_MESSAGES.INVALID_TOKEN,
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    return ApiResponse.error(
      ERROR_MESSAGES.SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

class PaginationHelper {
  static getPaginationParams(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)), // Max 100, min 1
      offset: Math.max(0, offset)
    };
  }

  static formatPaginatedResponse(data, totalCount, page, limit) {
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
}

module.exports = {
  ApiResponse,
  ValidationHelper,
  AuthHelper,
  FormatHelper,
  CalculationHelper,
  ErrorHandler,
  PaginationHelper
};