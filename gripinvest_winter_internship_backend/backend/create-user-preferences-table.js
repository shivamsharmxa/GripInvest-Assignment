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

async function createUserPreferencesTable() {
  const connection = mysql.createConnection(config);

  try {
    console.log('📊 Creating user_preferences table...');
    
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        notification_email BOOLEAN DEFAULT TRUE,
        notification_sms BOOLEAN DEFAULT FALSE,
        marketing_emails BOOLEAN DEFAULT TRUE,
        investment_alerts BOOLEAN DEFAULT TRUE,
        maturity_reminders BOOLEAN DEFAULT TRUE,
        weekly_reports BOOLEAN DEFAULT TRUE,
        theme_preference ENUM('light', 'dark', 'auto') DEFAULT 'light',
        language_preference VARCHAR(10) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_preferences (user_id)
      );
    `);

    console.log('✅ user_preferences table created successfully!');

  } catch (error) {
    console.error('❌ Failed to create user preferences table:', error.message);
    throw error;
  } finally {
    connection.end();
  }
}

createUserPreferencesTable()
  .then(() => {
    console.log('✅ User preferences table setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User preferences table setup failed:', error);
    process.exit(1);
  });