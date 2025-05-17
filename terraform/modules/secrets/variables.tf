variable "project_id" {
  description = "The ID of the project where resources will be created"
  type        = string
}

variable "region" {
  description = "The region where resources will be created"
  type        = string
}

variable "environment" {
  description = "The environment (dev, prod) for the resources"
  type        = string
}

variable "service_account_email" {
  description = "Email of the service account that needs access to secrets"
  type        = string
}
