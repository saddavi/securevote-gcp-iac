# SecureVote Infrastructure as Code

Infrastructure code for a secure online voting/survey platform built on Google Cloud Platform using Terraform with a serverless architecture.

## Architecture Overview

This project implements a modern, serverless architecture on GCP with:

- **Frontend**: Static assets hosted on Cloud Storage
- **Backend API**: Cloud Run services for scalable, containerized API
- **Database**: Cloud SQL with private VPC access
- **Networking**: VPC networks with serverless VPC access connectors (optional for dev)
- **Security**: IAM-based authentication and secure firewall rules

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

## Planned Improvements

With the core infrastructure and cost management scripts in place, the next planned improvements are:

- **Implement CI/CD:** Automate Terraform and application deployments using GitHub Actions or another pipeline.
- **Security & Compliance:**
  - Integrate Secret Manager for sensitive credentials
  - Add audit logging for user actions
  - Enhance IAM controls for more granular access

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

---

If you are a hiring manager or recruiter, this project demonstrates my ability to:

- Design and implement cost-effective cloud infrastructure
- Manage infrastructure as code using Terraform
- Implement secure CI/CD pipelines
- Follow cloud engineering best practices

I am actively seeking a Cloud Engineer role in Qatar and am eager to contribute these skills to your team.
