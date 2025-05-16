project_id                      = "securevote-iac"
terraform_service_account_email = "terraform-runner-securevote@securevote-iac.iam.gserviceaccount.com"
environment                     = "production"

# Production-specific settings
db_tier                        = "db-g1-small"
min_instances                  = 1
max_instances                  = 100
cloud_run_container_memory     = "512Mi"
cloud_sql_backup_time         = "01:00"