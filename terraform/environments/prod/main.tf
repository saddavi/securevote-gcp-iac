terraform {
  backend "gcs" {
    prefix = "terraform/state/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "networking" {
  source = "../../modules/networking"

  project_id  = var.project_id
  region      = var.region
  environment = "prod"
}

module "database" {
  source = "../../modules/database"

  project_id  = var.project_id
  region      = var.region
  environment = "prod"
  db_tier     = var.db_tier
  network_id  = module.networking.vpc_id
  backup_time = var.cloud_sql_backup_time
}

module "cloud-run" {
  source = "../../modules/cloud-run"

  project_id          = var.project_id
  region              = var.region
  environment         = "prod"
  container_memory    = var.cloud_run_container_memory
  min_instances       = var.min_instances
  max_instances       = var.max_instances
  vpc_connector_id    = module.networking.vpc_connector_id
  database_instance   = module.database.instance_name
  database_name       = module.database.database_name
  database_private_ip = module.database.private_ip_address
}

module "iam" {
  source = "../../modules/iam"

  project_id  = var.project_id
  environment = "prod"
}

module "storage" {
  source = "../../modules/storage"

  project_id  = var.project_id
  environment = "prod"
}
