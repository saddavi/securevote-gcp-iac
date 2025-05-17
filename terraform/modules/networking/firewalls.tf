# terraform/firewalls.tf
# VPC internal traffic
resource "google_compute_firewall" "vpc_allow_internal" {
  project     = var.project_id
  name        = "vpc-${var.environment}-allow-internal"
  network     = google_compute_network.vpc.name
  description = "Allow internal traffic between resources in the ${var.environment} subnet"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = [google_compute_subnetwork.subnet.ip_cidr_range]
}

# Allow Cloud Run to access VPC connector
resource "google_compute_firewall" "vpc_allow_serverless_access" {
  project     = var.project_id
  name        = "vpc-${var.environment}-allow-serverless"
  network     = google_compute_network.vpc.name
  description = "Allow serverless services to access VPC resources"

  allow {
    protocol = "tcp"
    ports    = ["443", "8080", "5432"] # HTTPS, HTTP alt, PostgreSQL
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    "107.178.230.64/26", # Google Cloud Serverless Access
    "35.199.224.0/19"    # Cloud Run
  ]
}

# Health check access for load balancers
resource "google_compute_firewall" "vpc_allow_health_checks" {
  project     = var.project_id
  name        = "vpc-${var.environment}-allow-health-checks"
  network     = google_compute_network.vpc.name
  description = "Allow health checks from Google Cloud Load Balancer"

  allow {
    protocol = "tcp"
    ports    = ["8080", "443"]
  }

  source_ranges = [
    "130.211.0.0/22", # Health Check Service
    "35.191.0.0/16"   # Health Check Service
  ]
}
