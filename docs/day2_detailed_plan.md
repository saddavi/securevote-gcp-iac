# SecureVote Project: Day 2 Implementation Plan

## Morning: Database Schema Implementation (3 hours)

### 1. Create Database Schema Files

- Created structured database schema with tables for users, elections, ballots, ballot options, votes, and audit logs
- Added appropriate data types, constraints, and relationships
- Used UUIDs for primary keys to enhance security
- Added comments for documentation

```sql
-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  organization VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Elections table
CREATE TABLE elections (
  election_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  created_by UUID REFERENCES users(user_id),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ballots table
CREATE TABLE ballots (
  ballot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES elections(election_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ballot options table
CREATE TABLE ballot_options (
  option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ballot_id UUID REFERENCES ballots(ballot_id) ON DELETE CASCADE,
  option_text VARCHAR(255) NOT NULL,
  option_order INTEGER NOT NULL
);

-- Votes table (with encryption)
CREATE TABLE votes (
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES elections(election_id) ON DELETE CASCADE,
  voter_hash VARCHAR(255) NOT NULL,
  encrypted_choice TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_code VARCHAR(50) UNIQUE NOT NULL
);

-- Audit logs table
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  user_id UUID,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB
);
```

### 2. Set Up Database Migration Scripts

- Created a migration system with numbered SQL files
- Implemented a migration runner script that uses Cloud SQL Proxy for secure connectivity
- Added proper error handling and logging

```bash
#!/bin/bash

# Database migration script for SecureVote
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

# Get Cloud SQL instance connection info
INSTANCE_CONNECTION_NAME=$(terraform -chdir=terraform/environments/${ENVIRONMENT} output -raw database_connection_name)
DB_NAME=$(terraform -chdir=terraform/environments/${ENVIRONMENT} output -raw database_name)
DB_USER=$(terraform -chdir=terraform/environments/${ENVIRONMENT} output -raw database_user)

# Get password from Secret Manager
DB_PASSWORD=$(gcloud secrets versions access latest --secret=db-password-${ENVIRONMENT})

# Make sure Cloud SQL Proxy is installed
if ! command -v cloud_sql_proxy &> /dev/null; then
  echo "Cloud SQL Proxy not found, installing..."
  curl -o cloud_sql_proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.1/cloud-sql-proxy.darwin.amd64
  chmod +x cloud_sql_proxy
  mv cloud_sql_proxy /usr/local/bin/
fi

# Start Cloud SQL Proxy in background
echo "Starting Cloud SQL Proxy..."
cloud_sql_proxy --port=5432 ${INSTANCE_CONNECTION_NAME} &
PROXY_PID=$!

# Wait for proxy to start
sleep 5

# Apply migrations
echo "Applying migrations..."
for migration in database/migrations/*.sql; do
  echo "Running $migration..."
  PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f $migration
done

# Kill proxy when done
kill $PROXY_PID
echo "Migration completed successfully"
```

### 3. Configured Database Backup Verification

- Created a script to verify backup status and alert on failures
- Integrated with GCP's backup system for Cloud SQL
- Added environment configuration for flexible deployment

```bash
#!/bin/bash

# Backup verification script for SecureVote
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

# Get Cloud SQL instance name
DB_INSTANCE=$(terraform -chdir=terraform/environments/${ENVIRONMENT} output -raw database_instance)

# Check backup status
echo "Checking backup status for $DB_INSTANCE..."
BACKUPS=$(gcloud sql backups list --instance=$DB_INSTANCE --project=$PROJECT_ID --format="table(id, windowStartTime, status)")

echo "$BACKUPS"

# Check for failed backups
FAILED_BACKUPS=$(echo "$BACKUPS" | grep -i failed | wc -l)
if [ $FAILED_BACKUPS -gt 0 ]; then
  echo "WARNING: Found $FAILED_BACKUPS failed backups!"
  exit 1
else
  echo "All backups successful!"
fi
```

## Afternoon: API Development (4 hours)

### 1. Set Up API Project Structure

- Created Node.js project with Express framework
- Installed essential dependencies for security, logging, and database connectivity
- Set up organized directory structure for a maintainable codebase

### 2. Implemented Core API Components

- Created secure server configuration with proper middleware
- Implemented database connection with retry logic and connection pooling
- Added authentication routes with JWT token generation
- Set up health check endpoint for monitoring

```javascript
// Sample server.js implementation
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const winston = require("winston");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const electionRoutes = require("./routes/elections");
const voteRoutes = require("./routes/votes");
const resultRoutes = require("./routes/results");

// Configure logger
const logger = winston.createLogger({
  level: "info",
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
    const dbStatus = await require("./models/db").checkHealth();

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
  logger.info(`Server running on port ${PORT}`);
});
```

### 3. Created Configuration for Different Environments

- Set up environment-specific configuration files
- Created Dockerfile for containerization
- Implemented secure credential handling

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8080

# Start the server
CMD ["node", "src/server.js"]
```

## Evening: Containerization & Deployment (3 hours)

### 1. Built Docker Container Build & Push System

- Created a script to build and push images to Google Artifact Registry
- Added version tagging for image management
- Implemented automatic repository creation if not exists

```bash
#!/bin/bash

