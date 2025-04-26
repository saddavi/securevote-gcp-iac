# SecureVote Infrastructure as Code

Infrastructure code for a secure online voting/survey platform built on Google Cloud Platform using Terraform.

## Current Infrastructure

- **Development VPC Network**
  - Custom VPC network (`vpc-dev`)
  - Regional subnet in `us-central1`
  - Basic firewall rules:
    - Internal communication within VPC
    - SSH access controls

## Prerequisites

- Google Cloud SDK
- Terraform
- Access to GCP Project: `securevote-iac`

## Getting Started

1. Clone the repository
2. Initialize Terraform:

```bash
cd terraform
terraform init
```

3. Plan and apply changes:

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

## Project Structure

```
securevote-gcp-iac/
├── terraform/
│   ├── backend.tf      # GCS backend configuration
│   ├── variables.tf    # Input variables
│   ├── main.tf        # Provider configuration
│   ├── networks.tf    # VPC and subnet definitions
│   ├── firewalls.tf   # Firewall rules
│   ├── iam.tf         # IAM roles and bindings
│   └── outputs.tf     # Output values
└── README.md
```
