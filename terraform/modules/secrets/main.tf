# Secret Manager module - Manages sensitive credentials

resource "google_secret_manager_secret" "db_password" {
  project   = var.project_id
  secret_id = "db-password-${var.environment}"
  
  replication {
    auto {
      customer_managed_encryption {
        kms_key_name = google_kms_crypto_key.secret_key.id
      }
    }
  }

  labels = {
    environment = var.environment
  }
}

# Create a random password for the database
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "_%@"
}

# Add the password value to the secret
resource "google_secret_manager_secret_version" "db_password_version" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# KMS key for encrypting secrets
resource "google_kms_key_ring" "secrets" {
  name     = "secrets-key-ring-${var.environment}"
  project  = var.project_id
  location = var.region
}

resource "google_kms_crypto_key" "secret_key" {
  name     = "secret-encryption-key-${var.environment}"
  key_ring = google_kms_key_ring.secrets.id
}

# Grant access to Cloud Run service account
resource "google_secret_manager_secret_iam_binding" "secret_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.db_password.secret_id
  role      = "roles/secretmanager.secretAccessor"
  
  members = [
    "serviceAccount:${var.service_account_email}"
  ]
}
