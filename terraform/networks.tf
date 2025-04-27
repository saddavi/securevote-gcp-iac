# terraform/networks.tf

# Development VPC Network
resource "google_compute_network" "vpc_dev" {
  project                 = var.project_id
  name                    = "vpc-dev"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "subnet_dev" {
  project       = var.project_id
  name          = "subnet-dev-${var.region}"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc_dev.id
}

# Production VPC Network
resource "google_compute_network" "vpc_prod" {
  project                 = var.project_id
  name                    = "vpc-prod"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "subnet_prod" {
  project       = var.project_id
  name          = "subnet-prod-${var.region}"
  ip_cidr_range = "10.0.2.0/24"
  region        = var.region
  network       = google_compute_network.vpc_prod.id
}

# Serverless VPC Access Connector for Development
# This allows Cloud Run services to securely connect to resources in the VPC
# such as Cloud SQL instances, using a private connection without exposing them to the internet
resource "google_vpc_access_connector" "connector_dev" {
  name          = "vpc-connector-dev"
  ip_cidr_range = "10.8.0.0/28"  # Small CIDR block for the connector (provides 16 addresses)
  network       = google_compute_network.vpc_dev.name
  region        = var.region
  depends_on    = [google_project_service.required_apis]
}

# Serverless VPC Access Connector for Production
# This provides a secure bridge between serverless Cloud Run services and VPC resources
# enabling private communication with databases and other internal services
resource "google_vpc_access_connector" "connector_prod" {
  name          = "vpc-connector-prod"
  ip_cidr_range = "10.9.0.0/28"  # Separate CIDR range from development
  network       = google_compute_network.vpc_prod.name
  region        = var.region
  depends_on    = [google_project_service.required_apis]
}
