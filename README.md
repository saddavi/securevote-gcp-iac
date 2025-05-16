# SecureVote Infrastructure as Code

Infrastructure code for a secure online voting/survey platform built on Google Cloud Platform using Terraform with a serverless architecture.

## Architecture Overview

This project implements a modern, serverless architecture on GCP with:

- **Frontend**: Static assets hosted on Cloud Storage
- **Backend API**: Cloud Run services for scalable, containerized API
- **Database**: Cloud SQL with private VPC access
- **Networking**: VPC networks with serverless VPC access connectors
- **Security**: IAM-based authentication and secure firewall rules

### Environment Isolation

The infrastructure maintains complete separation between:

- **Development Environment**: For testing and staging

  - Dedicated VPC network (`vpc-dev`)
  - Isolated subnet with its own CIDR range
  - Environment-specific firewall rules
  - Separate Cloud Run instances and database access

- **Production Environment**: For the live system
  - Completely isolated VPC network (`vpc-prod`)
  - Production-specific subnet configuration
  - Stricter firewall rules for production traffic
  - Dedicated service accounts with minimal permissions

## Current Infrastructure

- **Development VPC Network**
  - Custom VPC network (`vpc-dev`)
  - Regional subnet in `us-central1`
  - Basic firewall rules:
    - Internal communication within VPC
    - SSH access controls
- **Serverless Components**
  - Cloud Run services for API
  - Cloud Storage for frontend hosting
  - Cloud SQL for database
  - Serverless VPC Access connectors

## Prerequisites

- Google Cloud SDK
- Terraform >= 1.3
- Access to GCP Project: `securevote-iac`
- Service account with necessary permissions

## Getting Started

1. Clone the repository
2. Initialize Terraform:

```bash
cd terraform
terraform init
```

3. Plan and apply changes:

```bash
terraform plan -var="project_id=securevote-iac" -var="terraform_service_account_email=YOUR_SERVICE_ACCOUNT" -out=tfplan
terraform apply tfplan
```

## Project Structure

```
securevote-gcp-iac/
├── terraform/
│   ├── backend.tf         # GCS backend configuration
│   ├── variables.tf       # Input variables
│   ├── main.tf            # Provider configuration and APIs
│   ├── networks.tf        # VPC and subnet definitions
│   ├── firewalls.tf       # Firewall rules
│   ├── iam.tf             # IAM roles and bindings
│   ├── cloud_run.tf       # Serverless API services
│   ├── database.tf        # Cloud SQL configuration
│   ├── storage.tf         # Frontend storage configuration
│   └── outputs.tf         # Output values
└── README.md
```

## Serverless Components

- **Cloud Run**: Containerized microservices that scale automatically
- **Cloud Storage**: Hosting static frontend assets
- **Cloud SQL**: Managed PostgreSQL database
- **Serverless VPC Access**: Connecting serverless services to VPC resources

## Security Features

- **Network Segmentation**:

  - Separate VPC networks for development and production
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

The CI/CD pipeline has been fully implemented using GitHub Actions with both validation and deployment capabilities:

### Implemented Features

1. **Automated Checks on Every Push/PR**:

   - Terraform format verification
   - Terraform code validation
   - Infrastructure plan generation
   - Full GCP authentication

2. **Security**:

   - Secure GCP credentials management using GitHub Secrets
   - Service account with least-privilege access
   - Protected deployment to production environment
   - Required manual approvals for infrastructure changes

3. **Deployment Automation**:
   - Automated Terraform apply on merge to main
   - Production environment protection with required approvals
   - Direct link to GCP console for deployed resources
   - Artifact retention for terraform plans

### Workflow Details

The GitHub Actions workflow triggers on:

- Pull requests targeting any branch
- Direct pushes to the main branch
- Changes in `terraform/` directory or workflow file

The workflow consists of two main jobs:

1. **Terraform Validation (runs on all PRs and pushes)**:

   - Validates code formatting and configuration
   - Generates and stores terraform plan as artifact
   - Provides plan output for review

2. **Infrastructure Deployment (runs only on main branch)**:
   - Requires manual approval through GitHub environments
   - Executes terraform apply with approved changes
   - Uses protected production environment
   - Provides direct link to GCP dashboard

### Required Permissions

The service account has been configured with necessary roles in phases:

1. **Initial Base Roles**:

   - Cloud SQL Admin
   - Storage Admin
   - Compute Network Admin
   - Cloud Run Admin
   - Service Account User

2. **Extended Access**:
   - Project IAM Admin (for managing IAM policies)
   - VPC Access Admin (for managing VPC connectors)

This progressive role assignment follows the principle of least privilege while ensuring the service account has all necessary permissions for the CI/CD pipeline to function properly.

## CI/CD Implementation & Learning Goals

This project is also a learning journey to understand and implement modern DevOps practices, specifically CI/CD for Infrastructure as Code (IaC) on Google Cloud Platform.

### What is CI/CD?

- **Continuous Integration (CI):** Automatically checks and tests infrastructure code changes (like Terraform) on every commit or pull request.
- **Continuous Deployment/Delivery (CD):** Automates the process of applying validated infrastructure changes to the cloud environment.

### Why CI/CD for IaC?

- Ensures all infrastructure changes are tested, reviewed, and deployed consistently.
- Reduces manual errors and increases deployment speed.
- Provides audit trails and easy rollback options.

### Tools Used

- **GitHub Actions:** For automating CI/CD workflows.
- **Terraform:** For defining and provisioning cloud infrastructure.
- **Google Cloud Service Account:** For secure, automated access to GCP.

### Planned Workflow

1. On every pull request or push:
   - Run Terraform formatting, validation, and planning.
   - Optionally require approval before applying changes.
2. On merge to main (or manual trigger):
   - Apply infrastructure changes to GCP.

### Learning Objectives

- Understand how to automate infrastructure changes safely.
- Learn to use GitHub Actions for cloud automation.
- Practice secure credential management for automation.
- Gain hands-on experience with real-world DevOps workflows.

> As I progress, I will document key learnings and improvements here.

---

If you are a hiring manager or recruiter, this project demonstrates my ability to design, automate, and manage secure, cost-effective, and scalable cloud infrastructure on GCP. I am actively seeking a Cloud Engineer role in Qatar and am eager to contribute my skills to your team.
