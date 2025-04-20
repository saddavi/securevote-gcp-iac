variable "project_id" {
  description = "The GCP project ID for SecureVote"
  type        = string
  # No default, must be provided at runtime
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
  default     = "us-central1" # Or choose another region if preferred
}

variable "terraform_service_account_email" {
  description = "The email address of the service account Terraform will use"
  type        = string
  # No default, must be provided at runtime
}