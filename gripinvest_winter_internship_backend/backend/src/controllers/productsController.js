const productService = require('../services/productService');
const aiService = require('../services/aiService');
const productModel = require('../models/productModel');
const { 
  HTTP_STATUS, 
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} = require('../utils/constants');
const { 
  ApiResponse, 
  ValidationHelper, 
  ErrorHandler,
  PaginationHelper
} = require('../utils/helpers');

/**
 * Products Controller Class
 * Handles all investment product-related HTTP requests
 */
class ProductsController {

  /**
   * Get all products with advanced filtering
   * @route GET /api/products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProducts(req, res) {
    try {
      const filters = req.query;
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const userId = req.user?.id; // Optional user ID for personalization

      const result = await productService.getProducts(filters, pagination, userId);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Get products controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get products');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get product by ID with detailed information
   * @route GET /api/products/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Optional user ID for personalization

      const result = await productService.getProductById(id, userId);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Get product by ID controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get product by ID');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Create new product (admin only)
   * @route POST /api/products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createProduct(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const productData = req.body;
      const adminUserId = req.user.id;

      const result = await productService.createProduct(productData, adminUserId);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Create product controller error:', error);
      const response = ErrorHandler.handleError(error, 'Create product');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Update existing product (admin only)
   * @route PUT /api/products/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProduct(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const { id } = req.params;
      const updateData = req.body;
      const adminUserId = req.user.id;

      const result = await productService.updateProduct(id, updateData, adminUserId);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Update product controller error:', error);
      const response = ErrorHandler.handleError(error, 'Update product');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Delete product (admin only)
   * @route DELETE /api/products/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteProduct(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const { id } = req.params;
      const adminUserId = req.user.id;

      const result = await productService.deleteProduct(id, adminUserId);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Delete product controller error:', error);
      const response = ErrorHandler.handleError(error, 'Delete product');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get AI-powered product recommendations for user
   * @route GET /api/products/recommendations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRecommendations(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const result = await productService.getRecommendations(userId, limit);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Get recommendations controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get recommendations');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get trending products based on recent activity
   * @route GET /api/products/trending
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTrending(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const days = parseInt(req.query.days) || 30;

      // Validate parameters
      if (limit < 1 || limit > 50) {
        const response = ApiResponse.error(
          'Limit must be between 1 and 50',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      if (days < 1 || days > 365) {
        const response = ApiResponse.error(
          'Days must be between 1 and 365',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      const result = await productService.getTrendingProducts(limit, days);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Get trending controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get trending products');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get product categories with statistics
   * @route GET /api/products/categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCategories(req, res) {
    try {
      const result = await productService.getCategories();
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Get categories controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get categories');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Simulate investment for a product
   * @route POST /api/products/:id/simulate
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async simulateInvestment(req, res) {
    try {
      const { id } = req.params;
      const { amount, customTenure } = req.body;
      const userId = req.user?.id;

      // Validate required parameters
      if (!amount) {
        const response = ApiResponse.error(
          'Investment amount is required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      if (customTenure && (!Number.isInteger(customTenure) || customTenure <= 0)) {
        const response = ApiResponse.error(
          'Custom tenure must be a positive integer (months)',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      const result = await productService.simulateInvestment(id, amount, customTenure, userId);
      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Simulate investment controller error:', error);
      const response = ErrorHandler.handleError(error, 'Simulate investment');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get product analytics (admin only)
   * @route GET /api/products/:id/analytics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProductAnalytics(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const { id } = req.params;

      // Validate product ID
      const idValidation = ValidationHelper.validateUUID(id, 'Product ID');
      if (!idValidation.isValid) {
        const response = ApiResponse.error(idValidation.message, HTTP_STATUS.BAD_REQUEST);
        return res.status(response.statusCode).json(response);
      }

      const analytics = await productModel.getProductAnalytics(id);
      
      if (!analytics) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.PRODUCT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return res.status(response.statusCode).json(response);
      }

      const response = ApiResponse.success(
        'Product analytics retrieved successfully',
        analytics
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Get product analytics controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get product analytics');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Compare multiple products using AI
   * @route POST /api/products/compare
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async compareProducts(req, res) {
    try {
      const { productIds } = req.body;
      const userContext = req.user ? { riskAppetite: req.user.riskAppetite } : {};

      // Validate input
      if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
        const response = ApiResponse.error(
          'At least 2 product IDs are required for comparison',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      if (productIds.length > 5) {
        const response = ApiResponse.error(
          'Maximum 5 products can be compared at once',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Validate all product IDs
      for (const id of productIds) {
        const idValidation = ValidationHelper.validateUUID(id, 'Product ID');
        if (!idValidation.isValid) {
          const response = ApiResponse.error(
            `Invalid product ID: ${id}`,
            HTTP_STATUS.BAD_REQUEST
          );
          return res.status(response.statusCode).json(response);
        }
      }

      // Get product details
      const products = [];
      for (const id of productIds) {
        const product = await productModel.findById(id);
        if (!product) {
          const response = ApiResponse.error(
            `Product not found: ${id}`,
            HTTP_STATUS.NOT_FOUND
          );
          return res.status(response.statusCode).json(response);
        }
        products.push(product);
      }

      // Generate AI comparison
      let aiComparison = null;
      try {
        aiComparison = await aiService.generateProductComparison(products, userContext);
      } catch (error) {
        console.warn('AI comparison failed:', error.message);
      }

      const result = {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          investmentType: p.investmentType,
          annualYield: p.annualYield,
          riskLevel: p.riskLevel,
          tenureMonths: p.tenureMonths,
          minInvestment: p.minInvestment,
          maxInvestment: p.maxInvestment,
          taxBenefits: p.taxBenefits,
          liquidityLevel: p.liquidityLevel,
          statistics: p.statistics
        })),
        comparison: aiComparison || {
          message: 'Basic comparison available',
          details: 'AI-powered comparison temporarily unavailable'
        },
        aiEnhanced: !!aiComparison,
        comparedAt: new Date().toISOString()
      };

      const response = ApiResponse.success(
        'Product comparison completed successfully',
        result
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Compare products controller error:', error);
      const response = ErrorHandler.handleError(error, 'Compare products');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Generate product description using AI (admin only)
   * @route POST /api/products/:id/generate-description
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateDescription(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const { id } = req.params;

      // Validate product ID
      const idValidation = ValidationHelper.validateUUID(id, 'Product ID');
      if (!idValidation.isValid) {
        const response = ApiResponse.error(idValidation.message, HTTP_STATUS.BAD_REQUEST);
        return res.status(response.statusCode).json(response);
      }

      // Get product details
      const product = await productModel.findById(id);
      if (!product) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.PRODUCT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return res.status(response.statusCode).json(response);
      }

      // Generate AI description
      let aiDescription = null;
      try {
        aiDescription = await aiService.generateProductDescription(product);
      } catch (error) {
        console.warn('AI description generation failed:', error.message);
      }

      const result = {
        productId: id,
        productName: product.name,
        currentDescription: product.description,
        aiGeneratedDescription: aiDescription,
        aiAvailable: !!aiDescription,
        generatedAt: new Date().toISOString()
      };

      const response = ApiResponse.success(
        aiDescription ? 'AI description generated successfully' : 'AI description generation failed',
        result
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Generate description controller error:', error);
      const response = ErrorHandler.handleError(error, 'Generate description');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get market trends analysis
   * @route GET /api/products/market-analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMarketAnalysis(req, res) {
    try {
      const filters = req.query;
      
      // Get products for analysis
      const productsResult = await productService.getProducts(filters, { limit: 100 });
      
      if (!productsResult.success || !productsResult.data.products.length) {
        const response = ApiResponse.error(
          'Insufficient data for market analysis',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Generate AI market analysis
      let aiAnalysis = null;
      try {
        aiAnalysis = await aiService.analyzeMarketTrends(productsResult.data.products);
      } catch (error) {
        console.warn('AI market analysis failed:', error.message);
      }

      // Basic market statistics
      const basicStats = this.calculateBasicMarketStats(productsResult.data.products);

      const result = {
        marketAnalysis: aiAnalysis || {
          marketTrend: 'stable',
          message: 'AI analysis temporarily unavailable'
        },
        basicStatistics: basicStats,
        dataPoints: productsResult.data.products.length,
        aiEnhanced: !!aiAnalysis,
        analysisDate: new Date().toISOString()
      };

      const response = ApiResponse.success(
        'Market analysis completed successfully',
        result
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Get market analysis controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get market analysis');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get investment strategy suggestions (authenticated users)
   * @route GET /api/products/investment-strategy
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getInvestmentStrategy(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const userId = req.user.id;

      // Get user profile and portfolio data
      const userProfile = await productService.getUserRiskProfile(userId);
      const portfolioData = await this.getUserPortfolioData(userId);

      if (!userProfile) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return res.status(response.statusCode).json(response);
      }

      // Generate AI investment strategy
      let aiStrategy = null;
      try {
        aiStrategy = await aiService.generateInvestmentStrategy(userProfile, portfolioData);
      } catch (error) {
        console.warn('AI strategy generation failed:', error.message);
      }

      const result = {
        userProfile: {
          riskAppetite: userProfile.riskAppetite,
          accountBalance: userProfile.accountBalance,
          investmentExperience: portfolioData.totalInvestments
        },
        strategy: aiStrategy || {
          strategyType: 'balanced',
          message: 'AI strategy generation temporarily unavailable',
          basicRecommendations: ['Diversify across asset classes', 'Start with low-risk investments']
        },
        portfolioSummary: portfolioData,
        aiEnhanced: !!aiStrategy,
        generatedAt: new Date().toISOString()
      };

      const response = ApiResponse.success(
        'Investment strategy generated successfully',
        result
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Get investment strategy controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get investment strategy');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Search products with advanced filters
   * @route GET /api/products/search
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchProducts(req, res) {
    try {
      const { q: searchQuery } = req.query;

      if (!searchQuery || searchQuery.trim().length < 2) {
        const response = ApiResponse.error(
          'Search query must be at least 2 characters',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Add search query to filters
      const filters = {
        ...req.query,
        search: searchQuery.trim()
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const userId = req.user?.id;

      const result = await productService.getProducts(filters, pagination, userId);

      // Add search metadata
      if (result.success) {
        result.data.searchQuery = searchQuery;
        result.data.searchResults = result.data.total;
      }

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Search products controller error:', error);
      const response = ErrorHandler.handleError(error, 'Search products');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Calculate basic market statistics
   * @param {Array} products - Products array
   * @returns {Object} Basic market statistics
   */
  calculateBasicMarketStats(products) {
    if (!products.length) {
      return {
        avgYield: 0,
        totalProducts: 0,
        riskDistribution: {},
        typeDistribution: {}
      };
    }

    const stats = {
      avgYield: 0,
      totalProducts: products.length,
      riskDistribution: { low: 0, moderate: 0, high: 0 },
      typeDistribution: { bond: 0, fd: 0, mf: 0, etf: 0, other: 0 },
      yieldRange: { min: Infinity, max: 0 },
      tenureRange: { min: Infinity, max: 0 }
    };

    let totalYield = 0;

    products.forEach(product => {
      // Yield statistics
      totalYield += product.annualYield;
      stats.yieldRange.min = Math.min(stats.yieldRange.min, product.annualYield);
      stats.yieldRange.max = Math.max(stats.yieldRange.max, product.annualYield);

      // Tenure statistics
      stats.tenureRange.min = Math.min(stats.tenureRange.min, product.tenureMonths);
      stats.tenureRange.max = Math.max(stats.tenureRange.max, product.tenureMonths);

      // Risk distribution
      if (stats.riskDistribution[product.riskLevel] !== undefined) {
        stats.riskDistribution[product.riskLevel]++;
      }

      // Type distribution
      if (stats.typeDistribution[product.investmentType] !== undefined) {
        stats.typeDistribution[product.investmentType]++;
      }
    });

    stats.avgYield = totalYield / products.length;

    return stats;
  }

