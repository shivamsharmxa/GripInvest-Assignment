-- Grip Invest Database Schema
-- Mini Investment Platform Database Structure

-- Create database (run manually if needed)
-- CREATE DATABASE IF NOT EXISTS grip_invest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE grip_invest_db;

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    risk_appetite ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
    account_balance DECIMAL(15,2) DEFAULT 0.00,
    kyc_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    kyc_documents JSON,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_risk_appetite (risk_appetite),
    INDEX idx_created_at (created_at)
);

-- User sessions table (for JWT management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    refresh_token VARCHAR(255) NOT NULL,
    device_info JSON,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_expires_at (expires_at)
);

-- User verification codes (OTP, email verification, etc.)
CREATE TABLE IF NOT EXISTS user_verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('email', 'phone', 'password_reset') NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_code (code),
    INDEX idx_expires_at (expires_at)
);

-- =============================================
-- INVESTMENT PRODUCTS TABLES
-- =============================================

-- Investment products table
CREATE TABLE IF NOT EXISTS investment_products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    investment_type ENUM('bond', 'fd', 'mf', 'etf') NOT NULL,
    tenure_months INT NOT NULL,
    annual_yield DECIMAL(5,2) NOT NULL,
    risk_level ENUM('low', 'moderate', 'high') NOT NULL,
    min_investment DECIMAL(15,2) NOT NULL DEFAULT 1000.00,
    max_investment DECIMAL(15,2) NULL,
    description TEXT,
    issuer VARCHAR(100),
    credit_rating VARCHAR(20),
    liquidity_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    tax_benefits BOOLEAN DEFAULT FALSE,
    compound_frequency ENUM('daily', 'monthly', 'quarterly', 'annually') DEFAULT 'annually',
    early_withdrawal_penalty DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_investment_type (investment_type),
    INDEX idx_risk_level (risk_level),
    INDEX idx_annual_yield (annual_yield),
    INDEX idx_tenure_months (tenure_months),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- INVESTMENT TRACKING TABLES
-- =============================================

-- User investments table
CREATE TABLE IF NOT EXISTS investments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tenure_months INT NOT NULL,
    expected_return DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    maturity_date DATE NOT NULL,
    status ENUM('active', 'matured', 'cancelled', 'withdrawn') DEFAULT 'active',
    invested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    matured_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES investment_products(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_status (status),
    INDEX idx_invested_at (invested_at),
    INDEX idx_maturity_date (maturity_date)
);

-- Investment transactions table (for tracking all money movements)
CREATE TABLE IF NOT EXISTS investment_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    investment_id VARCHAR(36),
    transaction_type ENUM('deposit', 'investment', 'withdrawal', 'return', 'penalty', 'fee') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50) UNIQUE,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_investment_id (investment_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_reference_number (reference_number)
);

-- =============================================
-- SYSTEM MONITORING TABLES
-- =============================================

-- API request logs table
CREATE TABLE IF NOT EXISTS api_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    response_time_ms INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_body JSON,
    response_body JSON,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_endpoint (endpoint),
    INDEX idx_status_code (status_code),
    INDEX idx_created_at (created_at)
);

-- System notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    type ENUM('investment', 'maturity', 'system', 'security', 'promotion') NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- AI AND ANALYTICS TABLES
-- =============================================

-- User behavior analytics
CREATE TABLE IF NOT EXISTS user_analytics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    session_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

-- AI recommendations cache
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    recommendation_type ENUM('product', 'portfolio', 'strategy') NOT NULL,
    recommendations JSON NOT NULL,
    confidence_score DECIMAL(3,2),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_recommendation_type (recommendation_type),
    INDEX idx_expires_at (expires_at)
);

-- =============================================
-- PERFORMANCE OPTIMIZATION VIEWS
-- =============================================

-- User portfolio summary view
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.risk_appetite,
    u.account_balance,
    COUNT(i.id) as total_investments,
    COALESCE(SUM(i.amount), 0) as total_invested,
    COALESCE(SUM(i.current_value), 0) as current_portfolio_value,
    COALESCE(SUM(i.expected_return), 0) as expected_returns,
    CASE 
        WHEN SUM(i.amount) > 0 THEN 
            ((SUM(i.current_value) - SUM(i.amount)) / SUM(i.amount)) * 100
        ELSE 0 
    END as portfolio_return_percentage,
    COUNT(CASE WHEN i.status = 'active' THEN 1 END) as active_investments,
    COUNT(CASE WHEN i.status = 'matured' THEN 1 END) as matured_investments
FROM users u
LEFT JOIN investments i ON u.id = i.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.risk_appetite, u.account_balance;

-- Product performance summary view
CREATE OR REPLACE VIEW product_performance_summary AS
SELECT 
    p.id as product_id,
    p.name,
    p.investment_type,
    p.risk_level,
    p.annual_yield as expected_yield,
    COUNT(i.id) as total_investments,
    COUNT(DISTINCT i.user_id) as unique_investors,
    COALESCE(SUM(i.amount), 0) as total_amount_invested,
    COALESCE(AVG(i.amount), 0) as avg_investment_amount,
    COALESCE(SUM(i.current_value), 0) as total_current_value,
    CASE 
        WHEN SUM(i.amount) > 0 THEN 
            ((SUM(i.current_value) - SUM(i.amount)) / SUM(i.amount)) * 100
        ELSE 0 
    END as actual_return_percentage,
    COUNT(CASE WHEN i.status = 'active' THEN 1 END) as active_investments,
    COUNT(CASE WHEN i.status = 'matured' THEN 1 END) as matured_investments
