const productModel = require('../models/productModel');
const aiService = require('./aiService');
const { databaseConfig } = require('../config/database');
const { 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  INVESTMENT_TYPES,
  RISK_LEVELS 
} = require('../utils/constants');
const { 
  ApiResponse, 
  ValidationHelper, 
  CalculationHelper,
  FormatHelper 
} = require('../utils/helpers');

/**
 * Product Service Class
 * Handles all product-related business logic and validations
 */
class ProductService {

  /**
   * Create a new investment product (admin only)
   * @param {Object} productData - Product data
   * @param {string} adminUserId - Admin user ID
   * @returns {Promise<ApiResponse>} Created product result
   */
  async createProduct(productData, adminUserId) {
    try {
      // Validate required fields
      const validation = this.validateProductData(productData);
      if (!validation.isValid) {
        return ApiResponse.error(validation.message, HTTP_STATUS.BAD_REQUEST);
      }

      // Check for duplicate product name
      const existingProduct = await this.findProductByName(productData.name);
      if (existingProduct) {
        return ApiResponse.error(
          'Product with this name already exists',
          HTTP_STATUS.CONFLICT
        );
      }

      // Generate AI-enhanced description if not provided or basic
      if (!productData.description || productData.description.length < 50) {
        try {
          const aiDescription = await aiService.generateProductDescription(productData);
          if (aiDescription) {
            productData.description = aiDescription;
          }
        } catch (error) {
          console.warn('AI description generation failed:', error.message);
        }
      }

      // Create the product
      const createdProduct = await productModel.create({
        ...productData,
        // Sanitize inputs
        name: FormatHelper.sanitizeInput(productData.name),
        description: FormatHelper.sanitizeInput(productData.description || ''),
        issuer: FormatHelper.sanitizeInput(productData.issuer || ''),
      });

      // Log admin action
      await this.logAdminAction(adminUserId, 'CREATE_PRODUCT', createdProduct.id, {
        productName: createdProduct.name,
        investmentType: createdProduct.investmentType
      });

      return ApiResponse.success(
        SUCCESS_MESSAGES.PRODUCT_CREATED,
        createdProduct,
        HTTP_STATUS.CREATED
      );

    } catch (error) {
      console.error('Create product error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return ApiResponse.error(
          'Product with this name already exists',
          HTTP_STATUS.CONFLICT
        );
      }
      
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all products with advanced filtering
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination parameters
   * @param {string} userId - User ID for personalization (optional)
   * @returns {Promise<ApiResponse>} Products list result
   */
  async getProducts(filters = {}, pagination = {}, userId = null) {
    try {
      // Validate filter parameters
      const validatedFilters = this.validateFilters(filters);
      
      // Get products with filters
      const result = await productModel.findWithFilters(validatedFilters, pagination);

      // Add personalized scoring if user is provided
      if (userId && result.products.length > 0) {
        try {
          const user = await this.getUserRiskProfile(userId);
          if (user) {
            result.products = this.addPersonalizationScores(result.products, user.riskAppetite);
          }
        } catch (error) {
          console.warn('Personalization scoring failed:', error.message);
        }
      }

      // Add market insights
      result.marketInsights = await this.generateMarketInsights(validatedFilters);

      return ApiResponse.success(
        'Products retrieved successfully',
        result
      );

    } catch (error) {
      console.error('Get products error:', error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get product by ID with detailed information
   * @param {string} productId - Product ID
   * @param {string} userId - User ID for personalization (optional)
   * @returns {Promise<ApiResponse>} Product details result
   */
  async getProductById(productId, userId = null) {
    try {
      // Validate product ID (allow both UUID and simple alphanumeric IDs for demo)
      if (!productId || productId.trim() === '') {
        return ApiResponse.error('Product ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const product = await productModel.findById(productId);
      
      if (!product) {
        return ApiResponse.error(
          ERROR_MESSAGES.PRODUCT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Add investment projections
      product.projections = this.generateInvestmentProjections(product);

      // Add personalized recommendations if user provided
      if (userId) {
        try {
          const user = await this.getUserRiskProfile(userId);
          if (user) {
            product.personalizedInsights = await this.generatePersonalizedInsights(product, user);
          }
        } catch (error) {
          console.warn('Personalized insights generation failed:', error.message);
        }
      }

      // Add similar products
      product.similarProducts = await this.findSimilarProducts(product, 4);

      return ApiResponse.success(
        'Product details retrieved successfully',
        product
      );

    } catch (error) {
      console.error('Get product by ID error:', error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update product (admin only)
   * @param {string} productId - Product ID
   * @param {Object} updateData - Update data
   * @param {string} adminUserId - Admin user ID
   * @returns {Promise<ApiResponse>} Update result
   */
  async updateProduct(productId, updateData, adminUserId) {
    try {
      // Validate product ID (allow both UUID and simple alphanumeric IDs for demo)
      if (!productId || productId.trim() === '') {
        return ApiResponse.error('Product ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if product exists
      const existingProduct = await productModel.findById(productId);
      if (!existingProduct) {
        return ApiResponse.error(
          ERROR_MESSAGES.PRODUCT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Validate update data
      const validation = this.validateProductData(updateData, false); // false for update
      if (!validation.isValid) {
        return ApiResponse.error(validation.message, HTTP_STATUS.BAD_REQUEST);
      }

      // Check for duplicate name if name is being updated
      if (updateData.name && updateData.name !== existingProduct.name) {
        const duplicateProduct = await this.findProductByName(updateData.name);
        if (duplicateProduct && duplicateProduct.id !== productId) {
          return ApiResponse.error(
            'Product with this name already exists',
            HTTP_STATUS.CONFLICT
          );
        }
      }

      // Sanitize inputs
      if (updateData.name) {
        updateData.name = FormatHelper.sanitizeInput(updateData.name);
      }
      if (updateData.description) {
        updateData.description = FormatHelper.sanitizeInput(updateData.description);
      }
      if (updateData.issuer) {
        updateData.issuer = FormatHelper.sanitizeInput(updateData.issuer);
      }

      // Update the product
      const updatedProduct = await productModel.update(productId, updateData);

      // Log admin action
      await this.logAdminAction(adminUserId, 'UPDATE_PRODUCT', productId, {
        updatedFields: Object.keys(updateData),
        productName: updatedProduct.name
      });

      return ApiResponse.success(
        SUCCESS_MESSAGES.PRODUCT_UPDATED,
        updatedProduct
      );

    } catch (error) {
      console.error('Update product error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return ApiResponse.error(
          'Product with this name already exists',
          HTTP_STATUS.CONFLICT
        );
      }
      
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete product (admin only)
   * @param {string} productId - Product ID
   * @param {string} adminUserId - Admin user ID
   * @returns {Promise<ApiResponse>} Delete result
   */
  async deleteProduct(productId, adminUserId) {
    try {
      // Validate product ID (allow both UUID and simple alphanumeric IDs for demo)
      if (!productId || productId.trim() === '') {
        return ApiResponse.error('Product ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if product exists
      const existingProduct = await productModel.findById(productId);
      if (!existingProduct) {
        return ApiResponse.error(
          ERROR_MESSAGES.PRODUCT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Attempt to delete (will check for active investments)
      const deleted = await productModel.delete(productId);
      
      if (!deleted) {
        return ApiResponse.error(
          'Failed to delete product',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      // Log admin action
      await this.logAdminAction(adminUserId, 'DELETE_PRODUCT', productId, {
        productName: existingProduct.name,
        investmentType: existingProduct.investmentType
      });

      return ApiResponse.success(SUCCESS_MESSAGES.PRODUCT_DELETED);

    } catch (error) {
      console.error('Delete product error:', error);
      
      if (error.message.includes('active investments')) {
        return ApiResponse.error(
          'Cannot delete product with active investments',
          HTTP_STATUS.CONFLICT
        );
      }
      
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get AI-powered product recommendations for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<ApiResponse>} Recommendations result
   */
  async getRecommendations(userId, limit = 10) {
    try {
      // Get user profile
      const user = await this.getUserRiskProfile(userId);
      if (!user) {
        return ApiResponse.error(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Get basic recommendations based on risk appetite
      const basicRecommendations = await productModel.getRecommendedProducts(
        user.riskAppetite, 
        limit
      );

      // Enhance with AI recommendations if available
      let aiRecommendations = null;
      try {
        aiRecommendations = await aiService.generateProductRecommendations(
          user, 
          basicRecommendations
        );
      } catch (error) {
        console.warn('AI recommendations failed:', error.message);
      }

      // Get user's investment history for better personalization
      const investmentHistory = await this.getUserInvestmentHistory(userId);

      const result = {
        recommendations: basicRecommendations,
        userProfile: {
          riskAppetite: user.riskAppetite,
          totalInvestments: investmentHistory.totalInvestments,
          avgInvestmentAmount: investmentHistory.avgAmount,
          preferredTypes: investmentHistory.preferredTypes
        },
        aiEnhanced: !!aiRecommendations,
        ...(aiRecommendations && { 
          aiInsights: aiRecommendations,
          reasoning: aiRecommendations.reasoning 
        }),
        generatedAt: new Date().toISOString()
      };

      return ApiResponse.success(
        'Product recommendations generated successfully',
        result
      );

    } catch (error) {
      console.error('Get recommendations error:', error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get trending products
   * @param {number} limit - Number of products to return
   * @param {number} days - Days to look back
   * @returns {Promise<ApiResponse>} Trending products result
   */
  async getTrendingProducts(limit = 10, days = 30) {
    try {
      const trendingProducts = await productModel.getTrendingProducts(limit, days);

      // Add trend analysis
      const trendAnalysis = await this.analyzeTrends(trendingProducts, days);

      const result = {
        trending: trendingProducts,
        analysis: trendAnalysis,
        period: {
          days,
          from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        }
      };

      return ApiResponse.success(
        'Trending products retrieved successfully',
        result
      );

    } catch (error) {
      console.error('Get trending products error:', error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get product categories with statistics
   * @returns {Promise<ApiResponse>} Categories result
   */
  async getCategories() {
    try {
      const categories = await productModel.getCategories();

      // Add category insights
      const insights = this.generateCategoryInsights(categories);

      const result = {
        categories,
        insights,
        totalCategories: categories.length,
        totalProducts: categories.reduce((sum, cat) => sum + cat.productCount, 0)
      };

      return ApiResponse.success(
        'Product categories retrieved successfully',
        result
      );

    } catch (error) {
      console.error('Get categories error:', error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Simulate investment for a product
   * @param {string} productId - Product ID
   * @param {number} amount - Investment amount
   * @param {number} customTenure - Custom tenure (optional)
   * @param {string} userId - User ID for validation
   * @returns {Promise<ApiResponse>} Simulation result
   */
  async simulateInvestment(productId, amount, customTenure = null, userId = null) {
    try {
      // Validate inputs
      const idValidation = ValidationHelper.validateUUID(productId, 'Product ID');
      if (!idValidation.isValid) {
        return ApiResponse.error(idValidation.message, HTTP_STATUS.BAD_REQUEST);
      }

      if (!amount || isNaN(amount) || amount <= 0) {
        return ApiResponse.error(
          'Valid investment amount is required',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Get product details
      const product = await productModel.findById(productId);
      if (!product) {
        return ApiResponse.error(
          ERROR_MESSAGES.PRODUCT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Validate investment amount against product limits
      const amountValidation = ValidationHelper.validateInvestmentAmount(
        amount, 
        product.minInvestment, 
        product.maxInvestment
      );
      
      if (!amountValidation.isValid) {
        return ApiResponse.error(amountValidation.message, HTTP_STATUS.BAD_REQUEST);
      }

      // Run the simulation
      const simulation = await productModel.simulateInvestment(
        productId, 
        amount, 
        customTenure
      );

      // Add risk assessment if user provided
      if (userId) {
        try {
          const user = await this.getUserRiskProfile(userId);
          if (user) {
            simulation.riskAssessment = this.assessInvestmentRisk(simulation, user);
          }
        } catch (error) {
          console.warn('Risk assessment failed:', error.message);
        }
      }

      // Add comparative analysis
      simulation.comparativeAnalysis = await this.generateComparativeAnalysis(simulation);

      return ApiResponse.success(
        'Investment simulation completed successfully',
        simulation
      );

    } catch (error) {
      console.error('Simulate investment error:', error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Validate product data
   * @param {Object} productData - Product data to validate
   * @param {boolean} isCreate - Whether this is for creation (all fields required)
   * @returns {Object} Validation result
   */
  validateProductData(productData, isCreate = true) {
    const errors = [];

    // Required fields for creation
    if (isCreate) {
      if (!productData.name || productData.name.trim().length < 3) {
        errors.push('Product name must be at least 3 characters');
      }

      if (!productData.investmentType || !Object.values(INVESTMENT_TYPES).includes(productData.investmentType)) {
        errors.push('Valid investment type is required (bond, fd, mf, etf, other)');
      }

      if (!productData.tenureMonths || !Number.isInteger(productData.tenureMonths) || productData.tenureMonths <= 0) {
        errors.push('Valid tenure in months is required');
      }

      if (!productData.annualYield || isNaN(productData.annualYield) || productData.annualYield <= 0) {
        errors.push('Valid annual yield percentage is required');
      }

      if (!productData.riskLevel || !Object.values(RISK_LEVELS).includes(productData.riskLevel)) {
        errors.push('Valid risk level is required (low, moderate, high)');
      }
    }

    // Optional field validations
    if (productData.name && productData.name.trim().length > 255) {
      errors.push('Product name must not exceed 255 characters');
    }

    if (productData.tenureMonths && (!Number.isInteger(productData.tenureMonths) || productData.tenureMonths <= 0 || productData.tenureMonths > 600)) {
      errors.push('Tenure must be between 1 and 600 months');
    }

    if (productData.annualYield && (isNaN(productData.annualYield) || productData.annualYield < 0 || productData.annualYield > 50)) {
      errors.push('Annual yield must be between 0 and 50 percent');
    }

    if (productData.minInvestment && (isNaN(productData.minInvestment) || productData.minInvestment < 100)) {
      errors.push('Minimum investment must be at least ₹100');
    }

    if (productData.maxInvestment && productData.minInvestment && 
        productData.maxInvestment <= productData.minInvestment) {
      errors.push('Maximum investment must be greater than minimum investment');
    }

    if (productData.description && productData.description.length > 2000) {
      errors.push('Description must not exceed 2000 characters');
    }

    if (productData.issuer && productData.issuer.length > 255) {
      errors.push('Issuer name must not exceed 255 characters');
    }

    if (productData.creditRating && !/^[A-D][+-]?[A-D]*[+-]?$/.test(productData.creditRating)) {
      errors.push('Invalid credit rating format');
    }

    if (productData.earlyWithdrawalPenalty && (isNaN(productData.earlyWithdrawalPenalty) || 
        productData.earlyWithdrawalPenalty < 0 || productData.earlyWithdrawalPenalty > 10)) {
      errors.push('Early withdrawal penalty must be between 0 and 10 percent');
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors.join('; ') : null,
      errors
    };
  }

  /**
   * Validate filter parameters
   * @param {Object} filters - Filter object
   * @returns {Object} Validated filters
   */
  validateFilters(filters) {
    const validatedFilters = {};

    // Investment type
    if (filters.type && Object.values(INVESTMENT_TYPES).includes(filters.type)) {
      validatedFilters.type = filters.type;
    }

    // Risk level
    if (filters.riskLevel && Object.values(RISK_LEVELS).includes(filters.riskLevel)) {
      validatedFilters.riskLevel = filters.riskLevel;
    }

    // Yield range
    if (filters.minYield && !isNaN(filters.minYield) && filters.minYield >= 0) {
      validatedFilters.minYield = parseFloat(filters.minYield);
    }

    if (filters.maxYield && !isNaN(filters.maxYield) && filters.maxYield >= 0) {
      validatedFilters.maxYield = parseFloat(filters.maxYield);
    }

    // Tenure range
    if (filters.minTenure && !isNaN(filters.minTenure) && filters.minTenure > 0) {
      validatedFilters.minTenure = parseInt(filters.minTenure);
    }

    if (filters.maxTenure && !isNaN(filters.maxTenure) && filters.maxTenure > 0) {
      validatedFilters.maxTenure = parseInt(filters.maxTenure);
    }

    // Investment amount range
    if (filters.minInvestment && !isNaN(filters.minInvestment) && filters.minInvestment >= 0) {
      validatedFilters.minInvestment = parseFloat(filters.minInvestment);
    }

    if (filters.maxInvestment && !isNaN(filters.maxInvestment) && filters.maxInvestment >= 0) {
      validatedFilters.maxInvestment = parseFloat(filters.maxInvestment);
    }

    // Search
    if (filters.search && typeof filters.search === 'string') {
      validatedFilters.search = FormatHelper.sanitizeInput(filters.search.trim());
    }

    // Tax benefits
    if (filters.taxBenefits !== undefined) {
      validatedFilters.taxBenefits = filters.taxBenefits === true || filters.taxBenefits === 'true';
    }

    // Issuer
    if (filters.issuer && typeof filters.issuer === 'string') {
      validatedFilters.issuer = FormatHelper.sanitizeInput(filters.issuer.trim());
    }

    // Sort by
    const validSortOptions = ['yield', 'risk', 'tenure', 'popularity', 'name', 'created'];
    if (filters.sortBy && validSortOptions.includes(filters.sortBy)) {
      validatedFilters.sortBy = filters.sortBy;
    }

    return validatedFilters;
  }

  /**
   * Find product by name
   * @param {string} name - Product name
   * @returns {Promise<Object|null>} Product or null
   */
  async findProductByName(name) {
    try {
      const query = `
        SELECT id, name FROM investment_products 
        WHERE LOWER(name) = LOWER(?) AND is_active = TRUE
      `;
      
      const products = await databaseConfig.executeQuery(query, [name.trim()]);
      return products.length > 0 ? products[0] : null;

    } catch (error) {
      console.error('Find product by name error:', error);
      return null;
    }
  }

  /**
   * Get user risk profile
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User profile or null
   */
  async getUserRiskProfile(userId) {
    try {
      const query = `
        SELECT id, first_name, risk_appetite, account_balance, created_at
        FROM users 
        WHERE id = ? AND is_active = TRUE
      `;
      
      const users = await databaseConfig.executeQuery(query, [userId]);
      return users.length > 0 ? {
        id: users[0].id,
        firstName: users[0].first_name,
        riskAppetite: users[0].risk_appetite,
        accountBalance: parseFloat(users[0].account_balance),
        memberSince: users[0].created_at
      } : null;

    } catch (error) {
      console.error('Get user risk profile error:', error);
      return null;
    }
  }

  /**
   * Get user investment history
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Investment history summary
   */
  async getUserInvestmentHistory(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as totalInvestments,
          AVG(amount) as avgAmount,
          GROUP_CONCAT(DISTINCT p.investment_type) as types
        FROM investments i
        JOIN investment_products p ON i.product_id = p.id
        WHERE i.user_id = ?
      `;

      const result = await databaseConfig.executeQuery(query, [userId]);
      
      if (result.length === 0) {
        return {
          totalInvestments: 0,
          avgAmount: 0,
          preferredTypes: []
        };
      }

      const data = result[0];
      return {
        totalInvestments: data.totalInvestments || 0,
        avgAmount: parseFloat(data.avgAmount || 0),
        preferredTypes: data.types ? data.types.split(',') : []
      };

    } catch (error) {
      console.error('Get user investment history error:', error);
      return {
        totalInvestments: 0,
        avgAmount: 0,
        preferredTypes: []
      };
    }
  }

  /**
   * Log admin action
   * @param {string} adminUserId - Admin user ID
   * @param {string} action - Action type
   * @param {string} productId - Product ID
   * @param {Object} details - Action details
   */
  async logAdminAction(adminUserId, action, productId, details) {
    try {
      const query = `
        INSERT INTO transaction_logs (
          user_id, endpoint, http_method, status_code, 
          request_body, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;

      await databaseConfig.executeQuery(query, [
        adminUserId,
        `/admin/products/${productId}`,
        action,
        200,
        JSON.stringify(details)
      ]);

    } catch (error) {
      console.error('Log admin action error:', error);
    }
  }

  /**
   * Generate investment projections for a product
   * @param {Object} product - Product data
   * @returns {Array} Investment projections
   */
  generateInvestmentProjections(product) {
    const amounts = [10000, 25000, 50000, 100000];
    
    return amounts.map(amount => {
      if (amount < product.minInvestment || 
          (product.maxInvestment && amount > product.maxInvestment)) {
        return null;
      }

      const calculation = CalculationHelper.calculateReturns(
        amount,
        product.annualYield,
        product.tenureMonths,
        product.compoundFrequency
      );

      return {
        investment: amount,
        ...calculation,
        maturityDate: (product.tenureMonths && !isNaN(product.tenureMonths)) 
          ? CalculationHelper.calculateMaturityDate(new Date(), product.tenureMonths).toISOString().split('T')[0]
          : new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] // Default to 1 year if tenure is invalid
      };
    }).filter(Boolean);
  }

  /**
   * Find similar products
   * @param {Object} product - Reference product
   * @param {number} limit - Number of similar products
   * @returns {Promise<Array>} Similar products
   */
  async findSimilarProducts(product, limit = 5) {
    try {
      const query = `
        SELECT * FROM (
          SELECT p.*, 
            ABS(p.annual_yield - ?) as yield_diff,
            ABS(p.tenure_months - ?) as tenure_diff,
            CASE WHEN p.risk_level = ? THEN 0 ELSE 1 END as risk_diff,
            CASE WHEN p.investment_type = ? THEN 0 ELSE 1 END as type_diff
          FROM investment_products p
          WHERE p.id != ? AND p.is_active = TRUE
        ) similar
        ORDER BY (yield_diff * 0.3 + tenure_diff * 0.2 + risk_diff * 0.3 + type_diff * 0.2)
        LIMIT ?
      `;

      const similarProducts = await databaseConfig.executeQuery(query, [
        product.annualYield,
        product.tenureMonths,
        product.riskLevel,
        product.investmentType,
        product.id,
        limit
      ]);

      return similarProducts.map(p => ({
        id: p.id,
        name: p.name,
        investmentType: p.investment_type,
        annualYield: parseFloat(p.annual_yield),
        riskLevel: p.risk_level,
        tenureMonths: p.tenure_months,
        minInvestment: parseFloat(p.min_investment)
      }));

    } catch (error) {
      console.error('Find similar products error:', error);
      return [];
    }
  }

  /**
   * Generate personalized insights for a product
   * @param {Object} product - Product data
   * @param {Object} user - User data
   * @returns {Object} Personalized insights
   */
  async generatePersonalizedInsights(product, user) {
    const insights = {
      riskCompatibility: this.calculateRiskCompatibility(product.riskLevel, user.riskAppetite),
      affordabilityCheck: this.checkAffordability(product.minInvestment, user.accountBalance),
      suggestions: []
    };

    // Add specific suggestions based on user profile
    if (insights.riskCompatibility > 0.8) {
      insights.suggestions.push('This product matches your risk appetite perfectly');
    } else if (insights.riskCompatibility < 0.5) {
      insights.suggestions.push('Consider your risk tolerance before investing');
    }

    if (insights.affordabilityCheck.canInvest) {
      insights.suggestions.push(`You can invest up to ₹${insights.affordabilityCheck.maxAffordable.toLocaleString()}`);
    } else {
      insights.suggestions.push('Consider saving more before investing in this product');
    }

    return insights;
  }

  /**
   * Calculate risk compatibility score
   * @param {string} productRisk - Product risk level
   * @param {string} userRisk - User risk appetite
   * @returns {number} Compatibility score (0-1)
   */
  calculateRiskCompatibility(productRisk, userRisk) {
    const riskMatrix = {
      low: { low: 1.0, moderate: 0.7, high: 0.3 },
      moderate: { low: 0.6, moderate: 1.0, high: 0.8 },
      high: { low: 0.2, moderate: 0.7, high: 1.0 }
    };

    return riskMatrix[productRisk]?.[userRisk] || 0.5;
  }

  /**
   * Check affordability
   * @param {number} minInvestment - Minimum investment amount
   * @param {number} userBalance - User account balance
   * @returns {Object} Affordability check result
   */
  checkAffordability(minInvestment, userBalance) {
    const canInvest = userBalance >= minInvestment;
    const maxAffordable = Math.min(userBalance * 0.8, userBalance - 10000); // Keep some buffer

    return {
      canInvest,
      maxAffordable: Math.max(0, maxAffordable),
      shortfall: canInvest ? 0 : minInvestment - userBalance
    };
  }

  /**
   * Generate market insights
   * @param {Object} filters - Current filters
   * @returns {Promise<Object>} Market insights
   */
  async generateMarketInsights(filters) {
    try {
      // This would typically integrate with market data APIs
      // For now, we'll generate insights based on our data
      
      const insights = {
        marketTrend: 'stable',
        recommendations: [
          'Diversify across different investment types',
          'Consider your risk appetite when choosing products',
          'Long-term investments typically yield better returns'
        ],
        avgYield: await this.getAverageYield(filters.type),
        popularType: await this.getMostPopularType()
      };

      return insights;

    } catch (error) {
      console.error('Generate market insights error:', error);
      return {
        marketTrend: 'unknown',
        recommendations: [],
        avgYield: 0,
        popularType: 'unknown'
      };
    }
  }

  /**
   * Get average yield for investment type
   * @param {string} type - Investment type
   * @returns {Promise<number>} Average yield
   */
  async getAverageYield(type = null) {
    try {
      let query = 'SELECT AVG(annual_yield) as avg_yield FROM investment_products WHERE is_active = TRUE';
      let params = [];

      if (type) {
        query += ' AND investment_type = ?';
        params.push(type);
      }

      const result = await databaseConfig.executeQuery(query, params);
      return parseFloat(result[0]?.avg_yield || 0);

    } catch (error) {
      console.error('Get average yield error:', error);
      return 0;
    }
  }

  /**
   * Get most popular investment type
   * @returns {Promise<string>} Most popular type
   */
  async getMostPopularType() {
    try {
      const query = `
        SELECT p.investment_type, COUNT(i.id) as investment_count
        FROM investment_products p
        LEFT JOIN investments i ON p.id = i.product_id
        WHERE p.is_active = TRUE
        GROUP BY p.investment_type
        ORDER BY investment_count DESC
        LIMIT 1
      `;

      const result = await databaseConfig.executeQuery(query);
      return result[0]?.investment_type || 'fd';

    } catch (error) {
      console.error('Get most popular type error:', error);
      return 'fd';
    }
  }

  /**
   * Analyze trends in products
   * @param {Array} products - Product list
   * @param {number} days - Analysis period
   * @returns {Object} Trend analysis
   */
  async analyzeTrends(products, days) {
    const analysis = {
      totalTrendingProducts: products.length,
      avgYield: 0,
      dominantRiskLevel: 'moderate',
      dominantType: 'fd',
      insights: []
    };

    if (products.length === 0) {
      return analysis;
    }

    // Calculate averages
    analysis.avgYield = products.reduce((sum, p) => sum + p.annualYield, 0) / products.length;

    // Find dominant categories
    const riskCounts = {};
    const typeCounts = {};

    products.forEach(product => {
      riskCounts[product.riskLevel] = (riskCounts[product.riskLevel] || 0) + 1;
      typeCounts[product.investmentType] = (typeCounts[product.investmentType] || 0) + 1;
    });

    analysis.dominantRiskLevel = Object.keys(riskCounts)
      .reduce((a, b) => riskCounts[a] > riskCounts[b] ? a : b);
    
    analysis.dominantType = Object.keys(typeCounts)
      .reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);

    // Generate insights
    analysis.insights.push(`${analysis.dominantType.toUpperCase()} products are trending`);
    analysis.insights.push(`${analysis.dominantRiskLevel} risk products are popular`);
    
    if (analysis.avgYield > 10) {
      analysis.insights.push('High-yield products are gaining attention');
    }

    return analysis;
  }

  /**
   * Generate category insights
   * @param {Array} categories - Category data
   * @returns {Object} Category insights
   */
  generateCategoryInsights(categories) {
    const insights = {
      mostPopular: null,
      highestYield: null,
      mostInvested: null,
      recommendations: []
    };

    if (categories.length === 0) {
      return insights;
    }

    // Find most popular by product count
    insights.mostPopular = categories.reduce((prev, current) => 
      (prev.productCount > current.productCount) ? prev : current
    );

    // Find highest yield
    insights.highestYield = categories.reduce((prev, current) => 
      (parseFloat(prev.avgYield) > parseFloat(current.avgYield)) ? prev : current
    );

    // Find most invested
    insights.mostInvested = categories.reduce((prev, current) => 
      (prev.totalInvested > current.totalInvested) ? prev : current
    );

    // Generate recommendations
    insights.recommendations.push(`${insights.mostPopular.type.toUpperCase()} has the most product options`);
    insights.recommendations.push(`${insights.highestYield.type.toUpperCase()} offers highest average returns`);
    
    if (insights.mostInvested.type !== insights.mostPopular.type) {
      insights.recommendations.push(`${insights.mostInvested.type.toUpperCase()} attracts most investment volume`);
    }

    return insights;
  }

  /**
   * Assess investment risk for simulation
   * @param {Object} simulation - Simulation data
   * @param {Object} user - User data
   * @returns {Object} Risk assessment
   */
  assessInvestmentRisk(simulation, user) {
    const assessment = {
      riskScore: 0, // 0-10 scale
      compatibility: 'medium',
      warnings: [],
      recommendations: []
    };

    // Calculate risk score based on various factors
    const riskWeights = { low: 2, moderate: 5, high: 8 };
    assessment.riskScore = riskWeights[simulation.riskLevel] || 5;

    // Check compatibility with user risk appetite
    const compatibility = this.calculateRiskCompatibility(simulation.riskLevel, user.riskAppetite);
    
    if (compatibility > 0.8) {
      assessment.compatibility = 'high';
    } else if (compatibility < 0.5) {
      assessment.compatibility = 'low';
      assessment.warnings.push('This investment may not match your risk appetite');
    }

    // Check investment amount vs user balance
    if (simulation.principal > user.accountBalance * 0.5) {
      assessment.warnings.push('Consider not investing more than 50% of your balance in a single product');
    }

    // Add recommendations
    if (simulation.riskLevel === 'high' && user.riskAppetite === 'low') {
      assessment.recommendations.push('Consider lower-risk alternatives');
    }

    if (simulation.tenureMonths > 60) {
      assessment.recommendations.push('Long-term investments require patience but often yield better returns');
    }

    return assessment;
  }

  /**
   * Generate comparative analysis for simulation
   * @param {Object} simulation - Simulation data
   * @returns {Promise<Object>} Comparative analysis
   */
  async generateComparativeAnalysis(simulation) {
    try {
      // Find similar products for comparison
      const comparison = await this.findSimilarProducts({
        id: simulation.productId,
        annualYield: simulation.annualYield,
        tenureMonths: simulation.tenureMonths,
        riskLevel: simulation.riskLevel,
        investmentType: 'fd' // This would come from the actual product
      }, 3);

      const analysis = {
        similarProducts: comparison.length,
        rankingByYield: 'medium', // This would be calculated based on actual comparison
        marketPosition: 'competitive',
        alternatives: comparison.slice(0, 2).map(product => ({
          name: product.name,
          yield: product.annualYield,
          riskLevel: product.riskLevel,
          minInvestment: product.minInvestment
        }))
      };

      return analysis;

    } catch (error) {
      console.error('Generate comparative analysis error:', error);
      return {
        similarProducts: 0,
        rankingByYield: 'unknown',
        marketPosition: 'unknown',
        alternatives: []
      };
    }
  }

  /**
   * Add personalization scores to products
   * @param {Array} products - Product list
   * @param {string} userRiskAppetite - User's risk appetite
   * @returns {Array} Products with personalization scores
   */
  addPersonalizationScores(products, userRiskAppetite) {
    return products.map(product => ({
      ...product,
      personalizedScore: this.calculateRiskCompatibility(product.riskLevel, userRiskAppetite),
      personalizedRanking: 'medium' // This would be calculated relative to other products
    }));
  }
}

module.exports = new ProductService();