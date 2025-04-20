terraform {
  backend "gcs" {
    bucket = "talha-gcp-securevote-tfstate-bucket" # Your GCS bucket name
    prefix = "terraform/state"                     # Path within the bucket to store state
  }
}