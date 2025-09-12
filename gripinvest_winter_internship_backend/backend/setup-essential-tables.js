const mysql = require('mysql2');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grip_invest_db',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

async function setupEssentialTables() {
  const connection = mysql.createConnection(config);

  try {
    console.log('🗄️  Setting up essential tables for Grip Invest...');
    
    // Create users table
    console.log('📊 Creating users table...');
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50),
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(15),
        password_hash VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        risk_appetite ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
        account_balance DECIMAL(15,2) DEFAULT 0.00,
        kyc_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      );
    `);

    // Create investment_products table
    console.log('📊 Creating investment_products table...');
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS investment_products (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'Corporate Bonds',
        description TEXT,
        expected_return DECIMAL(5,2) NOT NULL,
        min_investment DECIMAL(15,2) NOT NULL DEFAULT 1000.00,
        max_investment DECIMAL(15,2) NULL,
        tenure INT NOT NULL,
        risk_level ENUM('low', 'moderate', 'high') NOT NULL,
        issuer VARCHAR(100),
        rating VARCHAR(20),
        total_size DECIMAL(15,2) DEFAULT 0,
        available_size DECIMAL(15,2) DEFAULT 0,
        features JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_risk_level (risk_level),
        INDEX idx_is_active (is_active)
      );
    `);

    // Create investments table
    console.log('📊 Creating investments table...');
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS investments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        current_value DECIMAL(15,2) DEFAULT 0,
        expected_return DECIMAL(5,2) NOT NULL,
        actual_return DECIMAL(5,2) DEFAULT 0,
        tenure INT NOT NULL,
        status ENUM('pending', 'active', 'matured', 'cancelled') DEFAULT 'active',
        notes TEXT,
        auto_reinvest BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        maturity_date DATE NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES investment_products(id) ON DELETE RESTRICT,
        INDEX idx_user_id (user_id),
        INDEX idx_product_id (product_id),
        INDEX idx_status (status)
      );
    `);

    // Create transaction_logs table
    console.log('📊 Creating transaction_logs table...');
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS transaction_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36),
        email VARCHAR(100),
        endpoint VARCHAR(255) NOT NULL,
        http_method VARCHAR(10) NOT NULL,
        status_code INT NOT NULL,
        request_body JSON,
        response_body JSON,
        user_agent TEXT,
        ip_address VARCHAR(45),
        execution_time_ms INT,
        error_message TEXT,
        error_stack TEXT,
        session_id VARCHAR(36),
        api_version VARCHAR(10) DEFAULT 'v1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_endpoint (endpoint),
        INDEX idx_status_code (status_code),
        INDEX idx_created_at (created_at)
      );
    `);

    console.log('✅ Essential tables created successfully!');
    
    // Insert sample data
    console.log('📝 Inserting sample investment products...');
    
    const sampleProducts = [
      {
        id: '1',
        name: 'Corporate Bond Series A',
        category: 'Corporate Bonds',
        description: 'High-grade corporate bond with steady returns and low risk profile.',
        expected_return: 12.5,
        min_investment: 10000,
        max_investment: 1000000,
        tenure: 24,
        risk_level: 'low',
        issuer: 'ABC Corporation',
        rating: 'AAA',
        total_size: 50000000,
        available_size: 25000000,
        features: JSON.stringify(['Quarterly Interest', 'Credit Enhancement', 'Listed on Exchange'])
      },
      {
        id: '2', 
        name: 'Alternative Investment Fund',
        category: 'Alternative Investment Fund',
        description: 'Diversified AIF focusing on high-growth sectors with professional management.',
        expected_return: 18.2,
        min_investment: 100000,
        max_investment: 5000000,
        tenure: 36,
        risk_level: 'high',
        issuer: 'XYZ Asset Management',
        rating: 'AA+',
        total_size: 200000000,
        available_size: 75000000,
        features: JSON.stringify(['Professional Management', 'Tax Efficient', 'Quarterly Reports'])
      },
      {
        id: '3',
        name: 'Real Estate Investment Trust',
        category: 'Real Estate',
        description: 'REIT with diversified commercial real estate portfolio.',
        expected_return: 14.8,
        min_investment: 50000,
        max_investment: 2000000,
        tenure: 60,
        risk_level: 'moderate',
        issuer: 'Property Trust Ltd',
        rating: 'AA',
        total_size: 150000000,
        available_size: 60000000,
        features: JSON.stringify(['Regular Dividends', 'Liquid Investment', 'Professional Management'])
      },
      {
        id: '4',
        name: 'Gold Investment Fund',
        category: 'Commodities',
        description: 'Commodity fund tracking gold prices with hedging strategies.',
        expected_return: 11.5,
        min_investment: 25000,
        max_investment: 1500000,
        tenure: 12,
        risk_level: 'moderate',
        issuer: 'Commodity Advisors',
        rating: 'A+',
        total_size: 100000000,
        available_size: 40000000,
        features: JSON.stringify(['Inflation Hedge', 'High Liquidity', 'Global Exposure'])
      }
    ];

    for (const product of sampleProducts) {
      await connection.promise().execute(`
        INSERT IGNORE INTO investment_products 
        (id, name, category, description, expected_return, min_investment, max_investment, 
         tenure, risk_level, issuer, rating, total_size, available_size, features) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.id, product.name, product.category, product.description,
        product.expected_return, product.min_investment, product.max_investment,
        product.tenure, product.risk_level, product.issuer, product.rating,
        product.total_size, product.available_size, product.features
      ]);
    }

    console.log('✅ Sample data inserted successfully!');
    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    connection.end();
  }
}

// Run setup
setupEssentialTables()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });