output "database_connection_name" {
  description = "The connection name of the Cloud SQL instance"
  value       = module.database.instance_connection_name
}

output "database_name" {
  description = "The name of the database"
  value       = module.database.database_name
}

output "database_user" {
  description = "The database user"
  value       = module.database.database_user
}

output "private_ip_address" {
  description = "The private IP address of the database"
  value       = module.database.private_ip_address
}

output "api_url" {
  description = "The URL of the Cloud Run API service"
  value       = module.cloud-run.service_url
}
