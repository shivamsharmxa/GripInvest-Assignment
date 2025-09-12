const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseConfig {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gripinvest_db',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      charset: 'utf8mb4',
      timezone: '+00:00'
    };
  }

  async createPool() {
    try {
      this.pool = mysql.createPool(this.config);
      
      // Test the connection
      const connection = await this.pool.getConnection();
      console.log('✅ Database connected successfully');
      console.log(`📊 Connected to database: ${this.config.database}`);
      console.log(`🔗 Host: ${this.config.host}:${this.config.port}`);
      
      await connection.release();
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call createPool() first.');
    }
    return this.pool;
  }

  async executeQuery(sql, params = []) {
    try {
      const pool = this.getPool();
      const [rows, fields] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async executeTransaction(queries) {
    const connection = await this.getPool().getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const query of queries) {
        const [rows] = await connection.execute(query.sql, query.params || []);
        results.push(rows);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      console.error('Transaction error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  async checkConnection() {
    try {
      const result = await this.executeQuery('SELECT 1 as connected');
      return result.length > 0;
    } catch (error) {
      console.error('Connection check failed:', error.message);
      return false;
    }
  }

  async closePool() {
    if (this.pool) {
      try {
        await this.pool.end();
        console.log('✅ Database pool closed successfully');
      } catch (error) {
        console.error('❌ Error closing database pool:', error.message);
      }
    }
  }

  // Utility method for handling database errors
  handleDatabaseError(error, operation = 'Database operation') {
    const errorMap = {
      'ER_DUP_ENTRY': { status: 409, message: 'Duplicate entry found' },
      'ER_NO_REFERENCED_ROW_2': { status: 400, message: 'Referenced record not found' },
      'ER_ROW_IS_REFERENCED_2': { status: 409, message: 'Cannot delete record - referenced by other records' },
      'ER_ACCESS_DENIED_ERROR': { status: 503, message: 'Database access denied' },
      'ECONNREFUSED': { status: 503, message: 'Database connection refused' },
      'ER_BAD_DB_ERROR': { status: 503, message: 'Database does not exist' }
    };

    const mappedError = errorMap[error.code];
    if (mappedError) {
      const dbError = new Error(mappedError.message);
      dbError.status = mappedError.status;
      dbError.operation = operation;
      return dbError;
    }

    // Generic database error
    const dbError = new Error(`${operation} failed`);
    dbError.status = 500;
    dbError.operation = operation;
    dbError.originalError = error.message;
    return dbError;
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

// Initialize the pool when the module is loaded
const initializeDatabase = async () => {
  try {
    await databaseConfig.createPool();
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Graceful shutdown initiated...');
  await databaseConfig.closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Graceful shutdown initiated...');
  await databaseConfig.closePool();
  process.exit(0);
});

module.exports = {
  databaseConfig,
  initializeDatabase
};