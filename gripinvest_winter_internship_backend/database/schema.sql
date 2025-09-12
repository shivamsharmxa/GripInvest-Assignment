-- Grip Invest Winter Internship 2025 - Database Schema
-- Mini Investment Platform Database Structure

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS transaction_logs;
DROP TABLE IF EXISTS investments;
DROP TABLE IF EXISTS investment_products;
DROP TABLE IF EXISTS users;

-- Users table with UUID primary key
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    risk_appetite ENUM('low','moderate','high') DEFAULT 'moderate',
    phone VARCHAR(20),
    date_of_birth DATE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    account_balance DECIMAL(15,2) DEFAULT 0.00,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_risk_appetite (risk_appetite),
    INDEX idx_created_at (created_at)
);

-- Investment Products table
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
    issuer VARCHAR(255),
    credit_rating VARCHAR(10),
    liquidity_level ENUM('high','medium','low') DEFAULT 'medium',
    tax_benefits BOOLEAN DEFAULT FALSE,
    compound_frequency ENUM('daily','monthly','quarterly','annually') DEFAULT 'annually',
    early_withdrawal_penalty DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_investment_type (investment_type),
    INDEX idx_risk_level (risk_level),
    INDEX idx_annual_yield (annual_yield),
    INDEX idx_tenure_months (tenure_months),
    INDEX idx_min_investment (min_investment),
    INDEX idx_is_active (is_active)
);

-- Investments table
CREATE TABLE investments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    invested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active','matured','cancelled','pending') DEFAULT 'active',
    expected_return DECIMAL(12,2),
    actual_return DECIMAL(12,2) DEFAULT 0.00,
    maturity_date DATE,
    current_value DECIMAL(12,2),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT,
    auto_reinvest BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES investment_products(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_status (status),
    INDEX idx_invested_at (invested_at),
    INDEX idx_maturity_date (maturity_date),
    INDEX idx_amount (amount)
);

-- Transaction Logs table
CREATE TABLE transaction_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36),
    email VARCHAR(255),
    endpoint VARCHAR(255) NOT NULL,
    http_method ENUM('GET','POST','PUT','DELETE','PATCH','OPTIONS') NOT NULL,
    status_code INT NOT NULL,
    request_body TEXT,
    response_body TEXT,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    execution_time_ms INT,
    error_message TEXT,
    error_stack TEXT,
    session_id VARCHAR(255),
    api_version VARCHAR(10) DEFAULT 'v1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_endpoint (endpoint),
    INDEX idx_http_method (http_method),
    INDEX idx_status_code (status_code),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address)
);

-- Additional tables for enhanced functionality

-- User Sessions table (for JWT refresh tokens)
CREATE TABLE user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_refresh_token (refresh_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
);

-- Password Reset Tokens table
CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    otp VARCHAR(6),
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at),
    INDEX idx_otp (otp)
);

-- Investment Performance Tracking table
CREATE TABLE investment_performance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    investment_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    current_value DECIMAL(12,2) NOT NULL,
    returns_amount DECIMAL(12,2) NOT NULL,
    returns_percentage DECIMAL(5,2) NOT NULL,
    market_value DECIMAL(12,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_investment_date (investment_id, date),
    INDEX idx_investment_id (investment_id),
    INDEX idx_date (date)
);

-- User Preferences table
CREATE TABLE user_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT TRUE,
    investment_alerts BOOLEAN DEFAULT TRUE,
    maturity_reminders BOOLEAN DEFAULT TRUE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    theme_preference ENUM('light','dark','auto') DEFAULT 'light',
    language_preference VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_preferences (user_id),
    INDEX idx_user_id (user_id)
);

-- AI Recommendations Cache table
CREATE TABLE ai_recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    recommendation_type ENUM('product','portfolio','risk','diversification') NOT NULL,
    recommendation_data JSON NOT NULL,
    confidence_score DECIMAL(3,2),
    model_version VARCHAR(50),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_recommendation_type (recommendation_type),
    INDEX idx_expires_at (expires_at)
);

-- Create triggers for automatic calculations

DELIMITER $$

