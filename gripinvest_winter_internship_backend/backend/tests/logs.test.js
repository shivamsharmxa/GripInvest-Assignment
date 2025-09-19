const request = require('supertest');
const app = require('../src/app');
const { databaseConfig } = require('../src/config/database');
const jwt = require('jsonwebtoken');

describe('Transaction Logs Endpoints', () => {
  let authToken;
  let adminToken;
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
    try {
      await databaseConfig.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/logs', () => {
    it('should fetch transaction logs with admin token', async () => {
      const response = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
      expect(Array.isArray(response.body.logs)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('should filter logs by user ID', async () => {
      const response = await request(app)
        .get(`/api/logs?user_id=${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
      
      if (response.body.logs.length > 0) {
        response.body.logs.forEach(log => {
          expect(log.user_id).toBe(testUserId);
        });
      }
    });

    it('should filter logs by email', async () => {
      const testEmail = 'test@example.com';
      const response = await request(app)
        .get(`/api/logs?email=${testEmail}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
      
      if (response.body.logs.length > 0) {
        response.body.logs.forEach(log => {
          expect(log.email).toBe(testEmail);
        });
      }
    });

    it('should filter logs by HTTP method', async () => {
      const response = await request(app)
        .get('/api/logs?method=POST')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
      
      if (response.body.logs.length > 0) {
        response.body.logs.forEach(log => {
          expect(log.http_method).toBe('POST');
        });
      }
    });

    it('should filter logs by status code', async () => {
      const response = await request(app)
        .get('/api/logs?status_code=200')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
      
      if (response.body.logs.length > 0) {
        response.body.logs.forEach(log => {
          expect(log.status_code).toBe(200);
        });
      }
    });

    it('should filter logs by date range', async () => {
      const response = await request(app)
        .get('/api/logs?start_date=2024-01-01&end_date=2024-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
    });

    it('should paginate logs correctly', async () => {
      const response = await request(app)
        .get('/api/logs?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
      expect(response.body.logs.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });

    it('should sort logs by created_at desc by default', async () => {
      const response = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      
      if (response.body.logs.length > 1) {
        for (let i = 0; i < response.body.logs.length - 1; i++) {
          const currentDate = new Date(response.body.logs[i].created_at);
          const nextDate = new Date(response.body.logs[i + 1].created_at);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });

    it('should return 401 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/logs')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/logs/user/:userId', () => {
    it('should fetch logs for specific user (owner access)', async () => {
      const response = await request(app)
        .get(`/api/logs/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
      expect(Array.isArray(response.body.logs)).toBe(true);
      
      if (response.body.logs.length > 0) {
        response.body.logs.forEach(log => {
          expect(log.user_id).toBe(testUserId);
        });
      }
    });

    it('should allow admin to access any user logs', async () => {
      const response = await request(app)
        .get(`/api/logs/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs');
    });

    it('should return 403 for unauthorized user access', async () => {
      const unauthorizedUserId = '550e8400-e29b-41d4-a716-446655440999';
      
      const response = await request(app)
        .get(`/api/logs/user/${unauthorizedUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/logs/user/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/logs/errors', () => {
    it('should fetch error logs with admin token', async () => {
      const response = await request(app)
        .get('/api/logs/errors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      
      if (response.body.errors.length > 0) {
        response.body.errors.forEach(error => {
          expect(error.status_code).toBeGreaterThanOrEqual(400);
        });
      }
    });

    it('should filter errors by status code range', async () => {
      const response = await request(app)
        .get('/api/logs/errors?min_status=400&max_status=499')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('errors');
      
      if (response.body.errors.length > 0) {
        response.body.errors.forEach(error => {
          expect(error.status_code).toBeGreaterThanOrEqual(400);
          expect(error.status_code).toBeLessThanOrEqual(499);
        });
      }
    });

    it('should group errors by endpoint', async () => {
      const response = await request(app)
        .get('/api/logs/errors?group_by=endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('grouped_errors');
      expect(typeof response.body.grouped_errors).toBe('object');
    });

    it('should return 401 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/logs/errors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/logs/analytics', () => {
    it('should provide log analytics with admin token', async () => {
      const response = await request(app)
        .get('/api/logs/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('total_requests');
      expect(response.body.analytics).toHaveProperty('success_rate');
      expect(response.body.analytics).toHaveProperty('error_rate');
      expect(response.body.analytics).toHaveProperty('top_endpoints');
      expect(response.body.analytics).toHaveProperty('status_code_distribution');
    });

    it('should filter analytics by date range', async () => {
      const response = await request(app)
        .get('/api/logs/analytics?start_date=2024-01-01&end_date=2024-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analytics');
    });

    it('should include hourly breakdown when requested', async () => {
      const response = await request(app)
        .get('/api/logs/analytics?breakdown=hourly')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.analytics).toHaveProperty('hourly_breakdown');
      expect(Array.isArray(response.body.analytics.hourly_breakdown)).toBe(true);
    });

    it('should return 401 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/logs/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/logs/ai-summary', () => {
    it('should provide AI-powered error summary with admin token', async () => {
      const response = await request(app)
        .get('/api/logs/ai-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('ai_summary');
      expect(response.body.ai_summary).toHaveProperty('error_patterns');
      expect(response.body.ai_summary).toHaveProperty('recommendations');
      expect(response.body.ai_summary).toHaveProperty('critical_issues');
    });

    it('should filter AI summary by user', async () => {
      const response = await request(app)
        .get(`/api/logs/ai-summary?user_id=${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('ai_summary');
    });

    it('should filter AI summary by time period', async () => {
      const response = await request(app)
        .get('/api/logs/ai-summary?period=24h')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('ai_summary');
    });

    it('should return 401 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/logs/ai-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Transaction Logging Middleware', () => {
    it('should log successful API calls', async () => {
      // Make a request that should be logged
      await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check if the request was logged
      const response = await request(app)
        .get('/api/logs?endpoint=/api/products&method=GET')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.logs.length).toBeGreaterThan(0);
      const log = response.body.logs[0];
      expect(log.endpoint).toBe('/api/products');
      expect(log.http_method).toBe('GET');
      expect(log.status_code).toBe(200);
    });

    it('should log failed API calls with error messages', async () => {
      // Make a request that should fail and be logged
      await request(app)
        .post('/api/investments')
        .send({ invalid: 'data' })
        .expect(401);

      // Check if the error was logged
      const response = await request(app)
        .get('/api/logs?endpoint=/api/investments&method=POST&status_code=401')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.logs.length > 0) {
        const log = response.body.logs[0];
        expect(log.endpoint).toBe('/api/investments');
        expect(log.http_method).toBe('POST');
        expect(log.status_code).toBe(401);
        expect(log.error_message).toBeTruthy();
      }
    });
  });
});