const investmentModel = require("../models/investmentModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const aiService = require("./aiService");
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INVESTMENT_STATUS,
} = require("../utils/constants");
const {
  ApiResponse,
  ValidationHelper,
  CalculationHelper,
} = require("../utils/helpers");

/**
 * Investment Service
 * Business rules for creating and managing investments
 */
class InvestmentService {
  /**
   * Create investment after validations
   */
  async createInvestment(userId, productId, amount, options = {}) {
    try {
      // Validate inputs
      const idValidation = ValidationHelper.validateUUID(
        productId,
        "Product ID"
      );
      if (!idValidation.isValid) {
        return ApiResponse.error(idValidation.message, HTTP_STATUS.BAD_REQUEST);
      }
      if (!amount || isNaN(amount) || amount <= 0) {
        return ApiResponse.error(
          "Valid investment amount is required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Fetch product and user
      const product = await productModel.findById(productId);
      if (!product || !product.isActive) {
        return ApiResponse.error(
          ERROR_MESSAGES.PRODUCT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      const user = await userModel.findById(userId);
      if (!user || !user.isActive) {
        return ApiResponse.error(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Check min/max amount
      const amountValidation = ValidationHelper.validateInvestmentAmount(
        amount,
        product.minInvestment,
        product.maxInvestment
      );
      if (!amountValidation.isValid) {
        return ApiResponse.error(
          amountValidation.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Check balance
      if (user.accountBalance < amount) {
        return ApiResponse.error(
          ERROR_MESSAGES.INSUFFICIENT_BALANCE,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Calculate simple projection to prefill expected_return/maturity_date (DB trigger will also compute)
      const calc = CalculationHelper.calculateReturns(
        parseFloat(amount),
        product.annualYield,
        options.customTenure || product.tenureMonths,
        product.compoundFrequency
      );

      const maturityDate = CalculationHelper.calculateMaturityDate(
        new Date(),
        options.customTenure || product.tenureMonths
      )
        .toISOString()
        .split("T")[0];

      // Create investment
      const investment = await investmentModel.create({
        userId,
        productId,
        amount: parseFloat(amount),
        status: INVESTMENT_STATUS.ACTIVE,
        expectedReturn: calc.finalAmount,
        maturityDate,
        currentValue: parseFloat(amount),
        notes: options.notes || null,
        autoReinvest: !!options.autoReinvest,
      });

      // Deduct balance (safeguarded at DB level too via trigger pattern in schema)
      await userModel.updateBalance(userId, parseFloat(amount), "subtract");

      return ApiResponse.success(
        SUCCESS_MESSAGES.INVESTMENT_CREATED,
        investment,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error("Create investment error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get user's portfolio with aggregates and distributions
   */
  async getPortfolio(userId, pagination = {}, filters = {}) {
    try {
      const [summary, list, distribution] = await Promise.all([
        investmentModel.getPortfolioSummary(userId),
        investmentModel.findByUser(userId, filters, pagination),
        investmentModel.getDistribution(userId),
      ]);

      return ApiResponse.success("Portfolio fetched successfully", {
        summary,
        distribution,
        investments: list.investments,
        pagination: list.pagination,
        total: list.total,
      });
    } catch (error) {
      console.error("Get portfolio error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get single investment
   */
  async getInvestment(userId, investmentId) {
    try {
      const idValidation = ValidationHelper.validateUUID(
        investmentId,
        "Investment ID"
      );
      if (!idValidation.isValid) {
        return ApiResponse.error(idValidation.message, HTTP_STATUS.BAD_REQUEST);
      }
      const investment = await investmentModel.findById(investmentId);
      if (!investment || investment.userId !== userId) {
        return ApiResponse.error(
          ERROR_MESSAGES.INVESTMENT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }
      return ApiResponse.success("Investment fetched successfully", investment);
    } catch (error) {
      console.error("Get investment error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update investment fields (notes, autoReinvest)
   */
  async updateInvestment(userId, investmentId, update) {
    try {
      const existing = await investmentModel.findById(investmentId);
      if (!existing || existing.userId !== userId) {
        return ApiResponse.error(
          ERROR_MESSAGES.INVESTMENT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }
      const updated = await investmentModel.update(investmentId, {
        notes: update.notes,
        autoReinvest: update.autoReinvest,
      });
      return ApiResponse.success("Investment updated", updated);
    } catch (error) {
      console.error("Update investment error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancel investment and refund amount to balance (simple policy)
   */
  async cancelInvestment(userId, investmentId) {
    try {
      const investment = await investmentModel.findById(investmentId);
      if (!investment || investment.userId !== userId) {
        return ApiResponse.error(
          ERROR_MESSAGES.INVESTMENT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }
      if (investment.status !== INVESTMENT_STATUS.ACTIVE) {
        return ApiResponse.error(
          "Only active investments can be cancelled",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const success = await investmentModel.cancel(investmentId, userId);
      if (!success) {
        return ApiResponse.error(
          "Unable to cancel investment",
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
      }

      // Simple refund policy: refund principal (ignoring penalties)
      await userModel.updateBalance(userId, investment.amount, "add");

      return ApiResponse.success("Investment cancelled successfully");
    } catch (error) {
      console.error("Cancel investment error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate AI portfolio insights
   */
  async getPortfolioInsights(userId, userGoals = {}) {
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return ApiResponse.error(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Build current portfolio snapshot
      const list = await investmentModel.findByUser(
        userId,
        { status: INVESTMENT_STATUS.ACTIVE },
        { page: 1, limit: 100 }
      );
      const allocation = {};
      let totalValue = 0;
      list.investments.forEach((inv) => {
        const key = inv.product?.investmentType || "other";
        const value = inv.currentValue || inv.amount;
        totalValue += value;
        allocation[key] = (allocation[key] || 0) + value;
      });
      const allocationPct = Object.fromEntries(
        Object.entries(allocation).map(([k, v]) => [
          k,
          parseFloat(((v / (totalValue || 1)) * 100).toFixed(2)),
        ])
      );

      const currentPortfolio = {
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalInvestments: list.total,
        allocation: Object.fromEntries(
          Object.entries(allocation).map(([k, v]) => [
            k,
            { value: parseFloat(v.toFixed(2)), percentage: allocationPct[k] },
          ])
        ),
      };

      const insights = await aiService.optimizePortfolio(
        currentPortfolio,
        userGoals
      );

      return ApiResponse.success("Portfolio insights generated", {
        currentPortfolio,
        insights,
      });
    } catch (error) {
      console.error("Portfolio insights error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new InvestmentService();
