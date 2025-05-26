# terraform/cloud_run.tf
# Cloud Run Service
resource "google_cloud_run_service" "api" {
  name     = "securevote-api-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        # Use the specified image from variable
        image = var.image

        resources {
          limits = {
            memory = var.container_memory
          }
        }

        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }

        # Connect securely to Cloud SQL
        env {
          name  = "DB_HOST"
          value = "/cloudsql/${var.database_connection_name}"
        }

        env {
          name  = "DB_CONNECTION_NAME"
          value = var.database_connection_name
        }

        env {
          name  = "DB_NAME"
          value = var.database_name
        }

        env {
          name  = "DB_USER"
          value = var.database_user
        }

        env {
          name  = "DB_PRIVATE_IP"
          value = var.database_private_ip
        }
        
        # Reference to Secret Manager for DB password
        env {
          name = "DB_PASSWORD"
          value_from {
            secret_key_ref {
              name = var.db_password_secret_id
              key  = "latest"
            }
          }
        }
        
        # Add NODE_ENV explicitly
        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        
        # Add API version for health check
        env {
          name  = "API_VERSION"
          value = "1.0.0"
        }
        
        # Add CORS configuration
        env {
          name  = "CORS_ORIGIN"
          value = "*"
        }
        
        # Add JWT Secret for authentication
        env {
          name  = "JWT_SECRET"
          value = "dev-secure-vote-jwt-secret-key-2025"
        }
      }

      # For Cloud SQL connection
      service_account_name = var.service_account_email
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"        = var.min_instances
        "autoscaling.knative.dev/maxScale"        = var.max_instances
        "run.googleapis.com/cloudsql-instances"   = var.database_connection_name
        "run.googleapis.com/vpc-access-connector" = var.vpc_connector_id
        "run.googleapis.com/vpc-access-egress"    = "all-traffic"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
