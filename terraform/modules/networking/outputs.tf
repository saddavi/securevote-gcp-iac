output "vpc_id" {
  description = "The ID of the VPC"
  value       = google_compute_network.vpc[0].id
}

output "vpc_name" {
  description = "The name of the VPC"
  value       = google_compute_network.vpc[0].name
}

output "subnet_id" {
  description = "The ID of the subnet"
  value       = google_compute_subnetwork.subnet[0].id
}

output "vpc_connector_id" {
  description = "The ID of the VPC connector"
  value       = google_vpc_access_connector.connector[0].id
}

output "vpc_connector_name" {
  description = "The name of the VPC connector"
  value       = google_vpc_access_connector.connector[0].name
}