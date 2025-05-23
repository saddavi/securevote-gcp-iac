// Ultra minimal Express server for Cloud Run deployment testing
// Imports kept minimal to avoid module loading issues
const express = require("express");
const http = require("http");
const app = express();

// Detailed environment and process information
console.log("***** PROCESS INFORMATION *****");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);

// Get the port from the environment variable
const PORT = parseInt(process.env.PORT) || 8080;

// Print all environment variables to help debug
console.log("***** ENVIRONMENT VARIABLES *****");
console.log("PORT:", PORT);
Object.keys(process.env).forEach((key) => {
  if (!key.includes("PASSWORD") && !key.includes("SECRET")) {
    console.log(`${key}: ${process.env[key]}`);
  }
});

// Add a simple route to confirm the server is running
app.get("/", (req, res) => {
  res.send("SecureVote API minimal test server is running!");
});

// Add health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Create HTTP server
const server = http.createServer(app);

// Start listening on the port
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
