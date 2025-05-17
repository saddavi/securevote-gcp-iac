# terraform/database.tf
# Database configuration for SecureVote application
# Development Database Instance - Used for testing and staging environments
resource "google_sql_database_instance" "votes_db_dev" {
  name             = "securevote-db-dev"
  database_version = "POSTGRES_14"
  region           = var.region

  settings {
    tier = "db-f1-micro" # Smallest tier for development

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc_dev.id
    }

    backup_configuration {
      enabled    = true
      start_time = "02:00" # UTC time
    }
  }

  deletion_protection = false # For easier cleanup in development
  depends_on          = [google_project_service.required_apis]

  lifecycle {
    ignore_changes = [settings[0].activation_policy]
  }
}

# Production Database Instance
resource "google_sql_database_instance" "votes_db_prod" {
  name             = "securevote-db-prod"
  database_version = "POSTGRES_14"
  region           = var.region

  settings {
    tier = "db-g1-small" # Slightly larger for production

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc_prod.id
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "01:00" # UTC time
      point_in_time_recovery_enabled = true    # Enable PITR for prod
    }
  }

  deletion_protection = false # Changed from true to false for cleanup
  depends_on          = [google_project_service.required_apis]

  lifecycle {
    ignore_changes = [settings[0].activation_policy]
  }
}

# Development Database
resource "google_sql_database" "votes_db_dev" {
  name      = "votes"
  instance  = google_sql_database_instance.votes_db_dev.name
  depends_on = [google_sql_database_instance.votes_db_dev]

  lifecycle {
    replace_triggered_by = [google_sql_database_instance.votes_db_dev]
  }
}

# Production Database
resource "google_sql_database" "votes_db_prod" {
  name      = "votes"
  instance  = google_sql_database_instance.votes_db_prod.name
  depends_on = [google_sql_database_instance.votes_db_prod]

  lifecycle {
    replace_triggered_by = [google_sql_database_instance.votes_db_prod]
  }
}
