const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { databaseConfig } = require('../src/config/database');

describe('Authentication Endpoints', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Ensure database connection
    try {
      await databaseConfig.execute('SELECT 1');
    } catch (error) {
      console.log('Database connection failed, using mocked responses');
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testUserId) {
        await databaseConfig.execute('DELETE FROM users WHERE id = ?', [testUserId]);
      }
      await databaseConfig.end();
    } catch (error) {
      // Ignore cleanup errors in test environment
    }
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        risk_appetite: 'moderate'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
      
      testUserId = response.body.user.id;
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'invalid-email',
        password: 'TestPassword123!',
        risk_appetite: 'moderate'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        password: '123',
        risk_appetite: 'moderate'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        risk_appetite: 'moderate'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
      try {
        const [result] = await databaseConfig.execute(
          'INSERT INTO users (first_name, last_name, email, password_hash, risk_appetite) VALUES (?, ?, ?, ?, ?)',
          ['Login', 'Test', 'login@example.com', hashedPassword, 'moderate']
        );
      } catch (error) {
        // User might already exist
      }
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', loginData.email);
      
      authToken = response.body.token;
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      const resetData = {
        email: 'login@example.com'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(resetData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent email', async () => {
      const resetData = {
        email: 'nonexistent@example.com'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(resetData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for invalid email format', async () => {
      const resetData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(resetData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Authentication Middleware', () => {
    it('should allow access with valid token', async () => {
      if (!authToken) {
        // Login to get token
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'login@example.com',
            password: 'TestPassword123!'
          });
        authToken = loginResponse.body.token;
      }

      const response = await request(app)
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/investments/portfolio')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/investments/portfolio')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should deny access with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('AI Password Analysis', () => {
    it('should provide password strength analysis', async () => {
      const passwordData = {
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/analyze-password')
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analysis');
      expect(response.body.analysis).toHaveProperty('strength');
      expect(response.body.analysis).toHaveProperty('suggestions');
    });

    it('should return analysis for weak password', async () => {
      const passwordData = {
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/analyze-password')
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.analysis.strength).toBe('weak');
      expect(response.body.analysis.suggestions).toBeInstanceOf(Array);
      expect(response.body.analysis.suggestions.length).toBeGreaterThan(0);
    });
  });
});