# Build and push API container to Artifact Registry
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

# Set variables
PROJECT_ID=${PROJECT_ID:-securevote-iac}
ENVIRONMENT=${ENVIRONMENT:-dev}
IMAGE_NAME=securevote-api
TAG=${TAG:-latest}
REGION=${REGION:-us-central1}

# Make sure Artifact Registry repository exists
echo "Creating Artifact Registry repository if it doesn't exist..."
gcloud artifacts repositories describe securevote-repo \
  --location=$REGION \
  --project=$PROJECT_ID > /dev/null 2>&1 || \
gcloud artifacts repositories create securevote-repo \
  --repository-format=docker \
  --location=$REGION \
  --description="SecureVote Docker repository" \
  --project=$PROJECT_ID

# Configure Docker to use gcloud auth
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build the Docker image
echo "Building Docker image..."
docker build -t ${REGION}-docker.pkg.dev/$PROJECT_ID/securevote-repo/$IMAGE_NAME:$TAG-$ENVIRONMENT ./api

# Push to Artifact Registry
echo "Pushing image to Artifact Registry..."
docker push ${REGION}-docker.pkg.dev/$PROJECT_ID/securevote-repo/$IMAGE_NAME:$TAG-$ENVIRONMENT

echo "Image built and pushed successfully: ${REGION}-docker.pkg.dev/$PROJECT_ID/securevote-repo/$IMAGE_NAME:$TAG-$ENVIRONMENT"

# Update the Cloud Run module variables
echo "Updating Cloud Run module to use the new image..."
IMAGE_PATH="${REGION}-docker.pkg.dev/$PROJECT_ID/securevote-repo/$IMAGE_NAME:$TAG-$ENVIRONMENT"

# Create a tfvars file to override the image
cat > terraform/environments/$ENVIRONMENT/image.auto.tfvars << EOF
cloud_run_image = "$IMAGE_PATH"
EOF

echo "Created terraform/environments/$ENVIRONMENT/image.auto.tfvars"
echo "Run 'terraform apply' in the environment directory to deploy the new image"
```

### 2. Updated Terraform Cloud Run Module

- Modified Cloud Run module to accept custom container images
- Added appropriate variables and defaults
- Updated environment configuration to use the new image parameter

### 3. Created Connectivity Testing Scripts

- Implemented health check and authentication testing
- Added database connectivity verification
- Created user management testing capabilities

```bash
#!/bin/bash

# Database connectivity test for SecureVote
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found"
  exit 1
fi

# Get Cloud Run service URL
API_URL=$(terraform -chdir=terraform/environments/${ENVIRONMENT} output -raw api_url 2>/dev/null)

if [ -z "$API_URL" ]; then
  echo "Error: Could not retrieve API URL from terraform output"
  echo "Make sure you've deployed the infrastructure and the output is defined"
  exit 1
fi

echo "Testing API health at $API_URL/health..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
echo $HEALTH_RESPONSE | jq || echo $HEALTH_RESPONSE

# Check database connection status
DB_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.database' 2>/dev/null)

if [ "$DB_STATUS" != "connected" ]; then
  echo "Error: Database connection failed"
  exit 1
else
  echo "✅ Database connection successful!"
fi

echo "Testing API endpoints..."

# Test user creation if --create-user flag is provided
if [ "$1" == "--create-user" ]; then
  echo "Creating test user..."
  TEST_USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test1234!","fullName":"Test User","organization":"Test Org","role":"admin"}')

  echo $TEST_USER_RESPONSE | jq || echo $TEST_USER_RESPONSE

  # Extract token for further tests
  TOKEN=$(echo $TEST_USER_RESPONSE | jq -r '.token' 2>/dev/null)
else
  # Otherwise, try to login
  echo "Logging in with test user..."
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test1234!"}')

  echo $LOGIN_RESPONSE | jq || echo $LOGIN_RESPONSE

  # Extract token for further tests
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)
fi

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Error: Could not authenticate"
  exit 1
fi

echo "✅ Authentication successful!"
echo "All tests passed!"
```

## Integration with Existing Infrastructure

All of these components integrate seamlessly with your existing GCP infrastructure:

1. The database schema works with your Cloud SQL PostgreSQL instance
2. The API connects securely using Cloud SQL Proxy via the VPC connector
3. Secrets are managed using Secret Manager with KMS encryption
4. The container is deployed to Cloud Run with proper IAM permissions
5. Everything is parameterized for environment-specific deployment

## Next Steps

After completing Day 2 tasks:

1. **Database Population**: Create sample data sets for testing
2. **API Testing**: Thoroughly test all API endpoints with Postman or similar tools
3. **Frontend Integration Planning**: Design how the frontend will interact with the API
4. **Security Review**: Review IAM permissions and adjust as needed
5. **Documentation**: Document the database schema and API endpoints

This plan provides a solid foundation for the SecureVote system, implementing the core database and backend functionality while following best practices for security, scalability, and code organization.
