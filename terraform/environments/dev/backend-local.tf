# Local backend for CI/CD validation
# This is used when running terraform init during CI/CD to avoid remote state access issues
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
