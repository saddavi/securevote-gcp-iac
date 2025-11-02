# 🌙 SecureVote Project - Hibernation Status

**Status:** HIBERNATED (Cost: $0/month)  
**Date:** November 2025  
**Reason:** Project on hold while focusing on other opportunities

## What Was Destroyed

On the date of hibernation, the following resources were permanently deleted from GCP to bring costs to $0:

### ✅ Destroyed Resources:

- **Cloud SQL Databases:**
  - `securevote-db-dev` (db-f1-micro, PostgreSQL 14)
  - `securevote-db-prod` (db-g1-small, PostgreSQL 14)
  
- **Cloud Run Services:**
  - `securevote-api-dev` (Node.js API)
  - `securevote-api-prod` (Node.js API)
  
- **VPC Access Connectors:**
  - `vpc-connector-dev` (us-central1)
  - `vpc-connector-prod` (us-central1)
  
- **Cloud Storage:**
  - Frontend hosting bucket (kept minimal)

### 💾 What's Still Available:

- **Terraform State:** Stored in Google Cloud Storage (remote backend)
- **Source Code:** All code in GitHub repo
- **Database Backups:** Manual backups created before destruction
- **Documentation:** All docs preserved in repo
- **Infrastructure as Code:** All Terraform configs ready for restoration

## How to Restore the Project

When ready to resume development, follow these steps:

### Step 1: Verify GCP Credentials
```bash
gcloud auth list
gcloud config get-value project
```

### Step 2: Navigate to Terraform Directory
```bash
cd terraform/environments/prod
# or for dev
cd terraform/environments/dev
```

### Step 3: Initialize Terraform
```bash
terraform init
```

### Step 4: Review Restoration Plan
```bash
terraform plan -var-file="terraform.tfvars"
```

### Step 5: Apply (Create Resources)
```bash
terraform apply -var-file="terraform.tfvars"
```

### Step 6: Run Database Migrations
```bash
cd ../../..
./scripts/run_migrations.sh
```

### Step 7: Verify Services Are Running
```bash
gcloud run services list --project=securevote-iac --region=us-central1
gcloud sql instances list --project=securevote-iac
```

## Cost Comparison

| Period | Status | Monthly Cost | Resources |
|--------|--------|--------------|-----------|
| October | Active | ~$21.69 | 2x Cloud SQL, 2x Cloud Run, VPC Connectors |
| November+ | Hibernated | $0.00 | None (all destroyed) |
| **Monthly Savings** | - | **~$21.69** | - |

## Important Notes

⚠️ **Data Retention:**
- Database backups are stored in GCP backups
- Can be restored from backup if needed during restoration
- See your GCP Cloud SQL console for backup details

📝 **Terraform State:**
- Remote state preserved in GCS bucket
- No need to recreate infrastructure from scratch
- Simply run `terraform apply` to restore

🔄 **Restoration Timeline:**
- Initial restoration: ~5-10 minutes (Terraform apply)
- Database initialization: ~2-3 minutes
- Total: ~15 minutes to full operational status

## Ongoing Costs

After hibernation:
- **$0.00/month** - No billable resources
- GCS remote state storage: <$0.01/month (negligible)
- Artifact Registry storage: <$0.01/month (negligible)

---

**Last Updated:** November 2025  
**Project:** SecureVote - GCP Infrastructure as Code  
**Contact:** See repository maintainers
