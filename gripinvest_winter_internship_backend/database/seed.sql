-- Grip Invest Winter Internship 2025 - Seed Data
-- Sample data for testing and development

-- Insert sample users with different risk appetites
INSERT INTO users (id, first_name, last_name, email, password_hash, risk_appetite, phone, date_of_birth, kyc_verified, account_balance, email_verified, is_active) VALUES
('user-uuid-0001-0001-000000000001', 'Rajesh', 'Sharma', 'rajesh.sharma@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeUcTlp0q2V9Y8q3u', 'low', '+91-9876543210', '1985-03-15', TRUE, 250000.00, TRUE, TRUE),
('user-uuid-0001-0001-000000000002', 'Priya', 'Patel', 'priya.patel@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeUcTlp0q2V9Y8q3u', 'moderate', '+91-9876543211', '1990-07-22', TRUE, 180000.00, TRUE, TRUE),
('user-uuid-0001-0001-000000000003', 'Arjun', 'Kumar', 'arjun.kumar@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeUcTlp0q2V9Y8q3u', 'high', '+91-9876543212', '1988-12-10', TRUE, 500000.00, TRUE, TRUE),
('user-uuid-0001-0001-000000000004', 'Sneha', 'Agarwal', 'sneha.agarwal@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeUcTlp0q2V9Y8q3u', 'moderate', '+91-9876543213', '1992-05-18', TRUE, 120000.00, TRUE, TRUE),
('user-uuid-0001-0001-000000000005', 'Vikram', 'Singh', 'vikram.singh@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeUcTlp0q2V9Y8q3u', 'low', '+91-9876543214', '1983-11-25', FALSE, 75000.00, FALSE, TRUE);

-- Insert sample investment products covering all types
INSERT INTO investment_products (id, name, investment_type, tenure_months, annual_yield, risk_level, min_investment, max_investment, description, issuer, credit_rating, liquidity_level, tax_benefits, compound_frequency, early_withdrawal_penalty, is_active) VALUES
-- Government Bonds (Low Risk)
('prod-uuid-0001-0001-000000000001', 'Government of India Bond 2025', 'bond', 36, 7.25, 'low', 1000.00, 1000000.00, 'Government-backed sovereign bond with guaranteed returns and high safety. Ideal for conservative investors seeking stable income.', 'Government of India', 'AAA', 'medium', TRUE, 'annually', 0.50, TRUE),
('prod-uuid-0001-0001-000000000002', 'State Development Bond - Maharashtra', 'bond', 60, 7.85, 'low', 5000.00, 500000.00, 'State government bond issued by Maharashtra for infrastructure development. Tax-free returns with sovereign guarantee.', 'Government of Maharashtra', 'AAA', 'low', TRUE, 'annually', 1.00, TRUE),

-- Corporate Bonds (Moderate Risk)
('prod-uuid-0001-0001-000000000003', 'HDFC Bank Corporate Bond', 'bond', 24, 8.50, 'moderate', 10000.00, 2000000.00, 'High-grade corporate bond from leading private sector bank. Regular interest payments with capital protection.', 'HDFC Bank Ltd', 'AA+', 'medium', FALSE, 'quarterly', 1.50, TRUE),
('prod-uuid-0001-0001-000000000004', 'Reliance Industries Bond Series-VII', 'bond', 48, 9.10, 'moderate', 25000.00, 5000000.00, 'Corporate bond from India largest private sector company. Higher yields with moderate risk profile.', 'Reliance Industries Ltd', 'AA', 'medium', FALSE, 'annually', 2.00, TRUE),

-- Fixed Deposits (Low to Moderate Risk)
('prod-uuid-0001-0001-000000000005', 'SBI Fixed Deposit - Premium', 'fd', 12, 6.80, 'low', 1000.00, 1000000.00, 'Traditional fixed deposit from India largest public sector bank. Guaranteed returns with deposit insurance up to 5 lakhs.', 'State Bank of India', 'AAA', 'high', FALSE, 'quarterly', 1.00, TRUE),
('prod-uuid-0001-0001-000000000006', 'ICICI Bank FD - Special Rate', 'fd', 18, 7.25, 'low', 5000.00, 2000000.00, 'Special rate fixed deposit for senior citizens and high-value deposits. Flexible tenure options available.', 'ICICI Bank Ltd', 'AA+', 'high', FALSE, 'monthly', 1.50, TRUE),
('prod-uuid-0001-0001-000000000007', 'HDFC Bank Corporate FD', 'fd', 36, 7.75, 'moderate', 100000.00, 10000000.00, 'Corporate fixed deposit with higher rates for bulk deposits. Suitable for institutional and HNI investors.', 'HDFC Bank Ltd', 'AA+', 'medium', FALSE, 'quarterly', 2.00, TRUE),

