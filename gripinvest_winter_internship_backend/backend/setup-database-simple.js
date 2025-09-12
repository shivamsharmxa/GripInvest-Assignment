#!/usr/bin/env node

/**
 * Simple Database Setup Script - Manual Version
 * Creates basic tables and inserts sample data
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  console.log('🗄️  Setting up Grip Invest Database (Simple Version)...\n');

  try {
    // Connect to MySQL
    console.log('📡 Connecting to MySQL server...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD
    });

    console.log('✅ Connected to MySQL server');

    // Create database
    console.log('\n📊 Creating database...');
    const dbName = process.env.DB_NAME || 'grip_invest_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created/verified`);

    // Use the database
    await connection.execute(`USE ${dbName}`);

    // Create essential tables
    console.log('\n🏗️  Creating essential tables...');

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50),
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(15),
        password_hash VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        risk_appetite ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
        account_balance DECIMAL(15,2) DEFAULT 0.00,
        kyc_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Investment products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS investment_products (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(100) NOT NULL,
        investment_type ENUM('bond', 'fd', 'mf', 'etf') NOT NULL,
        tenure_months INT NOT NULL,
        annual_yield DECIMAL(5,2) NOT NULL,
        risk_level ENUM('low', 'moderate', 'high') NOT NULL,
        min_investment DECIMAL(15,2) NOT NULL DEFAULT 1000.00,
        max_investment DECIMAL(15,2) NULL,
        description TEXT,
        issuer VARCHAR(100),
        credit_rating VARCHAR(20),
        liquidity_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
        tax_benefits BOOLEAN DEFAULT FALSE,
        compound_frequency ENUM('daily', 'monthly', 'quarterly', 'annually') DEFAULT 'annually',
        early_withdrawal_penalty DECIMAL(5,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Investments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS investments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        tenure_months INT NOT NULL,
        expected_return DECIMAL(15,2) NOT NULL,
        current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
        maturity_date DATE NOT NULL,
        status ENUM('active', 'matured', 'cancelled', 'withdrawn') DEFAULT 'active',
        invested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        matured_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES investment_products(id) ON DELETE RESTRICT
      )
    `);

    // User sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        refresh_token VARCHAR(255) NOT NULL,
        device_info JSON,
        ip_address VARCHAR(45),
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // API logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36),
        method VARCHAR(10) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        status_code INT NOT NULL,
        response_time_ms INT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        request_body JSON,
        response_body JSON,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Essential tables created successfully');

    // Insert sample investment products
    console.log('\n🌱 Inserting sample investment products...');
    
    const products = [
      ['Government Bond - 5 Year', 'bond', 60, 7.50, 'low', 10000.00, NULL, 'Secure government-backed bond with guaranteed returns', 'Government of India', 'AAA', 'medium', TRUE, 'annually', 2.00],
      ['Premium FD - SBI', 'fd', 12, 6.50, 'low', 1000.00, 1000000.00, 'Traditional fixed deposit with guaranteed returns', 'State Bank of India', 'AAA', 'high', FALSE, 'quarterly', 0.50],
      ['Equity Growth Fund', 'mf', 36, 12.50, 'high', 5000.00, NULL, 'High-growth equity mutual fund focusing on large-cap stocks', 'SBI Mutual Fund', 'AA', 'high', FALSE, 'daily', 1.00],
      ['Nifty 50 ETF', 'etf', 24, 11.50, 'moderate', 2000.00, NULL, 'Exchange-traded fund tracking Nifty 50 index', 'SBI ETF', 'AA', 'high', FALSE, 'daily', 0.25]
    ];

    for (const product of products) {
      try {
        await connection.execute(`
          INSERT INTO investment_products (
            name, investment_type, tenure_months, annual_yield, risk_level,
            min_investment, max_investment, description, issuer, credit_rating,
            liquidity_level, tax_benefits, compound_frequency, early_withdrawal_penalty
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, product);
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.log(`⚠️  Product warning: ${error.message}`);
        }
      }
    }

    // Insert sample users
    console.log('\n👥 Creating sample users...');
    
    const users = [
      ['john.doe@example.com', 'John', 'Doe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', 'moderate', 250000.00], // password123
      ['jane.smith@example.com', 'Jane', 'Smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', 'low', 150000.00],
      ['mike.johnson@example.com', 'Mike', 'Johnson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', 'high', 500000.00]
    ];

    for (const user of users) {
      try {
        await connection.execute(`
          INSERT INTO users (
            email, first_name, last_name, password_hash, risk_appetite, 
            account_balance, email_verified, phone_verified, kyc_status
          ) VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, 'approved')
        `, user);
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.log(`⚠️  User warning: ${error.message}`);
        }
      }
    }

    // Verify setup
    console.log('\n🔍 Verifying database setup...');
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    const [products_count] = await connection.execute('SELECT COUNT(*) as count FROM investment_products');
    const [users_count] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    console.log(`\n📊 Sample Data Summary:`);
    console.log(`   - Investment Products: ${products_count[0].count}`);
    console.log(`   - Sample Users: ${users_count[0].count}`);

    await connection.end();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   ✅ Database: grip_invest_db');
    console.log('   ✅ 5 essential tables');
    console.log('   ✅ 4 sample investment products');
    console.log('   ✅ 3 demo users with different risk profiles');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Test the API: http://localhost:3001/health');
    console.log('   3. View products: http://localhost:3001/api/products');
    
    console.log('\n💡 Demo Login Credentials (password: password123):');
    console.log('   • john.doe@example.com (moderate risk - ₹2.5L balance)');
    console.log('   • jane.smith@example.com (low risk - ₹1.5L balance)');
    console.log('   • mike.johnson@example.com (high risk - ₹5L balance)');
    
    console.log('\n🏦 Available Investment Products:');
    console.log('   • Government Bond (7.5% yield, 5 years, low risk)');
    console.log('   • Premium FD (6.5% yield, 1 year, low risk)');
    console.log('   • Equity Growth Fund (12.5% yield, 3 years, high risk)');
    console.log('   • Nifty 50 ETF (11.5% yield, 2 years, moderate risk)');

  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔧 Fix: Check your MySQL credentials in .env file');
      console.error(`   Current: DB_USER=${process.env.DB_USER}, DB_PASSWORD=[hidden]`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Fix: Start MySQL server');
      console.error('   macOS: brew services start mysql');
      console.error('   Linux: sudo systemctl start mysql');
    }
    
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };