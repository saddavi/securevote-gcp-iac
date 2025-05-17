# vpc_peering.tf - Configure private service access for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  count         = var.enable_vpc ? 1 : 0
  name          = "private-ip-address-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc[0].id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  count                   = var.enable_vpc ? 1 : 0
  network                 = google_compute_network.vpc[0].id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address[0].name]
}

# Export the private IP range for use in other modules
output "private_ip_range" {
  description = "The IP range used for private services access"
  value       = var.enable_vpc ? google_compute_global_address.private_ip_address[0].address : null
}
