variable "project_id" {
  description = "The ID of the project where resources will be created"
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

variable "terraform_service_account_email" {
  description = "The email of the service account used by Terraform"
  type        = string
}