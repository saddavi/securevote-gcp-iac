output "dev_vpc_id" {
  value       = google_compute_network.vpc_dev.id
  description = "The ID of the development VPC network"
}

output "dev_subnet_id" {
  value       = google_compute_subnetwork.subnet_dev.id
  description = "The ID of the development subnet"
}

output "dev_subnet_cidr" {
  value       = google_compute_subnetwork.subnet_dev.ip_cidr_range
  description = "The CIDR range of the development subnet"
}
