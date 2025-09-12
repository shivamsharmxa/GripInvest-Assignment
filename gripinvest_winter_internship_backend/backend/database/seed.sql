-- Grip Invest Seed Data
-- Sample data for development and testing

-- Use the database
USE grip_invest_db;

-- =============================================
-- SEED INVESTMENT PRODUCTS
-- =============================================

-- Government Bonds
INSERT INTO investment_products (
    id, name, investment_type, tenure_months, annual_yield, risk_level,
    min_investment, max_investment, description, issuer, credit_rating,
    liquidity_level, tax_benefits, compound_frequency, early_withdrawal_penalty
) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Government Bond - 5 Year', 'bond', 60, 7.50, 'low', 10000.00, 1000000.00, 
 'Secure government-backed bond with guaranteed returns and tax benefits under 80C', 'Government of India', 'AAA', 
 'medium', TRUE, 'annually', 2.00),

('550e8400-e29b-41d4-a716-446655440002', 'Government Bond - 10 Year', 'bond', 120, 8.25, 'low', 25000.00, 2000000.00,
 'Long-term government bond with higher returns and excellent credit rating', 'Government of India', 'AAA',
 'low', TRUE, 'annually', 3.00),

-- Corporate Bonds
('550e8400-e29b-41d4-a716-446655440003', 'Corporate Bond - HDFC', 'bond', 36, 9.50, 'moderate', 50000.00, 5000000.00,
 'High-yield corporate bond from leading financial institution', 'HDFC Ltd', 'AA+',
 'medium', FALSE, 'quarterly', 1.50),

('550e8400-e29b-41d4-a716-446655440004', 'Corporate Bond - Reliance', 'bond', 24, 10.25, 'moderate', 100000.00, 10000000.00,
 'Premium corporate bond from India\'s largest private company', 'Reliance Industries', 'AA',
 'medium', FALSE, 'quarterly', 2.50),

-- Fixed Deposits
('550e8400-e29b-41d4-a716-446655440005', 'Premium FD - SBI', 'fd', 12, 6.50, 'low', 1000.00, 1000000.00,
 'Traditional fixed deposit with guaranteed returns and capital protection', 'State Bank of India', 'AAA',
 'high', FALSE, 'quarterly', 0.50),

('550e8400-e29b-41d4-a716-446655440006', 'Senior Citizen FD', 'fd', 18, 7.25, 'low', 5000.00, 500000.00,
 'Special fixed deposit for senior citizens with higher interest rates', 'HDFC Bank', 'AAA',
 'high', FALSE, 'quarterly', 1.00),

('550e8400-e29b-41d4-a716-446655440007', 'Tax Saver FD', 'fd', 60, 6.75, 'low', 10000.00, 150000.00,
 'Tax-saving fixed deposit with lock-in period and 80C benefits', 'ICICI Bank', 'AAA',
 'low', TRUE, 'annually', 0.00),

-- Mutual Funds
('550e8400-e29b-41d4-a716-446655440008', 'Equity Growth Fund', 'mf', 36, 12.50, 'high', 5000.00, NULL,
 'High-growth equity mutual fund focusing on large-cap stocks', 'SBI Mutual Fund', 'AA',
 'high', FALSE, 'daily', 1.00),

('550e8400-e29b-41d4-a716-446655440009', 'Balanced Advantage Fund', 'mf', 24, 10.75, 'moderate', 10000.00, NULL,
 'Dynamic asset allocation fund balancing equity and debt', 'HDFC Mutual Fund', 'AA+',
 'high', FALSE, 'daily', 1.50),

('550e8400-e29b-41d4-a716-446655440010', 'Debt Fund - Short Term', 'mf', 18, 8.50, 'low', 5000.00, NULL,
 'Conservative debt mutual fund with stable returns', 'ICICI Prudential', 'AA',
 'high', FALSE, 'daily', 0.50),

('550e8400-e29b-41d4-a716-446655440011', 'Tax Saver ELSS Fund', 'mf', 36, 13.25, 'high', 5000.00, NULL,
 'Equity-linked savings scheme with tax benefits under 80C', 'Axis Mutual Fund', 'AA',
 'medium', TRUE, 'daily', 0.00),

-- ETFs
('550e8400-e29b-41d4-a716-446655440012', 'Nifty 50 ETF', 'etf', 24, 11.50, 'moderate', 2000.00, NULL,
 'Exchange-traded fund tracking Nifty 50 index', 'SBI ETF', 'AA',
 'high', FALSE, 'daily', 0.25),

('550e8400-e29b-41d4-a716-446655440013', 'Gold ETF', 'etf', 36, 8.75, 'moderate', 5000.00, NULL,
 'Gold exchange-traded fund for precious metal investment', 'HDFC Gold ETF', 'AA+',
 'high', FALSE, 'daily', 0.50),

('550e8400-e29b-41d4-a716-446655440014', 'Bank Nifty ETF', 'etf', 18, 12.75, 'high', 10000.00, NULL,
 'Banking sector ETF with high growth potential', 'ICICI Bank ETF', 'AA',
 'high', FALSE, 'daily', 0.75),

