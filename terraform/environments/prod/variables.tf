variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP Region"
}

variable "environment" {
  type        = string
  description = "Environment name (dev or prod)"
}

variable "db_tier" {
  type        = string
  description = "Cloud SQL database tier"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Database password"
}

variable "min_instances" {
  type        = number
  description = "Minimum number of Cloud Run instances"
}

variable "max_instances" {
  type        = number
  description = "Maximum number of Cloud Run instances"
}

variable "cloud_run_container_memory" {
  type        = string
  description = "Cloud Run container memory allocation"
}

variable "cloud_sql_backup_time" {
  type        = string
  description = "Cloud SQL backup time in HH:MM format"
}

variable "terraform_service_account_email" {
  type        = string
  description = "Service account email for Terraform"
}
