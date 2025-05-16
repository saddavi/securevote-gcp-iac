variable "project_id" {
  description = "The GCP project ID for SecureVote"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "terraform_service_account_email" {
  description = "The email address of the service account Terraform will use"
  type        = string
}

variable "environment" {
  description = "The environment (development or production)"
  type        = string
  validation {
    condition     = contains(["development", "production"], var.environment)
    error_message = "Environment must be either 'development' or 'production'."
  }
}

variable "db_tier" {
  description = "The machine type to use for the database instance"
  type        = string
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
}

variable "cloud_run_container_memory" {
  description = "Memory allocated to Cloud Run containers"
  type        = string
}

variable "cloud_sql_backup_time" {
  description = "Time to start the Cloud SQL backup (UTC)"
  type        = string
}