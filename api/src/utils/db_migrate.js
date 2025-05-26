#!/usr/bin/env node
// Database migration utility for SecureVote
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Database configuration for Cloud Run environment
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  connectionTimeoutMillis: 30000,
};

console.log("Starting database migration...");
console.log("DB Host:", process.env.DB_HOST);
console.log("DB Name:", process.env.DB_NAME);
console.log("DB User:", process.env.DB_USER);

async function runMigrations() {
  const pool = new Pool(dbConfig);

  try {
    // Test connection
    const client = await pool.connect();
    console.log("Successfully connected to database");

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Basic schema setup - create tables directly
    console.log("Creating users table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        organization VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    console.log("Creating elections table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS elections (
        election_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_by UUID REFERENCES users(user_id),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating ballots table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ballots (
        ballot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        election_id UUID REFERENCES elections(election_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating ballot_options table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ballot_options (
        option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ballot_id UUID REFERENCES ballots(ballot_id) ON DELETE CASCADE,
        option_text VARCHAR(255) NOT NULL,
        option_order INTEGER NOT NULL
      )
    `);

    console.log("Creating votes table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        election_id UUID REFERENCES elections(election_id) ON DELETE CASCADE,
        voter_hash VARCHAR(255) NOT NULL,
        encrypted_choice TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_code VARCHAR(50) UNIQUE NOT NULL
      )
    `);

    console.log("Creating audit_logs table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        user_id UUID,
        ip_address VARCHAR(45),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details JSONB
      )
    `);

    console.log("Creating indexes...");
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_elections_dates ON elections(start_date, end_date)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_votes_hash ON votes(voter_hash)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_ballot_options_ballot ON ballot_options(ballot_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_votes_verification ON votes(verification_code)"
    );

    console.log("Creating test admin user...");
    await client.query(`
      INSERT INTO users (email, hashed_password, full_name, role)
      VALUES ('admin@securevote.com', '$2b$10$Dm1.2uTa/li4zE6VFVNcPetmJVUpyHh.Y1YgkTe43nB2nCA2vKZp6', 'Admin User', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);

    // Record migration as completed
    await client.query(`
      INSERT INTO migrations (filename) 
      VALUES ('initial_schema') 
      ON CONFLICT (filename) DO NOTHING
    `);

    client.release();
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
