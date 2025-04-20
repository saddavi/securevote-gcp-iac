# filepath: /Users/talha/securevote-gcp-iac/terraform/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0" 
    }
  }
  required_version = ">= 1.3" 
}

provider "google" {
  project = var.project_id
  region  = var.region
}