  /**
   * Get user portfolio data for strategy generation
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Portfolio data
   */
  async getUserPortfolioData(userId) {
    try {
      const { databaseConfig } = require('../config/database');
      
      const portfolioQuery = `
        SELECT 
          COUNT(*) as totalInvestments,
          SUM(amount) as totalInvested,
          SUM(current_value) as portfolioValue,
          AVG((current_value - amount) / amount * 100) as avgReturns
        FROM investments 
        WHERE user_id = ? AND status = 'active'
      `;

      const result = await databaseConfig.executeQuery(portfolioQuery, [userId]);
      
      if (result.length === 0) {
        return {
          totalInvestments: 0,
          totalInvested: 0,
          portfolioValue: 0,
          avgReturns: 0
        };
      }

      const data = result[0];
      return {
        totalInvestments: data.totalInvestments || 0,
        totalInvested: parseFloat(data.totalInvested || 0),
        portfolioValue: parseFloat(data.portfolioValue || 0),
        avgReturns: parseFloat(data.avgReturns || 0)
      };

    } catch (error) {
      console.error('Get user portfolio data error:', error);
      return {
        totalInvestments: 0,
        totalInvested: 0,
        portfolioValue: 0,
        avgReturns: 0
      };
    }
  }
}

module.exports = new ProductsController();