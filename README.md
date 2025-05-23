# SecureVote Infrastructure as Code

Infrastructure code for a secure online voting/survey platform built on Google Cloud Platform using Terraform with a serverless architecture. This README documents my complete journey with this project - from initial setup through all challenges and solutions as a first-time GCP user.

## Table of Contents

- [Project Journey & Status](#project-journey--status)
- [Architecture Overview & Technical Journey](#architecture-overview--technical-journey)
- [API Development Challenges & Solutions](#api-development-challenges--solutions)
- [Database Design & Migration Journey](#database-design--migration-journey)
- [Cost-Optimized Infrastructure](#cost-optimized-infrastructure)
- [Prerequisites](#prerequisites)
- [Containerization & Deployment Journey](#containerization--deployment-journey)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Security Features](#security-features)
- [Resource Management & Cost Control](#resource-management--cost-control)
- [Documentation Resources](#documentation-resources)
- [CI/CD Implementation Status](#cicd-implementation-status)
- [Development Best Practices](#development-best-practices)
- [Git Workflow & Branch Management](#git-workflow--branch-management)
- [Key Lessons Learned & Mistakes Made](#key-lessons-learned--mistakes-made)
- [Future Improvements](#future-improvements)

## Technology Stack

- **Cloud Platform**: Google Cloud Platform (GCP)
- **Infrastructure as Code**: Terraform
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL on Cloud SQL
- **API Authentication**: JSON Web Tokens (JWT)
- **Containerization**: Docker
- **Deployment**: Cloud Run
- **Storage**: Cloud Storage
- **CI/CD**: GitHub Actions
- **Networking**: VPC, Serverless VPC Access
- **Security**: Secret Manager, IAM

## Project Journey & Status

### Initial Concept (Day 1-2)

I started this project as my first ever Google Cloud Platform implementation with the goal of creating a secure online voting system. Having no prior GCP experience, I faced numerous initial challenges:

- Learning GCP's service equivalents coming from AWS experience
- Understanding Terraform's application in the GCP environment
- Figuring out the right architecture for a budget-conscious serverless application

### Architecture Evolution (Day 3-5)

My initial architecture was monolithic with all infrastructure in a single Terraform file. I soon realized this wasn't maintainable and refactored to:

1. Create a modular architecture with separate components
2. Implement environment isolation between dev and prod
3. Set up proper networking with optional VPC for cost savings

### API Development Challenges (Day 6-10)

The Node.js API implementation faced several critical issues:

1. **Cloud SQL Proxy Connection Issues**: The API couldn't connect to the database through the socket
2. **Database Connection Management**: Poor connection handling caused performance issues
3. **bcrypt Compatibility Problems**: Authentication failures due to bcrypt version conflicts
4. **Server Initialization Errors**: The API server wouldn't start properly

### Current Status: Final Testing and Documentation Phase

After overcoming these challenges, the SecureVote project is now in the final testing and documentation phase. All core infrastructure components have been implemented, database schema designed, API endpoints created, and critical bugs fixed. The project is ready for final deployment and validation.

## Architecture Overview & Technical Journey

This project implements a modern, serverless architecture on GCP with:

- **Frontend**: Static assets hosted on Cloud Storage
- **Backend API**: Cloud Run services for scalable, containerized API
- **Database**: Cloud SQL with private VPC access
- **Networking**: VPC networks with serverless VPC access connectors (optional for dev)
- **Security**: IAM-based authentication and secure firewall rules

### Architecture Diagram

```
┌───────────────┐     ┌───────────────┐     ┌───────────────────┐
│               │     │               │     │                   │
│  Cloud        │     │  Cloud Run    │     │  Cloud SQL        │
│  Storage      │─────▶  API Service  │─────▶  (PostgreSQL)     │
│  (Frontend)   │     │  (Backend)    │     │  (Database)       │
│               │     │               │     │                   │
└───────────────┘     └───────────────┘     └───────────────────┘
                             │
                             │
                      ┌──────▼──────┐
                      │             │
                      │  Secret     │
                      │  Manager    │
                      │             │
                      └─────────────┘

VPC Network (Production)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  │
│  │             │      │             │      │             │  │
│  │  Private    │      │  Serverless │      │  Internal   │  │
│  │  Subnet     │──────▶  VPC Access │──────▶  Database   │  │
│  │             │      │  Connector  │      │  Access     │  │
│  └─────────────┘      └─────────────┘      └─────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Evolution from Monolithic to Modular

My initial architecture was monolithic - a common beginner mistake on cloud platforms. I later refactored to a modular approach:

```
Before:
├── main.tf       # All resources in one file
├── variables.tf
└── outputs.tf

After:
├── modules/      # Modular components
│   ├── cloud-run/
│   ├── database/
│   ├── networking/
│   └── ...
└── environments/ # Environment-specific configurations
    ├── dev/
    └── prod/
```

This modular approach solved several issues:

- Simplified maintenance of complex infrastructure
- Enabled environment-specific configurations
- Improved reusability of components
- Made troubleshooting easier

### Environment Isolation

The infrastructure maintains complete separation between:

- **Development Environment**: For testing and staging

  - Optional VPC network for cost savings
  - Environment-specific configurations
  - Cost-optimized resource settings
  - Start/stop scripts for resource management

- **Production Environment**: For the live system
  - Full VPC network implementation
  - Production-grade security measures
  - High-availability configurations
  - Dedicated service accounts with minimal permissions

## API Development Challenges & Solutions

### Critical Issue 1: Cloud SQL Proxy Socket Connection

**Problem**: The API couldn't connect to the database through the Unix socket.

**Root Cause**: Cloud SQL proxy was running but the socket path wasn't properly configured in the API.

**Solution**:

```javascript
// Fixed connection string in db.js
const pool = new Pool({
  host: "/cloudsql/project:region:instance", // Unix socket path
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});
```

### Critical Issue 2: Database Connection Management

**Problem**: Poor connection handling caused performance issues and connection leaks.

**Solution**: Implemented connection pooling and proper error handling:

```javascript
// Before: New connection for every query
// After: Connection pooling with proper release
const pool = new Pool({...});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release(); // Ensures connection is always returned to pool
  }
}
```

### Critical Issue 3: bcrypt Compatibility

**Problem**: Authentication failures due to bcrypt version conflicts between the hash generation and verification.

**Solution**: Standardized on bcrypt version and fixed hash comparison:

```javascript
// Consistent bcrypt configuration
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### Critical Issue 4: Server Initialization

**Problem**: The API server wouldn't start properly due to middleware and route initialization issues.

**Solution**: Restructured the server initialization code with proper ordering:

```javascript
// Proper server initialization sequence
const app = express();
app.use(express.json());
app.use(corsMiddleware);

// Register routes
app.use("/auth", authRoutes);
app.use("/elections", authMiddleware, electionRoutes);
// ...

// Error handling middleware added last
app.use(errorHandler);
```

### API Endpoints Summary

The SecureVote API includes these key endpoints:

#### Authentication

- `POST /auth/login`: User login with email and password
- `POST /auth/register`: Register a new user account
- `GET /auth/me`: Get current authenticated user info

#### Elections

- `GET /elections`: List all elections
- `GET /elections/:id`: Get election details
- `POST /elections`: Create a new election
- `PUT /elections/:id`: Update an existing election
- `DELETE /elections/:id`: Delete an election

#### Votes

- `POST /votes`: Cast a vote in an election
- `GET /votes/my-votes`: Get votes cast by the current user

#### Results

- `GET /results/:electionId`: Get results for a specific election
- `GET /results/:electionId/statistics`: Get detailed voting statistics

## Database Design & Migration Journey

### Database Evolution

I created a PostgreSQL database with Cloud SQL and went through several iterations:

1. **Initial Schema Creation** (`001_initial_schema.sql`):

   - Created core tables for elections, voters, and votes
   - Implemented proper relationships and constraints
   - Set up UUID primary keys for security

2. **Performance Optimization** (`002_indexes.sql`):

   - Added indexes for frequently queried columns
   - Optimized join operations
   - Improved query performance

3. **Test Data Creation** (`003_create_test_user.sql`):

   - Added users table with secure password storage
   - Created test admin user with bcrypt-hashed password
   - Example of the migration:

   ```sql
   -- Create the users table if it doesn't exist
   CREATE TABLE IF NOT EXISTS users (
     user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     hashed_password VARCHAR(255) NOT NULL,
     full_name VARCHAR(255),
     organization VARCHAR(255),
     role VARCHAR(50) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     last_login TIMESTAMP
   );

   -- Add a test user with password 'test123'
   INSERT INTO users (email, hashed_password, full_name, role)
   VALUES ('test@example.com', '$2b$10$Dm1.2uTa/li4zE6VFVNcPetmJVUpyHh.Y1YgkTe43nB2nCA2vKZp6', 'Test User', 'admin')
   ON CONFLICT (email) DO NOTHING;
   ```

### Database Connection Lessons Learned

- **Private IP vs Public IP**: Initially used public IP with firewall rules, then switched to more secure private IP through VPC
- **Connection Pooling**: Essential for performance in Cloud SQL
- **Socket vs TCP/IP**: Unix socket connections are more efficient within GCP but required special configuration

## Cost-Optimized Infrastructure

Estimated monthly costs for development:

- Cloud Run: $0-1 (mostly free tier)
- Cloud Storage: $0-1
- Cloud SQL (when needed): $7-9
- VPC (optional): $0-5
  Total Expected: Under $10/month during development

### Cost Management Features

- Optional VPC components for development
- Minimal instance sizes
- Start/stop scripts for expensive resources
- Lifecycle policies for storage
- Free tier utilization

## Prerequisites

- Google Cloud SDK
- Terraform >= 1.3
- Access to GCP Project: `securevote-iac`
- Service account with necessary permissions
- GitHub CLI (gh) for PR management

## Containerization & Deployment Journey

### Docker Configuration Evolution

The containerization process went through several iterations:

1. **Initial Basic Dockerfile**:

   ```dockerfile
   FROM node:14
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   CMD ["npm", "start"]
   ```

2. **Cloud SQL Proxy Integration**:

   - Had to modify the container to work with Cloud SQL proxy
   - Created a startup script (`start.sh`) to handle connection initialization

3. **Production-Ready Container**:
   - Multi-stage builds to reduce image size
   - Non-root user for security
   - Proper signal handling for graceful shutdown

### Deployment Challenges

- **Environment Variables**: Managing secrets between environments
- **Container Registry Access**: Setting up proper IAM permissions
- **Cold Start Performance**: Optimizing the container for faster startup times
- **Cloud Run Configuration**: Finding the right memory/CPU settings for cost/performance balance

## Project Structure

```
securevote-gcp-iac/
├── terraform/
│   ├── modules/
│   │   ├── cloud-run/      # Cloud Run service configuration
│   │   ├── database/       # Cloud SQL database setup
│   │   ├── iam/           # IAM roles and permissions
│   │   ├── networking/    # VPC and network configuration
│   │   └── storage/       # Storage buckets and configurations
│   ├── environments/
│   │   ├── dev/          # Development environment
│   │   └── prod/         # Production environment
│   └── backend.tf        # GCS backend configuration
├── docs/
│   └── session_changes_may17.md  # Detailed change documentation
├── scripts/
│   ├── db_control.sh
│   ├── start_all_dev_resources.sh
│   └── stop_all_dev_resources.sh
└── README.md
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/saddavi/securevote-gcp-iac.git
cd securevote-gcp-iac
```

2. Initialize Terraform for development:

```bash
cd terraform/environments/dev
terraform init
```

3. Plan and apply changes:

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

4. Managing development resources:

```bash
# Start resources
./scripts/start_all_dev_resources.sh

# Stop resources when not in use
./scripts/stop_all_dev_resources.sh
```

## Security Features

- **Network Segmentation**:

  - Optional VPC networks for cost-effective development
  - Private subnets with controlled ingress/egress
  - Internal-only database access via private IP

- **Firewall Protection**:
  - Granular firewall rules allowing only necessary traffic
  - TCP/UDP/ICMP traffic controlled within VPC subnets
  - Limited serverless-to-VPC communication (ports 443, 8080, 5432)
- **Identity and Access Management**:

  - Principle of least privilege for all service accounts
  - Environment-specific IAM roles and permissions
  - IAM-based authentication between services

- **Data Protection**:
  - Cloud SQL with private VPC access only
  - Encrypted connections for all service communications
  - Isolated storage buckets with appropriate ACLs

## Resource Management & Cost Control

To minimize costs during development, the following scripts are included and ready to use:

- `scripts/stop_all_dev_resources.sh`: Stops Cloud SQL, scales Cloud Run to zero, and (optionally) deletes VPC connectors.
- `scripts/start_all_dev_resources.sh`: Starts Cloud SQL and provides guidance for recreating VPC connectors and Cloud Run min-instances.

> Note: Cloud SQL and Cloud Storage will still incur storage costs even when stopped.

## Documentation Resources

The following documentation is available to help you work with the SecureVote platform:

- [**API Documentation**](/docs/api_documentation.md): Details of all API endpoints, authentication, and request/response formats
- [**Deployment Guide**](/docs/deployment_guide.md): Step-by-step instructions for deploying the SecureVote platform
- [**Cost Management**](/docs/cost_management.md): Strategies for keeping the project under the $10/month budget
- [**Final Deployment Steps**](/docs/final_deployment.md): Instructions for completing the API deployment
- [**Project Completion Report**](/docs/project_completion.md): Summary of accomplished work and next steps
- [**Final Checklist**](/docs/final_checklist.md): Comprehensive checklist for project completion

## CI/CD Implementation Status

The CI/CD pipeline has been implemented using GitHub Actions with both validation and deployment capabilities:

### Latest Improvements

1. **Environment-Specific Deployments**:

   - Separate workflows for dev/prod
   - Environment-specific variable handling
   - Cost-optimized development deployments

2. **Enhanced Security**:

   - Secure secret management
   - Service account key rotation
   - Least privilege access implementation

3. **Validation Improvements**:
   - Added terraform fmt checks
   - Implemented cost estimation
   - Resource validation steps

### Workflow Details

The GitHub Actions workflow triggers on:

- Pull requests targeting any branch
- Direct pushes to feature/\* branches
- Changes in `terraform/` directory

The workflow includes:

1. **Validation (all PRs)**:

   - Code formatting verification
   - Infrastructure validation
   - Cost estimation review

2. **Deployment (with approvals)**:
   - Environment-specific deployments
   - Manual approval requirements
   - Post-deployment validation

## Development Best Practices

1. **Cost Management**:

   - Use start/stop scripts for expensive resources
   - Enable VPC only when needed
   - Monitor GCP billing dashboard

2. **Security**:

   - Follow least privilege principle
   - Use environment-specific configurations
   - Implement proper secret management

3. **Development Workflow**:
   - Create feature branches for changes
   - Submit changes through pull requests
   - Use conventional commit messages

## Git Workflow & Branch Management

### Feature Branches & Merge Process

I used a feature branch workflow throughout this project:

1. Created `feature/modular-architecture` branch for major refactoring
2. Implemented and tested changes on the feature branch
3. When complete, merged changes back to `main` branch
4. Deleted the feature branch after successful merge

### Git Workflow Lessons

- **Atomic Commits**: I learned to make smaller, focused commits with clear messages
- **Branching Strategy**: Feature branches helped isolate changes and prevent breaking the main branch
- **Pull Request Process**: Used PRs for code review before merging
- **Merge Conflict Resolution**: Experienced and resolved several merge conflicts

Example of my feature branch workflow:

```bash
# Create feature branch
git checkout -b feature/modular-architecture

# Make changes and commit
git add .
git commit -m "refactor: implement modular architecture"

# Push to remote
git push origin feature/modular-architecture

# After PR approval, merge to main
git checkout main
git merge feature/modular-architecture

# Delete the feature branch
git branch -d feature/modular-architecture
git push origin --delete feature/modular-architecture
```

## Contributing

1. Create a new feature branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:

```bash
git add .
git commit -m "feat: your feature description"
```

3. Push and create a pull request:

```bash
git push origin feature/your-feature-name
gh pr create
```

## Key Lessons Learned & Mistakes Made

As my first GCP project, this journey taught me numerous valuable lessons:

### Mistakes & Lessons

1. **Monolithic Architecture**: Starting with all infrastructure in one file was a mistake; modularization was essential
2. **Database Connectivity**: Spent too much time debugging Cloud SQL connectivity; should have used the recommended connection patterns from the start
3. **IAM Permissions**: Initially granted overly broad permissions; had to refactor to follow least privilege principle
4. **Cost Management**: Initially incurred unexpected costs from always-on resources; implemented start/stop scripts as a solution
5. **VPC Configuration**: Initially complicated the networking setup; learned to use simpler patterns for development

### GCP-Specific Learnings

1. **Cloud Run vs App Engine**: Learned when to use each service
2. **Cloud SQL Proxy**: Understanding how to properly connect applications
3. **Serverless VPC Access**: Configuration and troubleshooting
4. **IAM & Service Accounts**: GCP's approach to authentication and authorization
5. **Terraform with GCP**: Provider-specific patterns and best practices

### What I Would Do Differently

1. Start with a modular architecture from day one
2. Use more granular IAM permissions from the beginning
3. Implement proper dev/prod separation earlier in the process
4. Focus more on automated testing earlier
5. Use infrastructure patterns recommended by GCP documentation rather than trying to replicate AWS patterns

## Future Improvements

For the next phase of this project, I plan to implement these specific enhancements:

### Short-term Improvements (1-2 months)

1. **Automated Testing**

   - Implement Jest unit tests for API endpoints
   - Add integration tests for database operations
   - Set up automated UI testing for frontend components

2. **Monitoring & Observability**

   - Configure Cloud Monitoring dashboards for API performance metrics
   - Set up alerting for critical failures and performance degradation
   - Implement structured logging with better error categorization

3. **Database Enhancements**
   - Configure automated daily backups with 7-day retention
   - Set up point-in-time recovery capability
   - Implement database migration automation

### Medium-term Improvements (3-6 months)

1. **API Enhancements**

   - Add email notification service for election events
   - Implement real-time updates using WebSockets
   - Add file upload capabilities for election materials

2. **Security Hardening**
   - Implement rate limiting for API endpoints
   - Add CAPTCHA for sensitive operations
   - Enhance authentication with MFA options
   - Set up automated security scanning in CI/CD pipeline

### Long-term Vision (6+ months)

1. **Scale & Reliability**
   - Deploy to multiple regions for high availability
   - Implement automated failover capabilities
   - Set up advanced analytics for voting patterns
   - Create a mobile application for voting

---

If you are a hiring manager or recruiter, this project demonstrates my ability to:

- Learn and adapt to new cloud platforms (GCP)
- Design and implement cost-effective cloud infrastructure
- Manage infrastructure as code using Terraform
- Implement secure CI/CD pipelines
- Follow cloud engineering best practices
- Document my journey, including mistakes and lessons learned

I am actively seeking a Cloud Engineer role in Qatar and am eager to contribute these skills and continuous learning mindset to your team.
