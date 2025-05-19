# Final API Deployment Steps

This document outlines the steps required to finalize the deployment of the SecureVote API.

## 1. API Deployment Requirements

### 1.1 Build the API Container

The current API service is running the placeholder image. We need to build and push our actual API image:

```bash
# Set environment variables
export PROJECT_ID=securevote-iac
export REGION=us-central1
export TAG=v1.0.0
export ENVIRONMENT=dev

# Navigate to API directory
cd api

# Build Docker image
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/securevote-repo/securevote-api:${TAG}-${ENVIRONMENT} .

# Configure Docker for Artifact Registry if not already done
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Push image
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/securevote-repo/securevote-api:${TAG}-${ENVIRONMENT}
```

### 1.2 Update Cloud Run Service

Update the Cloud Run service to use the newly built image:

```bash
# Update the Cloud Run service
gcloud run services update securevote-api-dev \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/securevote-repo/securevote-api:${TAG}-${ENVIRONMENT}
```

## 2. Database Initialization

Since we cannot directly connect to the Cloud SQL instance due to it having only a private IP, we need to:

### 2.1 Set up Cloud SQL Auth Proxy

```bash
# Install Cloud SQL Auth Proxy (if not already installed)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.1/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy
```

### 2.2 Create Database Schema through Cloud Run job

Create a one-time Cloud Run job to initialize the database:

```bash
# Create a job to run migrations
gcloud run jobs create db-migrations \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/securevote-repo/securevote-api:${TAG}-${ENVIRONMENT} \
  --command="node" \
  --args="src/utils/db_migrate.js" \
  --vpc-connector=vpc-connector-dev \
  --service-account=cloudrun-service-dev@${PROJECT_ID}.iam.gserviceaccount.com \
  --set-cloudsql-instances=${PROJECT_ID}:${REGION}:securevote-db-dev \
  --set-env-vars="DB_HOST=/cloudsql/${PROJECT_ID}:${REGION}:securevote-db-dev,DB_USER=securevote-app-user-dev,DB_NAME=votes"
```

### 2.3 Run the Migration Job

```bash
# Execute the migration job
gcloud run jobs execute db-migrations --region=${REGION} --wait
```

## 3. Test the Deployed API

Use the test connectivity script to verify the API is working properly:

```bash
./scripts/test_connectivity.sh --create-user
```

## 4. Configure Automatic Scaling

```bash
# Configure scaling for cost efficiency
gcloud run services update securevote-api-dev \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --min-instances=0 \
  --max-instances=10 \
  --cpu-throttling
```

## 5. Enable HTTPS and Security Headers

```bash
# Update the service with security configurations
gcloud run services update securevote-api-dev \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --set-env-vars="NODE_ENV=production,CORS_ORIGIN=https://securevote-iac-frontend-dev.web.app" \
  --ingress=all \
  --session-affinity
```

## 6. Run Performance Tests

```bash
# Run a simple load test (requires hey tool)
brew install hey
hey -n 1000 -c 50 -m GET https://$(terraform -chdir=terraform/environments/dev output -raw api_url)/health
```

## 7. Create a Production Deployment Plan

After successful testing in the development environment, plan for production deployment.

```bash
# Create the production deployment plan
ENVIRONMENT=prod ./scripts/deploy_api.sh --dry-run
```
