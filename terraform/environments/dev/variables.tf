variable "project_id" {
  description = "The ID of the project where resources will be created"
  type        = string
}

variable "region" {
  description = "The region where resources will be created"
  type        = string
  default     = "us-central1"
}

variable "db_tier" {
  description = "The machine type for the database instance"
  type        = string
  default     = "db-f1-micro"
}

variable "min_instances" {
  description = "Minimum number of instances for Cloud Run"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances for Cloud Run"
  type        = number
  default     = 10
}

variable "cloud_run_container_memory" {
  description = "Memory allocation for Cloud Run containers"
  type        = string
  default     = "256Mi"
}

variable "cloud_sql_backup_time" {
  description = "Time to start the database backup (UTC)"
  type        = string
  default     = "02:00"
}

variable "terraform_service_account_email" {
  description = "Email of the service account Terraform runs as"
  type        = string
}

variable "environment" {
  description = "The environment (dev, prod, etc.)"
  type        = string
  default     = "dev"
}
