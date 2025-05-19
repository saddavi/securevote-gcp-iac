# SecureVote Cost Management Guide

This guide provides strategies for keeping the SecureVote platform within the $10/month budget constraint.

## Current Resource Costs

| Resource       | Service                          | Estimated Monthly Cost                |
| -------------- | -------------------------------- | ------------------------------------- |
| Cloud SQL      | db-f1-micro (PostgreSQL)         | ~$7.50/month                          |
| Cloud Run      | Serverless (min instances = 0)   | Variable based on usage (~$0-2/month) |
| Cloud Storage  | Standard Storage (minimal usage) | ~$0.50/month                          |
| Network Egress | Minimal for development          | ~$0-1/month                           |

## Cost Management Strategies

### 1. Start/Stop Development Resources

Using the provided scripts to stop resources when not in use:

```bash
# Stop all development resources
./scripts/stop_all_dev_resources.sh

# Start resources when needed
./scripts/start_all_dev_resources.sh
```

### 2. Database Management

The Cloud SQL instance is the most expensive component. Manage it carefully:

```bash
# Stop only the database
./scripts/db_control.sh stop

# Start the database
./scripts/db_control.sh start

# Check database status
./scripts/db_control.sh status
```

### 3. Cloud Run Configuration

Cloud Run is configured to scale to zero when not in use, but verify settings:

```bash
# Verify min-instances is set to 0
gcloud run services describe securevote-api-dev \
  --project=securevote-iac \
  --region=us-central1 \
  --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])"
```

### 4. Development vs. Production

Development environment is optimized for cost:

- VPC network with minimal resources
- Small instance sizes
- Start/stop scripts
- No redundancy requirements

Production environment is optimized for reliability:

- High availability configuration
- Proper scalability
- Enhanced security
- Regular backups

### 5. Budget Alerts

Budget alerts are configured at:

- 50% of budget ($5)
- 75% of budget ($7.50)
- 90% of budget ($9)
- 100% of budget ($10)

To check current spending:

```bash
gcloud billing accounts list

# Once you have the billing account ID
gcloud billing accounts get-spend-information --account-id=YOUR_BILLING_ACCOUNT_ID
```

### 6. Cost Optimization Recommendations

1. **Regular Resource Shutdown**: Stop resources when not actively developing
2. **Minimal Testing Data**: Keep database size small in development
3. **Clean Up Old Versions**: Remove unused Cloud Run revisions
4. **Monitor Usage**: Check GCP billing dashboard weekly
5. **Use Cloud Storage Lifecycle Policies**: Automatically delete old backups/logs

## Emergency Cost Reduction

If budget limits are approaching:

1. Stop all development resources:

```bash
./scripts/stop_all_dev_resources.sh
```

2. Delete VPC connectors if not needed immediately:

```bash
gcloud compute networks vpc-access connectors delete vpc-connector-dev \
  --project=securevote-iac \
  --region=us-central1
```

3. Export and backup critical data, then delete non-essential Cloud SQL instances:

```bash
# Export the database (after starting it if it's stopped)
./scripts/db_control.sh start
gcloud sql export sql securevote-db-dev gs://securevote-iac-artifacts-dev/db-backups/backup-$(date +%Y%m%d).sql \
  --project=securevote-iac

# Once backup is complete, you could delete the instance if necessary
# WARNING: Only do this in emergency budget situations
# gcloud sql instances delete securevote-db-dev --project=securevote-iac
```
