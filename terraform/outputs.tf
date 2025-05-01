# terraform/outputs.tf
output "dev_vpc_id" {
  value       = google_compute_network.vpc_dev.id
  description = "The ID of the development VPC network"
}

output "prod_vpc_id" {
  value       = google_compute_network.vpc_prod.id
  description = "The ID of the production VPC network"
}

output "dev_api_url" {
  value       = google_cloud_run_service.api_dev.status[0].url
  description = "The URL of the development API"
}

output "prod_api_url" {
  value       = google_cloud_run_service.api_prod.status[0].url
  description = "The URL of the production API"
}

output "frontend_url" {
  value       = "https://storage.googleapis.com/${google_storage_bucket.frontend.name}/index.html"
  description = "The URL of the frontend website"
}
