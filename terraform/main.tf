# terraform/main.tf
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

# Enable required APIs for serverless architecture
resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com", 
    "secretmanager.googleapis.com",
    "storage.googleapis.com",
    "iap.googleapis.com",
    "firebase.googleapis.com",
    "vpcaccess.googleapis.com",    # For Serverless VPC Access connectors
    "servicenetworking.googleapis.com" # For private VPC connections to Cloud SQL
  ])
  
  project = var.project_id
  service = each.key
  
  disable_dependent_services = true
}