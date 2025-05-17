# terraform/networks.tf

# VPC Network
resource "google_compute_network" "vpc" {
  count                   = var.enable_vpc ? 1 : 0
  project                 = var.project_id
  name                    = "vpc-${var.environment}"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "subnet" {
  count         = var.enable_vpc ? 1 : 0
  project       = var.project_id
  name          = "subnet-${var.environment}-${var.region}"
  ip_cidr_range = var.environment == "prod" ? "10.0.2.0/24" : "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc[0].id
}

# Serverless VPC Access Connector
# This allows Cloud Run services to securely connect to resources in the VPC
# such as Cloud SQL instances, using a private connection
resource "google_vpc_access_connector" "connector" {
  count         = var.enable_vpc ? 1 : 0
  name          = "vpc-connector-${var.environment}"
  ip_cidr_range = var.environment == "prod" ? "10.9.0.0/28" : "10.8.0.0/28"
  network       = google_compute_network.vpc[0].name
  region        = var.region
  machine_type  = "e2-micro"  # Smallest available instance
}
