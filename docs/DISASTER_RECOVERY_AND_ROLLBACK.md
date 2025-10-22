# Disaster Recovery and Rollback Procedures

## Overview

This document provides comprehensive procedures for recovering from failures, rolling back problematic deployments, and handling disaster scenarios with CollisionOS hybrid cloud sync.

**Key Principle**: Local SQLite is always the source of truth. Cloud sync is optional and can be disabled/recovered without data loss.

---

## Quick Reference

| Scenario | Action | Time | Risk |
|----------|--------|------|------|
| Sync errors | Disable sync | < 1 min | None |
| Queue growing | Clear queue | < 2 min | Low |
| Bad deployment | Rollback | < 5 min | Low |
| Supabase down | Failover to local | Automatic | None |
| Data corruption | Re-sync from local | < 30 min | Low |
| Complete failure | Full restore | < 2 hours | Medium |

---

## Emergency Procedures

### LEVEL 1: Disable Cloud Sync (< 1 minute) ⚡

**When to use**:
- Sync errors appearing in logs
- Supabase outage
- Suspicious sync activity
- Need to troubleshoot

**Steps**:

1. **Stop sync immediately** (doesn't require restart):
   ```bash
   curl -X POST http://localhost:3002/api/sync/disable
   ```

2. **Or via environment variable** (requires restart):
   ```bash
   # Edit .env
   SYNC_ENABLED=false

   # Restart server
   npm restart
   ```

3. **Verify sync stopped**:
   ```bash
   curl http://localhost:3002/api/sync/status | jq '.data.enabled'
   # Should return: false
   ```

**Impact**:
- ✅ Local operations continue normally
- ✅ No data loss
- ⏸️ Cloud sync paused
- ⏸️ Queue operations held (not lost)

---

### LEVEL 2: Clear Sync Queue (< 2 minutes) ⚠️

**When to use**:
- Queue size growing uncontrollably (> 1,000 operations)
- Corrupted queue entries causing errors
- Need to reset sync state

**Steps**:

1. **Check queue status first**:
   ```bash
   curl http://localhost:3002/api/sync/queue | jq
   ```

2. **Backup queue (optional but recommended)**:
   ```bash
   curl http://localhost:3002/api/sync/queue > queue-backup-$(date +%Y%m%d-%H%M%S).json
   ```

3. **Clear queue** (requires admin token):
   ```bash
   curl -X POST http://localhost:3002/api/sync/queue/clear \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

4. **Verify cleared**:
   ```bash
   curl http://localhost:3002/api/sync/status | jq '.data.queue.queueSize'
   # Should return: 0
   ```

**Impact**:
- ⚠️ Queued operations lost (not yet synced to cloud)
- ✅ Local data intact (source of truth)
- ✅ Fresh start for sync
- ⚠️ May need manual re-sync (see Level 4)

---

### LEVEL 3: Application Rollback (< 5 minutes) 🔄

**When to use**:
- New deployment causing issues
- Unexpected behavior after update
- Need to revert to stable version

**Steps**:

#### Method A: Environment Variable Rollback (Fastest)

```bash
# 1. Disable Supabase entirely
echo "ENABLE_SUPABASE=false" >> .env

# 2. Restart application
npm restart

# 3. Verify running on local-only mode
curl http://localhost:3002/api/sync/status | jq '.data.mode'
# Should return: "local-only"
```

#### Method B: Git Rollback (Complete)

```bash
# 1. Find commit to rollback to
git log --oneline -10

# 2. Rollback to previous commit (creates new commit)
git revert <commit-hash>

# 3. Or hard reset (DANGEROUS - loses commits)
git reset --hard <commit-hash>

# 4. Push changes
git push origin main

# 5. Redeploy application
npm install
npm restart
```

#### Method C: Branch Rollback

```bash
# 1. Create backup of current state
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)

# 2. Revert to stable branch
git checkout main
git pull origin main

# 3. Redeploy
npm install
npm restart
```

**Verification**:
```bash
# Test critical functionality
curl http://localhost:3002/api/health
curl http://localhost:3002/api/repair-orders?limit=1

