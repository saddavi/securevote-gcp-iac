-- Check user data for debugging
\echo 'Checking test user data:'
SELECT 
    user_id, 
    email, 
    full_name, 
    role, 
    created_at,
    LENGTH(hashed_password) as hash_length,
    SUBSTRING(hashed_password, 1, 30) as hash_start
FROM users 
WHERE email = 'test@example.com';
