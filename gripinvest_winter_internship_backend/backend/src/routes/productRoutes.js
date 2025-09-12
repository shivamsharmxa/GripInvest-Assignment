const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const productsController = require('../controllers/productsController');
const authMiddleware = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * Investment Products API Routes
 * All routes include comprehensive validation and security measures
 */

// Rate limiting for product operations
const productRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many product requests, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for admin operations
  message: {
    success: false,
    message: 'Too many admin requests, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

// AI operations rate limiting (more restrictive)
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit AI operations
  message: {
    success: false,
    message: 'Too many AI requests, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Validation Schemas
 */

// Product creation validation schema
const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.min': 'Product name must be at least 3 characters long',
    'string.max': 'Product name cannot exceed 100 characters',
    'any.required': 'Product name is required'
  }),
  
  investmentType: Joi.string().valid('bond', 'fd', 'mf', 'etf').required().messages({
    'any.only': 'Investment type must be one of: bond, fd, mf, etf',
    'any.required': 'Investment type is required'
  }),
  
  tenureMonths: Joi.number().integer().min(1).max(360).required().messages({
    'number.base': 'Tenure must be a number',
    'number.integer': 'Tenure must be a whole number',
    'number.min': 'Tenure must be at least 1 month',
    'number.max': 'Tenure cannot exceed 360 months (30 years)',
    'any.required': 'Tenure is required'
  }),
  
  annualYield: Joi.number().min(0).max(50).precision(2).required().messages({
    'number.base': 'Annual yield must be a number',
    'number.min': 'Annual yield cannot be negative',
    'number.max': 'Annual yield cannot exceed 50%',
    'any.required': 'Annual yield is required'
  }),
  
  riskLevel: Joi.string().valid('low', 'moderate', 'high').required().messages({
    'any.only': 'Risk level must be one of: low, moderate, high',
    'any.required': 'Risk level is required'
  }),
  
  minInvestment: Joi.number().min(100).max(10000000).precision(2).default(1000).messages({
    'number.base': 'Minimum investment must be a number',
    'number.min': 'Minimum investment must be at least ₹100',
    'number.max': 'Minimum investment cannot exceed ₹1 crore'
  }),
  
  maxInvestment: Joi.number().min(Joi.ref('minInvestment')).max(100000000).precision(2).allow(null).messages({
    'number.base': 'Maximum investment must be a number',
    'number.min': 'Maximum investment must be greater than minimum investment',
    'number.max': 'Maximum investment cannot exceed ₹10 crores'
  }),
  
  description: Joi.string().trim().max(1000).allow('', null).messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  
  issuer: Joi.string().trim().max(100).allow('', null).messages({
    'string.max': 'Issuer name cannot exceed 100 characters'
  }),
  
  creditRating: Joi.string().trim().max(20).allow('', null).messages({
    'string.max': 'Credit rating cannot exceed 20 characters'
  }),
  
  liquidityLevel: Joi.string().valid('low', 'medium', 'high').default('medium').messages({
    'any.only': 'Liquidity level must be one of: low, medium, high'
  }),
  
  taxBenefits: Joi.boolean().default(false),
  
  compoundFrequency: Joi.string().valid('daily', 'monthly', 'quarterly', 'annually').default('annually').messages({
    'any.only': 'Compound frequency must be one of: daily, monthly, quarterly, annually'
  }),
  
  earlyWithdrawalPenalty: Joi.number().min(0).max(25).precision(2).default(0).messages({
    'number.base': 'Early withdrawal penalty must be a number',
    'number.min': 'Early withdrawal penalty cannot be negative',
    'number.max': 'Early withdrawal penalty cannot exceed 25%'
  }),
  
  isActive: Joi.boolean().default(true)
});

