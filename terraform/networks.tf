# filepath: /Users/talha/securevote-gcp-iac/terraform/networks.tf
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