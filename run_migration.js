#!/usr/bin/env node
// Simple migration runner for Cloud Run Job
const { exec } = require("child_process");
const path = require("path");

console.log("Starting migration job...");

// Set working directory to api folder
process.chdir("/app");

// Run the migration script
exec("node src/utils/db_migrate.js", (error, stdout, stderr) => {
  if (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  if (stderr) {
    console.error("Migration stderr:", stderr);
  }

  console.log("Migration output:", stdout);
  console.log("Migration completed successfully!");
  process.exit(0);
});
