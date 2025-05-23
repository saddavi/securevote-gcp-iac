// Server configuration for SecureVote API
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const winston = require("winston");
require("dotenv").config();

// Configure logger first for potential error handling
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "securevote-api" },
  transports: [new winston.transports.Console()],
});

// Try loading bcrypt with robust error handling
let bcryptAvailable = true;
try {
  require("bcrypt");
  logger.info("bcrypt module loaded successfully");
} catch (error) {
  bcryptAvailable = false;
  logger.error(`Failed to load bcrypt: ${error.message}`, { error });
  logger.warn("Authentication features will be limited without bcrypt");

  // Print more detailed diagnostics to help debug native module issues
  if (error.code === "MODULE_NOT_FOUND") {
    logger.error("bcrypt module not found - check npm installation");
  } else if (error.message && error.message.includes("native module")) {
    logger.error(
      "Native module issue with bcrypt - likely a platform compatibility problem"
    );
    // Log system info to help diagnose
    const os = require("os");
    logger.info("System platform:", process.platform);
    logger.info("System architecture:", process.arch);
    logger.info("Node version:", process.version);
  }
}

// Load other modules
const authRoutes = require("./routes/auth");
const electionRoutes = require("./routes/elections");
const voteRoutes = require("./routes/votes");
const resultRoutes = require("./routes/results");
const db = require("./models/db");

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    path: req.path,
    query: req.query,
  });
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/results", resultRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbStatus = await db.checkHealth();

    res.status(200).json({
      status: "healthy",
      database: dbStatus.connected ? "connected" : "disconnected",
      version: process.env.API_VERSION || "1.0.0",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("SecureVote API is running. See /api/* for endpoints.");
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.code || "SERVER_ERROR",
    },
  });
});

const PORT = process.env.PORT || 8080;

// Print Cloud Run specific environment info
if (process.env.K_SERVICE) {
  logger.info(`Running in Cloud Run environment`);
  logger.info(`Service: ${process.env.K_SERVICE}`);
  logger.info(`Revision: ${process.env.K_REVISION}`);
  logger.info(`DB_HOST: ${process.env.DB_HOST || "not set"}`);
}

// Start server with better error handling
try {
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(
      `Server running on port ${PORT} in ${
        process.env.NODE_ENV || "development"
      } mode`
    );
    logger.info(`Health check available at http://0.0.0.0:${PORT}/health`);
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  });

  server.on("error", (error) => {
    logger.error(`Server error: ${error.message}`, { error });
    // Try to restart with minimal server as a last resort
    if (error.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
  });
} catch (error) {
  logger.error(`Failed to start server: ${error.message}`, { error });
  process.exit(1);
}

module.exports = app;