# Check logs for errors
tail -f logs/server.log
```

---

### LEVEL 4: Data Re-Sync from Local to Cloud (< 30 minutes) 🔄

**When to use**:
- Cloud data out of sync with local
- After clearing queue (Level 2)
- Supabase restored after outage
- Initial setup of new Supabase project

**Steps**:

1. **Prepare for bulk sync**:
   ```bash
   # Ensure sync is disabled
   curl -X POST http://localhost:3002/api/sync/disable

   # Clear cloud queue
   curl -X POST http://localhost:3002/api/sync/queue/clear
   ```

2. **Create re-sync script** (save as `scripts/resync-to-cloud.js`):
   ```javascript
   const { sequelize } = require('../server/database/models');
   const { hybridDatabaseService } = require('../server/services/databaseServiceHybrid');

   async function resyncAllTables() {
     const tables = [
       'customers',
       'vehicles',
       'repair_orders',
       'parts',
       'purchase_orders',
       // Add other critical tables
     ];

     for (const table of tables) {
       console.log(`Syncing ${table}...`);

       const records = await sequelize.query(
         `SELECT * FROM ${table}`,
         { type: sequelize.QueryTypes.SELECT }
       );

       console.log(`Found ${records.length} records in ${table}`);

       // Sync in batches
       const batchSize = 50;
       for (let i = 0; i < records.length; i += batchSize) {
         const batch = records.slice(i, i + batchSize);
         await hybridDatabaseService.bulkCreate(table, batch, { skipSync: false });
         console.log(`Synced ${i + batch.length}/${records.length} ${table} records`);
       }
     }

     console.log('Re-sync complete!');
   }

   resyncAllTables().catch(console.error);
   ```

3. **Run re-sync**:
   ```bash
   node scripts/resync-to-cloud.js
   ```

4. **Monitor progress**:
   ```bash
   # Watch queue size
   watch -n 5 'curl -s http://localhost:3002/api/sync/status | jq ".data.queue"'
   ```

5. **Verify data in Supabase**:
   - Go to Supabase dashboard
   - Check Table Editor
   - Spot-check a few records

6. **Re-enable sync**:
   ```bash
   curl -X POST http://localhost:3002/api/sync/enable
   ```

---

### LEVEL 5: Complete System Restore (< 2 hours) 🆘

**When to use**:
- Catastrophic failure (both local and cloud)
- Database corruption
- Ransomware attack
- Hardware failure

**Prerequisites**:
- ✅ Recent SQLite backup (`database.sqlite.backup`)
- ✅ Recent cloud backup (Supabase snapshot)
- ✅ Application backup (Git repository)

**Steps**:

#### Phase 1: Restore Local Database (15 minutes)

```bash
# 1. Stop application
pm2 stop collision-os
# or
killall node

# 2. Backup corrupted database
mv database.sqlite database.sqlite.CORRUPTED.$(date +%Y%m%d-%H%M%S)

# 3. Restore from backup
cp database.sqlite.backup database.sqlite

# 4. Verify database integrity
sqlite3 database.sqlite "PRAGMA integrity_check;"
# Should return: ok

# 5. Test database access
sqlite3 database.sqlite "SELECT COUNT(*) FROM customers;"
```

#### Phase 2: Restore Application (15 minutes)

```bash
# 1. Clone fresh from repository
cd /tmp
git clone https://github.com/your-repo/collision-os.git collision-os-restore
cd collision-os-restore

# 2. Install dependencies
npm install

# 3. Copy restored database
cp /path/to/restored/database.sqlite ./database.sqlite

# 4. Copy environment configuration
cp /path/to/backup/.env .env

# 5. Run database migrations (if needed)
npm run db:migrate

# 6. Test startup
npm run dev
```

#### Phase 3: Verify Functionality (30 minutes)

```bash
# Test critical endpoints
curl http://localhost:3002/api/health
curl http://localhost:3002/api/repair-orders?limit=5
curl http://localhost:3002/api/customers?limit=5

# Test authentication
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shop.com","password":"test"}'

# Test create operation
curl -X POST http://localhost:3002/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"firstName":"Test","lastName":"User","phone":"555-1234"}'
```

#### Phase 4: Restore Cloud Sync (60 minutes)

```bash
# 1. Disable sync initially
curl -X POST http://localhost:3002/api/sync/disable

# 2. Clear Supabase data (CAREFUL!)
# Go to Supabase dashboard → SQL Editor
# Run: TRUNCATE TABLE customers, vehicles, repair_orders CASCADE;

# 3. Re-sync from local (see Level 4)
node scripts/resync-to-cloud.js

# 4. Re-enable sync
curl -X POST http://localhost:3002/api/sync/enable

# 5. Monitor for 15 minutes
watch -n 10 'curl -s http://localhost:3002/api/sync/status | jq'
```

---

## Common Failure Scenarios

### Scenario 1: Supabase Service Outage

**Symptoms**:
- Sync errors in logs
- Queue growing
- Timeout errors

**Resolution**:
```bash
# Automatic failover - no action needed!
# Local operations continue, queue holds operations

# Optionally: Disable sync to reduce log noise
curl -X POST http://localhost:3002/api/sync/disable

# When Supabase back online:
curl -X POST http://localhost:3002/api/sync/enable
curl -X POST http://localhost:3002/api/sync/trigger  # Manual sync
```

**Prevention**:
- Monitor Supabase status page
- Set up alerts for sync failures
- Increase retry attempts and delays

---

### Scenario 2: RLS Policy Blocking Access

**Symptoms**:
- "Policy violation" errors
- 403 Forbidden from Supabase
- Operations fail with RLS errors

**Resolution**:
```sql
-- In Supabase SQL Editor

-- 1. Check current policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'your_table';

-- 2. Temporarily disable RLS (TESTING ONLY)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- 3. Fix policy (example)
DROP POLICY "Users can view shop customers" ON customers;
CREATE POLICY "Users can view shop customers"
  ON customers FOR SELECT
  USING (shop_id = auth.current_shop_id() OR auth.is_owner_or_admin());

-- 4. Re-enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

**Prevention**:
- Test RLS policies thoroughly before production
- Use service_role key for sync (bypasses RLS)
- Log RLS violations for monitoring

---

### Scenario 3: Queue Memory Overflow

**Symptoms**:
- High memory usage
- Node.js out of memory errors
- Queue size > 10,000

**Resolution**:
```bash
# 1. Check queue size
curl http://localhost:3002/api/sync/status | jq '.data.queue.queueSize'

# 2. If > 10,000, clear queue
curl -X POST http://localhost:3002/api/sync/queue/clear

# 3. Increase memory limit (temporary fix)
NODE_OPTIONS="--max-old-space-size=4096" npm start

# 4. Fix root cause:
#    - Increase SYNC_BATCH_SIZE
#    - Decrease SYNC_INTERVAL_MS
#    - Check for sync errors blocking processing
```

**Prevention**:
- Monitor queue size (alert if > 1,000)
- Implement Redis queue (replaces in-memory)
- Tune batch size and interval

---

### Scenario 4: Duplicate Records in Cloud

**Symptoms**:
- Same record appears multiple times in Supabase
- Unique constraint violations

**Resolution**:
```sql
-- In Supabase SQL Editor

-- 1. Find duplicates
SELECT id, COUNT(*)
FROM customers
GROUP BY id
HAVING COUNT(*) > 1;

-- 2. Remove duplicates (keep latest)
DELETE FROM customers a
USING customers b
WHERE a.id = b.id
  AND a.created_at < b.created_at;

-- 3. Verify cleanup
SELECT id, COUNT(*)
FROM customers
GROUP BY id
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

**Prevention**:
- Ensure unique constraints in Supabase schema
- Add idempotency checks in sync queue
- Use upsert instead of insert where possible

---

## Backup Strategies

### Daily Automated Backups

```bash
# Add to crontab (crontab -e)

# Backup SQLite daily at 2 AM
0 2 * * * cd /path/to/collision-os && cp database.sqlite database.sqlite.backup.$(date +\%Y\%m\%d)

# Keep only last 7 days
0 3 * * * find /path/to/collision-os -name "database.sqlite.backup.*" -mtime +7 -delete

# Backup to cloud storage (optional)
0 4 * * * aws s3 cp /path/to/collision-os/database.sqlite s3://your-bucket/backups/collision-os-$(date +\%Y\%m\%d).sqlite
```

### Weekly Supabase Snapshots

1. Go to Supabase Dashboard
2. Navigate to "Database" → "Backups"
3. Enable automatic backups (Pro plan)
4. Or manually export:
   ```bash
   pg_dump -h your-project.supabase.co -U postgres -d postgres > supabase-backup.sql
   ```

### On-Demand Backups

```bash
# Before major changes
./scripts/backup-now.sh

# Example backup script (scripts/backup-now.sh)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp database.sqlite "backups/database-pre-change-${TIMESTAMP}.sqlite"
echo "Backup created: backups/database-pre-change-${TIMESTAMP}.sqlite"
```

---

## Testing Recovery Procedures

**Run these tests quarterly** to ensure procedures work:

### Test 1: Disable/Enable Sync
```bash
curl -X POST http://localhost:3002/api/sync/disable
# Verify local ops work
curl -X POST http://localhost:3002/api/sync/enable
# Verify sync resumes
```

### Test 2: Clear Queue
```bash
# Create test operations
# Clear queue
curl -X POST http://localhost:3002/api/sync/queue/clear
# Verify no errors
```

### Test 3: Rollback Application
```bash
# In test environment
git revert HEAD
npm install && npm restart
# Verify application works
git reset --hard HEAD@{1}  # Restore
```

### Test 4: Restore from Backup
```bash
# In test environment
cp database.sqlite.backup database-test.sqlite
# Verify integrity
# Test operations
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Queue Size** (alert if > 100)
   ```bash
   curl -s http://localhost:3002/api/sync/status | jq '.data.queue.queueSize'
   ```

2. **Failed Syncs** (alert if > 10)
   ```bash
   curl -s http://localhost:3002/api/sync/status | jq '.data.queue.totalFailed'
   ```

3. **Last Sync Time** (alert if > 5 minutes ago)
   ```bash
   curl -s http://localhost:3002/api/sync/status | jq '.data.lastSync'
   ```

4. **Supabase API Health**
   ```bash
   curl -s https://your-project.supabase.co/rest/v1/ | jq
   ```

### Alerting Script

```bash
#!/bin/bash
# scripts/monitor-sync.sh

QUEUE_SIZE=$(curl -s http://localhost:3002/api/sync/status | jq '.data.queue.queueSize')
FAILED=$(curl -s http://localhost:3002/api/sync/status | jq '.data.queue.totalFailed')

if [ "$QUEUE_SIZE" -gt 100 ]; then
  echo "ALERT: Sync queue size is $QUEUE_SIZE (threshold: 100)"
  # Send alert (email, Slack, PagerDuty, etc.)
fi

if [ "$FAILED" -gt 10 ]; then
  echo "ALERT: Failed syncs: $FAILED (threshold: 10)"
  # Send alert
fi
```

---

## Contact & Escalation

### Support Tiers

**Tier 1: Self-Service** (< 15 minutes)
- Check this documentation
- Review logs: `tail -f logs/server.log`
- Check Supabase dashboard
- Disable sync if needed

**Tier 2: Internal Team** (< 1 hour)
- Contact development team
- Review sync queue: `GET /api/sync/queue`
- Check Supabase status page

**Tier 3: Vendor Support** (< 4 hours)
- Supabase Support: support@supabase.com
- Supabase Discord: discord.supabase.com
- GitHub Issues: github.com/your-repo/issues

**Tier 4: Emergency** (< 30 minutes)
- Call on-call engineer
- Disable sync immediately
- Rollback deployment
- Switch to backup system

---

## Checklist: Pre-Production

Before deploying to production, verify:

- [ ] Backups automated (daily SQLite, weekly Supabase)
- [ ] Monitoring alerts configured
- [ ] Recovery procedures tested in staging
- [ ] Team trained on Level 1 & 2 procedures
- [ ] On-call rotation established
- [ ] Escalation contacts documented
- [ ] Rollback tested successfully
- [ ] Re-sync tested successfully
- [ ] Supabase billing alerts set up
- [ ] Disaster recovery plan reviewed

---

## Summary

CollisionOS hybrid architecture is designed for **resilience**:

- ✅ Local data is always safe (source of truth)
- ✅ Cloud sync can be disabled instantly
- ✅ Recovery procedures are fast (< 5 minutes for most scenarios)
- ✅ No single point of failure

**Remember**: When in doubt, disable sync. Local operations always work.

---

**Last Updated**: 2025-10-21
**Next Review**: 2026-01-21 (Quarterly)
