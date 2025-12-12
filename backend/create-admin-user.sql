-- Create Admin User Script for RideHub
-- Run this in your PostgreSQL database

-- First, check if admin exists
SELECT * FROM users WHERE email = 'admin@ridehub.com';

-- If not exists, create admin user
-- Password: admin123 (BCrypt encrypted)
INSERT INTO users (name, email, password, contact, age, role, gender, active, created_at, updated_at)
VALUES (
    'Admin User',
    'admin@ridehub.com',
    '$2a$10$rqY8pYZJVKvZ3K3mXxZqLOH4vP6kKz6vY0H6sF7wMJX6kRbGxVx2G', -- password: admin123
    '1234567890',
    '30',
    'ADMIN',
    'Male',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Verify admin user was created
SELECT id, name, email, role, active FROM users WHERE email = 'admin@ridehub.com';

-- If you need to update existing user to admin:
-- UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
