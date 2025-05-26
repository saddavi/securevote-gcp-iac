const express = require("express");
const app = express();
const db = require("./models/db");

// Middleware
app.use(express.json());

// Force stdout to flush immediately for Cloud Run
process.stdout.write = (function (write) {
  return function (string, encoding, fd) {
    var ret = write.apply(process.stdout, arguments);
    process.stdout.emit("drain");
    return ret;
  };
})(process.stdout.write);

// Enhanced logging that works in Cloud Run
function logDebug(message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data,
    severity: "INFO",
  };

  // Output both structured and unstructured logs
  console.log(JSON.stringify(logEntry));
  console.log(
    `[${timestamp}] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );

  // Force flush
  if (process.stdout.flush) process.stdout.flush();
}

// Test bcrypt loading and functionality
let bcrypt;
let bcryptStatus = "unknown";

async function testBcrypt() {
  try {
    bcrypt = require("bcrypt");

    // Test basic hashing
    const testPassword = "Test1234!";
    const hash = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hash);

    if (isValid) {
      bcryptStatus = "working";
      logDebug("bcrypt is working correctly", {
        testHash: hash,
        comparison: isValid,
      });
    } else {
      bcryptStatus = "hash_compare_failed";
      logDebug("bcrypt hash/compare failed", {
        testHash: hash,
        comparison: isValid,
      });
    }
  } catch (error) {
    bcryptStatus = "failed_to_load";
    logDebug("bcrypt failed to load", {
      error: error.message,
      stack: error.stack,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    });

    // Fallback for testing
    bcrypt = {
      hash: async (password) => `fallback_hash_${password}`,
      compare: async (password, hash) => hash === `fallback_hash_${password}`,
    };
  }
}

// Test the specific hash from migration
async function testMigrationHash() {
  const migrationHash =
    "$2b$10$4tVQpt./tu3PpDwYkmRkdOwKahIfcfiayAOc0ffXp8P3ZDzh9KUXa";
  const testPassword = "Test1234!";

  try {
    if (bcryptStatus === "working") {
      const isValid = await bcrypt.compare(testPassword, migrationHash);
      logDebug("Migration hash test", {
        hash: migrationHash,
        password: testPassword,
        isValid: isValid,
      });
      return isValid;
    } else {
      logDebug("Cannot test migration hash - bcrypt not working", {
        bcryptStatus,
        hash: migrationHash,
      });
      return false;
    }
  } catch (error) {
    logDebug("Error testing migration hash", {
      error: error.message,
      hash: migrationHash,
    });
    return false;
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  logDebug("Health check requested");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    bcryptStatus: bcryptStatus,
  });
});

// Database configuration debug endpoint
app.get("/debug/db-config", (req, res) => {
  logDebug("Database configuration debug requested");

  const dbConfig = {
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    connection_name: process.env.DB_CONNECTION_NAME,
    private_ip: process.env.DB_PRIVATE_IP,
    k_service: process.env.K_SERVICE,
    node_env: process.env.NODE_ENV,
    // Don't expose password for security
    password_set: !!process.env.DB_PASSWORD,
  };

  logDebug("Current database configuration", dbConfig);

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: dbConfig,
  });
});

// Comprehensive authentication debug endpoint
app.post("/debug-auth", async (req, res) => {
  const { email = "test@example.com", password = "Test1234!" } = req.body;

  logDebug("=== STARTING AUTH DEBUG ===", { email, password });

  const result = {
    timestamp: new Date().toISOString(),
    email,
    password,
    bcryptStatus,
    steps: [],
  };

  try {
    // Step 1: Test database connection
    try {
      await db.query("SELECT 1");
      result.steps.push({ step: "database_connection", status: "success" });
      logDebug("✓ Database connection successful");
    } catch (dbError) {
      result.steps.push({
        step: "database_connection",
        status: "failed",
        error: dbError.message,
      });
      logDebug("✗ Database connection failed", { error: dbError.message });
      return res.status(500).json(result);
    }

    // Step 2: Query user from database
    let user;
    try {
      const userQuery = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (userQuery.rows.length === 0) {
        result.steps.push({ step: "user_lookup", status: "user_not_found" });
        logDebug("✗ User not found", { email });
        return res.status(404).json(result);
      }

      user = userQuery.rows[0];
      result.steps.push({
        step: "user_lookup",
        status: "success",
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          hash_length: user.hashed_password?.length || 0,
          hash_prefix: user.hashed_password?.substring(0, 10) || "null",
        },
      });
      logDebug("✓ User found", {
        userId: user.user_id,
        email: user.email,
        hashLength: user.hashed_password?.length,
      });
    } catch (userError) {
      result.steps.push({
        step: "user_lookup",
        status: "query_failed",
        error: userError.message,
      });
      logDebug("✗ User lookup query failed", { error: userError.message });
      return res.status(500).json(result);
    }

    // Step 3: Test bcrypt comparison
    if (bcryptStatus === "working") {
      try {
        const isValidPassword = await bcrypt.compare(
          password,
          user.hashed_password
        );
        result.steps.push({
          step: "bcrypt_compare",
          status: isValidPassword ? "success" : "password_mismatch",
          details: {
            providedPassword: password,
            storedHash: user.hashed_password,
            comparison: isValidPassword,
          },
        });
        logDebug(isValidPassword ? "✓ Password valid" : "✗ Password invalid", {
          password,
          hash: user.hashed_password,
          result: isValidPassword,
        });
      } catch (compareError) {
        result.steps.push({
          step: "bcrypt_compare",
          status: "compare_error",
          error: compareError.message,
        });
        logDebug("✗ bcrypt compare error", { error: compareError.message });
      }
    } else {
      result.steps.push({
        step: "bcrypt_compare",
        status: "bcrypt_unavailable",
        bcryptStatus,
      });
      logDebug("✗ bcrypt not available for comparison", { bcryptStatus });
    }

    // Step 4: Test migration hash specifically
    if (bcryptStatus === "working") {
      const migrationHashValid = await testMigrationHash();
      result.steps.push({
        step: "migration_hash_test",
        status: migrationHashValid ? "success" : "failed",
        details: {
          expectedPassword: "Test1234!",
          migrationHash:
            "$2b$10$4tVQpt./tu3PpDwYkmRkdOwKahIfcfiayAOc0ffXp8P3ZDzh9KUXa",
          isValid: migrationHashValid,
        },
      });
    }

    // Step 5: Generate fresh hash for comparison
    if (bcryptStatus === "working") {
      try {
        const freshHash = await bcrypt.hash(password, 10);
        const freshHashValid = await bcrypt.compare(password, freshHash);
        result.steps.push({
          step: "fresh_hash_test",
          status: freshHashValid ? "success" : "failed",
          details: {
            password,
            freshHash,
            isValid: freshHashValid,
          },
        });
        logDebug("Fresh hash test", {
          password,
          freshHash,
          isValid: freshHashValid,
        });
      } catch (hashError) {
        result.steps.push({
          step: "fresh_hash_test",
          status: "error",
          error: hashError.message,
        });
        logDebug("✗ Fresh hash test error", { error: hashError.message });
      }
    }

    logDebug("=== AUTH DEBUG COMPLETE ===", result);
    res.json(result);
  } catch (error) {
    logDebug("=== AUTH DEBUG FAILED ===", {
      error: error.message,
      stack: error.stack,
    });
    result.steps.push({
      step: "general_error",
      status: "failed",
      error: error.message,
    });
    res.status(500).json(result);
  }
});

// Test bcrypt endpoint
app.get("/test-bcrypt", async (req, res) => {
  logDebug("Testing bcrypt functionality");

  const result = {
    bcryptStatus,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  };

  if (bcryptStatus === "working") {
    try {
      const testPassword = "Test1234!";
      const hash = await bcrypt.hash(testPassword, 10);
      const isValid = await bcrypt.compare(testPassword, hash);

      result.hashTest = {
        password: testPassword,
        hash: hash,
        verification: isValid,
      };

      // Test the specific migration hash
      const migrationHash =
        "$2b$10$4tVQpt./tu3PpDwYkmRkdOwKahIfcfiayAOc0ffXp8P3ZDzh9KUXa";
      const migrationValid = await bcrypt.compare(testPassword, migrationHash);

      result.migrationHashTest = {
        password: testPassword,
        migrationHash: migrationHash,
        verification: migrationValid,
      };
    } catch (error) {
      result.error = error.message;
    }
  }

  logDebug("bcrypt test result", result);
  res.json(result);
});

// Check database state
app.get("/check-db", async (req, res) => {
  logDebug("Checking database state");

  try {
    // Check database connection
    await db.query("SELECT 1");

    // Get all users
    const users = await db.query(
      "SELECT user_id, email, role, created_at, last_login FROM users"
    );

    // Get test user specifically
    const testUser = await db.query(
      "SELECT * FROM users WHERE email = 'test@example.com'"
    );

    const result = {
      connection: "success",
      totalUsers: users.rows.length,
      users: users.rows,
      testUser: testUser.rows[0] || null,
      testUserHashInfo: testUser.rows[0]
        ? {
            hasHash: !!testUser.rows[0].hashed_password,
            hashLength: testUser.rows[0].hashed_password?.length || 0,
            hashPrefix:
              testUser.rows[0].hashed_password?.substring(0, 10) || "null",
          }
        : null,
    };

    logDebug("Database check result", result);
    res.json(result);
  } catch (error) {
    logDebug("Database check failed", { error: error.message });
    res.status(500).json({
      connection: "failed",
      error: error.message,
    });
  }
});

// Apply hash fix endpoint
app.post("/apply-hash-fix", async (req, res) => {
  logDebug("=== APPLYING HASH FIX ===");

  const correctHash =
    "$2b$10$1UY41I8NN91l90LpZeUjX.SsMeoj.CJq0DwlzhACiLXV39QmcAY3W";
  const testPassword = "Test1234!";

  try {
    // Step 1: Verify the correct hash works with bcrypt
    if (bcryptStatus === "working") {
      const hashTest = await bcrypt.compare(testPassword, correctHash);
      if (!hashTest) {
        return res.status(400).json({
          error: "Correct hash validation failed",
          hash: correctHash,
          password: testPassword,
        });
      }
      logDebug("✓ Correct hash validated with bcrypt");
    }

    // Step 2: Get current user state
    const currentUser = await db.query(
      "SELECT user_id, email, hashed_password FROM users WHERE email = $1",
      ["test@example.com"]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        error: "Test user not found",
        email: "test@example.com",
      });
    }

    const oldHash = currentUser.rows[0].hashed_password;

    // Step 3: Apply the fix
    const updateResult = await db.query(
      "UPDATE users SET hashed_password = $1 WHERE email = $2 RETURNING user_id, email, hashed_password",
      [correctHash, "test@example.com"]
    );

    // Step 4: Verify the fix worked
    const updatedUser = await db.query(
      "SELECT user_id, email, hashed_password FROM users WHERE email = $1",
      ["test@example.com"]
    );

    // Step 5: Test authentication with the new hash
    const authTest = await bcrypt.compare(testPassword, correctHash);

    const result = {
      status: "success",
      timestamp: new Date().toISOString(),
      oldHash: oldHash,
      newHash: correctHash,
      updateAffected: updateResult.rowCount,
      updatedUser: updatedUser.rows[0],
      authenticationTest: authTest,
    };

    logDebug("✓ Hash fix applied successfully", result);
    res.json(result);
  } catch (error) {
    logDebug("✗ Hash fix failed", { error: error.message });
    res.status(500).json({
      error: "Failed to apply hash fix",
      message: error.message,
    });
  }
});

// Initialize and start server
async function startServer() {
  const port = process.env.PORT || 8080;

  logDebug("=== INITIALIZING AUTH DEBUGGER ===", {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    port,
  });

  // Test bcrypt on startup
  await testBcrypt();

  app.listen(port, () => {
    logDebug("Auth debugger server started", { port });
  });
}

startServer().catch((error) => {
  logDebug("Failed to start server", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