-- Trigger to calculate expected return on investment creation
CREATE TRIGGER calculate_expected_return 
BEFORE INSERT ON investments
FOR EACH ROW
BEGIN
    DECLARE product_yield DECIMAL(5,2);
    DECLARE product_tenure INT;
    
    SELECT annual_yield, tenure_months 
    INTO product_yield, product_tenure 
    FROM investment_products 
    WHERE id = NEW.product_id;
    
    SET NEW.expected_return = NEW.amount * (1 + (product_yield / 100) * (product_tenure / 12));
    SET NEW.current_value = NEW.amount;
    SET NEW.maturity_date = DATE_ADD(NEW.invested_at, INTERVAL product_tenure MONTH);
END$$

-- Trigger to update user balance after investment
CREATE TRIGGER update_user_balance_after_investment
AFTER INSERT ON investments
FOR EACH ROW
BEGIN
    UPDATE users 
    SET account_balance = account_balance - NEW.amount 
    WHERE id = NEW.user_id;
END$$

-- Trigger to log investment updates
CREATE TRIGGER log_investment_updates
AFTER UPDATE ON investments
FOR EACH ROW
BEGIN
    INSERT INTO investment_performance (investment_id, date, current_value, returns_amount, returns_percentage)
    VALUES (
        NEW.id,
        CURDATE(),
        NEW.current_value,
        NEW.current_value - NEW.amount,
        ((NEW.current_value - NEW.amount) / NEW.amount) * 100
    )
    ON DUPLICATE KEY UPDATE
        current_value = NEW.current_value,
        returns_amount = NEW.current_value - NEW.amount,
        returns_percentage = ((NEW.current_value - NEW.amount) / NEW.amount) * 100;
END$$

DELIMITER ;

-- Create views for common queries

-- User Portfolio Summary View
CREATE VIEW user_portfolio_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.risk_appetite,
    COUNT(i.id) as total_investments,
    SUM(i.amount) as total_invested,
    SUM(i.current_value) as portfolio_value,
    SUM(i.current_value - i.amount) as total_returns,
    (SUM(i.current_value - i.amount) / SUM(i.amount)) * 100 as returns_percentage,
    u.account_balance,
    u.created_at as member_since
FROM users u
LEFT JOIN investments i ON u.id = i.user_id AND i.status = 'active'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.risk_appetite, u.account_balance, u.created_at;

-- Product Performance View
CREATE VIEW product_performance_summary AS
SELECT 
    p.id as product_id,
    p.name,
    p.investment_type,
    p.risk_level,
    p.annual_yield,
    p.tenure_months,
    COUNT(i.id) as total_investors,
    SUM(i.amount) as total_amount_invested,
    AVG(i.amount) as avg_investment_amount,
    SUM(i.current_value) as total_current_value,
    (SUM(i.current_value - i.amount) / SUM(i.amount)) * 100 as actual_returns_percentage
FROM investment_products p
LEFT JOIN investments i ON p.id = i.product_id AND i.status = 'active'
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.investment_type, p.risk_level, p.annual_yield, p.tenure_months;

-- Investment Dashboard View
CREATE VIEW investment_dashboard AS
SELECT 
    i.id,
    i.user_id,
    u.first_name,
    u.last_name,
    p.name as product_name,
    p.investment_type,
    p.risk_level,
    i.amount,
    i.current_value,
    i.expected_return,
    i.invested_at,
    i.maturity_date,
    i.status,
    DATEDIFF(i.maturity_date, CURDATE()) as days_to_maturity,
    (i.current_value - i.amount) as current_returns,
    ((i.current_value - i.amount) / i.amount) * 100 as returns_percentage
FROM investments i
JOIN users u ON i.user_id = u.id
JOIN investment_products p ON i.product_id = p.id
WHERE i.status = 'active'
ORDER BY i.invested_at DESC;

-- Insert initial system configuration
INSERT INTO users (id, first_name, last_name, email, password_hash, risk_appetite, account_balance, kyc_verified, is_active) 
VALUES 
('admin-uuid-0000-0000-000000000001', 'System', 'Administrator', 'admin@gripinvest.com', '$2b$12$dummy.hash.for.admin.account', 'moderate', 0.00, TRUE, TRUE);

COMMIT;