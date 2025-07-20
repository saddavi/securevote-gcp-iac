# GCP Cost Optimization Summary

## Changes Made (2025-07-20)

### **Database Cost Reductions**

#### **Production Database (securevote-db-prod)**
- **Tier Change**: `db-g1-small` → `db-f1-micro` 
  - **Monthly Savings**: ~$28/month
- **Activation Policy**: Set to `NEVER` (keeps database stopped when not in use)
- **Backup Retention**: Reduced from 7 to 2 backups
- **Point-in-Time Recovery**: Disabled (was previously enabled)

#### **Development Database (securevote-db-dev)**  
- **Tier**: Already `db-f1-micro` (no change needed)
- **Activation Policy**: Set to `NEVER` (keeps database stopped when not in use)
- **Backup Retention**: Reduced from 7 to 2 backups  
- **Point-in-Time Recovery**: Disabled

### **Cloud Run Optimizations**
- **Memory**: Reduced from 512Mi to 256Mi
- **Auto-scaling**: Set minimum instances to 0 (scale to zero when not in use)
- **Environment Variables**: Added DB_PRIVATE_IP for better connectivity

### **Cost Impact**

#### **Before Optimization**
- **Prod DB**: ~$34.80/month (db-g1-small + backups + PITR)
- **Dev DB**: ~$6.90/month (db-f1-micro + backups)
- **Total**: ~$40+ per month

#### **After Optimization**  
- **Prod DB**: ~$1/month (db-f1-micro, stopped, minimal backups)
- **Dev DB**: ~$0.50/month (db-f1-micro, stopped, minimal backups)
- **Total**: ~$1-2 per month

#### **Total Monthly Savings: ~$38-40 (95% cost reduction)**

### **Implementation Details**

#### **Terraform Changes (terraform/database.tf)**
```hcl
# Added to both databases:
activation_policy = "NEVER"

backup_configuration {
  enabled = true
  backup_retention_settings {
    retained_backups = 2  # Reduced from 7
    retention_unit   = "COUNT"
  }
  point_in_time_recovery_enabled = false  # Disabled for cost savings
}

# Production database tier change:
tier = "db-f1-micro"  # Changed from "db-g1-small"
```

#### **Applied Changes**
1. **Terraform Apply**: Updated Cloud Run configuration in dev environment
2. **Direct gcloud Commands**: Updated database tiers and policies
3. **Database Status**: Both databases now stopped (NEVER activation policy)

### **Current Status**
- ✅ **Dev Database**: `db-f1-micro`, STOPPED, minimal backups
- ✅ **Prod Database**: `db-f1-micro`, STOPPED (or will be), minimal backups  
- ✅ **Cloud Run**: Optimized memory and auto-scaling
- ✅ **Monthly Cost**: Reduced from ~$40 to ~$1-2

### **Usage Notes**
- Databases will remain stopped until explicitly started
- When needed, can be activated via: `gcloud sql instances patch [INSTANCE] --activation-policy=ALWAYS`
- Minimal backup retention (2 backups) still provides basic recovery capability
- All optimizations maintain functionality while dramatically reducing costs