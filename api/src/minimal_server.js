// Minimal server without any dependencies that might cause issues
// Used as a fallback for Cloud Run when other servers fail

const http = require("http");
const os = require("os");

// Print detailed diagnostics
console.log("\n***** MINIMAL SERVER DIAGNOSTICS *****");
console.log("Date/Time:", new Date().toISOString());
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("CPUs:", os.cpus().length);
console.log("Total memory:", Math.round(os.totalmem() / (1024 * 1024)) + " MB");
console.log("Free memory:", Math.round(os.freemem() / (1024 * 1024)) + " MB");
console.log("Process ID:", process.pid);

// Print non-sensitive environment variables
console.log("\n***** ENVIRONMENT VARIABLES *****");
Object.keys(process.env)
  .filter((key) => !key.includes("PASSWORD") && !key.includes("SECRET"))
  .sort()
  .forEach((key) => console.log(`${key}=${process.env[key]}`));

// Get the port with fallback
const PORT = parseInt(process.env.PORT) || 8080;
console.log(`Setting up minimal server on port ${PORT}`);

// Create a minimal HTTP server without Express or other dependencies
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Health check endpoint
  if (req.url === "/health" || req.url === "/") {
    // Check for Cloud SQL socket
    let dbStatus = "unknown";
    const socketPath = process.env.DB_HOST || "";

    if (socketPath.startsWith("/cloudsql/")) {
      try {
        const fs = require("fs");
        const socketDir = socketPath.split("/").slice(0, -1).join("/");
        const exists = fs.existsSync(socketDir);
        dbStatus = exists
          ? "socket directory exists"
          : "socket directory missing";
      } catch (err) {
        dbStatus = `error checking socket: ${err.message}`;
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        message: "SecureVote API minimal server is running!",
        environment: process.env.NODE_ENV || "unknown",
        cloudRunService: process.env.K_SERVICE || "not in cloud run",
        dbHost: socketPath,
        dbStatus: dbStatus,
        memoryUsage:
          Math.round(process.memoryUsage().rss / (1024 * 1024)) + " MB",
      })
    );
    return;
  }

  // Default response for other routes
  res.writeHead(404);
  res.end("Not Found");
});

// Add error handling
server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

// Enhanced error handling throughout the application
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION:", reason);
});

// Start the server with improved error handling
console.log(`\nAttempting to start minimal server on port ${PORT}...`);

try {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `\n***** SUCCESS: Minimal server running on port ${PORT} *****\n`
    );

    // Log successful startup right away
    console.log(`Server is listening for requests at http://0.0.0.0:${PORT}`);
    console.log(`Health endpoint available at http://0.0.0.0:${PORT}/health`);

    // Print Cloud Run specific info if applicable
    if (process.env.K_SERVICE) {
      console.log(`Running as Cloud Run service: ${process.env.K_SERVICE}`);
      console.log(`Revision: ${process.env.K_REVISION}`);

      // Check if we're running in Cloud Run to help with troubleshooting
      console.log(`Cloud Run environment detected`);
      console.log(`Using DB_HOST=${process.env.DB_HOST || "not set"}`);
      console.log(
        `DB_CONNECTION_NAME=${process.env.DB_CONNECTION_NAME || "not set"}`
      );
    }
  });
} catch (error) {
  console.error("FATAL: Failed to start server:", error);
  process.exit(1);
}

// Handle SIGINT (Ctrl+C in local development)
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle SIGTERM (Cloud Run shutdown signal)
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    console.error("Forced shutdown due to timeout");
    process.exit(1);
  }, 5000);
});
