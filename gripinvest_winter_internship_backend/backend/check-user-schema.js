const { databaseConfig } = require('./src/config/database');
require('dotenv').config();

async function checkUserSchema() {
  try {
    // Initialize database connection
    await databaseConfig.createPool();
    
    // Check users table structure
    const schema = await databaseConfig.executeQuery('DESCRIBE users');
    console.log('users table structure:');
    schema.forEach(column => {
      console.log(` - ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `KEY: ${column.Key}` : ''} ${column.Default !== null ? `DEFAULT: ${column.Default}` : ''}`);
    });
    
    // Close connection
    await databaseConfig.closePool();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUserSchema();