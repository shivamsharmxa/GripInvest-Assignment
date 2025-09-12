const { databaseConfig } = require('../config/database');
const { FormatHelper, PaginationHelper } = require('../utils/helpers');
const { INVESTMENT_TYPES, RISK_LEVELS } = require('../utils/constants');

/**
 * Investment Product Model Class
 * Handles all database operations related to investment products
 */
class ProductModel {
  constructor() {
    this.tableName = 'investment_products';
  }

  /**
   * Create a new investment product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product data
   */
  async create(productData) {
    try {
      const productId = FormatHelper.generateUUID();
      
      const query = `
        INSERT INTO ${this.tableName} (
          id, name, investment_type, tenure_months, annual_yield, 
          risk_level, min_investment, max_investment, description, 
          issuer, credit_rating, liquidity_level, tax_benefits, 
          compound_frequency, early_withdrawal_penalty, is_active, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const params = [
        productId,
        productData.name,
        productData.investmentType,
        productData.tenureMonths,
        productData.annualYield,
        productData.riskLevel,
        productData.minInvestment || 1000.00,
        productData.maxInvestment || null,
        productData.description || null,
        productData.issuer || null,
        productData.creditRating || null,
        productData.liquidityLevel || 'medium',
        productData.taxBenefits || false,
        productData.compoundFrequency || 'annually',
        productData.earlyWithdrawalPenalty || 0.00,
        productData.isActive !== false
      ];

      await databaseConfig.executeQuery(query, params);

      // Return created product
      return this.findById(productId);

    } catch (error) {
      console.error('Product creation error:', error);
      throw error;
    }
  }

  /**
   * Find product by ID with investment statistics
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Product data with statistics
   */
  async findById(productId) {
    try {
      const query = `
        SELECT p.*,
          COUNT(i.id) as total_investments,
          COUNT(DISTINCT i.user_id) as total_investors,
          COALESCE(SUM(i.amount), 0) as total_amount_invested,
          COALESCE(AVG(i.amount), 0) as avg_investment_amount,
          COALESCE(SUM(i.current_value), 0) as total_current_value,
          CASE 
            WHEN COUNT(i.id) > 0 THEN 
              ((SUM(i.current_value) - SUM(i.amount)) / SUM(i.amount)) * 100
            ELSE 0 
          END as actual_return_percentage
        FROM ${this.tableName} p
        LEFT JOIN investments i ON p.id = i.product_id AND i.status = 'active'
        WHERE p.id = ?
        GROUP BY p.id
      `;

      const products = await databaseConfig.executeQuery(query, [productId]);
      
      if (products.length === 0) {
        return null;
      }

      return this.formatProductData(products[0]);

    } catch (error) {
      console.error('Find product by ID error:', error);
      throw error;
    }
  }

  /**
   * Find products with advanced filtering and pagination
   * @param {Object} filters - Search and filter criteria
   * @param {Object} pagination - Pagination parameters
   * @returns {Promise<Object>} Products and metadata
   */
  async findWithFilters(filters = {}, pagination = {}) {
    try {
      const { offset, limit } = PaginationHelper.getPaginationParams({ 
        query: pagination 
      });

      let whereConditions = ['p.is_active = TRUE'];
      let params = [];

      // Investment type filter
      if (filters.type && Object.values(INVESTMENT_TYPES).includes(filters.type)) {
        whereConditions.push('p.category = ?');
        params.push(filters.type);
      }

      // Risk level filter
      if (filters.riskLevel && Object.values(RISK_LEVELS).includes(filters.riskLevel)) {
        whereConditions.push('p.risk_level = ?');
        params.push(filters.riskLevel);
      }

      // Yield range filter
      if (filters.minYield) {
        whereConditions.push('p.expected_return >= ?');
        params.push(parseFloat(filters.minYield));
      }

      if (filters.maxYield) {
        whereConditions.push('p.expected_return <= ?');
        params.push(parseFloat(filters.maxYield));
      }

      // Tenure filter
      if (filters.minTenure) {
        whereConditions.push('p.tenure >= ?');
        params.push(parseInt(filters.minTenure));
      }

      if (filters.maxTenure) {
        whereConditions.push('p.tenure <= ?');
        params.push(parseInt(filters.maxTenure));
      }

      // Investment amount filter
      if (filters.minInvestment) {
        whereConditions.push('p.min_investment <= ?');
        params.push(parseFloat(filters.minInvestment));
      }

      if (filters.maxInvestment) {
        whereConditions.push('(p.max_investment IS NULL OR p.max_investment >= ?)');
        params.push(parseFloat(filters.maxInvestment));
      }

      // Search filter
      if (filters.search) {
        whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.issuer LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Tax benefits filter
      if (filters.taxBenefits !== undefined) {
        whereConditions.push('p.tax_benefits = ?');
        params.push(filters.taxBenefits);
      }

      // Issuer filter
      if (filters.issuer) {
        whereConditions.push('p.issuer LIKE ?');
        params.push(`%${filters.issuer}%`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Build sort clause
      let sortClause = 'ORDER BY ';
      switch (filters.sortBy) {
        case 'yield':
          sortClause += 'p.expected_return DESC';
          break;
        case 'risk':
          sortClause += 'FIELD(p.risk_level, "low", "moderate", "high")';
          break;
        case 'tenure':
          sortClause += 'p.tenure ASC';
          break;
        case 'popularity':
          sortClause += 'p.created_at DESC';
          break;
        case 'name':
          sortClause += 'p.name ASC';
          break;
        case 'created':
          sortClause += 'p.created_at DESC';
          break;
        default:
          sortClause += 'p.expected_return DESC, p.created_at DESC';
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM ${this.tableName} p
        WHERE ${whereClause}
      `;

      const countResult = await databaseConfig.executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get products (simplified query for now)
      const productsQuery = `
        SELECT p.* 
        FROM ${this.tableName} p
        WHERE ${whereClause}
        ${sortClause}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const products = await databaseConfig.executeQuery(
        productsQuery, 
        params
      );

      return {
        products: products.map(product => this.formatProductData(product)),
        pagination: PaginationHelper.formatPaginatedResponse(
          [], total, pagination.page || 1, limit
        ).pagination,
        total,
        filters: filters
      };

    } catch (error) {
      console.error('Find products with filters error:', error);
      throw error;
    }
  }

  /**
   * Update product data
   * @param {string} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product data
   */
  async update(productId, updateData) {
    try {
      const updateFields = [];
      const updateParams = [];

      // Build dynamic update query
      const allowedFields = {
        name: 'name',
        investmentType: 'category',
        tenureMonths: 'tenure',
        annualYield: 'expected_return',
        riskLevel: 'risk_level',
        minInvestment: 'min_investment',
        maxInvestment: 'max_investment',
        description: 'description',
        issuer: 'issuer',
        creditRating: 'rating',
        liquidityLevel: 'liquidity_level',
        taxBenefits: 'tax_benefits',
        compoundFrequency: 'compound_frequency',
        earlyWithdrawalPenalty: 'early_withdrawal_penalty',
        isActive: 'is_active'
      };

      Object.keys(allowedFields).forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${allowedFields[field]} = ?`);
          updateParams.push(updateData[field]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at and product ID
      updateFields.push('updated_at = NOW()');
      updateParams.push(productId);

      const query = `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ?`;
      const result = await databaseConfig.executeQuery(query, updateParams);

      if (result.affectedRows === 0) {
        throw new Error('Product not found or no changes made');
      }

      // Return updated product
      return this.findById(productId);

    } catch (error) {
      console.error('Product update error:', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete with safety checks)
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(productId) {
    try {
      // Check if product has active investments
      const investmentQuery = `
        SELECT COUNT(*) as active_investments
        FROM investments
        WHERE product_id = ? AND status = 'active'
      `;

      const investmentResult = await databaseConfig.executeQuery(investmentQuery, [productId]);
      
      if (investmentResult[0].active_investments > 0) {
        throw new Error('Cannot delete product with active investments');
      }

      // Soft delete (set inactive)
      const query = `
        UPDATE ${this.tableName} 
        SET is_active = FALSE, updated_at = NOW() 
        WHERE id = ?
      `;

      const result = await databaseConfig.executeQuery(query, [productId]);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Product deletion error:', error);
      throw error;
    }
  }

  /**
   * Get trending products based on recent investment activity
   * @param {number} limit - Number of products to return
   * @param {number} days - Days to look back for trending calculation
   * @returns {Promise<Array>} Trending products
   */
  async getTrendingProducts(limit = 10, days = 30) {
    try {
      const query = `
        SELECT p.*,
          COUNT(i.id) as recent_investments,
          COUNT(DISTINCT i.user_id) as recent_investors,
          SUM(i.amount) as recent_investment_amount,
          (COUNT(i.id) * 0.5 + COUNT(DISTINCT i.user_id) * 0.3 + 
           (SUM(i.amount) / 100000) * 0.2) as trending_score
        FROM ${this.tableName} p
        LEFT JOIN investments i ON p.id = i.product_id 
          AND i.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND i.status = 'active'
        WHERE p.is_active = TRUE
        GROUP BY p.id
        ORDER BY trending_score DESC, p.expected_return DESC
        LIMIT ?
      `;

      const products = await databaseConfig.executeQuery(query, [days, limit]);
      return products.map(product => this.formatProductData(product));

    } catch (error) {
      console.error('Get trending products error:', error);
      throw error;
    }
  }

  /**
   * Get product categories with statistics
   * @returns {Promise<Array>} Product categories with counts
   */
  async getCategories() {
    try {
      const query = `
        SELECT 
          p.category as type,
          COUNT(p.id) as product_count,
          COUNT(i.id) as total_investments,
          AVG(p.expected_return) as avg_yield,
          MIN(p.min_investment) as min_investment,
          MAX(COALESCE(p.max_investment, p.min_investment)) as max_investment,
          SUM(i.amount) as total_invested
        FROM ${this.tableName} p
        LEFT JOIN investments i ON p.id = i.product_id AND i.status = 'active'
        WHERE p.is_active = TRUE
        GROUP BY p.category
        ORDER BY product_count DESC
      `;

      const categories = await databaseConfig.executeQuery(query);
      
      return categories.map(category => ({
        type: category.type,
        productCount: category.product_count,
        totalInvestments: category.total_investments || 0,
        avgYield: parseFloat(category.avg_yield || 0).toFixed(2),
        minInvestment: parseFloat(category.min_investment || 0),
        maxInvestment: parseFloat(category.max_investment || 0),
        totalInvested: parseFloat(category.total_invested || 0)
      }));

    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  /**
   * Get products recommended for a specific user based on risk appetite
   * @param {string} riskAppetite - User's risk appetite
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Recommended products
   */
  async getRecommendedProducts(riskAppetite, limit = 10) {
    try {
      // Create risk-based scoring
      let riskScoring = '';
      switch (riskAppetite) {
        case 'low':
          riskScoring = `
            CASE p.risk_level 
              WHEN 'low' THEN 3 
              WHEN 'moderate' THEN 1 
              ELSE 0 
            END
          `;
          break;
        case 'moderate':
          riskScoring = `
            CASE p.risk_level 
              WHEN 'moderate' THEN 3 
              WHEN 'low' THEN 2 
              WHEN 'high' THEN 1 
            END
          `;
          break;
        case 'high':
          riskScoring = `
            CASE p.risk_level 
              WHEN 'high' THEN 3 
              WHEN 'moderate' THEN 2 
              WHEN 'low' THEN 1 
            END
          `;
          break;
        default:
          riskScoring = '2'; // Default moderate scoring
      }

      const query = `
        SELECT p.*,
          COUNT(i.id) as total_investments,
          COUNT(DISTINCT i.user_id) as total_investors,
          COALESCE(SUM(i.amount), 0) as total_amount_invested,
          (${riskScoring} * 0.4 + 
           (p.expected_return / 20) * 0.3 + 
           (COUNT(i.id) / 100) * 0.2 + 
           0.1) as recommendation_score
        FROM ${this.tableName} p
        LEFT JOIN investments i ON p.id = i.product_id AND i.status = 'active'
        WHERE p.is_active = TRUE
        GROUP BY p.id
        HAVING recommendation_score > 0
        ORDER BY recommendation_score DESC, p.expected_return DESC
        LIMIT ?
      `;

      const products = await databaseConfig.executeQuery(query, [limit]);
      return products.map(product => this.formatProductData(product));

    } catch (error) {
      console.error('Get recommended products error:', error);
      throw error;
    }
  }

  /**
   * Get product performance analytics
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Performance analytics
   */
  async getProductAnalytics(productId) {
    try {
      const analyticsQuery = `
        SELECT 
          p.name,
          p.expected_return as expected_yield,
          COUNT(i.id) as total_investments,
          COUNT(DISTINCT i.user_id) as unique_investors,
          MIN(i.created_at) as first_investment,
          MAX(i.created_at) as latest_investment,
          SUM(i.amount) as total_invested,
          SUM(i.current_value) as current_portfolio_value,
          AVG(i.amount) as avg_investment_size,
          MIN(i.amount) as min_investment_size,
          MAX(i.amount) as max_investment_size,
          ((SUM(i.current_value) - SUM(i.amount)) / SUM(i.amount)) * 100 as actual_return_percentage,
          COUNT(CASE WHEN i.status = 'active' THEN 1 END) as active_investments,
          COUNT(CASE WHEN i.status = 'matured' THEN 1 END) as matured_investments,
          COUNT(CASE WHEN i.status = 'cancelled' THEN 1 END) as cancelled_investments
        FROM ${this.tableName} p
        LEFT JOIN investments i ON p.id = i.product_id
        WHERE p.id = ?
        GROUP BY p.id
      `;

      const analytics = await databaseConfig.executeQuery(analyticsQuery, [productId]);
      
      if (analytics.length === 0) {
        return null;
      }

      const data = analytics[0];
      
      // Get investment distribution by risk appetite
      const riskDistributionQuery = `
        SELECT 
          u.risk_appetite,
          COUNT(i.id) as investment_count,
          SUM(i.amount) as total_amount
        FROM investments i
        JOIN users u ON i.user_id = u.id
        WHERE i.product_id = ?
        GROUP BY u.risk_appetite
        ORDER BY investment_count DESC
      `;

      const riskDistribution = await databaseConfig.executeQuery(riskDistributionQuery, [productId]);

      // Get monthly investment trends
      const trendsQuery = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as investment_count,
          SUM(amount) as monthly_investment
        FROM investments
        WHERE product_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
      `;

      const trends = await databaseConfig.executeQuery(trendsQuery, [productId]);

      return {
        productName: data.name,
        expectedYield: parseFloat(data.expected_yield || 0),
        totalInvestments: data.total_investments || 0,
        uniqueInvestors: data.unique_investors || 0,
        firstInvestment: data.first_investment,
        latestInvestment: data.latest_investment,
        totalInvested: parseFloat(data.total_invested || 0),
        currentPortfolioValue: parseFloat(data.current_portfolio_value || 0),
        avgInvestmentSize: parseFloat(data.avg_investment_size || 0),
        minInvestmentSize: parseFloat(data.min_investment_size || 0),
        maxInvestmentSize: parseFloat(data.max_investment_size || 0),
        actualReturnPercentage: parseFloat(data.actual_return_percentage || 0),
        statusDistribution: {
          active: data.active_investments || 0,
          matured: data.matured_investments || 0,
          cancelled: data.cancelled_investments || 0
        },
        riskDistribution: riskDistribution.map(item => ({
          riskAppetite: item.risk_appetite,
          investmentCount: item.investment_count,
          totalAmount: parseFloat(item.total_amount)
        })),
        monthlyTrends: trends.map(item => ({
          month: item.month,
          investmentCount: item.investment_count,
          monthlyInvestment: parseFloat(item.monthly_investment)
        }))
      };

    } catch (error) {
      console.error('Get product analytics error:', error);
      throw error;
    }
  }

  /**
   * Calculate investment simulation for a product
   * @param {string} productId - Product ID
   * @param {number} amount - Investment amount
   * @param {number} customTenure - Custom tenure in months (optional)
   * @returns {Promise<Object>} Investment simulation results
   */
  async simulateInvestment(productId, amount, customTenure = null) {
    try {
      const product = await this.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const principal = parseFloat(amount);
      const annualRate = parseFloat(product.annualYield) / 100;
      const tenureMonths = customTenure || product.tenureMonths;
      const tenureYears = tenureMonths / 12;

      // Get compound frequency
      const frequencies = {
        daily: 365,
        monthly: 12,
        quarterly: 4,
        annually: 1
      };

      const compoundingFreq = frequencies[product.compoundFrequency] || 1;

      // Compound interest calculation: A = P(1 + r/n)^(nt)
      const finalAmount = principal * Math.pow(
        (1 + annualRate / compoundingFreq), 
        (compoundingFreq * tenureYears)
      );

      const totalReturns = finalAmount - principal;
      const returnPercentage = (totalReturns / principal) * 100;

      // Calculate maturity date
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

      // Generate monthly projections
      const monthlyProjections = [];
      for (let month = 1; month <= tenureMonths; month++) {
        const currentTime = month / 12;
        const currentValue = principal * Math.pow(
          (1 + annualRate / compoundingFreq), 
          (compoundingFreq * currentTime)
        );
        
        monthlyProjections.push({
          month,
          value: parseFloat(currentValue.toFixed(2)),
          returns: parseFloat((currentValue - principal).toFixed(2)),
          returnPercentage: parseFloat(((currentValue - principal) / principal * 100).toFixed(2))
        });
      }

      return {
        productId,
        productName: product.name,
        principal: parseFloat(principal.toFixed(2)),
        annualYield: product.annualYield,
        tenureMonths,
        tenureYears: parseFloat(tenureYears.toFixed(2)),
        compoundFrequency: product.compoundFrequency,
        finalAmount: parseFloat(finalAmount.toFixed(2)),
        totalReturns: parseFloat(totalReturns.toFixed(2)),
        returnPercentage: parseFloat(returnPercentage.toFixed(2)),
        maturityDate: maturityDate.toISOString().split('T')[0],
        monthlyProjections,
        riskLevel: product.riskLevel,
        taxBenefits: product.taxBenefits,
        earlyWithdrawalPenalty: product.earlyWithdrawalPenalty
      };

    } catch (error) {
      console.error('Investment simulation error:', error);
      throw error;
    }
  }

  /**
   * Check if product exists
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Whether product exists
   */
  async exists(productId) {
    try {
      const query = `SELECT id FROM ${this.tableName} WHERE id = ? AND is_active = TRUE`;
      const products = await databaseConfig.executeQuery(query, [productId]);
      return products.length > 0;

    } catch (error) {
      console.error('Product exists check error:', error);
      throw error;
    }
  }

  /**
   * Helper method to safely parse JSON fields
   * @param {string} jsonString - JSON string to parse
   * @param {any} defaultValue - Default value if parsing fails
   * @returns {any} Parsed JSON or default value
   */
  parseJsonField(jsonString, defaultValue) {
    if (!jsonString) return defaultValue;
    
    try {
      // Handle case where the field is already parsed (array/object)
      if (Array.isArray(jsonString) || typeof jsonString === 'object') {
        return jsonString;
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to parse JSON field:', jsonString);
      return defaultValue;
    }
  }

  /**
   * Format product data for response
   * @param {Object} productData - Raw product data from database
   * @returns {Object} Formatted product data
   */
  formatProductData(productData) {
    return {
      id: productData.id,
      name: productData.name,
      category: productData.category || 'Corporate Bonds',
      investmentType: productData.category,
      tenure: productData.tenure || 24,
      tenureMonths: productData.tenure,
      expectedReturn: parseFloat(productData.expected_return),
      annualYield: parseFloat(productData.expected_return),
      riskLevel: productData.risk_level,
      minInvestment: parseFloat(productData.min_investment),
      maxInvestment: productData.max_investment ? parseFloat(productData.max_investment) : null,
      totalSize: productData.total_size ? parseFloat(productData.total_size) : 100000000,
      availableSize: productData.available_size ? parseFloat(productData.available_size) : 50000000,
      description: productData.description,
      detailedDescription: productData.description,
      issuer: productData.issuer,
      rating: productData.rating || 'AA',
      creditRating: productData.credit_rating,
      liquidityLevel: productData.liquidity_level,
      taxBenefits: !!productData.tax_benefits,
      compoundFrequency: productData.compound_frequency,
      earlyWithdrawalPenalty: parseFloat(productData.early_withdrawal_penalty || 0),
      isActive: !!productData.is_active,
      createdAt: productData.created_at,
      updatedAt: productData.updated_at,
      
      // Add missing array properties with defaults
      keyHighlights: this.parseJsonField(productData.key_highlights, [
        'Strong credit rating',
        'Regular income payments',
        'Minimum investment amount',
        'Professional management'
      ]),
      features: this.parseJsonField(productData.features, [
        'Regular Interest Payments',
        'Credit Enhancement',
        'Listed on Exchange',
        'High Liquidity',
        'Investment Grade Rating',
        'Tax Efficient'
      ]),
      documents: this.parseJsonField(productData.documents, [
        { name: 'Information Memorandum', url: '#' },
        { name: 'Financial Statements', url: '#' },
        { name: 'Rating Report', url: '#' },
        { name: 'Terms & Conditions', url: '#' }
      ]),
      risks: this.parseJsonField(productData.risks, [
        'Credit risk - Risk of issuer default',
        'Interest rate risk - Bond prices may fluctuate',
        'Liquidity risk - May face liquidity constraints',
        'Market risk - Subject to market volatility'
      ]),
      
      // Additional properties needed by frontend
      ratingAgency: 'CRISIL',
      interestPayment: 'Quarterly',
      maturityDate: new Date(Date.now() + (productData.tenure || 24) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      listingExchange: 'NSE',
      isin: `INE${Math.random().toString().substr(2, 9)}`,
      
      // Statistics (if available)
      statistics: {
        totalInvestments: productData.total_investments || 0,
        totalInvestors: productData.total_investors || 0,
        totalAmountInvested: parseFloat(productData.total_amount_invested || 0),
        avgInvestmentAmount: parseFloat(productData.avg_investment_amount || 0),
        totalCurrentValue: parseFloat(productData.total_current_value || 0),
        actualReturnPercentage: parseFloat(productData.actual_return_percentage || 0),
        
        // Additional metrics (if calculated)
        ...(productData.trending_score && {
          trendingScore: parseFloat(productData.trending_score)
        }),
        ...(productData.recommendation_score && {
          recommendationScore: parseFloat(productData.recommendation_score)
        }),
        ...(productData.recent_investments && {
          recentInvestments: productData.recent_investments,
          recentInvestors: productData.recent_investors,
          recentInvestmentAmount: parseFloat(productData.recent_investment_amount || 0)
        })
      }
    };
  }
}

module.exports = new ProductModel();