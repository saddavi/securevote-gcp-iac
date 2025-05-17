output "service_url" {
  description = "The URL of the Cloud Run service"
  value       = google_cloud_run_service.api.status[0].url
}

output "service_name" {
  description = "The name of the Cloud Run service"
  value       = google_cloud_run_service.api.name
}

output "latest_revision_name" {
  description = "The name of the latest revision"
  value       = google_cloud_run_service.api.status[0].latest_ready_revision_name
}

output "service_id" {
  description = "The ID of the Cloud Run service"
  value       = google_cloud_run_service.api.id
}