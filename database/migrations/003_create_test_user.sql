-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  organization VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Add a test user with password 'test123'
INSERT INTO users (email, hashed_password, full_name, role)
VALUES ('test@example.com', '$2b$10$Dm1.2uTa/li4zE6VFVNcPetmJVUpyHh.Y1YgkTe43nB2nCA2vKZp6', 'Test User', 'admin')
ON CONFLICT (email) DO NOTHING;