// Product update validation schema (all fields optional)
const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).messages({
    'string.min': 'Product name must be at least 3 characters long',
    'string.max': 'Product name cannot exceed 100 characters'
  }),
  
  investmentType: Joi.string().valid('bond', 'fd', 'mf', 'etf').messages({
    'any.only': 'Investment type must be one of: bond, fd, mf, etf'
  }),
  
  tenureMonths: Joi.number().integer().min(1).max(360).messages({
    'number.base': 'Tenure must be a number',
    'number.integer': 'Tenure must be a whole number',
    'number.min': 'Tenure must be at least 1 month',
    'number.max': 'Tenure cannot exceed 360 months (30 years)'
  }),
  
  annualYield: Joi.number().min(0).max(50).precision(2).messages({
    'number.base': 'Annual yield must be a number',
    'number.min': 'Annual yield cannot be negative',
    'number.max': 'Annual yield cannot exceed 50%'
  }),
  
  riskLevel: Joi.string().valid('low', 'moderate', 'high').messages({
    'any.only': 'Risk level must be one of: low, moderate, high'
  }),
  
  minInvestment: Joi.number().min(100).max(10000000).precision(2).messages({
    'number.base': 'Minimum investment must be a number',
    'number.min': 'Minimum investment must be at least ₹100',
    'number.max': 'Minimum investment cannot exceed ₹1 crore'
  }),
  
  maxInvestment: Joi.number().min(Joi.ref('minInvestment')).max(100000000).precision(2).allow(null).messages({
    'number.base': 'Maximum investment must be a number',
    'number.min': 'Maximum investment must be greater than minimum investment',
    'number.max': 'Maximum investment cannot exceed ₹10 crores'
  }),
  
  description: Joi.string().trim().max(1000).allow('', null).messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  
  issuer: Joi.string().trim().max(100).allow('', null).messages({
    'string.max': 'Issuer name cannot exceed 100 characters'
  }),
  
  creditRating: Joi.string().trim().max(20).allow('', null).messages({
    'string.max': 'Credit rating cannot exceed 20 characters'
  }),
  
  liquidityLevel: Joi.string().valid('low', 'medium', 'high').messages({
    'any.only': 'Liquidity level must be one of: low, medium, high'
  }),
  
  taxBenefits: Joi.boolean(),
  
  compoundFrequency: Joi.string().valid('daily', 'monthly', 'quarterly', 'annually').messages({
    'any.only': 'Compound frequency must be one of: daily, monthly, quarterly, annually'
  }),
  
  earlyWithdrawalPenalty: Joi.number().min(0).max(25).precision(2).messages({
    'number.base': 'Early withdrawal penalty must be a number',
    'number.min': 'Early withdrawal penalty cannot be negative',
    'number.max': 'Early withdrawal penalty cannot exceed 25%'
  }),
  
  isActive: Joi.boolean()
});

// Investment simulation validation schema
const simulationSchema = Joi.object({
  amount: Joi.number().min(100).max(100000000).precision(2).required().messages({
    'number.base': 'Investment amount must be a number',
    'number.min': 'Investment amount must be at least ₹100',
    'number.max': 'Investment amount cannot exceed ₹10 crores',
    'any.required': 'Investment amount is required'
  }),
  
  customTenure: Joi.number().integer().min(1).max(360).allow(null).messages({
    'number.base': 'Custom tenure must be a number',
    'number.integer': 'Custom tenure must be a whole number',
    'number.min': 'Custom tenure must be at least 1 month',
    'number.max': 'Custom tenure cannot exceed 360 months'
  })
});

// Product comparison validation schema
const comparisonSchema = Joi.object({
  productIds: Joi.array().items(
    Joi.string().uuid().required()
  ).min(2).max(5).required().messages({
    'array.min': 'At least 2 products are required for comparison',
    'array.max': 'Maximum 5 products can be compared',
    'any.required': 'Product IDs are required',
    'string.uuid': 'Each product ID must be a valid UUID'
  })
});

