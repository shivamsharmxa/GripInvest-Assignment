const request = require('supertest');
const app = require('../src/app');
const { databaseConfig } = require('../src/config/database');
const jwt = require('jsonwebtoken');

describe('Investments Endpoints', () => {
  let authToken;
  let testUserId = '550e8400-e29b-41d4-a716-446655440000';
  let testProductId = '660e8400-e29b-41d4-a716-446655440000';
  let testInvestmentId;

  beforeAll(async () => {
    // Create test token
    authToken = jwt.sign(
      { userId: testUserId, email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testInvestmentId) {
        await databaseConfig.execute('DELETE FROM investments WHERE id = ?', [testInvestmentId]);
      }
      await databaseConfig.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('POST /api/investments', () => {
    it('should create a new investment with valid data', async () => {
      const investmentData = {
        product_id: testProductId,
        amount: 5000.00
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investmentData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('investment');
      expect(response.body.investment).toHaveProperty('user_id', testUserId);
      expect(response.body.investment).toHaveProperty('product_id', testProductId);
      expect(response.body.investment).toHaveProperty('amount', investmentData.amount);
      expect(response.body.investment).toHaveProperty('status', 'active');
      expect(response.body.investment).toHaveProperty('expected_return');
      expect(response.body.investment).toHaveProperty('maturity_date');

      testInvestmentId = response.body.investment.id;
    });

    it('should return 400 for invalid product ID', async () => {
      const investmentData = {
        product_id: 'invalid-product-id',
        amount: 5000.00
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investmentData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent product', async () => {
      const investmentData = {
        product_id: '550e8400-e29b-41d4-a716-446655440999',
        amount: 5000.00
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investmentData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for investment below minimum amount', async () => {
      const investmentData = {
        product_id: testProductId,
        amount: 100.00  // Below minimum investment
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investmentData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/minimum investment/i);
    });

    it('should return 400 for investment above maximum amount', async () => {
      const investmentData = {
        product_id: testProductId,
        amount: 10000000.00  // Above maximum investment
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investmentData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields', async () => {
      const investmentData = {
        amount: 5000.00
        // Missing product_id
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investmentData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const investmentData = {
        product_id: testProductId,
        amount: 5000.00
      };

      const response = await request(app)
        .post('/api/investments')
        .send(investmentData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/investments/portfolio', () => {
    it('should fetch user portfolio with authentication', async () => {
      const response = await request(app)
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('portfolio');
      expect(response.body.portfolio).toHaveProperty('summary');
      expect(response.body.portfolio).toHaveProperty('investments');
      expect(Array.isArray(response.body.portfolio.investments)).toBe(true);

      // Check summary structure
      expect(response.body.portfolio.summary).toHaveProperty('total_investments');
      expect(response.body.portfolio.summary).toHaveProperty('total_amount_invested');
      expect(response.body.portfolio.summary).toHaveProperty('current_value');
      expect(response.body.portfolio.summary).toHaveProperty('total_returns');
      expect(response.body.portfolio.summary).toHaveProperty('return_percentage');
    });

    it('should filter portfolio by status', async () => {
      const response = await request(app)
        .get('/api/investments/portfolio?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.portfolio.investments.every(inv => inv.status === 'active')).toBe(true);
    });

    it('should limit portfolio results', async () => {
      const response = await request(app)
        .get('/api/investments/portfolio?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.portfolio.investments.length).toBeLessThanOrEqual(3);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/investments/portfolio')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/investments/:id', () => {
    it('should fetch specific investment for owner', async () => {
      if (!testInvestmentId) {
        // Create an investment first
        const createResponse = await request(app)
          .post('/api/investments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            product_id: testProductId,
            amount: 5000.00
          });
        testInvestmentId = createResponse.body.investment.id;
      }

      const response = await request(app)
        .get(`/api/investments/${testInvestmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('investment');
      expect(response.body.investment).toHaveProperty('id', testInvestmentId);
      expect(response.body.investment).toHaveProperty('user_id', testUserId);
    });

    it('should return 404 for non-existent investment', async () => {
      const fakeId = '770e8400-e29b-41d4-a716-446655440999';

      const response = await request(app)
        .get(`/api/investments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid investment ID format', async () => {
      const response = await request(app)
        .get('/api/investments/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/investments/insights', () => {
    it('should get AI portfolio insights for authenticated user', async () => {
      const response = await request(app)
        .get('/api/investments/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('insights');
      expect(response.body.insights).toHaveProperty('risk_analysis');
      expect(response.body.insights).toHaveProperty('diversification_score');
      expect(response.body.insights).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.insights.recommendations)).toBe(true);
    });

    it('should include portfolio performance metrics', async () => {
      const response = await request(app)
        .get('/api/investments/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.insights).toHaveProperty('performance');
      expect(response.body.insights.performance).toHaveProperty('total_return_percentage');
      expect(response.body.insights.performance).toHaveProperty('risk_adjusted_return');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/investments/insights')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/investments/:id/status', () => {
    it('should update investment status for owner', async () => {
      if (!testInvestmentId) {
        // Create an investment first
        const createResponse = await request(app)
          .post('/api/investments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            product_id: testProductId,
            amount: 5000.00
          });
        testInvestmentId = createResponse.body.investment.id;
      }

      const statusData = {
        status: 'cancelled'
      };

      const response = await request(app)
        .put(`/api/investments/${testInvestmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('investment');
      expect(response.body.investment).toHaveProperty('status', 'cancelled');
    });

    it('should return 400 for invalid status', async () => {
      const statusData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .put(`/api/investments/${testInvestmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent investment', async () => {
      const fakeId = '770e8400-e29b-41d4-a716-446655440999';
      const statusData = {
        status: 'cancelled'
      };

      const response = await request(app)
        .put(`/api/investments/${fakeId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/investments/analytics', () => {
    it('should get investment analytics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/investments/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('monthly_performance');
      expect(response.body.analytics).toHaveProperty('asset_allocation');
      expect(response.body.analytics).toHaveProperty('risk_metrics');
    });

    it('should filter analytics by date range', async () => {
      const response = await request(app)
        .get('/api/investments/analytics?start_date=2024-01-01&end_date=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analytics');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/investments/analytics')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});