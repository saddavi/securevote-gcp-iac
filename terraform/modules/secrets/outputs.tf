output "db_password_secret_id" {
  description = "The Secret ID for the database password"
  value       = google_secret_manager_secret.db_password.id
}

output "db_password" {
  description = "The generated database password"
  value       = random_password.db_password.result
  sensitive   = true
}