-- Mutual Funds (Moderate to High Risk)
('prod-uuid-0001-0001-000000000008', 'SBI Large Cap Equity Fund', 'mf', 36, 12.50, 'moderate', 500.00, NULL, 'Diversified large-cap equity fund investing in blue-chip companies. Suitable for long-term wealth creation.', 'SBI Mutual Fund', 'N/A', 'high', TRUE, 'daily', 0.50, TRUE),
('prod-uuid-0001-0001-000000000009', 'HDFC Mid Cap Opportunities Fund', 'mf', 60, 15.30, 'high', 1000.00, NULL, 'Mid-cap focused equity fund with potential for higher returns. Recommended for aggressive investors with long investment horizon.', 'HDFC Mutual Fund', 'N/A', 'high', TRUE, 'daily', 1.00, TRUE),
('prod-uuid-0001-0001-000000000010', 'ICICI Prudential Bluechip Fund', 'mf', 24, 11.85, 'moderate', 500.00, NULL, 'Large-cap equity fund focusing on established companies with consistent performance and dividend yield.', 'ICICI Prudential MF', 'N/A', 'high', TRUE, 'daily', 0.25, TRUE),

-- ETFs (Low to Moderate Risk)
('prod-uuid-0001-0001-000000000011', 'Nippon India Nifty BeES', 'etf', 0, 10.20, 'moderate', 100.00, NULL, 'Exchange-traded fund tracking Nifty 50 index. Provides broad market exposure with low expense ratio.', 'Nippon India MF', 'N/A', 'high', TRUE, 'daily', 0.00, TRUE),
('prod-uuid-0001-0001-000000000012', 'SBI Gold ETF', 'etf', 0, 8.75, 'moderate', 1000.00, NULL, 'Gold exchange-traded fund providing exposure to gold prices. Hedge against inflation and currency fluctuation.', 'SBI Mutual Fund', 'N/A', 'high', FALSE, 'daily', 0.00, TRUE),
('prod-uuid-0001-0001-000000000013', 'HDFC Nifty Bank BeES', 'etf', 0, 13.40, 'high', 500.00, NULL, 'Banking sector ETF tracking Nifty Bank index. High growth potential with sector-specific risks.', 'HDFC Mutual Fund', 'N/A', 'high', TRUE, 'daily', 0.00, TRUE);

-- Insert sample investments for users
INSERT INTO investments (id, user_id, product_id, amount, invested_at, status, current_value, notes, auto_reinvest) VALUES
-- Rajesh Sharma's investments (Conservative)
('inv-uuid-0001-0001-000000000001', 'user-uuid-0001-0001-000000000001', 'prod-uuid-0001-0001-000000000001', 50000.00, '2024-01-15 10:30:00', 'active', 53625.00, 'First investment in government bonds', FALSE),
('inv-uuid-0001-0001-000000000002', 'user-uuid-0001-0001-000000000001', 'prod-uuid-0001-0001-000000000005', 30000.00, '2024-02-20 14:15:00', 'active', 31530.00, 'SBI FD for emergency fund', FALSE),
('inv-uuid-0001-0001-000000000003', 'user-uuid-0001-0001-000000000001', 'prod-uuid-0001-0001-000000000011', 15000.00, '2024-03-10 11:45:00', 'active', 16125.00, 'Nifty ETF for market exposure', FALSE),

