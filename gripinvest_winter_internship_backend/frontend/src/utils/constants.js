// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Investment Categories
export const INVESTMENT_CATEGORIES = {
  CORPORATE_BONDS: 'Corporate Bonds',
  ALTERNATIVE_INVESTMENT_FUND: 'Alternative Investment Fund',
  REAL_ESTATE: 'Real Estate',
  COMMODITIES: 'Commodities',
  MUTUAL_FUNDS: 'Mutual Funds',
  FIXED_DEPOSITS: 'Fixed Deposits',
};

// Investment Status
export const INVESTMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  MATURED: 'matured',
  CANCELLED: 'cancelled',
  PARTIAL: 'partial',
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
};

// Risk Colors
export const RISK_COLORS = {
  [RISK_LEVELS.LOW]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  [RISK_LEVELS.MODERATE]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  [RISK_LEVELS.HIGH]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
};

// Status Colors
export const STATUS_COLORS = {
  [INVESTMENT_STATUS.PENDING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: 'text-yellow-500',
  },
  [INVESTMENT_STATUS.ACTIVE]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: 'text-green-500',
  },
  [INVESTMENT_STATUS.MATURED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: 'text-blue-500',
  },
  [INVESTMENT_STATUS.CANCELLED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
};

// Currency Configuration
export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  LOCALE: 'en-IN',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  INPUT: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD HH:mm:ss',
  SHORT: 'DD/MM/YY',
  LONG: 'DD MMMM YYYY',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// Chart Colors
export const CHART_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
  '#F97316', // Orange
];

// Investment Amounts
export const INVESTMENT_AMOUNTS = {
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 10000000,
  QUICK_AMOUNTS: [10000, 25000, 50000, 100000, 200000, 500000],
};

// Tenure Options (in months)
export const TENURE_OPTIONS = [
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 18, label: '1.5 years' },
  { value: 24, label: '2 years' },
  { value: 36, label: '3 years' },
  { value: 48, label: '4 years' },
  { value: 60, label: '5 years' },
];

// Form Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  NAME: /^[a-zA-Z\s]+$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  AADHAR: /^\d{12}$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please login again.',
  AUTHORIZATION_ERROR: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  INVESTMENT_CREATED: 'Investment created successfully!',
  INVESTMENT_UPDATED: 'Investment updated successfully!',
  INVESTMENT_CANCELLED: 'Investment cancelled successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_LOGIN: 'last_login',
};

// Theme Configuration
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Language Configuration
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
];

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
};

// Investment Product Features
export const PRODUCT_FEATURES = {
  QUARTERLY_INTEREST: 'Quarterly Interest',
  CREDIT_ENHANCEMENT: 'Credit Enhancement',
  LISTED_EXCHANGE: 'Listed on Exchange',
  HIGH_LIQUIDITY: 'High Liquidity',
  PROFESSIONAL_MANAGEMENT: 'Professional Management',
  TAX_EFFICIENT: 'Tax Efficient',
  REGULAR_DIVIDENDS: 'Regular Dividends',
  INFLATION_HEDGE: 'Inflation Hedge',
  GLOBAL_EXPOSURE: 'Global Exposure',
};

// Rating Agencies
export const RATING_AGENCIES = [
  'CRISIL',
  'ICRA',
  'CARE',
  'India Ratings',
  'Brickwork',
  'SMERA',
];

// Credit Ratings
export const CREDIT_RATINGS = [
  'AAA', 'AA+', 'AA', 'AA-',
  'A+', 'A', 'A-',
  'BBB+', 'BBB', 'BBB-',
  'BB+', 'BB', 'BB-',
  'B+', 'B', 'B-',
  'C', 'D'
];

// Portfolio Metrics
export const PORTFOLIO_METRICS = {
  SHARPE_RATIO: 'Sharpe Ratio',
  ALPHA: 'Alpha',
  BETA: 'Beta',
  VOLATILITY: 'Volatility',
  MAX_DRAWDOWN: 'Max Drawdown',
  RETURNS: 'Returns',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Export all constants as default
export default {
  API_CONFIG,
  INVESTMENT_CATEGORIES,
  INVESTMENT_STATUS,
  RISK_LEVELS,
  RISK_COLORS,
  STATUS_COLORS,
  CURRENCY,
  DATE_FORMATS,
  PAGINATION,
  CHART_COLORS,
  INVESTMENT_AMOUNTS,
  TENURE_OPTIONS,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  THEMES,
  LANGUAGES,
  UPLOAD_CONFIG,
  PRODUCT_FEATURES,
  RATING_AGENCIES,
  CREDIT_RATINGS,
  PORTFOLIO_METRICS,
  NOTIFICATION_TYPES,
};