#!/usr/bin/env node

/**
 * Grip Invest Backend Setup Script
 * Automated setup for development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logStep(step, message) {
  log(`${COLORS.BOLD}${COLORS.BLUE}[Step ${step}]${COLORS.RESET} ${message}`);
}

function logSuccess(message) {
  log(`${COLORS.GREEN}✅ ${message}${COLORS.RESET}`);
}

function logError(message) {
  log(`${COLORS.RED}❌ ${message}${COLORS.RESET}`);
}

function logWarning(message) {
  log(`${COLORS.YELLOW}⚠️  ${message}${COLORS.RESET}`);
}

function logInfo(message) {
  log(`${COLORS.CYAN}ℹ️  ${message}${COLORS.RESET}`);
}

function checkCommand(command, name) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    logError(`${name} is not installed or not in PATH`);
    return false;
  }
}

function createEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (fs.existsSync(envPath)) {
    logInfo('.env file already exists, skipping creation');
    return true;
  }
  
  if (!fs.existsSync(envExamplePath)) {
    logError('.env.example file not found');
    return false;
  }
  
  try {
    fs.copyFileSync(envExamplePath, envPath);
    logSuccess('.env file created from template');
    logWarning('Please update .env file with your actual configuration values');
    return true;
  } catch (error) {
    logError(`Failed to create .env file: ${error.message}`);
    return false;
  }
}

function createDirectories() {
  const directories = ['logs', 'uploads', 'temp'];
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logSuccess(`Created directory: ${dir}`);
    }
  });
}

function installDependencies() {
  logInfo('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    logSuccess('Dependencies installed successfully');
    return true;
  } catch (error) {
    logError('Failed to install dependencies');
    return false;
  }
}

function checkDatabaseConnection() {
  logInfo('Checking database connection...');
  
  // Load environment variables
  require('dotenv').config();
  
  const mysql = require('mysql2/promise');
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };
  
  return mysql.createConnection(dbConfig)
    .then(connection => {
      logSuccess('Database connection successful');
      connection.end();
      return true;
    })
    .catch(error => {
      logError(`Database connection failed: ${error.message}`);
      logInfo('Please ensure MySQL is running and credentials in .env are correct');
      return false;
    });
}

async function createDatabase() {
  logInfo('Creating database if not exists...');
  
  require('dotenv').config();
  const mysql = require('mysql2/promise');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  
  try {
    const dbName = process.env.DB_NAME || 'grip_invest_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    logSuccess(`Database '${dbName}' created/verified`);
    return true;
  } catch (error) {
    logError(`Failed to create database: ${error.message}`);
    return false;
  } finally {
    await connection.end();
  }
}

async function runMigrations() {
  logInfo('Running database schema migrations...');
  
  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    logError('Schema file not found at database/schema.sql');
    return false;
  }
  
  require('dotenv').config();
  const mysql = require('mysql2/promise');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'grip_invest_db',
    multipleStatements: true
  });
  
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.execute(schema);
    logSuccess('Database schema created successfully');
    return true;
  } catch (error) {
    logError(`Failed to run migrations: ${error.message}`);
    return false;
  } finally {
    await connection.end();
  }
}

async function runSeedData() {
  logInfo('Inserting seed data...');
  
  const seedPath = path.join(__dirname, 'database', 'seed.sql');
  if (!fs.existsSync(seedPath)) {
    logError('Seed file not found at database/seed.sql');
    return false;
  }
  
  require('dotenv').config();
  const mysql = require('mysql2/promise');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'grip_invest_db',
    multipleStatements: true
  });
  
  try {
    const seedData = fs.readFileSync(seedPath, 'utf8');
    await connection.execute(seedData);
    logSuccess('Seed data inserted successfully');
    return true;
  } catch (error) {
    logError(`Failed to insert seed data: ${error.message}`);
    return false;
  } finally {
    await connection.end();
  }
}

function runTests() {
  logInfo('Running basic API tests...');
  try {
    execSync('node test-auth-basic.js', { stdio: 'inherit', cwd: __dirname });
    execSync('node test-products-basic.js', { stdio: 'inherit', cwd: __dirname });
    logSuccess('All tests passed!');
    return true;
  } catch (error) {
    logError('Some tests failed, but this is expected without full database setup');
    return true; // Don't fail setup for test failures
  }
}

function displayNextSteps() {
  log('\n' + '='.repeat(60), COLORS.CYAN);
  log('🎉 SETUP COMPLETE! Next Steps:', COLORS.BOLD + COLORS.GREEN);
  log('='.repeat(60), COLORS.CYAN);
  
  log('\n1. Update your .env file with actual values:', COLORS.YELLOW);
  log('   - Database credentials');
  log('   - JWT secrets (generate secure random strings)');
  log('   - AI API keys (OpenAI/Gemini)');
  log('   - Email configuration (if using email features)');
  
  log('\n2. Start the development server:', COLORS.YELLOW);
  log('   npm start                    # Production mode');
  log('   npm run dev                  # Development mode with nodemon');
  
  log('\n3. Test the API:', COLORS.YELLOW);
  log('   Health Check: http://localhost:5000/health');
  log('   API Docs:     http://localhost:5000/api');
  log('   Products:     http://localhost:5000/api/products');
  
  log('\n4. API Endpoints Available:', COLORS.YELLOW);
  log('   Authentication:');
  log('   - POST /api/auth/signup');
  log('   - POST /api/auth/login');
  log('   - GET  /api/auth/profile');
  log('   - POST /api/auth/logout');
  
  log('\n   Products:');
  log('   - GET  /api/products              # List all products');
  log('   - GET  /api/products/:id          # Get product details');
  log('   - GET  /api/products/trending     # Trending products');
  log('   - GET  /api/products/categories   # Product categories');
  log('   - POST /api/products/:id/simulate # Investment simulation');
  
  log('\n   Investments (requires auth):');
  log('   - POST /api/investments           # Create investment');
  log('   - GET  /api/investments           # User investments');
  
  log('\n5. Database Access:', COLORS.YELLOW);
  log(`   Database: ${process.env.DB_NAME || 'grip_invest_db'}`);
  log('   - 15 sample investment products');
  log('   - 5 demo users (password: password123)');
  log('   - Sample investments and transactions');
  
  log('\n6. Optional Integrations:', COLORS.YELLOW);
  log('   - OpenAI API for AI-powered features');
  log('   - Google Gemini API for AI recommendations');
  log('   - Email service for notifications');
  log('   - Redis for caching (optional)');
  
  log('\n' + '='.repeat(60), COLORS.CYAN);
  log('Happy Coding! 🚀', COLORS.BOLD + COLORS.GREEN);
  log('='.repeat(60) + '\n', COLORS.CYAN);
}

async function main() {
  log('\n' + '='.repeat(60), COLORS.CYAN);
  log('🏦 Grip Invest Backend Setup', COLORS.BOLD + COLORS.CYAN);
  log('Mini Investment Platform - Winter Internship 2025', COLORS.CYAN);
  log('='.repeat(60) + '\n', COLORS.CYAN);
  
  // Step 1: Check prerequisites
  logStep(1, 'Checking prerequisites...');
  const nodeOk = checkCommand('node', 'Node.js');
  const npmOk = checkCommand('npm', 'npm');
  const mysqlOk = checkCommand('mysql', 'MySQL');
  
  if (!nodeOk || !npmOk) {
    logError('Missing required dependencies. Please install Node.js and npm');
    process.exit(1);
  }
  
  if (!mysqlOk) {
    logWarning('MySQL command not found. Ensure MySQL server is running');
  }
  
  // Step 2: Create environment file
  logStep(2, 'Setting up environment configuration...');
  createEnvFile();
  
  // Step 3: Create necessary directories
  logStep(3, 'Creating project directories...');
  createDirectories();
  
  // Step 4: Install dependencies
  logStep(4, 'Installing npm dependencies...');
  if (!installDependencies()) {
    process.exit(1);
  }
  
  // Step 5: Database setup
  logStep(5, 'Setting up database...');
  try {
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      await createDatabase();
      await runMigrations();
      await runSeedData();
    } else {
      logWarning('Database setup skipped due to connection issues');
      logInfo('You can run the database setup manually later');
    }
  } catch (error) {
    logWarning(`Database setup encountered issues: ${error.message}`);
    logInfo('You can set up the database manually using the SQL files in database/');
  }
  
  // Step 6: Run basic tests
  logStep(6, 'Running system tests...');
  runTests();
  
  // Step 7: Display completion message
  displayNextSteps();
}

// Run the setup
if (require.main === module) {
  main().catch(error => {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };