# Supabase Setup Guide for CollisionOS

## Overview

This guide walks you through setting up Supabase cloud sync for CollisionOS. Supabase provides optional cloud backup, multi-location support, and mobile app synchronization while maintaining local-first SQLite as the primary database.

---

## Prerequisites

- CollisionOS installed and running locally
- Internet connection
- Admin access to create Supabase account
- Approximately 30-45 minutes for setup

---

## Step 1: Create Supabase Account and Project

### 1.1 Sign Up for Supabase

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "Sign Up" and create account using:
   - GitHub (recommended for developers)
   - Email/password
3. Verify your email address

### 1.2 Create New Project

1. Click "New Project" from dashboard
2. Fill in project details:
   - **Name**: `CollisionOS-Production` (or `CollisionOS-Test` for testing)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with Free tier
3. Click "Create New Project"
4. Wait 2-3 minutes for project provisioning

### 1.3 Get API Credentials

Once project is ready:

1. Click on "Project Settings" (gear icon in sidebar)
2. Navigate to "API" section
3. Copy the following values (you'll need these later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (starts with eyJ)
   - **service_role key**: `eyJhbGc...` (starts with eyJ)

⚠️ **IMPORTANT**:
- **anon key** is safe to use in frontend (has RLS restrictions)
- **service_role key** bypasses RLS - NEVER commit to git or expose to frontend

---

## Step 2: Run Database Migrations

You need to create the PostgreSQL schema in Supabase to match CollisionOS's SQLite structure.

### 2.1 Access SQL Editor

1. In Supabase dashboard, click "SQL Editor" in left sidebar
2. Click "New Query"

### 2.2 Run Migrations in Order

Run each migration file in the exact order below. Each migration builds on the previous one.

#### Migration 1: Core Tables (Shops, Users, Customers, Vehicles)

1. Open `supabase/migrations/20250121000001_initial_core_tables.sql` from your CollisionOS folder
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" (bottom right)
5. Wait for "Success. No rows returned" message
6. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   - Should see: shops, users, customers, vehicles, insurance_companies, vendors

#### Migration 2: Claims and Repair Orders

1. Open `supabase/migrations/20250121000002_claims_estimates_repair_orders.sql`
2. Copy and paste into new SQL query
3. Click "Run"
4. Verify: claim_management, estimates, estimate_line_items, repair_order_management, bms_imports tables created

#### Migration 3: Parts and Purchase Orders

1. Open `supabase/migrations/20250121000003_parts_and_purchase_orders.sql`
2. Copy and paste into new SQL query
3. Click "Run"
4. Verify: parts, advanced_parts_management, parts_sourcing_requests, purchase_order_system, automated_purchase_orders tables created

#### Migration 4: Additional Tables

1. Open `supabase/migrations/20250121000004_remaining_tables.sql`
2. Copy and paste into new SQL query
3. Click "Run"
4. Verify: jobs, labor_time_entries, invoices, payments, attachments, production_workflow tables created

#### Migration 5: Row Level Security (RLS)

1. Open `supabase/migrations/20250121000005_row_level_security.sql`
2. Copy and paste into new SQL query
3. Click "Run"
4. Verify RLS enabled:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = true;
   ```
   - Should see all tables with RLS enabled

### 2.3 Verify Schema

Run this comprehensive check:

```sql
-- Count tables
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
-- Expected: 47+ tables

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
-- Expected: 50+ policies

-- Verify helper functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name LIKE 'current_%';
-- Expected: current_shop_id, current_user_id, current_user_role
```

---

## Step 3: Configure CollisionOS

### 3.1 Create Local Environment File

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in text editor

### 3.2 Add Supabase Credentials

Update these lines in `.env`:

```bash
# Enable Supabase integration
ENABLE_SUPABASE=true

# Supabase Project Credentials (from Step 1.3)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc... (your anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service role key)

# Enable cloud synchronization
SYNC_ENABLED=true

# Start with minimal features (enable more later)
SYNC_BMS_INGESTION=false
SYNC_MOBILE=false
SYNC_MULTI_LOCATION=false
SYNC_FILE_BACKUP=false
SYNC_REALTIME=false
```

### 3.3 Secure Your Credentials

⚠️ **CRITICAL SECURITY STEPS**:

1. Ensure `.env` is in `.gitignore`:
   ```bash
   # Check if .env is ignored
   git check-ignore .env
   # Should output: .env
   ```

2. Never commit `.env` to git
3. Store backup of credentials securely (password manager)
4. Use different credentials for development vs production

---

## Step 4: Test Connection

### 4.1 Start CollisionOS

```bash
npm run dev
```

Check server startup logs for:
```
[SyncConfig] Initialized with config: { enabled: true, ... }
[SyncQueue] Initialized with interval: 30000
[HybridDB] Initialized in HYBRID mode
```

### 4.2 Test via API

Open browser or use curl:

```bash
# Test connection
curl http://localhost:3002/api/sync/status

# Expected response:
{
  "success": true,
  "data": {
    "enabled": true,
    "credentialsValid": true,
    "mode": "hybrid",
    "supabaseUrl": "https://xxxxx.supabase.co"
  }
}
```

### 4.3 Test via UI

1. Navigate to Settings → Cloud Sync (if UI exists)
2. Click "Test Connection" button
3. Should see: ✅ "Connection successful"

---

## Step 5: Enable Cloud Sync Features

### 5.1 Start with Basic Features

Initially enable minimal features to test:

```bash
# In .env
SYNC_ENABLED=true
SYNC_BMS_INGESTION=false  # Keep disabled initially
SYNC_MOBILE=false          # Enable when mobile app ready
SYNC_MULTI_LOCATION=false  # Enable if you have multiple locations
SYNC_FILE_BACKUP=false     # Enable after testing
SYNC_REALTIME=false        # Enable for live updates
```

### 5.2 Test Basic Sync

1. Create a test customer in CollisionOS
2. Check local SQLite database - customer should exist
3. Wait 30 seconds (default sync interval)
4. Check Supabase dashboard:
   - Go to "Table Editor"
   - Select "customers" table
   - Your test customer should appear

### 5.3 Monitor Sync Queue

```bash
# Check sync status
curl http://localhost:3002/api/sync/queue

# Expected:
{
  "success": true,
  "data": {
    "queueSize": 0,           # 0 = all synced
    "totalProcessed": 5,      # Number of operations synced
    "totalFailed": 0,         # Should be 0
    "lastSync": "2025-10-21T..."
  }
}
```

### 5.4 Enable Additional Features Gradually

Once basic sync working, enable one feature at a time:

1. **BMS Ingestion** (if using insurance BMS XML):
   ```bash
   SYNC_BMS_INGESTION=true
   ```
   - Test: Upload BMS file, verify data in Supabase

2. **File Backup** (for photos/documents):
   ```bash
   SYNC_FILE_BACKUP=true
   ```
   - Test: Upload attachment, check Supabase Storage bucket

3. **Multi-Location** (if you have multiple shops):
   ```bash
   SYNC_MULTI_LOCATION=true
   ```
   - Test: Create RO at each location, verify isolation

---

## Step 6: Production Deployment

### 6.1 Create Production Supabase Project

1. Create separate Supabase project for production:
   - Name: `CollisionOS-Production`
   - Different region (optional)
   - Paid plan if needed
2. Run all 5 migrations again in production project
3. Update production `.env` with production credentials

### 6.2 Setup Monitoring

1. **Supabase Dashboard**:
   - Monitor "Database" → "Usage" for storage
   - Check "API" → "Logs" for errors
   - Review "Auth" → "Users" for access logs

2. **CollisionOS Monitoring**:
   ```bash
   # Create cron job to monitor sync health
   curl http://localhost:3002/api/sync/status | jq '.data.queue'
   ```

3. **Alerting** (optional):
   - Set up alerts if queue size > 100
   - Alert if totalFailed > 10
   - Monitor Supabase costs

### 6.3 Backup Strategy

Even with Supabase sync, maintain local backups:

```bash
# Daily SQLite backup
cp database.sqlite database.sqlite.backup.$(date +%Y%m%d)

# Weekly off-site backup
# Upload database.sqlite to cloud storage (S3, Dropbox, etc.)
```

---

## Troubleshooting

### Issue: "Supabase client not available"

**Solution**:
1. Check `ENABLE_SUPABASE=true` in `.env`
2. Verify credentials are correct (no extra spaces)
3. Check Supabase project is active (not paused)
4. Test URL manually: `curl https://xxxxx.supabase.co`

### Issue: "RLS policy violation" errors

**Solution**:
1. Check JWT token includes `shop_id` claim
2. Verify RLS policies were created (Step 2.2, Migration 5)
3. Ensure using `service_role` key for sync (not anon key)
4. Check user has correct role in JWT

### Issue: Sync queue growing, not processing

**Solution**:
1. Check network connectivity
2. Review Supabase API limits (free tier: unlimited requests)
3. Check for errors in sync history:
   ```bash
   curl http://localhost:3002/api/sync/history
   ```
4. Clear queue if corrupted:
   ```bash
   curl -X POST http://localhost:3002/api/sync/queue/clear
   ```

### Issue: High Supabase costs

**Solution**:
1. Check usage in Supabase dashboard
2. Increase sync interval (30s → 60s → 5min):
   ```bash
   SYNC_INTERVAL_MS=300000  # 5 minutes
   ```
3. Reduce batch size:
   ```bash
   SYNC_BATCH_SIZE=25  # Default 50
   ```
4. Disable unused features

---

## Cost Management

### Free Tier Limits (Supabase)

- ✅ **500MB database** - Sufficient for most single shops
- ✅ **1GB file storage** - Good for moderate photo usage
- ✅ **2GB bandwidth/month** - ~5,000-10,000 API calls
- ✅ **Unlimited API requests** - No request limit

### Estimated Monthly Costs (Beyond Free Tier)

| Shop Size | Database | Storage | Bandwidth | Total/Month |
|-----------|----------|---------|-----------|-------------|
| **Small** (1-50 ROs/month) | Free | Free | Free | **$0** |
| **Medium** (50-200 ROs/month) | Free | $5 | Free | **$5** |
| **Large** (200+ ROs/month) | $25 | $10 | $15 | **$50** |
| **Multi-Location** (5 shops) | $25 | $25 | $25 | **$75** |

### Cost Optimization Tips

1. **Compress photos** before uploading (reduce storage)
2. **Increase sync interval** (reduce API calls)
3. **Selective sync** - Only sync critical tables
4. **Archive old data** - Move old ROs to cold storage

---

## Next Steps

After successful setup:

1. ✅ **Test thoroughly** - Create ROs, parts, customers, verify all sync
2. ✅ **Train staff** - Show them sync status indicator
3. ✅ **Monitor costs** - Check Supabase usage weekly for first month
4. ✅ **Plan mobile app** - Foundation now ready for Phase 3
5. ✅ **Enable multi-location** - If you have multiple shops

---

## Support

**Issues?**
1. Check this guide's Troubleshooting section
2. Review Supabase logs: [app.supabase.com](https://app.supabase.com) → Logs
3. Check sync queue: `GET /api/sync/queue`
4. Review `docs/hybrid-architecture.md` for technical details

**Need Help?**
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
- CollisionOS Issues: [github.com/your-repo/issues](https://github.com)

---

## Security Checklist

Before going to production:

- [ ] `.env` is in `.gitignore` and never committed
- [ ] Service role key is stored securely
- [ ] Different credentials for dev vs production
- [ ] RLS policies tested and working
- [ ] JWT tokens include shop_id claim
- [ ] Backup of credentials stored in password manager
- [ ] Team knows NOT to share service role key
- [ ] Monitoring alerts configured
- [ ] Tested offline → online transition
- [ ] Verified data isolation between shops

---

**Congratulations!** 🎉 CollisionOS is now cloud-enabled while maintaining offline-first reliability.
