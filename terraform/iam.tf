# terraform/iam.tf
# Grant the Cloud Run service account access to Cloud SQL
resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

# Grant minimal permissions to the terraform service account
resource "google_project_iam_member" "terraform_permissions" {
  for_each = toset([
    "roles/cloudsql.admin",
    "roles/run.admin",
    "roles/storage.admin",
    "roles/compute.networkAdmin",
    "roles/iam.serviceAccountUser"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${var.terraform_service_account_email}"
}
