# SecureVote Deployment & Testing Guide

This document provides step-by-step instructions for deploying and testing the SecureVote application.

## Prerequisites

- Google Cloud SDK installed and configured
- Terraform installed
- Node.js and npm installed
- PostgreSQL client installed

## 1. Infrastructure Deployment

### 1.1 Initialize and Apply Terraform

```bash
# Navigate to the dev environment directory
cd terraform/environments/dev

# Initialize Terraform
terraform init

# Apply the Terraform configuration
terraform plan -out=tfplan
terraform apply tfplan

# Get the Cloud Run URL
export API_URL=$(terraform output -raw api_url)
echo "API URL: $API_URL"
```

### 1.2 Start Cloud Resources

```bash
# Start the database instances
./scripts/db_control.sh start

# Ensure VPC connector is running
# (Should be automatically managed by Terraform)
```

## 2. Database Setup

### 2.1 Apply Database Migrations

```bash
# Run the migrations script
./scripts/run_migrations.sh
```

## 3. API Deployment

### 3.1 Build and Deploy the API

```bash
# Navigate to the API directory
cd api

# Install dependencies
npm install

# Build the API
npm run build

# Deploy to Cloud Run
./scripts/deploy_api.sh
```

## 4. Testing

### 4.1 Run Tests

```bash
# Run the comprehensive API test suite
./scripts/run_api_tests.sh
```

### 4.2 Manual Testing Endpoints

You can also test specific endpoints manually:

#### Health Check

```
curl $API_URL/health
```

#### User Registration

```
curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "fullName": "Test User",
    "organization": "Test Org",
    "role": "admin"
  }'
```

#### User Login

```
curl -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

#### Create Election

```
# Store the token first
TOKEN="your_jwt_token_here"

curl -X POST "$API_URL/api/elections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Election",
    "description": "Test election description",
    "startDate": "2025-06-01T00:00:00Z",
    "endDate": "2025-06-02T00:00:00Z"
  }'
```

## 5. Cost Management

Always remember to stop resources when not in use to stay under the $10/month budget:

```bash
# Stop all dev resources
./scripts/stop_all_dev_resources.sh
```

## 6. Monitoring & Debugging

### 6.1 Check Cloud Run Logs

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=securevote-api-dev" --limit=20
```

### 6.2 Check Database Logs

```bash
gcloud logging read "resource.type=cloudsql_database AND resource.labels.database_id=securevote-db-dev" --limit=10
```

### 6.3 Check Service Health

```bash
# Test database connectivity
./scripts/test_connectivity.sh
```
