-- Update the test user password to ensure compatibility with the current bcrypt implementation

-- Delete existing test user to ensure clean state
DELETE FROM users WHERE email = 'test@example.com';

-- Create a new test user with password 'Test1234!'
INSERT INTO users (email, hashed_password, full_name, organization, role)
VALUES (
  'test@example.com', 
  -- This is bcrypt hash for 'Test1234!' generated with rounds=10 (CORRECTED HASH)
  '$2b$10$1UY41I8NN91l90LpZeUjX.SsMeoj.CJq0DwlzhACiLXV39QmcAY3W', 
  'Test User', 
  'Test Organization', 
  'admin'
);
