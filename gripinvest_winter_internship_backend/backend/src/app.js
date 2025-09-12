const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { initializeDatabase } = require('./config/database');
require('dotenv').config();

const app = express();

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
});

// Rate limiting middleware
const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Apply rate limiting
app.use(rateLimitMiddleware);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database connection
initializeDatabase().catch(console.error);

// Transaction logging middleware
const transactionLogger = require('./middleware/transactionLogger');
app.use('/api', transactionLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Grip Invest API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.get('/api', (_req, res) => {
  res.status(200).json({
    message: 'Grip Invest API v1.0.0',
    description: 'Mini Investment Platform Backend',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      investments: '/api/investments',
      logs: '/api/logs'
    },
    documentation: '/api/docs'
  });
});

// Import and use route modules
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes-simple');
const investmentRoutes = require('./routes/investmentRoutes');
const logRoutes = require('./routes/logRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/logs', logRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET /api/products',
      'POST /api/investments',
      'GET /api/logs'
    ]
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Global Error Handler:', err.stack);
  
  // Database connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed'
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Grip Invest API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📋 API documentation: http://localhost:${PORT}/api`);
  });
}

module.exports = app;