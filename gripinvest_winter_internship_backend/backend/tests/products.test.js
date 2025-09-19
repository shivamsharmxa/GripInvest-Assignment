const request = require('supertest');
const app = require('../src/app');
const { databaseConfig } = require('../src/config/database');
const jwt = require('jsonwebtoken');

describe('Products Endpoints', () => {
  let authToken;
  let adminToken;
  let testProductId;
  let testUserId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    // Create test tokens
    authToken = jwt.sign(
      { userId: testUserId, email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: 'admin-id', email: 'admin@gripinvest.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testProductId) {
        await databaseConfig.execute('DELETE FROM investment_products WHERE id = ?', [testProductId]);
      }
      await databaseConfig.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/products', () => {
    it('should fetch all products without authentication', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should filter products by investment type', async () => {
      const response = await request(app)
        .get('/api/products?investment_type=bond')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      
      if (response.body.products.length > 0) {
        response.body.products.forEach(product => {
          expect(product.investment_type).toBe('bond');
        });
      }
    });

    it('should filter products by risk level', async () => {
      const response = await request(app)
        .get('/api/products?risk_level=low')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      
      if (response.body.products.length > 0) {
        response.body.products.forEach(product => {
          expect(product.risk_level).toBe('low');
        });
      }
    });

    it('should filter products by yield range', async () => {
      const response = await request(app)
        .get('/api/products?min_yield=8&max_yield=12')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      
      if (response.body.products.length > 0) {
        response.body.products.forEach(product => {
          expect(product.annual_yield).toBeGreaterThanOrEqual(8);
          expect(product.annual_yield).toBeLessThanOrEqual(12);
        });
      }
    });

    it('should sort products by yield', async () => {
      const response = await request(app)
        .get('/api/products?sort_by=annual_yield&sort_order=desc')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      
      if (response.body.products.length > 1) {
        for (let i = 0; i < response.body.products.length - 1; i++) {
          expect(response.body.products[i].annual_yield)
            .toBeGreaterThanOrEqual(response.body.products[i + 1].annual_yield);
        }
      }
    });

    it('should limit number of products returned', async () => {
      const response = await request(app)
        .get('/api/products?limit=3')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should fetch a specific product', async () => {
      // First get a product ID
      const productsResponse = await request(app).get('/api/products');
      
      if (productsResponse.body.products.length > 0) {
        const productId = productsResponse.body.products[0].id;
        
        const response = await request(app)
          .get(`/api/products/${productId}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('product');
        expect(response.body.product).toHaveProperty('id', productId);
      }
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440999';
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product with admin token', async () => {
      const productData = {
        name: 'Test Bond 2025',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: 8.5,
        risk_level: 'low',
        min_investment: 1000,
        max_investment: 100000,
        description: 'Test bond for unit testing'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product).toHaveProperty('name', productData.name);
      expect(response.body.product).toHaveProperty('investment_type', productData.investment_type);
      
      testProductId = response.body.product.id;
    });

    it('should return 401 for non-admin user', async () => {
      const productData = {
        name: 'Unauthorized Product',
        investment_type: 'bond',
        tenure_months: 12,
        annual_yield: 8.5,
        risk_level: 'low',
        min_investment: 1000
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid product data', async () => {
      const productData = {
        name: '',  // Invalid empty name
        investment_type: 'invalid_type',  // Invalid type
        tenure_months: -1,  // Invalid negative tenure
        annual_yield: 8.5,
        risk_level: 'low'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields', async () => {
      const productData = {
        name: 'Incomplete Product'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update an existing product with admin token', async () => {
      if (!testProductId) {
        // Create a product first
        const createResponse = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Update Test Product',
            investment_type: 'bond',
            tenure_months: 12,
            annual_yield: 8.5,
            risk_level: 'low',
            min_investment: 1000
          });
        testProductId = createResponse.body.product.id;
      }

      const updateData = {
        name: 'Updated Test Bond 2025',
        annual_yield: 9.0,
        description: 'Updated test bond description'
      };

      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product).toHaveProperty('name', updateData.name);
      expect(response.body.product).toHaveProperty('annual_yield', updateData.annual_yield);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440999';
      const updateData = {
        name: 'Non-existent Product'
      };

      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/products/recommendations', () => {
    it('should get AI-powered recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/products/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should filter recommendations by risk appetite', async () => {
      const response = await request(app)
        .get('/api/products/recommendations?risk_appetite=low')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should require authentication for recommendations', async () => {
      const response = await request(app)
        .get('/api/products/recommendations')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/products/trending', () => {
    it('should fetch trending products', async () => {
      const response = await request(app)
        .get('/api/products/trending')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should limit trending products count', async () => {
      const response = await request(app)
        .get('/api/products/trending?limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.products.length).toBeLessThanOrEqual(5);
    });
  });
});