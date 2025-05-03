# vpc_peering.tf - Configure private service access for Cloud SQL
resource "google_compute_global_address" "private_ip_address_dev" {
  name          = "private-ip-address-dev"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc_dev.id
}

resource "google_compute_global_address" "private_ip_address_prod" {
  name          = "private-ip-address-prod"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc_prod.id
}

resource "google_service_networking_connection" "private_vpc_connection_dev" {
  network                 = google_compute_network.vpc_dev.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address_dev.name]
  depends_on              = [google_project_service.required_apis]
}

resource "google_service_networking_connection" "private_vpc_connection_prod" {
  network                 = google_compute_network.vpc_prod.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address_prod.name]
  depends_on              = [google_project_service.required_apis]
}
