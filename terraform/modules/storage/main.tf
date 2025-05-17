# terraform/storage.tf
resource "google_storage_bucket" "frontend" {
  name          = "${var.project_id}-frontend-${var.environment}"
  location      = var.region
  force_destroy = var.environment == "prod" ? false : true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }

  cors {
    origin          = var.environment == "prod" ? [var.allowed_origin] : ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["Content-Type", "Cache-Control"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true

  versioning {
    enabled = var.environment == "prod" ? true : false
  }

  lifecycle_rule {
    condition {
      age = var.environment == "prod" ? 90 : 30
    }
    action {
      type = "Delete"
    }
  }
}

# Public access for the frontend bucket
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Artifacts bucket for storing build artifacts
resource "google_storage_bucket" "artifacts" {
  name          = "${var.project_id}-artifacts-${var.environment}"
  location      = var.region
  force_destroy = var.environment == "prod" ? false : true

  uniform_bucket_level_access = true

  versioning {
    enabled = var.environment == "prod" ? true : false
  }

  lifecycle_rule {
    condition {
      age = var.environment == "prod" ? 60 : 14
    }
    action {
      type = "Delete"
    }
  }
}
