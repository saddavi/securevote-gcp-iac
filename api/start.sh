#!/bin/bash

# Don't exit immediately on errors - we want to try the fallback server
set +e

# Print commands for debugging
set -x

# Print environment (without sensitive data)
echo "Environment configuration:"
echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"
echo "DB_HOST=$DB_HOST" 
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
echo "DB_CONNECTION_NAME is set: $([ -n "$DB_CONNECTION_NAME" ] && echo "yes" || echo "no")"
echo "K_SERVICE=${K_SERVICE:-not in Cloud Run}"

# Set default PORT if not provided
if [ -z "$PORT" ]; then
  export PORT=8080
fi
echo "Using PORT: $PORT"

# Function to cleanup on exit
cleanup() {
  echo "Cleaning up..."
  if [ -n "$CLOUD_SQL_PID" ] && kill -0 "$CLOUD_SQL_PID" 2>/dev/null; then
    echo "Killing Cloud SQL Proxy (PID: $CLOUD_SQL_PID)"
    kill "$CLOUD_SQL_PID"
  fi
}
trap cleanup EXIT

# Start Cloud SQL Proxy in the background if DB_CONNECTION_NAME is provided
if [ -n "$DB_CONNECTION_NAME" ]; then
  echo "Starting Cloud SQL Proxy..."
  mkdir -p /cloudsql
  
  # Cloud Run actually handles the Cloud SQL Proxy connection for us
  # We should NOT try to start the proxy manually in Cloud Run environment
  if [ -n "$K_SERVICE" ]; then
    echo "Running in Cloud Run environment - using managed Cloud SQL sockets"
    # Check if socket directory exists and is accessible
    if [ -d "/cloudsql" ]; then
      echo "Cloud SQL socket directory exists at /cloudsql"
      ls -la /cloudsql/ || echo "Cannot list socket directory"
      
      # We don't need to start the proxy - Cloud Run handles it
      echo "Using Cloud Run managed Cloud SQL connections"
      export DB_HOST="/cloudsql/$DB_CONNECTION_NAME"
    else
      echo "WARNING: Cloud SQL socket directory not found or not accessible"
      export DB_HOST="localhost"
    fi
  else
    # Only start Cloud SQL Proxy manually when running locally
    echo "Starting Cloud SQL Proxy for local development..."
    cloud-sql-proxy --unix-socket=/cloudsql "$DB_CONNECTION_NAME" &
    CLOUD_SQL_PID=$!
    echo "Cloud SQL Proxy started with PID: $CLOUD_SQL_PID"
    
    sleep 5
    # Check if proxy is still running
    if ! kill -0 "$CLOUD_SQL_PID" 2>/dev/null; then
      echo "WARNING: Cloud SQL Proxy process died but will continue anyway"
    fi
  fi
  
  # Only verify the proxy is running if we started it manually (not in Cloud Run)
  if [ -z "$K_SERVICE" ] && [ -n "$CLOUD_SQL_PID" ]; then
    if ! kill -0 "$CLOUD_SQL_PID" 2>/dev/null; then
      echo "Cloud SQL Proxy failed to start"
      # Continue anyway to allow the minimal server to run for diagnostics
      echo "Continuing with minimal server for diagnostics..."
    else
      # Verify socket exists (only when running locally)
      SOCKET_PATH="/cloudsql/$DB_CONNECTION_NAME"
      echo "Waiting for socket $SOCKET_PATH to be ready..."
      
      # In local mode, we should check for the socket
      # In Cloud Run, do not attempt socket validation - Cloud Run handles this differently
      # Keep trying to validate but don't fail the startup process if it doesn't work
      timeout=10
      while [ $timeout -gt 0 ] && [ ! -S "$SOCKET_PATH" ]; do
        echo "Waiting for socket $SOCKET_PATH... ($timeout seconds remaining)"
        sleep 1
        timeout=$((timeout - 1))
      done
      
      if [ ! -S "$SOCKET_PATH" ] && [ $timeout -eq 0 ]; then
        echo "Socket $SOCKET_PATH was not created in time, but continuing anyway"
      fi
    fi
  fi
  
  echo "Cloud SQL Proxy is ready!"
fi

echo "Current directory: $(pwd)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if our main server file exists
if [ ! -f "src/server.js" ]; then
  echo "Error: src/server.js not found"
  exit 1
fi

# Attempt to start the main application with better error handling
echo "Starting Node.js application on port $PORT..."

# First try a simple test script to check Node.js environment
node -e "console.log('Node.js environment check passed: ' + process.version)" || {
  echo "ERROR: Basic Node.js environment check failed"
  echo "Falling back to minimal server for diagnostics"
  exec node src/minimal_server.js
}

# Test direct Node.js logging to stdout
node -e "console.log('NODE_LOG_TEST: Hello from Node.js stdout!')"

# Start the main SecureVote API server
echo "Starting main SecureVote API server..."
if node src/server.js; then
  echo "Main API server started successfully"
else
  exit_code=$?
  echo "Main server failed with exit code: $exit_code"
  
  # If main server fails, try the auth debugger as fallback
  echo "Attempting to start authentication debugger as fallback..."
  if node src/auth_debugger.js; then
    echo "Auth debugger fallback started successfully"
  else
    fallback_exit_code=$?
    echo "Both servers failed - main: $exit_code, fallback: $fallback_exit_code"
    exit $exit_code
  fi
fi