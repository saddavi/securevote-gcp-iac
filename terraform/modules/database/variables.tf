variable "project_id" {
  description = "The ID of the project in which resources will be created"
  type        = string
}

variable "region" {
  description = "The region where resources will be created"
  type        = string
}

variable "environment" {
  description = "The environment (dev/prod) where resources will be created"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "db_tier" {
  description = "The machine type for the database instance"
  type        = string
}

variable "network_id" {
  description = "The ID of the VPC network to connect to"
  type        = string
}

variable "backup_time" {
  description = "The start time for database backups (HH:MM format)"
  type        = string
  default     = "02:00"
}