FROM investment_products p
LEFT JOIN investments i ON p.id = i.product_id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.investment_type, p.risk_level, p.annual_yield;

-- =============================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =============================================

DELIMITER //

-- Procedure to calculate investment returns
CREATE PROCEDURE CalculateInvestmentReturns(IN investment_id VARCHAR(36))
BEGIN
    DECLARE current_amount DECIMAL(15,2);
    DECLARE principal DECIMAL(15,2);
    DECLARE annual_rate DECIMAL(5,2);
    DECLARE months_elapsed INT;
    DECLARE compound_freq VARCHAR(20);
    
    -- Get investment details
    SELECT 
        i.amount,
        p.annual_yield,
        p.compound_frequency,
        TIMESTAMPDIFF(MONTH, i.invested_at, NOW())
    INTO principal, annual_rate, compound_freq, months_elapsed
    FROM investments i
    JOIN investment_products p ON i.product_id = p.id
    WHERE i.id = investment_id;
    
    -- Calculate current value based on compound frequency
    CASE compound_freq
        WHEN 'daily' THEN 
            SET current_amount = principal * POW((1 + annual_rate/100/365), 365 * months_elapsed/12);
        WHEN 'monthly' THEN 
            SET current_amount = principal * POW((1 + annual_rate/100/12), months_elapsed);
        WHEN 'quarterly' THEN 
            SET current_amount = principal * POW((1 + annual_rate/100/4), months_elapsed/3);
        WHEN 'annually' THEN 
            SET current_amount = principal * POW((1 + annual_rate/100), months_elapsed/12);
        ELSE 
            SET current_amount = principal * (1 + (annual_rate/100) * months_elapsed/12);
    END CASE;
    
    -- Update the investment current value
    UPDATE investments 
    SET current_value = current_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = investment_id;
    
END //

-- Procedure to update all active investments
CREATE PROCEDURE UpdateAllActiveInvestments()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE inv_id VARCHAR(36);
    DECLARE cur CURSOR FOR 
        SELECT id FROM investments WHERE status = 'active';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    update_loop: LOOP
        FETCH cur INTO inv_id;
        IF done THEN
            LEAVE update_loop;
        END IF;
        
        CALL CalculateInvestmentReturns(inv_id);
    END LOOP;
    
    CLOSE cur;
END //

DELIMITER ;

-- =============================================
-- INITIAL DATA TRIGGERS
-- =============================================

-- Trigger to create user analytics record on registration
DELIMITER //
CREATE TRIGGER after_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
BEGIN
    INSERT INTO user_analytics (user_id, event_type, event_data)
    VALUES (NEW.id, 'user_registration', JSON_OBJECT('registration_date', NOW()));
END //
DELIMITER ;

-- Trigger to log investment creation
DELIMITER //
CREATE TRIGGER after_investment_insert
    AFTER INSERT ON investments
    FOR EACH ROW
BEGIN
    -- Create investment transaction record
    INSERT INTO investment_transactions (
        user_id, investment_id, transaction_type, amount, description, status
    ) VALUES (
        NEW.user_id, NEW.id, 'investment', NEW.amount, 
        CONCAT('Investment in product: ', NEW.product_id), 'completed'
    );
    
    -- Log analytics event
    INSERT INTO user_analytics (user_id, event_type, event_data)
    VALUES (NEW.user_id, 'investment_created', JSON_OBJECT(
        'investment_id', NEW.id,
        'product_id', NEW.product_id,
        'amount', NEW.amount,
        'investment_date', NEW.invested_at
    ));
END //
DELIMITER ;

-- =============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

-- Composite indexes for common queries
CREATE INDEX idx_user_investment_status ON investments(user_id, status, invested_at);
CREATE INDEX idx_product_type_risk ON investment_products(investment_type, risk_level, is_active);
CREATE INDEX idx_transaction_user_type ON investment_transactions(user_id, transaction_type, created_at);
CREATE INDEX idx_analytics_user_event ON user_analytics(user_id, event_type, created_at);

-- =============================================
-- DATABASE MAINTENANCE EVENTS
-- =============================================

-- Event to update investment values daily (if Event Scheduler is enabled)
CREATE EVENT IF NOT EXISTS daily_investment_update
    ON SCHEDULE EVERY 1 DAY
    STARTS CURRENT_DATE + INTERVAL 1 DAY
    DO
        CALL UpdateAllActiveInvestments();

-- Event to clean up expired sessions weekly
CREATE EVENT IF NOT EXISTS weekly_session_cleanup
    ON SCHEDULE EVERY 1 WEEK
    DO
        DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = FALSE;

-- Event to clean up old logs monthly
CREATE EVENT IF NOT EXISTS monthly_log_cleanup
    ON SCHEDULE EVERY 1 MONTH
    DO
        DELETE FROM api_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);