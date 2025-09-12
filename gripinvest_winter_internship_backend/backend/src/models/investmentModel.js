const { databaseConfig } = require("../config/database");
const { FormatHelper, PaginationHelper } = require("../utils/helpers");
const { INVESTMENT_STATUS } = require("../utils/constants");

/**
 * Investment Model Class
 * Handles database operations for investments
 */
class InvestmentModel {
  constructor() {
    this.tableName = "investments";
  }

  /**
   * Create a new investment
   * @param {Object} data - investment data
   * @returns {Promise<Object>} created investment
   */
  async create(data) {
    const id = FormatHelper.generateUUID();
    const query = `
      INSERT INTO ${this.tableName} (
        id, user_id, product_id, amount, status, expected_return,
        maturity_date, current_value, notes, auto_reinvest, tenure
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      data.userId,
      data.productId,
      data.amount,
      data.status || INVESTMENT_STATUS.ACTIVE,
      data.expectedReturn || null,
      data.maturityDate || null,
      data.currentValue || data.amount,
      data.notes || null,
      !!data.autoReinvest,
      data.tenure || null,
    ];

    await databaseConfig.executeQuery(query, params);
    return this.findById(id);
  }

  /**
   * Find investment by id
   */
  async findById(id) {
    const query = `
      SELECT i.*, 
             u.first_name, u.last_name, u.email,
             p.name as product_name, p.category, p.expected_return, p.risk_level, p.tenure
      FROM ${this.tableName} i
      JOIN users u ON i.user_id = u.id
      JOIN investment_products p ON i.product_id = p.id
      WHERE i.id = ?
    `;
    const rows = await databaseConfig.executeQuery(query, [id]);
    return rows.length ? this.formatInvestment(rows[0]) : null;
  }

  /**
   * Get investments for a user with optional filters and pagination
   */
  async findByUser(userId, filters = {}, pagination = {}) {
    const { offset, limit } = PaginationHelper.getPaginationParams({
      query: pagination,
    });
    const where = ["i.user_id = ?"];
    const params = [userId];

    if (filters.status) {
      where.push("i.status = ?");
      params.push(filters.status);
    }
    if (filters.productId) {
      where.push("i.product_id = ?");
      params.push(filters.productId);
    }
    if (filters.fromDate) {
      where.push("i.created_at >= ?");
      params.push(filters.fromDate);
    }
    if (filters.toDate) {
      where.push("i.created_at <= ?");
      params.push(filters.toDate);
    }

    const whereClause = where.join(" AND ");

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName} i
      WHERE ${whereClause}
    `;
    const [{ total }] = await databaseConfig.executeQuery(countQuery, params);

    const dataQuery = `
      SELECT i.*, p.name as product_name, p.category, p.expected_return, p.risk_level, p.tenure
      FROM ${this.tableName} i
      JOIN investment_products p ON i.product_id = p.id
      WHERE ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await databaseConfig.executeQuery(dataQuery, [
      ...params,
      limit,
      offset,
    ]);

    return {
      investments: rows.map((r) => this.formatInvestment(r)),
      pagination: PaginationHelper.formatPaginatedResponse(
        [],
        total,
        pagination.page || 1,
        limit
      ).pagination,
      total,
    };
  }

  /**
   * Update investment (notes, auto_reinvest, status, current_value)
   */
  async update(id, update) {
    const fields = [];
    const params = [];
    const map = {
      notes: "notes",
      autoReinvest: "auto_reinvest",
      status: "status",
      currentValue: "current_value",
      maturityDate: "maturity_date",
    };
    Object.keys(map).forEach((k) => {
      if (update[k] !== undefined) {
        fields.push(`${map[k]} = ?`);
        params.push(update[k]);
      }
    });
    if (!fields.length) throw new Error("No valid fields to update");
    params.push(id);

    const query = `UPDATE ${this.tableName} SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`;
    const result = await databaseConfig.executeQuery(query, params);
    if (!result.affectedRows)
      throw new Error("Investment not found or no changes");
    return this.findById(id);
  }

  /**
   * Cancel investment (set status = cancelled)
   */
  async cancel(id, userId) {
    const query = `UPDATE ${this.tableName} SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND user_id = ? AND status = 'active'`;
    const result = await databaseConfig.executeQuery(query, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Portfolio aggregates for a user
   */
  async getPortfolioSummary(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_investments,
        COALESCE(SUM(amount), 0) as total_invested,
        COALESCE(SUM(current_value), 0) as portfolio_value,
        COALESCE(SUM(current_value - amount), 0) as total_returns
      FROM ${this.tableName}
      WHERE user_id = ? AND status = 'active'
    `;
    const [row] = await databaseConfig.executeQuery(query, [userId]);
    return {
      totalInvestments: row.total_investments || 0,
      totalInvested: parseFloat(row.total_invested || 0),
      portfolioValue: parseFloat(row.portfolio_value || 0),
      totalReturns: parseFloat(row.total_returns || 0),
    };
  }

  /**
   * Distribution by type and risk
   */
  async getDistribution(userId) {
    const typeQuery = `
      SELECT p.category as type, COUNT(i.id) as count, COALESCE(SUM(i.amount),0) as amount
      FROM ${this.tableName} i
      JOIN investment_products p ON i.product_id = p.id
      WHERE i.user_id = ? AND i.status = 'active'
      GROUP BY p.category
    `;
    const riskQuery = `
      SELECT p.risk_level as risk, COUNT(i.id) as count, COALESCE(SUM(i.amount),0) as amount
      FROM ${this.tableName} i
      JOIN investment_products p ON i.product_id = p.id
      WHERE i.user_id = ? AND i.status = 'active'
      GROUP BY p.risk_level
    `;
    const [types, risks] = await Promise.all([
      databaseConfig.executeQuery(typeQuery, [userId]),
      databaseConfig.executeQuery(riskQuery, [userId]),
    ]);
    return {
      byType: types.map((t) => ({
        type: t.type,
        count: t.count,
        amount: parseFloat(t.amount),
      })),
      byRisk: risks.map((r) => ({
        risk: r.risk,
        count: r.count,
        amount: parseFloat(r.amount),
      })),
    };
  }

  /**
   * Format DB row
   */
  formatInvestment(row) {
    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      amount: parseFloat(row.amount),
      investedAt: row.created_at,
      status: row.status,
      expectedReturn: row.expected_return
        ? parseFloat(row.expected_return)
        : null,
      maturityDate: row.maturity_date,
      currentValue: row.current_value
        ? parseFloat(row.current_value)
        : undefined,
      notes: row.notes || null,
      autoReinvest: !!row.auto_reinvest,
      product: row.product_name
        ? {
            name: row.product_name,
            investmentType: row.category,
            annualYield: parseFloat(row.expected_return),
            riskLevel: row.risk_level,
            tenureMonths: row.tenure,
          }
        : undefined,
    };
  }
}

module.exports = new InvestmentModel();
