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

---

If you are a hiring manager or recruiter, this project demonstrates my ability to design, automate, and manage secure, cost-effective, and scalable cloud infrastructure on GCP. I am actively seeking a Cloud Engineer role in Qatar and am eager to contribute my skills to your team.
