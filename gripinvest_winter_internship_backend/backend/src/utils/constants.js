// Application Constants
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

const INVESTMENT_TYPES = {
  BOND: 'bond',
  FD: 'fd',
  MUTUAL_FUND: 'mf',
  ETF: 'etf',
  OTHER: 'other'
};

const RISK_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high'
};

const INVESTMENT_STATUS = {
  ACTIVE: 'active',
  MATURED: 'matured',
  CANCELLED: 'cancelled',
  PENDING: 'pending'
};

const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS'
};

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const JWT_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET: 'reset'
};

const EMAIL_TYPES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  INVESTMENT_CONFIRMATION: 'investment_confirmation',
  MATURITY_REMINDER: 'maturity_reminder',
  WEEKLY_REPORT: 'weekly_report'
};

const AI_RECOMMENDATION_TYPES = {
  PRODUCT: 'product',
  PORTFOLIO: 'portfolio',
  RISK: 'risk',
  DIVERSIFICATION: 'diversification'
};

const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_PATTERN: /^[+]?[1-9][\d\s\-()]{8,15}$/,
  MIN_INVESTMENT_AMOUNT: 500,
  MAX_INVESTMENT_AMOUNT: 10000000,
  OTP_LENGTH: 6,
  TOKEN_LENGTH: 32
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

const CACHE_DURATIONS = {
  USER_SESSION: 7 * 24 * 60 * 60, // 7 days in seconds
  PASSWORD_RESET: 60 * 60, // 1 hour in seconds
  OTP_EXPIRY: 5 * 60, // 5 minutes in seconds
  AI_RECOMMENDATIONS: 7 * 24 * 60 * 60 // 7 days in seconds
};

const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists with this email',
  INVALID_TOKEN: 'Invalid or expired token',
  ACCESS_DENIED: 'Access denied',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  
  // Validation
  VALIDATION_ERROR: 'Validation error',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  
  // Investment
  INSUFFICIENT_BALANCE: 'Insufficient account balance',
  INVALID_INVESTMENT_AMOUNT: 'Investment amount is outside allowed range',
  PRODUCT_NOT_FOUND: 'Investment product not found',
  INVESTMENT_NOT_FOUND: 'Investment not found',
  PRODUCT_INACTIVE: 'Investment product is not currently active',
  
  // General
  SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  DATABASE_ERROR: 'Database operation failed',
  NETWORK_ERROR: 'Network connectivity issue'
};

const SUCCESS_MESSAGES = {
  USER_CREATED: 'User account created successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET_SENT: 'Password reset instructions sent to email',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  INVESTMENT_CREATED: 'Investment created successfully',
  PRODUCT_CREATED: 'Investment product created successfully',
  PRODUCT_UPDATED: 'Investment product updated successfully',
  PRODUCT_DELETED: 'Investment product deleted successfully'
};

const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  PHONE: /^[+]?[1-9][\d\s\-()]{8,15}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
  NUMERIC: /^\d+(\.\d{1,2})?$/
};

const API_RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 10 requests per windowMs
  },
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  INVESTMENT: {
    windowMs: 60 * 1000, // 1 minute
    max: 5 // limit investment creation to 5 per minute
  }
};

const AI_MODELS = {
  OPENAI_GPT3: 'gpt-3.5-turbo',
  OPENAI_GPT4: 'gpt-4',
  GEMINI_PRO: 'gemini-pro'
};

const NOTIFICATION_PREFERENCES = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app'
};

module.exports = {
  HTTP_STATUS,
  INVESTMENT_TYPES,
  RISK_LEVELS,
  INVESTMENT_STATUS,
  HTTP_METHODS,
  USER_ROLES,
  JWT_TYPES,
  EMAIL_TYPES,
  AI_RECOMMENDATION_TYPES,
  VALIDATION_RULES,
  PAGINATION,
  CACHE_DURATIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS,
  API_RATE_LIMITS,
  AI_MODELS,
  NOTIFICATION_PREFERENCES
};