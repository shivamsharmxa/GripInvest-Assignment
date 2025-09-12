const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grip_invest_db',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

async function createSimpleTestUser() {
  const connection = mysql.createConnection(config);

  try {
    console.log('👤 Creating simple test user...');
    
    const testUser = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'password123',
      risk_appetite: 'moderate'
    };

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(testUser.password, saltRounds);

    // Insert user
    const [result] = await connection.promise().execute(`
      INSERT INTO users (first_name, last_name, email, password_hash, risk_appetite, email_verified, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE, TRUE)
      ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      updated_at = CURRENT_TIMESTAMP
    `, [testUser.first_name, testUser.last_name, testUser.email, password_hash, testUser.risk_appetite]);

    console.log('✅ Simple test user created/updated successfully!');
    console.log('📧 Email:', testUser.email);
    console.log('🔐 Password:', testUser.password);
    console.log('ℹ️  User is verified and active');

  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    throw error;
  } finally {
    connection.end();
  }
}

// Run setup
createSimpleTestUser()
  .then(() => {
    console.log('✅ Simple test user setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test user setup failed:', error);
    process.exit(1);
  });