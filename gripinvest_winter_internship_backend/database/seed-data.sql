-- Seed data for Grip Invest Mini Investment Platform
USE gripinvest_db;

-- Insert sample users
INSERT INTO users (id, first_name, last_name, email, password_hash, risk_appetite) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'John', 'Doe', 'john.doe@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'moderate'),
('550e8400-e29b-41d4-a716-446655440001', 'Jane', 'Smith', 'jane.smith@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'high'),
('550e8400-e29b-41d4-a716-446655440002', 'Mike', 'Johnson', 'mike.johnson@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'low'),
('550e8400-e29b-41d4-a716-446655440003', 'Sarah', 'Wilson', 'sarah.wilson@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'moderate'),
('550e8400-e29b-41d4-a716-446655440004', 'David', 'Brown', 'david.brown@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'high'),
('550e8400-e29b-41d4-a716-446655440005', 'Admin', 'User', 'admin@gripinvest.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'moderate');

-- Insert sample investment products
INSERT INTO investment_products (id, name, investment_type, tenure_months, annual_yield, risk_level, min_investment, max_investment, description) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Government Bond 2025', 'bond', 12, 7.50, 'low', 1000.00, 100000.00, 'Secure government bond with guaranteed returns and low risk profile'),
('660e8400-e29b-41d4-a716-446655440001', 'Corporate Bond AAA', 'bond', 24, 9.25, 'moderate', 5000.00, 500000.00, 'High-grade corporate bond with stable returns from top-rated companies'),
('660e8400-e29b-41d4-a716-446655440002', 'Fixed Deposit Premium', 'fd', 36, 8.75, 'low', 1000.00, 1000000.00, 'Premium fixed deposit with competitive interest rates and capital protection'),
('660e8400-e29b-41d4-a716-446655440003', 'Equity Mutual Fund', 'mf', 60, 12.50, 'high', 500.00, 50000.00, 'Diversified equity mutual fund targeting high growth and capital appreciation'),
('660e8400-e29b-41d4-a716-446655440004', 'Nifty 50 ETF', 'etf', 12, 11.20, 'moderate', 100.00, 10000.00, 'Exchange-traded fund tracking Nifty 50 index with low expense ratio'),
('660e8400-e29b-41d4-a716-446655440005', 'Debt Mutual Fund', 'mf', 18, 8.90, 'low', 1000.00, 100000.00, 'Conservative debt mutual fund focusing on capital preservation'),
('660e8400-e29b-41d4-a716-446655440006', 'Infrastructure Bond', 'bond', 120, 10.75, 'moderate', 10000.00, 1000000.00, 'Long-term infrastructure development bond with tax benefits'),
('660e8400-e29b-41d4-a716-446655440007', 'Gold ETF', 'etf', 24, 9.80, 'moderate', 1000.00, 100000.00, 'Gold exchange-traded fund for portfolio diversification'),
('660e8400-e29b-41d4-a716-446655440008', 'Small Cap Fund', 'mf', 36, 15.30, 'high', 2000.00, 200000.00, 'High-risk small cap mutual fund with potential for exceptional returns'),
('660e8400-e29b-41d4-a716-446655440009', 'Senior Citizen FD', 'fd', 60, 9.50, 'low', 5000.00, 500000.00, 'Special fixed deposit scheme for senior citizens with higher interest rates');

-- Insert sample investments
INSERT INTO investments (id, user_id, product_id, amount, invested_at, status, expected_return, maturity_date) VALUES
('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 50000.00, '2024-01-15 10:30:00', 'active', 53750.00, '2025-01-15'),
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440004', 10000.00, '2024-03-20 14:45:00', 'active', 11120.00, '2025-03-20'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 25000.00, '2024-02-10 09:15:00', 'active', 31250.00, '2029-02-10'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440008', 15000.00, '2024-04-05 16:20:00', 'active', 18825.00, '2027-04-05'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 30000.00, '2024-01-25 11:00:00', 'active', 38250.00, '2027-01-25'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 5000.00, '2024-05-12 13:30:00', 'active', 5445.00, '2025-11-12'),
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 75000.00, '2024-03-08 08:45:00', 'active', 93750.00, '2026-03-08'),
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440007', 20000.00, '2024-06-01 10:15:00', 'active', 23920.00, '2026-06-01'),
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440006', 100000.00, '2023-12-01 12:00:00', 'matured', 110750.00, '2024-12-01'),
('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440009', 40000.00, '2024-07-15 15:30:00', 'active', 59000.00, '2029-07-15');

-- Insert sample transaction logs
INSERT INTO transaction_logs (user_id, email, endpoint, http_method, status_code, error_message, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john.doe@email.com', '/api/auth/login', 'POST', 200, NULL, '2024-08-01 09:30:00'),
('550e8400-e29b-41d4-a716-446655440000', 'john.doe@email.com', '/api/products', 'GET', 200, NULL, '2024-08-01 09:35:00'),
('550e8400-e29b-41d4-a716-446655440000', 'john.doe@email.com', '/api/investments', 'POST', 201, NULL, '2024-08-01 09:45:00'),
('550e8400-e29b-41d4-a716-446655440001', 'jane.smith@email.com', '/api/auth/login', 'POST', 200, NULL, '2024-08-01 10:15:00'),
('550e8400-e29b-41d4-a716-446655440001', 'jane.smith@email.com', '/api/investments/portfolio', 'GET', 200, NULL, '2024-08-01 10:20:00'),
('550e8400-e29b-41d4-a716-446655440002', 'mike.johnson@email.com', '/api/auth/login', 'POST', 401, 'Invalid credentials', '2024-08-01 11:00:00'),
('550e8400-e29b-41d4-a716-446655440002', 'mike.johnson@email.com', '/api/auth/login', 'POST', 200, NULL, '2024-08-01 11:05:00'),
('550e8400-e29b-41d4-a716-446655440003', 'sarah.wilson@email.com', '/api/products/recommendations', 'GET', 200, NULL, '2024-08-01 12:30:00'),
('550e8400-e29b-41d4-a716-446655440004', 'david.brown@email.com', '/api/investments', 'POST', 400, 'Insufficient balance', '2024-08-01 13:15:00'),
('550e8400-e29b-41d4-a716-446655440005', 'admin@gripinvest.com', '/api/products', 'POST', 201, NULL, '2024-08-01 14:00:00'),
(NULL, 'anonymous@test.com', '/api/auth/signup', 'POST', 400, 'Email already exists', '2024-08-01 15:30:00'),
('550e8400-e29b-41d4-a716-446655440000', 'john.doe@email.com', '/api/logs', 'GET', 200, NULL, '2024-08-01 16:00:00');

-- Display summary of inserted data
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM users
UNION ALL
SELECT 'Investment Products', COUNT(*) FROM investment_products  
UNION ALL
SELECT 'Investments', COUNT(*) FROM investments
UNION ALL
SELECT 'Transaction Logs', COUNT(*) FROM transaction_logs;