// Query validation schemas
const queryFiltersSchema = Joi.object({
  type: Joi.string().valid('bond', 'fd', 'mf', 'etf'),
  riskLevel: Joi.string().valid('low', 'moderate', 'high'),
  minYield: Joi.number().min(0).max(50),
  maxYield: Joi.number().min(0).max(50),
  minTenure: Joi.number().integer().min(1).max(360),
  maxTenure: Joi.number().integer().min(1).max(360),
  minInvestment: Joi.number().min(100),
  maxInvestment: Joi.number().min(100),
  taxBenefits: Joi.boolean(),
  issuer: Joi.string().trim().max(100),
  search: Joi.string().trim().min(2).max(100),
  sortBy: Joi.string().valid('yield', 'risk', 'tenure', 'popularity', 'name', 'created'),
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Search query must be at least 2 characters',
    'string.max': 'Search query cannot exceed 100 characters',
    'any.required': 'Search query is required'
  }),
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
}).unknown(true); // Allow other filter parameters

/**
 * PUBLIC ROUTES (No authentication required)
 */

// GET /api/products - Get all products with filtering
router.get('/',
  productRateLimit,
  validateRequest({ query: queryFiltersSchema }),
  productsController.getProducts
);

// GET /api/products/search - Search products
router.get('/search',
  productRateLimit,
  validateRequest({ query: searchQuerySchema }),
  productsController.searchProducts
);

// GET /api/products/trending - Get trending products
router.get('/trending',
  productRateLimit,
  validateRequest({ 
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(10),
      days: Joi.number().integer().min(1).max(365).default(30)
    })
  }),
  productsController.getTrending
);

// GET /api/products/categories - Get product categories
router.get('/categories',
  productRateLimit,
  productsController.getCategories
);

// GET /api/products/market-analysis - Get market trends analysis
router.get('/market-analysis',
  productRateLimit,
  validateRequest({ query: queryFiltersSchema }),
  productsController.getMarketAnalysis
);

// GET /api/products/:id - Get product by ID
router.get('/:id',
  productRateLimit,
  validateRequest({
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
      })
    })
  }),
  productsController.getProductById
);

// POST /api/products/:id/simulate - Simulate investment
router.post('/:id/simulate',
  productRateLimit,
  validateRequest({
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
      })
    }),
    body: simulationSchema
  }),
  productsController.simulateInvestment
);

// POST /api/products/compare - Compare multiple products
router.post('/compare',
  productRateLimit,
  validateRequest({ body: comparisonSchema }),
  productsController.compareProducts
);

/**
 * AUTHENTICATED USER ROUTES
 */

// GET /api/products/recommendations - Get personalized recommendations
router.get('/recommendations',
  productRateLimit,
  authMiddleware.authenticateToken,
  validateRequest({
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(10)
    })
  }),
  productsController.getRecommendations
);

// GET /api/products/investment-strategy - Get investment strategy suggestions
router.get('/investment-strategy',
  aiRateLimit,
  authMiddleware.authenticateToken,
  productsController.getInvestmentStrategy
);

/**
 * ADMIN ONLY ROUTES
 */

// POST /api/products - Create new product
router.post('/',
  adminRateLimit,
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validateRequest({ body: createProductSchema }),
  productsController.createProduct
);

// PUT /api/products/:id - Update existing product
router.put('/:id',
  adminRateLimit,
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validateRequest({
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
      })
    }),
    body: updateProductSchema
  }),
  productsController.updateProduct
);

// DELETE /api/products/:id - Delete product
router.delete('/:id',
  adminRateLimit,
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validateRequest({
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
      })
    })
  }),
  productsController.deleteProduct
);

// GET /api/products/:id/analytics - Get product analytics
router.get('/:id/analytics',
  adminRateLimit,
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validateRequest({
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
      })
    })
  }),
  productsController.getProductAnalytics
);

// POST /api/products/:id/generate-description - Generate AI description
router.post('/:id/generate-description',
  aiRateLimit,
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  validateRequest({
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
      })
    })
  }),
  productsController.generateDescription
);

module.exports = router;