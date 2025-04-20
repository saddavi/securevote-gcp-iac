# filepath: /Users/talha/securevote-gcp-iac/terraform/iam.tf
# Grants the specified service account the Editor role on the project.
# WARNING: 'roles/editor' is broad. Refine to least privilege later.
resource "google_project_iam_member" "terraform_editor" {
  project = var.project_id
  role    = "roles/editor" 
  member  = "serviceAccount:${var.terraform_service_account_email}"
}