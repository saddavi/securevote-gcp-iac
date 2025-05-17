output "frontend_bucket_name" {
  description = "The name of the frontend storage bucket"
  value       = google_storage_bucket.frontend.name
}

output "frontend_bucket_url" {
  description = "The URL of the frontend storage bucket"
  value       = google_storage_bucket.frontend.url
}

output "artifacts_bucket_name" {
  description = "The name of the artifacts storage bucket"
  value       = google_storage_bucket.artifacts.name
}

output "artifacts_bucket_url" {
  description = "The URL of the artifacts storage bucket"
  value       = google_storage_bucket.artifacts.url
}