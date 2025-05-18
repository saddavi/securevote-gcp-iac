variable "project_id" {
  description = "The ID of the project where resources will be created"
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

variable "container_memory" {
  description = "Memory allocation for Cloud Run containers"
  type        = string
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
}

variable "vpc_connector_id" {
  description = "The ID of the VPC connector"
  type        = string
}

variable "database_instance" {
  description = "The name of the database instance"
  type        = string
}

variable "database_connection_name" {
  description = "The connection name of the database instance"
  type        = string
}

variable "database_name" {
  description = "The name of the database"
  type        = string
}

variable "database_private_ip" {
  description = "The private IP of the database instance"
  type        = string
}

variable "database_user" {
  description = "The database username"
  type        = string
}

variable "db_password_secret_id" {
  description = "Secret ID for the database password in Secret Manager"
  type        = string
}

variable "service_account_email" {
  description = "Email of the service account for Cloud Run"
  type        = string
}