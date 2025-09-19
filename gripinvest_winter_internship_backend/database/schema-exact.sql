-- Grip Invest Database Schema - Exact Assignment Requirements
-- This file contains the EXACT predefined schemas from the assignment

-- Create database
CREATE DATABASE IF NOT EXISTS gripinvest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gripinvest_db;

-- Users Table (Exact as per assignment)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    risk_appetite ENUM('low','moderate','high') DEFAULT 'moderate',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Investment Products Table (Exact as per assignment)
CREATE TABLE investment_products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    investment_type ENUM('bond','fd','mf','etf','other') NOT NULL,
    tenure_months INT NOT NULL,
    annual_yield DECIMAL(5,2) NOT NULL,
    risk_level ENUM('low','moderate','high') NOT NULL,
    min_investment DECIMAL(12,2) DEFAULT 1000.00,
    max_investment DECIMAL(12,2),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Investments Table (Exact as per assignment)
CREATE TABLE investments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    invested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active','matured','cancelled') DEFAULT 'active',
    expected_return DECIMAL(12,2),
    maturity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES investment_products(id) ON DELETE CASCADE
);

-- Transaction Logs Table (Exact as per assignment)
CREATE TABLE transaction_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36),
    email VARCHAR(255),
    endpoint VARCHAR(255) NOT NULL,
    http_method ENUM('GET','POST','PUT','DELETE') NOT NULL,
    status_code INT NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add some useful indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_risk_appetite ON users(risk_appetite);
CREATE INDEX idx_products_type ON investment_products(investment_type);
CREATE INDEX idx_products_risk ON investment_products(risk_level);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_product ON investments(product_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_logs_user ON transaction_logs(user_id);
CREATE INDEX idx_logs_endpoint ON transaction_logs(endpoint);
CREATE INDEX idx_logs_status ON transaction_logs(status_code);