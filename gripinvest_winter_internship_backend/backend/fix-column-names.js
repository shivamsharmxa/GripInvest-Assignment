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

async function fixColumnNames() {
  const connection = mysql.createConnection(config);

  try {
    console.log('🔧 Fixing column names...');
    
    // Check current columns
    const [columns] = await connection.promise().execute(`
      SHOW COLUMNS FROM users LIKE 'last_login%'
    `);
    
    console.log('Current columns:', columns.map(c => c.Field));
    
    if (columns.some(c => c.Field === 'last_login') && !columns.some(c => c.Field === 'last_login_at')) {
      console.log('📝 Renaming last_login to last_login_at...');
      await connection.promise().execute(`
        ALTER TABLE users CHANGE COLUMN last_login last_login_at TIMESTAMP NULL
      `);
      console.log('✅ Column renamed successfully!');
    } else {
      console.log('ℹ️  Column names are already correct');
    }

  } catch (error) {
    console.error('❌ Failed to fix column names:', error.message);
    throw error;
  } finally {
    connection.end();
  }
}

// Run fix
fixColumnNames()
  .then(() => {
    console.log('✅ Column fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Column fix failed:', error);
    process.exit(1);
  });