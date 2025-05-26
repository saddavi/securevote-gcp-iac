# SecureVote Authentication Troubleshooting Guide

## Test User Password Reset History

### Overview
During the deployment process, we encountered multiple authentication issues with the test user. This document provides a complete history and troubleshooting guide.

## Current Working Credentials
```
Email: test@example.com
Password: password
Role: admin
```

## Password Reset Timeline

### Initial Problem (Day 1)
- Test user created with incorrect bcrypt hash
- Authentication failing with 401 errors
- Password verification not working

### Migration 003: Initial User Creation
```sql
-- Created test user with initial hash
INSERT INTO users (email, hashed_password, role, created_at) 
VALUES ('test@example.com', '[initial_hash]', 'admin', NOW());
```

### Migration 004: First Reset Attempt
```sql
-- Attempted to fix with updated hash
UPDATE users 
SET hashed_password = '[updated_hash]' 
WHERE email = 'test@example.com';
```

### Migration 005: Final Working Reset ✅
```sql
-- FINAL WORKING SOLUTION
UPDATE users 
SET hashed_password = '$2b$10$n9TvvhfLp0n8NtZpGZmTT.W.UoFXSUGRadPvTYajrUodmDgfsBYcS' 
WHERE email = 'test@example.com';
-- This hash corresponds to password: 'password'
```

## How to Verify Authentication

### 1. Test via API
```bash
curl -X POST https://securevote-api-dev-832948640879.us-central1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

**Expected Success Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "role": "admin"
}
```

### 2. Test via Frontend
1. Open: `file:///Users/talha/securevote-gcp-iac/frontend/index.html`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `password`
3. Should redirect to dashboard with admin access

## Troubleshooting Authentication Issues

### Symptom: "Invalid credentials" error
**Possible Causes:**
1. Password hash incorrect in database
2. API not connecting to database
3. bcrypt comparison failing

**Solution:**
```bash
# Re-run the final migration
gcloud run jobs execute db-migrations --region=us-central1
```

### Symptom: Database connection errors
**Possible Causes:**
1. Cloud SQL instance not running
2. Connection string incorrect
3. IAM permissions missing

**Check Database Status:**
```bash
gcloud sql instances describe securevote-db-dev
```

### Symptom: API returning 500 errors
**Check API Logs:**
```bash
gcloud run services logs read securevote-api-dev --region=us-central1
```

## Password Hash Generation

The current working hash was generated using bcrypt with salt rounds of 10:

```javascript
const bcrypt = require('bcrypt');
const password = 'password';
const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);
// Result: $2b$10$n9TvvhfLp0n8NtZpGZmTT.W.UoFXSUGRadPvTYajrUodmDgfsBYcS
```

## Key Lessons Learned

1. **Always test authentication immediately** after user creation
2. **Use consistent bcrypt configuration** across environment
3. **Keep migration files for password resets** as they may be needed multiple times
4. **Document password reset history** to avoid confusion
5. **Test both API and frontend authentication** separately

## Emergency Password Reset

If authentication stops working, apply the final migration:

```bash
# Connect to Cloud SQL and run migration 005
gcloud sql connect securevote-db-dev --user=postgres --database=securevote
\i /path/to/005_reset_test_user.sql
```

Or through the migration job:
```bash
gcloud run jobs execute db-migrations --region=us-central1
```

## Contact & Support

If authentication issues persist:
1. Check the deployment logs
2. Verify database connectivity
3. Re-run the final deployment test script
4. Consider recreating the test user from scratch

---
**Last Updated:** May 26, 2025  
**Working Configuration:** Migration 005 applied, password = 'password'