-- Priya Patel's investments (Moderate)
('inv-uuid-0001-0001-000000000004', 'user-uuid-0001-0001-000000000002', 'prod-uuid-0001-0001-000000000003', 40000.00, '2024-01-25 09:20:00', 'active', 42850.00, 'HDFC corporate bond investment', TRUE),
('inv-uuid-0001-0001-000000000005', 'user-uuid-0001-0001-000000000002', 'prod-uuid-0001-0001-000000000008', 25000.00, '2024-02-15 16:30:00', 'active', 27500.00, 'Large cap equity fund SIP', TRUE),
('inv-uuid-0001-0001-000000000006', 'user-uuid-0001-0001-000000000002', 'prod-uuid-0001-0001-000000000012', 20000.00, '2024-03-05 13:10:00', 'active', 20875.00, 'Gold ETF for diversification', FALSE),

-- Arjun Kumar's investments (Aggressive)
('inv-uuid-0001-0001-000000000007', 'user-uuid-0001-0001-000000000003', 'prod-uuid-0001-0001-000000000009', 100000.00, '2024-01-10 10:00:00', 'active', 118750.00, 'Mid cap fund for high growth', TRUE),
('inv-uuid-0001-0001-000000000008', 'user-uuid-0001-0001-000000000003', 'prod-uuid-0001-0001-000000000013', 75000.00, '2024-01-20 11:30:00', 'active', 87375.00, 'Banking sector ETF', FALSE),
('inv-uuid-0001-0001-000000000009', 'user-uuid-0001-0001-000000000003', 'prod-uuid-0001-0001-000000000004', 150000.00, '2024-02-01 15:45:00', 'active', 160125.00, 'Reliance corporate bond', FALSE),

-- Sneha Agarwal's investments (Balanced)
('inv-uuid-0001-0001-000000000010', 'user-uuid-0001-0001-000000000004', 'prod-uuid-0001-0001-000000000010', 35000.00, '2024-02-10 12:20:00', 'active', 37450.00, 'Bluechip fund for stability', TRUE),
('inv-uuid-0001-0001-000000000011', 'user-uuid-0001-0001-000000000004', 'prod-uuid-0001-0001-000000000006', 25000.00, '2024-02-25 14:00:00', 'active', 26075.00, 'ICICI Bank FD', FALSE),

-- Vikram Singh's investments (Conservative - New investor)
('inv-uuid-0001-0001-000000000012', 'user-uuid-0001-0001-000000000005', 'prod-uuid-0001-0001-000000000005', 10000.00, '2024-03-15 10:15:00', 'active', 10235.00, 'First investment - SBI FD', FALSE);

-- Insert user preferences
INSERT INTO user_preferences (user_id, notification_email, notification_sms, marketing_emails, investment_alerts, maturity_reminders, weekly_reports, theme_preference, language_preference, timezone) VALUES
('user-uuid-0001-0001-000000000001', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'light', 'en', 'Asia/Kolkata'),
('user-uuid-0001-0001-000000000002', TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, 'light', 'en', 'Asia/Kolkata'),
('user-uuid-0001-0001-000000000003', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'dark', 'en', 'Asia/Kolkata'),
('user-uuid-0001-0001-000000000004', TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, 'auto', 'en', 'Asia/Kolkata'),
('user-uuid-0001-0001-000000000005', FALSE, FALSE, FALSE, TRUE, TRUE, FALSE, 'light', 'en', 'Asia/Kolkata');

