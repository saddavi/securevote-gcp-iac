-- Check what's actually in the users table
SELECT 
    user_id, 
    email, 
    full_name, 
    role, 
    created_at,
    LENGTH(hashed_password) as hash_length,
    LEFT(hashed_password, 20) as hash_preview
FROM users 
WHERE email = 'test@example.com';
