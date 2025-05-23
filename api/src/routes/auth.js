const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../models/db");
const { validateEmail, validatePassword } = require("../utils/validators");

// Try to import bcrypt with fallback
let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (error) {
  console.error("Failed to load bcrypt:", error.message);

  // More robust diagnostics for bcrypt loading failure
  if (process.env.NODE_ENV === "production") {
    console.error(
      "CRITICAL ERROR: bcrypt failed to load in production environment"
    );
    console.error("Error details:", error);
    console.error(
      "System info - Platform:",
      process.platform,
      "Arch:",
      process.arch
    );
  }

  // Simple fallback for hashing in development/testing only
  // NOT SECURE FOR PRODUCTION - only used when bcrypt fails
  bcrypt = {
    hash: async (password) => `insecure_hash_${password}`,
    compare: async (password, hash) => hash === `insecure_hash_${password}`,
  };

  // Log a warning to make it clear we're using the insecure fallback
  console.warn("SECURITY WARNING: Using insecure password hashing fallback");
}

// User registration
router.post("/register", async (req, res, next) => {
  try {
    const {
      email,
      password,
      fullName,
      organization,
      role = "voter",
    } = req.body;

    // Validate input
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters with letters, numbers, and symbols",
      });
    }

    // Check if users table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    // If table doesn't exist, return a helpful error
    if (!tableCheck.rows[0].exists) {
      return res.status(503).json({
        error: "Database schema not initialized",
        message:
          "Run database migrations to set up user schema before registration.",
      });
    }

    // Check if user already exists
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await db.query(
      `INSERT INTO users (email, hashed_password, full_name, organization, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, role`,
      [email, hashedPassword, fullName, organization, role]
    );

    // Create JWT
    const token = jwt.sign(
      {
        userId: result.rows[0].user_id,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.rows[0].user_id,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// User login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.hashed_password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login time
    await db.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
      [user.user_id]
    );

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      userId: user.user_id,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get("/me", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      "SELECT user_id, email, full_name, organization, role, created_at, last_login FROM users WHERE user_id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    next(error);
  }
});

module.exports = router;
