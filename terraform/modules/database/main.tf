# terraform/database.tf
# Database configuration for SecureVote application

# Database Instance for SecureVote application
resource "google_sql_database_instance" "votes_db" {
  name             = "securevote-db-${var.environment}"
  database_version = "POSTGRES_14"
  region           = var.region

  settings {
    tier = var.db_tier

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_id
    }

    backup_configuration {
      enabled                        = true
      start_time                     = var.backup_time
      point_in_time_recovery_enabled = var.environment == "prod" ? true : false
    }
  }

  deletion_protection = var.environment == "prod" ? true : false

  lifecycle {
    ignore_changes = [settings[0].activation_policy]
  }
}

# Application Database
resource "google_sql_database" "votes_db" {
  name       = "votes"
  instance   = google_sql_database_instance.votes_db.name
  depends_on = [google_sql_database_instance.votes_db]

  lifecycle {
    replace_triggered_by = [google_sql_database_instance.votes_db]
  }
}

# Database user with Secret Manager password
resource "google_sql_user" "db_user" {
  name     = "securevote-app-user-${var.environment}"
  instance = google_sql_database_instance.votes_db.name
  password = var.db_password

  depends_on = [google_sql_database_instance.votes_db]
}
