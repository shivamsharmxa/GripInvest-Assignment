const express = require("express");
const Joi = require("joi");
const investmentService = require("../services/investmentService");
const { verifyToken } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

// Schemas
const createSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    "string.uuid": "Product ID must be a valid UUID",
    "any.required": "Product ID is required",
  }),
  amount: Joi.number().positive().precision(2).min(100).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  customTenure: Joi.number().integer().min(1).max(360).optional(),
  notes: Joi.string().max(1000).allow("", null),
  autoReinvest: Joi.boolean().default(false),
});

const idParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.uuid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});

const updateSchema = Joi.object({
  notes: Joi.string().max(1000).allow("", null),
  autoReinvest: Joi.boolean(),
});

const portfolioQuery = Joi.object({
  status: Joi.string()
    .valid("active", "matured", "cancelled", "pending")
    .optional(),
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
});

// Routes
router.post(
  "/",
  verifyToken,
  validateRequest({ body: createSchema }),
  async (req, res) => {
    const { productId, amount, customTenure, notes, autoReinvest } = req.body;
    const result = await investmentService.createInvestment(
      req.user.id,
      productId,
      amount,
      { customTenure, notes, autoReinvest }
    );
    return res.status(result.statusCode).json(result);
  }
);

router.get(
  "/portfolio",
  verifyToken,
  validateRequest({ query: portfolioQuery }),
  async (req, res) => {
    const result = await investmentService.getPortfolio(
      req.user.id,
      {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      },
      {
        status: req.query.status,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      }
    );
    return res.status(result.statusCode).json(result);
  }
);

router.get("/insights", verifyToken, async (req, res) => {
  const result = await investmentService.getPortfolioInsights(
    req.user.id,
    req.query || {}
  );
  return res.status(result.statusCode).json(result);
});

router.get(
  "/:id",
  verifyToken,
  validateRequest({ params: idParams }),
  async (req, res) => {
    const result = await investmentService.getInvestment(
      req.user.id,
      req.params.id
    );
    return res.status(result.statusCode).json(result);
  }
);

router.put(
  "/:id",
  verifyToken,
  validateRequest({ params: idParams, body: updateSchema }),
  async (req, res) => {
    const result = await investmentService.updateInvestment(
      req.user.id,
      req.params.id,
      req.body
    );
    return res.status(result.statusCode).json(result);
  }
);

router.delete(
  "/:id",
  verifyToken,
  validateRequest({ params: idParams }),
  async (req, res) => {
    const result = await investmentService.cancelInvestment(
      req.user.id,
      req.params.id
    );
    return res.status(result.statusCode).json(result);
  }
);

module.exports = router;
