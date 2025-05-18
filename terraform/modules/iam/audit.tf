# Audit Logging Configuration

# Enable Data Access audit logs for Networking
resource "google_project_iam_audit_config" "network_audit_logging" {
  count   = var.environment == "prod" ? 1 : 0
  project = var.project_id
  service = "compute.googleapis.com"
  
  audit_log_config {
    log_type = "DATA_READ"
  }
  
  audit_log_config {
    log_type = "DATA_WRITE"
  }
  
  audit_log_config {
    log_type = "ADMIN_READ" 
  }
}

# Enable Data Access audit logs for Cloud SQL
resource "google_project_iam_audit_config" "sql_audit_logging" {
  count   = var.environment == "prod" ? 1 : 0
  project = var.project_id
  service = "cloudsql.googleapis.com"
  
  audit_log_config {
    log_type = "DATA_WRITE"
  }
  
  audit_log_config {
    log_type = "ADMIN_READ" 
  }
}

# Enable Data Access audit logs for Secret Manager
resource "google_project_iam_audit_config" "secret_manager_audit_logging" {
  project = var.project_id
  service = "secretmanager.googleapis.com"
  
  audit_log_config {
    log_type = "DATA_READ"
  }
  
  audit_log_config {
    log_type = "DATA_WRITE"
  }
}
