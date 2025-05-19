// Database model for SecureVote
const { Pool } = require("pg");
const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "db-service" },
  transports: [new winston.transports.Console()],
});

// Determine if we're connecting via Cloud SQL proxy
const isOnGoogleCloud = process.env.K_SERVICE ? true : false;

let pool;
if (isOnGoogleCloud) {
  // Connect using Cloud SQL socket when running in Cloud Run
  logger.info("Initializing Cloud SQL socket connection");
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST.startsWith("/cloudsql/")
      ? process.env.DB_HOST
      : `/cloudsql/${process.env.DB_HOST}`,
  });
} else {
  // Connect via TCP for local development
  logger.info("Initializing TCP connection to database");
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_PRIVATE_IP || "localhost",
    port: 5432,
  });
}

// Add event listeners
pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err);
});

// Implement retry logic with exponential backoff
const executeWithRetry = async (
  queryFn,
  maxRetries = 3,
  initialDelay = 300
) => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await queryFn();
    } catch (error) {
      retries++;

      // Transient errors that warrant a retry
      const isTransientError =
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        error.code === "40001"; // Postgres serialization failure

      if (!isTransientError || retries > maxRetries) {
        throw error;
      }

      logger.warn(
        `Database operation failed, retrying (${retries}/${maxRetries})`,
        { error: error.message }
      );

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// Check database health
const checkHealth = async () => {
  let client;
  try {
    client = await pool.connect();
    const results = await Promise.all([
      client.query("SELECT 1"),
      client.query("SELECT version()"),
    ]);

    return {
      connected: true,
      version: results[1].rows[0].version,
    };
  } catch (error) {
    logger.error("Database health check failed", error);
    return { connected: false, error: error.message };
  } finally {
    if (client) client.release();
  }
};

// Export functions with retry logic
module.exports = {
  query: (text, params) => executeWithRetry(() => pool.query(text, params)),
  getClient: () => pool.connect(),
  checkHealth,
};
