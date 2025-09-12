const express = require('express');
const productsController = require('../controllers/productsController');
const router = express.Router();

/**
 * Simple Product Routes for Testing
 */

// GET /api/products - Get all products
router.get('/', productsController.getProducts);

// GET /api/products/categories - Get product categories  
router.get('/categories', productsController.getCategories);

// GET /api/products/trending - Get trending products
router.get('/trending', productsController.getTrending);

// GET /api/products/:id - Get product by ID
router.get('/:id', productsController.getProductById);

// POST /api/products/:id/simulate - Simulate investment
router.post('/:id/simulate', productsController.simulateInvestment);

// POST /api/products/compare - Compare products
router.post('/compare', productsController.compareProducts);

module.exports = router;