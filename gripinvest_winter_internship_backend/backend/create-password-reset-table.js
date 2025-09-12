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

async function createPasswordResetTable() {
  const connection = mysql.createConnection(config);

  try {
    console.log('📊 Creating password_reset_tokens table...');
    
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_email (email),
        INDEX idx_expires_at (expires_at)
      );
    `);

    console.log('✅ password_reset_tokens table created successfully!');

  } catch (error) {
    console.error('❌ Failed to create password reset table:', error.message);
    throw error;
  } finally {
    connection.end();
  }
}

createPasswordResetTable()
  .then(() => {
    console.log('✅ Password reset table setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Password reset table setup failed:', error);
    process.exit(1);
  });