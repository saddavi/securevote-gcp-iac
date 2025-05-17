terraform {
  backend "gcs" {
    prefix = "terraform/state/dev"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "secrets" {
  source = "../../modules/secrets"

  project_id            = var.project_id
  region                = var.region
  environment           = "dev"
  service_account_email = module.iam.cloud_run_service_account_email
}

module "networking" {
  source = "../../modules/networking"

  project_id  = var.project_id
  region      = var.region
  environment = "dev"
  enable_vpc  = false  # Disable VPC in dev environment for cost savings
}

module "database" {
  source = "../../modules/database"

  project_id   = var.project_id
  region       = var.region
  environment  = "dev"
  db_tier      = var.db_tier
  network_id   = module.networking.vpc_id
  backup_time  = var.cloud_sql_backup_time
  db_password  = module.secrets.db_password
}

module "cloud-run" {
  source = "../../modules/cloud-run"

  project_id             = var.project_id
  region                = var.region
  environment           = "dev"
  container_memory      = var.cloud_run_container_memory
  min_instances         = var.min_instances
  max_instances         = var.max_instances
  vpc_connector_id      = module.networking.vpc_connector_id
  database_instance     = module.database.instance_name
  database_name         = module.database.database_name
  database_user         = module.database.database_user
  database_private_ip   = module.database.private_ip_address
  service_account_email = module.iam.cloud_run_service_account_email
  db_password_secret_id = module.secrets.db_password_secret_id
}

module "iam" {
  source = "../../modules/iam"

  project_id                      = var.project_id
  environment                     = "dev"
  terraform_service_account_email = var.terraform_service_account_email
}

module "storage" {
  source = "../../modules/storage"

  project_id  = var.project_id
  environment = "dev"
  region      = var.region
}
