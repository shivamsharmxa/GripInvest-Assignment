const { databaseConfig } = require('./src/config/database');
require('dotenv').config();

async function checkTables() {
  try {
    // Initialize database connection
    await databaseConfig.createPool();
    
    // Check tables
    const tables = await databaseConfig.executeQuery('SHOW TABLES');
    console.log('Tables in database:', tables);
    
    if (tables.length > 0) {
      console.log('\nTable names:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(' -', tableName);
      });
    } else {
      console.log('\nNo tables found in database!');
    }
    
    // Close connection
    await databaseConfig.closePool();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables();