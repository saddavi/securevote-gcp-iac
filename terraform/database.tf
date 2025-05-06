# terraform/database.tf
# Development Database Instance
resource "google_sql_database_instance" "votes_db_dev" {
  name             = "securevote-db-dev"
  database_version = "POSTGRES_14"
  region           = var.region
  
  settings {
    tier = "db-f1-micro" # Smallest tier for development
    activation_policy = "ALWAYS" # Set to NEVER to stop instance
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc_dev.id
    }
    
    backup_configuration {
      enabled = true
      start_time = "02:00" # UTC time
    }
  }
  
  deletion_protection = false # For easier cleanup in development
  depends_on = [google_project_service.required_apis]
}

# Production Database Instance
resource "google_sql_database_instance" "votes_db_prod" {
  name             = "securevote-db-prod"
  database_version = "POSTGRES_14"
  region           = var.region
  
  settings {
    tier = "db-g1-small" # Slightly larger for production
    activation_policy = "ALWAYS" # Set to NEVER to stop instance
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc_prod.id
    }
    
    backup_configuration {
      enabled = true
      start_time = "01:00" # UTC time
      point_in_time_recovery_enabled = true # Enable PITR for prod
    }
  }
  
  deletion_protection = true # Protect against accidental deletion
  depends_on = [google_project_service.required_apis]
}

# Development Database
resource "google_sql_database" "votes_db_dev" {
  name            = "votes"
  instance        = google_sql_database_instance.votes_db_dev.name
  deletion_policy = "ABANDON" # Don't delete the database when Terraform resource is removed
}

# Production Database
resource "google_sql_database" "votes_db_prod" {
  name            = "votes"
  instance        = google_sql_database_instance.votes_db_prod.name
  deletion_policy = "ABANDON" # Don't delete the database when Terraform resource is removed
}
