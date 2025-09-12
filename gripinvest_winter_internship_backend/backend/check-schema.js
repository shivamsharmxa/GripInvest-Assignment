const { databaseConfig } = require('./src/config/database');
require('dotenv').config();

async function checkSchema() {
  try {
    // Initialize database connection
    await databaseConfig.createPool();
    
    // Check investment_products table structure
    const schema = await databaseConfig.executeQuery('DESCRIBE investment_products');
    console.log('investment_products table structure:');
    schema.forEach(column => {
      console.log(` - ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `KEY: ${column.Key}` : ''} ${column.Default !== null ? `DEFAULT: ${column.Default}` : ''}`);
    });
    
    // Check if there are any records
    const count = await databaseConfig.executeQuery('SELECT COUNT(*) as count FROM investment_products');
    console.log(`\nNumber of products in database: ${count[0].count}`);
    
    if (count[0].count > 0) {
      const samples = await databaseConfig.executeQuery('SELECT * FROM investment_products LIMIT 2');
      console.log('\nSample products:');
      samples.forEach((product, index) => {
        console.log(`Product ${index + 1}:`, JSON.stringify(product, null, 2));
      });
    }
    
    // Close connection
    await databaseConfig.closePool();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkSchema();