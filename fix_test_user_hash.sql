-- Fix the incorrect bcrypt hash for test@example.com user
-- Generated: 2025-05-25

-- Update the test user with the correct bcrypt hash for password 'Test1234!'
UPDATE users 
SET hashed_password = '$2b$10$1UY41I8NN91l90LpZeUjX.SsMeoj.CJq0DwlzhACiLXV39QmcAY3W'
WHERE email = 'test@example.com';

-- Verify the update was successful
SELECT 
    user_id, 
    email, 
    full_name, 
    role, 
    hashed_password,
    created_at,
    last_login
FROM users 
WHERE email = 'test@example.com';