('550e8400-e29b-41d4-a716-446655440015', 'International ETF', 'etf', 60, 10.25, 'moderate', 25000.00, NULL,
 'Diversified international equity ETF', 'Axis International ETF', 'AA-',
 'medium', FALSE, 'daily', 1.00);

-- =============================================
-- SEED DEMO USERS
-- =============================================

-- Demo users with different risk profiles (passwords are hashed for 'password123')
INSERT INTO users (
    id, first_name, last_name, email, phone, password_hash, date_of_birth, gender,
    risk_appetite, account_balance, kyc_status, email_verified, phone_verified
) VALUES 
('550e8400-e29b-41d4-a716-446655440101', 'John', 'Doe', 'john.doe@example.com', '+919876543210',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', '1990-05-15', 'male',
 'moderate', 250000.00, 'approved', TRUE, TRUE),

('550e8400-e29b-41d4-a716-446655440102', 'Jane', 'Smith', 'jane.smith@example.com', '+919876543211',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', '1985-08-22', 'female',
 'low', 150000.00, 'approved', TRUE, TRUE),

('550e8400-e29b-41d4-a716-446655440103', 'Mike', 'Johnson', 'mike.johnson@example.com', '+919876543212',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', '1988-12-03', 'male',
 'high', 500000.00, 'approved', TRUE, TRUE),

('550e8400-e29b-41d4-a716-446655440104', 'Sarah', 'Wilson', 'sarah.wilson@example.com', '+919876543213',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', '1992-03-18', 'female',
 'moderate', 300000.00, 'approved', TRUE, TRUE),

('550e8400-e29b-41d4-a716-446655440105', 'Robert', 'Brown', 'robert.brown@example.com', '+919876543214',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYgwp.8KzfKlEoy', '1980-11-28', 'male',
 'low', 100000.00, 'approved', TRUE, TRUE);

-- =============================================
-- SEED SAMPLE INVESTMENTS
-- =============================================

-- Sample investments to demonstrate the system
INSERT INTO investments (
    id, user_id, product_id, amount, tenure_months, expected_return, current_value,
    maturity_date, status, invested_at
) VALUES 
-- John Doe's investments
('550e8400-e29b-41d4-a716-446655440201', 
 '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440005',
 50000.00, 12, 53250.00, 52100.00, '2024-12-15', 'active', '2023-12-15 10:30:00'),

('550e8400-e29b-41d4-a716-446655440202',
 '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440008',
 75000.00, 36, 103125.00, 89500.00, '2026-11-20', 'active', '2023-11-20 14:15:00'),

-- Jane Smith's investments (conservative)
('550e8400-e29b-41d4-a716-446655440203',
 '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001',
 25000.00, 60, 34375.00, 27800.00, '2028-10-10', 'active', '2023-10-10 09:45:00'),

('550e8400-e29b-41d4-a716-446655440204',
 '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440006',
 30000.00, 18, 33262.50, 32100.00, '2025-04-15', 'active', '2023-10-15 11:20:00'),

-- Mike Johnson's investments (aggressive)
('550e8400-e29b-41d4-a716-446655440205',
 '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440011',
 100000.00, 36, 139750.00, 118200.00, '2026-09-25', 'active', '2023-09-25 16:30:00'),

('550e8400-e29b-41d4-a716-446655440206',
 '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440014',
 150000.00, 18, 178687.50, 165400.00, '2025-03-10', 'active', '2023-09-10 13:45:00'),

-- Sarah Wilson's balanced investments
('550e8400-e29b-41d4-a716-446655440207',
 '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440009',
 60000.00, 24, 73950.00, 68200.00, '2025-08-20', 'active', '2023-08-20 12:00:00'),

('550e8400-e29b-41d4-a716-446655440208',
 '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440012',
 40000.00, 24, 49200.00, 45800.00, '2025-07-30', 'active', '2023-07-30 15:30:00'),

-- Robert Brown's conservative investments
('550e8400-e29b-41d4-a716-446655440209',
 '550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440007',
 35000.00, 60, 46812.50, 38100.00, '2028-06-15', 'active', '2023-06-15 10:15:00'),

-- Some matured investments for historical data
('550e8400-e29b-41d4-a716-446655440210',
 '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440005',
 30000.00, 12, 31950.00, 31950.00, '2023-05-10', 'matured', '2022-05-10 14:20:00');

-- =============================================
-- SEED SAMPLE TRANSACTIONS
-- =============================================

INSERT INTO investment_transactions (
    id, user_id, investment_id, transaction_type, amount, description,
    reference_number, status, processed_at
) VALUES 
-- Initial deposits
('550e8400-e29b-41d4-a716-446655440301', 
 '550e8400-e29b-41d4-a716-446655440101', NULL, 'deposit', 250000.00,
 'Initial account deposit', 'TXN001001', 'completed', '2023-10-01 09:00:00'),

