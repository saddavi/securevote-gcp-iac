# terraform/cloud_run.tf
# Development Environment Cloud Run Service
resource "google_cloud_run_service" "api_dev" {
  name     = "securevote-api-dev"
  location = var.region
  
  template {
    spec {
      containers {
        # Using a placeholder image - in a real scenario, you'd build and deploy your own
        image = "gcr.io/cloudrun/hello"
        
        env {
          name  = "ENVIRONMENT"
          value = "development"
        }
        
        # Connect securely to Cloud SQL
        env {
          name  = "DB_HOST"
          value = "/cloudsql/${google_sql_database_instance.votes_db_dev.connection_name}"
        }
      }
      
      # For Cloud SQL connection
      service_account_name = google_service_account.cloud_run_service_account.email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "100"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.votes_db_dev.connection_name
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.required_apis]
}

# Production Environment Cloud Run Service
resource "google_cloud_run_service" "api_prod" {
  name     = "securevote-api-prod"
  location = var.region
  
  template {
    spec {
      containers {
        image = "gcr.io/cloudrun/hello"
        
        env {
          name  = "ENVIRONMENT"
          value = "production"
        }
        
        env {
          name  = "DB_HOST"
          value = "/cloudsql/${google_sql_database_instance.votes_db_prod.connection_name}"
        }
      }
      
      service_account_name = google_service_account.cloud_run_service_account.email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "100"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.votes_db_prod.connection_name
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.required_apis]
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_service_account" {
  account_id   = "cloud-run-service-account"
  display_name = "Cloud Run Service Account"
}

# IAM binding for cloud run development service
resource "google_cloud_run_service_iam_binding" "api_dev_public" {
  location = google_cloud_run_service.api_dev.location
  service  = google_cloud_run_service.api_dev.name
  role     = "roles/run.invoker"
  members  = ["allUsers"] # Dev is public for testing
}

# IAM binding for cloud run production service with restricted access
resource "google_cloud_run_service_iam_binding" "api_prod_auth" {
  location = google_cloud_run_service.api_prod.location
  service  = google_cloud_run_service.api_prod.name
  role     = "roles/run.invoker"
  members  = [
    "serviceAccount:${google_service_account.cloud_run_service_account.email}",
    # Add authenticated users here if needed
    # "allAuthenticatedUsers"
  ]
}