-- Insert sample transaction logs
INSERT INTO transaction_logs (user_id, email, endpoint, http_method, status_code, user_agent, ip_address, execution_time_ms, created_at) VALUES
('user-uuid-0001-0001-000000000001', 'rajesh.sharma@example.com', '/api/auth/login', 'POST', 200, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100', 245, '2024-03-15 08:30:00'),
('user-uuid-0001-0001-000000000001', 'rajesh.sharma@example.com', '/api/products', 'GET', 200, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100', 156, '2024-03-15 08:31:15'),
('user-uuid-0001-0001-000000000002', 'priya.patel@example.com', '/api/auth/login', 'POST', 200, 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', '192.168.1.101', 189, '2024-03-15 09:15:30'),
('user-uuid-0001-0001-000000000002', 'priya.patel@example.com', '/api/investments/portfolio', 'GET', 200, 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', '192.168.1.101', 298, '2024-03-15 09:16:00'),
('user-uuid-0001-0001-000000000003', 'arjun.kumar@example.com', '/api/auth/login', 'POST', 200, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.102', 201, '2024-03-15 10:45:00'),
('user-uuid-0001-0001-000000000003', 'arjun.kumar@example.com', '/api/investments', 'POST', 201, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '192.168.1.102', 445, '2024-03-15 10:50:00'),
(NULL, NULL, '/api/products', 'GET', 401, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.150', 45, '2024-03-15 11:20:00'),
('user-uuid-0001-0001-000000000004', 'sneha.agarwal@example.com', '/api/auth/forgot-password', 'POST', 200, 'Mozilla/5.0 (Android 12; Mobile) AppleWebKit/537.36', '192.168.1.103', 567, '2024-03-15 12:30:00');

-- Insert AI recommendations cache
INSERT INTO ai_recommendations (user_id, recommendation_type, recommendation_data, confidence_score, model_version, expires_at) VALUES
('user-uuid-0001-0001-000000000001', 'product', '{"recommended_products": [{"id": "prod-uuid-0001-0001-000000000002", "reason": "Tax benefits align with conservative profile", "match_score": 0.92}], "analysis": "Based on your low-risk appetite, government bonds with tax benefits are ideal"}', 0.92, 'gpt-3.5-turbo', DATE_ADD(NOW(), INTERVAL 7 DAY)),
('user-uuid-0001-0001-000000000002', 'portfolio', '{"diversification_score": 0.75, "suggestions": ["Consider adding international exposure", "Increase debt allocation for stability"], "risk_analysis": "Well-balanced portfolio with room for improvement"}', 0.87, 'gpt-3.5-turbo', DATE_ADD(NOW(), INTERVAL 7 DAY)),
('user-uuid-0001-0001-000000000003', 'risk', '{"current_risk": "High", "portfolio_volatility": 0.18, "recommendations": ["Consider some debt instruments for stability", "Monitor concentration risk in banking sector"]}', 0.94, 'gpt-3.5-turbo', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Insert investment performance data
INSERT INTO investment_performance (investment_id, date, current_value, returns_amount, returns_percentage) VALUES
-- Performance tracking for recent investments
('inv-uuid-0001-0001-000000000001', '2024-03-01', 52850.00, 2850.00, 5.70),
('inv-uuid-0001-0001-000000000001', '2024-03-15', 53625.00, 3625.00, 7.25),
('inv-uuid-0001-0001-000000000004', '2024-03-01', 42250.00, 2250.00, 5.63),
('inv-uuid-0001-0001-000000000004', '2024-03-15', 42850.00, 2850.00, 7.13),
('inv-uuid-0001-0001-000000000007', '2024-02-15', 110750.00, 10750.00, 10.75),
('inv-uuid-0001-0001-000000000007', '2024-03-15', 118750.00, 18750.00, 18.75);

-- Insert some password reset tokens for testing
INSERT INTO password_reset_tokens (user_id, email, token, otp, expires_at, ip_address) VALUES
('user-uuid-0001-0001-000000000005', 'vikram.singh@example.com', 'reset_token_sample_123456789', '543210', DATE_ADD(NOW(), INTERVAL 1 HOUR), '192.168.1.104');

-- Insert user sessions for JWT refresh tokens
INSERT INTO user_sessions (user_id, refresh_token, device_info, ip_address, expires_at) VALUES
('user-uuid-0001-0001-000000000001', 'refresh_token_rajesh_sample_12345', 'Windows 10, Chrome 120', '192.168.1.100', DATE_ADD(NOW(), INTERVAL 7 DAY)),
('user-uuid-0001-0001-000000000002', 'refresh_token_priya_sample_67890', 'iPhone 14, Safari 16', '192.168.1.101', DATE_ADD(NOW(), INTERVAL 7 DAY)),
('user-uuid-0001-0001-000000000003', 'refresh_token_arjun_sample_11111', 'MacBook Pro, Chrome 120', '192.168.1.102', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Update statistics and optimize tables
ANALYZE TABLE users, investment_products, investments, transaction_logs;

-- Display summary statistics
SELECT 'Database seeded successfully! Summary:' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_products FROM investment_products;
SELECT COUNT(*) as total_investments FROM investments;
SELECT COUNT(*) as total_transaction_logs FROM transaction_logs;
SELECT SUM(amount) as total_invested_amount FROM investments;
SELECT SUM(current_value) as total_portfolio_value FROM investments;

COMMIT;