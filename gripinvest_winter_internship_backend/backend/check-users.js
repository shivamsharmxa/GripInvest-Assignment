const { databaseConfig } = require('./src/config/database');
require('dotenv').config();

async function checkUsers() {
  try {
    // Initialize database connection
    await databaseConfig.createPool();
    
    // Check users
    const users = await databaseConfig.executeQuery('SELECT id, first_name, last_name, email, risk_appetite, account_balance FROM users LIMIT 5');
    console.log('Users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - Balance: ${user.account_balance}`);
    });
    
    // Close connection
    await databaseConfig.closePool();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsers();