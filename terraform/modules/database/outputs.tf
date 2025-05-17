output "instance_name" {
  description = "The name of the database instance"
  value       = google_sql_database_instance.votes_db.name
}

output "database_name" {
  description = "The name of the database"
  value       = google_sql_database.votes_db.name
}

output "instance_connection_name" {
  description = "The connection name of the instance to be used in connection strings"
  value       = google_sql_database_instance.votes_db.connection_name
}

output "private_ip_address" {
  description = "The private IP address of the database instance"
  value       = google_sql_database_instance.votes_db.private_ip_address
}