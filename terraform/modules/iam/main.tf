# terraform/iam.tf
# Create a service account for Cloud Run services
resource "google_service_account" "cloud_run_service_account" {
  project      = var.project_id
  account_id   = "cloudrun-service-${var.environment}"
  display_name = "Cloud Run Service Account for ${title(var.environment)} Environment"
  description  = "Service account for Cloud Run services in the ${var.environment} environment"
}

# Grant the Cloud Run service account access to Cloud SQL
resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

# Grant Cloud Run service account access to Secret Manager
resource "google_project_iam_member" "cloud_run_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

# Grant environment-specific roles to the terraform service account
resource "google_project_iam_member" "terraform_permissions" {
  for_each = toset([
    "roles/cloudsql.admin",
    "roles/run.admin",
    "roles/storage.admin",
    "roles/compute.networkAdmin",
    "roles/iam.serviceAccountUser",
    "roles/secretmanager.admin"
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${var.terraform_service_account_email}"
}
