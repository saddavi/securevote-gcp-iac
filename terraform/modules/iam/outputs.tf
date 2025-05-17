output "cloud_run_service_account_email" {
  description = "The email of the service account used by Cloud Run services"
  value       = google_service_account.cloud_run_service_account.email
}

output "cloud_run_service_account_name" {
  description = "The fully-qualified name of the service account used by Cloud Run services"
  value       = google_service_account.cloud_run_service_account.name
}

output "cloud_run_service_account_id" {
  description = "The unique ID of the service account used by Cloud Run services"
  value       = google_service_account.cloud_run_service_account.unique_id
}