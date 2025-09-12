const express = require("express");
const Joi = require("joi");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validation");
const aiService = require("../services/aiService");
const { databaseConfig } = require("../config/database");
const { ApiResponse } = require("../utils/helpers");

const router = express.Router();

// Schemas
const listQuery = Joi.object({
  userId: Joi.string().uuid().optional(),
  email: Joi.string().email().optional(),
  endpoint: Joi.string().max(255).optional(),
  method: Joi.string()
    .valid("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
    .optional(),
  status: Joi.number().integer().min(100).max(599).optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const userParams = Joi.object({
  userId: Joi.string().uuid().required(),
});

// Helpers
const buildWhere = (q) => {
  const where = [];
  const params = [];
  if (q.userId) {
    where.push("user_id = ?");
    params.push(q.userId);
  }
  if (q.email) {
    where.push("email = ?");
    params.push(q.email);
  }
  if (q.endpoint) {
    where.push("endpoint LIKE ?");
    params.push(`%${q.endpoint}%`);
  }
  if (q.method) {
    where.push("http_method = ?");
    params.push(q.method);
  }
  if (q.status) {
    where.push("status_code = ?");
    params.push(q.status);
  }
  if (q.from) {
    where.push("created_at >= ?");
    params.push(q.from);
  }
  if (q.to) {
    where.push("created_at <= ?");
    params.push(q.to);
  }
  if (q.search) {
    where.push(
      "(request_body LIKE ? OR response_body LIKE ? OR error_message LIKE ?)"
    );
    params.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
  }
  return { where: where.length ? where.join(" AND ") : "1=1", params };
};

// List logs (admin only)
router.get(
  "/",
  verifyToken,
  requireAdmin,
  validateRequest({ query: listQuery }),
  async (req, res) => {
    const { where, params } = buildWhere(req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) as total FROM transaction_logs WHERE ${where}`;
    const [{ total }] = await databaseConfig.executeQuery(countSql, params);

    const dataSql = `
      SELECT id, user_id, email, endpoint, http_method, status_code, created_at, execution_time_ms, error_message
      FROM transaction_logs
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await databaseConfig.executeQuery(dataSql, [
      ...params,
      limit,
      offset,
    ]);

    const response = ApiResponse.success("Logs fetched", {
      logs: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
    return res.status(response.statusCode).json(response);
  }
);

// Error summary (admin)
router.get(
  "/errors",
  verifyToken,
  requireAdmin,
  validateRequest({ query: listQuery }),
  async (req, res) => {
    const { where, params } = buildWhere(req.query);
    const sql = `
      SELECT endpoint, http_method, status_code, COUNT(*) as count
      FROM transaction_logs
      WHERE ${where} AND status_code >= 400
      GROUP BY endpoint, http_method, status_code
      ORDER BY count DESC
      LIMIT 100
    `;
    const summary = await databaseConfig.executeQuery(sql, params);
    const response = ApiResponse.success("Error summary", { summary });
    return res.status(response.statusCode).json(response);
  }
);

// User-specific logs (admin)
router.get(
  "/user/:userId",
  verifyToken,
  requireAdmin,
  validateRequest({ params: userParams, query: listQuery }),
  async (req, res) => {
    const q = { ...req.query, userId: req.params.userId };
    const { where, params } = buildWhere(q);
    const sql = `
      SELECT id, endpoint, http_method, status_code, created_at, error_message
      FROM transaction_logs
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT 200
    `;
    const rows = await databaseConfig.executeQuery(sql, params);
    const response = ApiResponse.success("User logs", { logs: rows });
    return res.status(response.statusCode).json(response);
  }
);

// Analytics (admin)
router.get("/analytics", verifyToken, requireAdmin, async (_req, res) => {
  const topEndpointsSql = `
      SELECT endpoint, COUNT(*) as hits, AVG(execution_time_ms) as avg_ms
      FROM transaction_logs
      GROUP BY endpoint
      ORDER BY hits DESC
      LIMIT 10
    `;
  const statusBreakdownSql = `
      SELECT status_code, COUNT(*) as count
      FROM transaction_logs
      GROUP BY status_code
      ORDER BY status_code
    `;
  const [topEndpoints, statusBreakdown] = await Promise.all([
    databaseConfig.executeQuery(topEndpointsSql),
    databaseConfig.executeQuery(statusBreakdownSql),
  ]);
  const response = ApiResponse.success("API analytics", {
    topEndpoints,
    statusBreakdown,
  });
  return res.status(response.statusCode).json(response);
});

// AI error summarizer (admin)
router.get(
  "/ai/error-summary",
  verifyToken,
  requireAdmin,
  validateRequest({ query: listQuery }),
  async (req, res) => {
    const { where, params } = buildWhere(req.query);
    const sql = `
      SELECT endpoint, http_method, status_code, error_message, created_at
      FROM transaction_logs
      WHERE ${where} AND status_code >= 400
      ORDER BY created_at DESC
      LIMIT 200
    `;
    const rows = await databaseConfig.executeQuery(sql, params);
    const activities = rows.map((r) => ({
      endpoint: r.endpoint,
      http_method: r.http_method,
      status_code: r.status_code,
      created_at: r.created_at,
      error_message: r.error_message,
    }));
    // Reuse behavior analysis AI prompt for summarization
    let ai;
    try {
      ai = await aiService.performAIRiskAnalysis(activities, {});
    } catch (_e) {
      ai = {
        riskScore: 0,
        suspiciousPatterns: [],
        securityConcerns: [],
        recommendations: [],
        fraudProbability: 0,
        reasoning: "AI unavailable",
      };
    }
    const response = ApiResponse.success("AI error summary", {
      activities,
      ai,
    });
    return res.status(response.statusCode).json(response);
  }
);

module.exports = router;
