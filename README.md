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
- **Production Environment**: For the live system

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

- Environment isolation with separate VPC networks
- Internal-only database access
- IAM-based authentication for services
- Principle of least privilege for service accounts
