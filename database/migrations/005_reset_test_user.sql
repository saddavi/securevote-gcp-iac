-- Reset the test user with a simple password for testing

-- Update the password to a simple value for debugging
UPDATE users 
SET hashed_password = '$2b$10$n9TvvhfLp0n8NtZpGZmTT.W.UoFXSUGRadPvTYajrUodmDgfsBYcS' 
WHERE email = 'test@example.com';

-- This hash is for password 'password'
