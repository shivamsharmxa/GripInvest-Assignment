#!/usr/bin/env node

/**
 * Simple Database Setup Script
 * Creates database schema and inserts sample data
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🗄️  Setting up Grip Invest Database...\n');

  try {
    // Step 1: Connect to MySQL (without database)
    console.log('📡 Connecting to MySQL server...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Step 2: Create database
    console.log('\n📊 Creating database...');
    const dbName = process.env.DB_NAME || 'grip_invest_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created/verified`);

    // Step 3: Use the database
    await connection.execute(`USE ${dbName}`);

    // Step 4: Run schema
    console.log('\n🏗️  Creating database schema...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found at database/schema.sql');
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements (simple approach)
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            console.log(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Database schema created successfully');

    // Step 5: Insert seed data
    console.log('\n🌱 Inserting sample data...');
    const seedPath = path.join(__dirname, 'database', 'seed.sql');
    
    if (fs.existsSync(seedPath)) {
      const seedData = fs.readFileSync(seedPath, 'utf8');
      
      // Split seed data into statements
      const seedStatements = seedData
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of seedStatements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
          } catch (error) {
            // Ignore duplicate entry errors
            if (!error.message.includes('Duplicate entry')) {
              console.log(`⚠️  Seed warning: ${error.message}`);
            }
          }
        }
      }
      console.log('✅ Sample data inserted successfully');
    } else {
      console.log('⚠️  Seed file not found, skipping sample data');
    }

    // Step 6: Verify setup
    console.log('\n🔍 Verifying database setup...');
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Check sample data
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM investment_products');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    console.log(`\n📊 Sample Data Summary:`);
    console.log(`   - Investment Products: ${products[0].count}`);
    console.log(`   - Sample Users: ${users[0].count}`);

    await connection.end();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Test the API: http://localhost:3001/health');
    console.log('   3. View products: http://localhost:3001/api/products');
    console.log('\n💡 Demo Users (password: password123):');
    console.log('   - john.doe@example.com (moderate risk)');
    console.log('   - jane.smith@example.com (low risk)');
    console.log('   - mike.johnson@example.com (high risk)');

  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔧 Fix: Update your .env file with correct MySQL credentials');
      console.error('   DB_USER=root');
      console.error('   DB_PASSWORD=your_mysql_password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Fix: Ensure MySQL server is running');
      console.error('   macOS: brew services start mysql');
      console.error('   Linux: sudo systemctl start mysql');
      console.error('   Windows: Start MySQL service from Services panel');
    }
    
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };