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

async function checkUser() {
  const connection = mysql.createConnection(config);

  try {
    console.log('👤 Checking test users...');
    
    const [users] = await connection.promise().execute(`
      SELECT id, first_name, last_name, email, is_active, email_verified, created_at
      FROM users 
      WHERE email IN ('test@example.com', 'sharmas92565@gmail.com')
    `);
    
    console.log('Found users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email}: ${user.first_name} ${user.last_name}, active: ${user.is_active}, verified: ${user.email_verified}`);
    });

    // Check table structure
    console.log('\n📋 Checking users table structure...');
    const [columns] = await connection.promise().execute(`
      DESCRIBE users
    `);
    
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    throw error;
  } finally {
    connection.end();
  }
}

checkUser()
  .then(() => {
    console.log('✅ User check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User check failed:', error);
    process.exit(1);
  });