('550e8400-e29b-41d4-a716-446655440302',
 '550e8400-e29b-41d4-a716-446655440102', NULL, 'deposit', 150000.00,
 'Initial account deposit', 'TXN001002', 'completed', '2023-10-01 09:15:00'),

-- Investment transactions (auto-generated by trigger, but adding some manual ones)
('550e8400-e29b-41d4-a716-446655440303',
 '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440210',
 'return', 31950.00, 'Matured investment return', 'TXN001003', 'completed', '2023-05-10 12:00:00');

-- =============================================
-- SEED SAMPLE NOTIFICATIONS
-- =============================================

INSERT INTO notifications (
    id, user_id, type, title, message, is_read, action_url
) VALUES 
('550e8400-e29b-41d4-a716-446655440401',
 '550e8400-e29b-41d4-a716-446655440101', 'investment', 'Investment Performing Well',
 'Your Equity Growth Fund investment is showing positive returns of 19.3%', FALSE, '/investments/550e8400-e29b-41d4-a716-446655440202'),

('550e8400-e29b-41d4-a716-446655440402',
 '550e8400-e29b-41d4-a716-446655440102', 'maturity', 'Investment Maturing Soon',
 'Your Senior Citizen FD will mature on 2025-04-15. Plan your reinvestment.', FALSE, '/investments/550e8400-e29b-41d4-a716-446655440204'),

('550e8400-e29b-41d4-a716-446655440403',
 '550e8400-e29b-41d4-a716-446655440103', 'system', 'New Investment Products Available',
 'Check out our latest high-yield corporate bonds with attractive returns', FALSE, '/products?type=bond'),

('550e8400-e29b-41d4-a716-446655440404',
 '550e8400-e29b-41d4-a716-446655440104', 'promotion', 'Special Offer: Tax Saver Funds',
 'Invest in ELSS funds before March 31st and save taxes under section 80C', FALSE, '/products?type=mf&tax_benefits=true');

-- =============================================
-- SEED USER ANALYTICS DATA
-- =============================================

INSERT INTO user_analytics (
    id, user_id, event_type, event_data, session_id, ip_address
) VALUES 
('550e8400-e29b-41d4-a716-446655440501',
 '550e8400-e29b-41d4-a716-446655440101', 'login', 
 '{"login_method": "email", "device": "desktop"}', 
 'sess001', '192.168.1.100'),

('550e8400-e29b-41d4-a716-446655440502',
 '550e8400-e29b-41d4-a716-446655440101', 'product_view',
 '{"product_id": "550e8400-e29b-41d4-a716-446655440008", "product_type": "mf"}',
 'sess001', '192.168.1.100'),

('550e8400-e29b-41d4-a716-446655440503',
 '550e8400-e29b-41d4-a716-446655440102', 'investment_simulation',
 '{"product_id": "550e8400-e29b-41d4-a716-446655440001", "amount": 50000, "tenure": 60}',
 'sess002', '192.168.1.101');

-- =============================================
-- UPDATE STATISTICS
-- =============================================

-- Update investment current values to reflect some growth
UPDATE investments SET current_value = amount * 1.08 WHERE status = 'active' AND DATEDIFF(NOW(), invested_at) > 180;
UPDATE investments SET current_value = amount * 1.05 WHERE status = 'active' AND DATEDIFF(NOW(), invested_at) > 90;
UPDATE investments SET current_value = amount * 1.02 WHERE status = 'active' AND DATEDIFF(NOW(), invested_at) > 30;

-- Create some sample API logs for monitoring
INSERT INTO api_logs (
    id, user_id, method, endpoint, status_code, response_time_ms, ip_address
) VALUES 
('550e8400-e29b-41d4-a716-446655440601',
 '550e8400-e29b-41d4-a716-446655440101', 'GET', '/api/products', 200, 145, '192.168.1.100'),

('550e8400-e29b-41d4-a716-446655440602',
 '550e8400-e29b-41d4-a716-446655440101', 'POST', '/api/investments', 201, 320, '192.168.1.100'),

('550e8400-e29b-41d4-a716-446655440603',
 '550e8400-e29b-41d4-a716-446655440102', 'GET', '/api/auth/profile', 200, 89, '192.168.1.101');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify data insertion
SELECT 'Investment Products' as table_name, COUNT(*) as record_count FROM investment_products
UNION ALL
SELECT 'Users', COUNT(*) FROM users  
UNION ALL
SELECT 'Investments', COUNT(*) FROM investments
UNION ALL
SELECT 'Transactions', COUNT(*) FROM investment_transactions
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Analytics', COUNT(*) FROM user_analytics
UNION ALL
SELECT 'API Logs', COUNT(*) FROM api_logs;

-- Display sample portfolio summary
SELECT 
    CONCAT(first_name, ' ', last_name) as name,
    risk_appetite,
    account_balance,
    total_investments,
    total_invested,
    current_portfolio_value,
    ROUND(portfolio_return_percentage, 2) as return_pct
FROM user_portfolio_summary
LIMIT 5;