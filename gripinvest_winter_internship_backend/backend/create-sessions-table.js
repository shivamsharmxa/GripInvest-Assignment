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

async function createSessionsTable() {
  const connection = mysql.createConnection(config);

  try {
    console.log('📊 Creating user_sessions table...');
    
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        refresh_token VARCHAR(500) NOT NULL,
        device_info TEXT,
        ip_address VARCHAR(45),
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_refresh_token (refresh_token),
        INDEX idx_expires_at (expires_at)
      );
    `);

    console.log('✅ user_sessions table created successfully!');

  } catch (error) {
    console.error('❌ Failed to create sessions table:', error.message);
    throw error;
  } finally {
    connection.end();
  }
}

createSessionsTable()
  .then(() => {
    console.log('✅ Sessions table setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Sessions table setup failed:', error);
    process.exit(1);
  });