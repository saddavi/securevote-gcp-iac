// Server configuration for SecureVote API
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const winston = require("winston");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const electionRoutes = require("./routes/elections");
const voteRoutes = require("./routes/votes");
const resultRoutes = require("./routes/results");
const db = require("./models/db");

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "securevote-api" },
  transports: [new winston.transports.Console()],
});

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
app.listen(PORT, () => {
  logger.info(
    `Server running on port ${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});

module.exports = app;
