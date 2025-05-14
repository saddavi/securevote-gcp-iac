# terraform/firewalls.tf
# Development VPC internal traffic
resource "google_compute_firewall" "vpc_dev_allow_internal" {
  project     = var.project_id
  name        = "vpc-dev-allow-internal"
  network     = google_compute_network.vpc_dev.name
  description = "Allow internal traffic between resources in the subnet"

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

  source_ranges = [google_compute_subnetwork.subnet_dev.ip_cidr_range]
}

# Production VPC internal traffic
resource "google_compute_firewall" "vpc_prod_allow_internal" {
  project     = var.project_id
  name        = "vpc-prod-allow-internal"
  network     = google_compute_network.vpc_prod.name
  description = "Allow internal traffic between resources in the prod subnet"

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

  source_ranges = [google_compute_subnetwork.subnet_prod.ip_cidr_range]
}

# Allow Cloud Run to access VPC connector in dev
resource "google_compute_firewall" "vpc_dev_allow_serverless_access" {
  project     = var.project_id
  name        = "vpc-dev-allow-serverless"
  network     = google_compute_network.vpc_dev.name
  description = "Allow serverless services to access VPC resources"

  allow {
    protocol = "tcp"
    ports    = ["443", "8080", "5432"] # HTTPS, default Cloud Run, PostgreSQL
  }

  source_ranges = ["35.199.224.0/19"] # Google's serverless services range
}

# Allow Cloud Run to access VPC connector in prod
resource "google_compute_firewall" "vpc_prod_allow_serverless_access" {
  project     = var.project_id
  name        = "vpc-prod-allow-serverless"
  network     = google_compute_network.vpc_prod.name
  description = "Allow serverless services to access VPC resources"

  allow {
    protocol = "tcp"
    ports    = ["443", "8080", "5432"] # HTTPS, default Cloud Run, PostgreSQL
  }

  source_ranges = ["35.199.224.0/19"] # Google's serverless services range
}
