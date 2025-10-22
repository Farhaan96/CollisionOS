# Database Service Migration Strategy

## Overview

This document outlines the strategy for migrating CollisionOS route files from the legacy `databaseService` to the new `hybridDatabaseService` to enable optional cloud synchronization.

---

## Current State Analysis

### Routes Using Database Service

After auditing the codebase, **20+ route files** currently use database operations:

```
server/routes/
├── ai.js
├── attachments.js
├── auth.js
├── bmsApi.js
├── communication.js
├── customerCommunication.js
├── customers.js
├── dashboard.js
├── expenses.js
├── financial.js
├── invoices.js
├── jobs.js
├── jobsEnhanced.js          # ✅ Already uses databaseService explicitly
├── labor.js
├── loanerFleet.js
├── partsStatusUpdate.js
├── partsWorkflow.js
├── payments.js
├── production.js
├── purchaseOrders.js
└── [more files...]
```

### Database Access Patterns

Most routes access database via **Sequelize models**, not direct `databaseService`:

```javascript
// Current pattern (most common):
const { RepairOrder, Customer, Vehicle } = require('../database/models');

// Direct usage (only jobsEnhanced.js):
const { databaseService } = require('../services/databaseService');
```

### Key Finding ✅

**Good News**: Most routes use **Sequelize ORM directly**, which means:
- They don't need migration to `hybridDatabaseService`
- Sequelize models are already abstracted from the database
- Sync will work transparently once we integrate at the Sequelize level

**Only 1 route file** (`jobsEnhanced.js`) directly uses `databaseService`.

---

## Migration Strategy

### Option A: Sequelize Hooks (RECOMMENDED) ✅

**Approach**: Intercept Sequelize operations with hooks to trigger cloud sync.

**Advantages**:
- ✅ No route file changes needed (zero regression risk)
- ✅ Automatic sync for all CRUD operations
- ✅ Centralized logic in one place
- ✅ Easy to enable/disable sync

**Implementation**:

Create `server/database/hooks/syncHooks.js`:

```javascript
/**
 * Sequelize Hooks for Cloud Sync
 * Automatically queues cloud sync for all model operations
 */

const { syncQueueService } = require('../../services/syncQueue');
const { syncConfigService } = require('../../services/syncConfig');

/**
 * Register sync hooks on all models
 */
function registerSyncHooks(sequelize) {
  const models = sequelize.models;

  Object.keys(models).forEach((modelName) => {
    const Model = models[modelName];
    const tableName = Model.tableName;

    // After Create Hook
    Model.addHook('afterCreate', async (instance, options) => {
      if (syncConfigService.isSyncEnabled() && !options.skipSync) {
        try {
          const data = instance.toJSON();
          syncQueueService.queueCreate(tableName, data, {
            shopId: data.shop_id || data.shopId,
          });
        } catch (error) {
          console.error(`[SyncHook] Error queuing create for ${modelName}:`, error);
        }
      }
    });

    // After Update Hook
    Model.addHook('afterUpdate', async (instance, options) => {
      if (syncConfigService.isSyncEnabled() && !options.skipSync) {
        try {
          const data = instance.toJSON();
          const changes = instance._changed; // Changed fields

          syncQueueService.queueUpdate(
            tableName,
            { id: instance.id },
            data,
            {
              shopId: data.shop_id || data.shopId,
              changes,
            }
          );
        } catch (error) {
          console.error(`[SyncHook] Error queuing update for ${modelName}:`, error);
        }
      }
    });

    // After Destroy Hook
    Model.addHook('afterDestroy', async (instance, options) => {
      if (syncConfigService.isSyncEnabled() && !options.skipSync) {
        try {
          syncQueueService.queueDelete(
            tableName,
            { id: instance.id },
            {
              shopId: instance.shop_id || instance.shopId,
            }
          );
        } catch (error) {
          console.error(`[SyncHook] Error queuing delete for ${modelName}:`, error);
        }
      }
    });

    // After Bulk Create Hook
    Model.addHook('afterBulkCreate', async (instances, options) => {
      if (syncConfigService.isSyncEnabled() && !options.skipSync) {
        try {
          const dataArray = instances.map(i => i.toJSON());
          syncQueueService.queueBulkCreate(tableName, dataArray, {
            shopId: dataArray[0]?.shop_id || dataArray[0]?.shopId,
          });
        } catch (error) {
          console.error(`[SyncHook] Error queuing bulk create for ${modelName}:`, error);
        }
      }
    });
  });

  console.log(`[SyncHooks] Registered sync hooks for ${Object.keys(models).length} models`);
}

module.exports = { registerSyncHooks };
```

**Integration** (in `server/database/models/index.js`):

```javascript
// After all models are loaded
if (process.env.ENABLE_SUPABASE === 'true' && process.env.SYNC_ENABLED === 'true') {
  const { registerSyncHooks } = require('../hooks/syncHooks');
  registerSyncHooks(sequelize);
}
```

---

### Option B: Database Service Wrapper (ALTERNATIVE)

**Approach**: Keep `databaseService` but wrap it with sync logic.

**Advantages**:
- ✅ Works for direct `databaseService` calls
- ✅ No route changes needed

**Implementation**:

Modify `server/services/databaseService.js`:

```javascript
// At the top
const { syncQueueService } = require('./syncQueue');
const { syncConfigService } = require('./syncConfig');

class DatabaseService {
  async insert(table, data) {
    // Insert to local SQLite
    const result = await this.executeInsert(table, data);

    // Queue for cloud sync if enabled
    if (syncConfigService.isSyncEnabled()) {
      syncQueueService.queueCreate(table, result);
    }

    return result;
  }

  // Similar for update, delete, etc.
}
```

**Cons**:
- Only helps the 1 route using `databaseService` directly
- Doesn't help the 30+ routes using Sequelize models

---

### Option C: Explicit Migration (MANUAL)

**Approach**: Manually update each route file.

**Steps**:
1. Replace imports:
   ```javascript
   // Old:
   const { databaseService } = require('../services/databaseService');

   // New:
   const { hybridDatabaseService } = require('../services/databaseServiceHybrid');
   ```

2. Update method calls (if needed - API is compatible)

**Cons**:
- ❌ 20+ files to change
- ❌ High regression risk
- ❌ Time-consuming
- ❌ Doesn't help Sequelize-based routes

---

## Recommended Implementation Plan

### Phase 1: Sequelize Hook Integration (Week 1)

**Day 1-2: Create Sync Hooks**
1. Create `server/database/hooks/syncHooks.js`
2. Implement afterCreate, afterUpdate, afterDestroy, afterBulkCreate hooks
3. Add error handling and logging
4. Add `skipSync` option support

**Day 3: Integrate Hooks**
1. Modify `server/database/models/index.js`
2. Register hooks after models load
3. Make conditional on `ENABLE_SUPABASE` flag

**Day 4: Testing**
1. Test with sync disabled (verify no regression)
2. Test with sync enabled (verify operations queued)
3. Create test cases for all CRUD operations
4. Verify hook errors don't break transactions

**Day 5: Monitoring & Optimization**
1. Add performance metrics
2. Test with bulk operations (100+ records)
3. Verify queue doesn't overwhelm sync processor
4. Document skipSync usage for specific operations

### Phase 2: Service Layer Integration (Week 2)

**For the 1 file using databaseService directly:**

1. Update `jobsEnhanced.js`:
   ```javascript
   // Change:
   const { databaseService } = require('../services/databaseService');

   // To:
   const { hybridDatabaseService: databaseService } = require('../services/databaseServiceHybrid');
   ```

2. Test all endpoints in `jobsEnhanced.js`
3. Verify sync queuing works

### Phase 3: Validation & Testing (Week 3)

**Comprehensive Testing**:
1. Create integration tests for all 33 route files
2. Test with sync enabled and disabled
3. Load test with 1,000+ operations
4. Verify no performance regression
5. Test error scenarios (Supabase down, network issues)

### Phase 4: Documentation & Rollout (Week 4)

1. Update API documentation
2. Create troubleshooting guide
3. Train team on monitoring sync status
4. Gradual rollout to production

---

## Testing Checklist

Before deploying to production:

### Functional Tests
- [ ] Create operation syncs to cloud
- [ ] Update operation syncs changes
- [ ] Delete operation syncs deletion
- [ ] Bulk create batches correctly
- [ ] Sync disabled = no queuing
- [ ] skipSync option prevents sync
- [ ] Errors don't break transactions

### Performance Tests
- [ ] Single operation: < 10ms overhead
- [ ] Bulk operation (100 records): < 100ms overhead
- [ ] Queue size doesn't grow unbounded
- [ ] Memory usage acceptable with 1,000+ queue items
- [ ] Sync processor handles backlog efficiently

### Error Handling Tests
- [ ] Supabase down = graceful degradation
- [ ] Invalid credentials = no crashes
- [ ] Network timeout = retry logic works
- [ ] RLS violation = logged, not thrown
- [ ] Queue full = oldest items processed first

### Integration Tests
- [ ] All 33 routes work with sync enabled
- [ ] All 33 routes work with sync disabled
- [ ] No regression in existing functionality
- [ ] Real-time updates (if enabled) work
- [ ] Multi-location isolation works

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (< 5 minutes)

1. **Disable sync via environment**:
   ```bash
   # Set in .env
   ENABLE_SUPABASE=false
   SYNC_ENABLED=false

   # Restart server
   npm restart
   ```

2. **Verify local operations work**:
   - Create test RO
   - Confirm SQLite database updated
   - Check no sync errors in logs

### Full Rollback (< 30 minutes)

1. **Git revert**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Redeploy previous version**

3. **Verify all routes functional**

### Data Recovery

If cloud data corrupted:

1. **Local data is source of truth** - always preserved
2. **Clear cloud sync queue**:
   ```bash
   curl -X POST http://localhost:3002/api/sync/queue/clear
   ```
3. **Optionally re-sync from local**:
   ```bash
   # Future: Implement bulk re-sync script
   npm run sync:rebuild
   ```

---

## Performance Benchmarks

Expected performance impact:

| Operation | Without Sync | With Sync (Queue) | Overhead |
|-----------|-------------|-------------------|----------|
| Create RO | 5ms | 7ms | +2ms (40%) |
| Update Part | 3ms | 5ms | +2ms (66%) |
| Delete Record | 4ms | 6ms | +2ms (50%) |
| Bulk Create (100) | 50ms | 70ms | +20ms (40%) |
| Read Operations | 10ms | 10ms | 0ms (0%) |

**Overhead is acceptable** - queuing is fast, sync happens in background.

---

## Security Considerations

### Data Privacy
- All sync operations include shop_id
- RLS policies enforce isolation
- Service role key never exposed to frontend

### Error Exposure
- Sync errors logged server-side only
- No sensitive data in error messages
- Failed syncs don't expose credentials

### Access Control
- Sync queue API requires authentication
- Only admins can clear queue
- Read-only endpoints for users

---

## Monitoring & Alerting

Set up monitoring for:

### Key Metrics
- Queue size (alert if > 100)
- Failed sync count (alert if > 10)
- Sync processing time (alert if > 5min)
- Supabase API errors (alert on 5xx)

### Dashboards
- Real-time queue status
- Sync throughput (ops/minute)
- Error rate
- Cost tracking (Supabase usage)

### Logs
```javascript
// Example log queries
// Successful syncs
grep "Completed operation" logs/server.log

// Failed syncs
grep "Error processing operation" logs/server.log

// Queue status
curl http://localhost:3002/api/sync/stats
```

---

## Next Steps

1. ✅ **Implement Sequelize hooks** (Option A - Recommended)
2. ✅ **Update jobsEnhanced.js** (only file needing change)
3. ✅ **Test comprehensively** (all 33 routes)
4. ✅ **Deploy to staging** (monitor for 1 week)
5. ✅ **Gradual production rollout** (10% → 50% → 100%)

---

## Summary

**Best Approach**: Sequelize Hooks (Option A)
- Minimal code changes (1 new file)
- Automatic sync for all models
- Easy to enable/disable
- Low regression risk

**Timeline**: 3-4 weeks
- Week 1: Implement hooks
- Week 2: Update direct databaseService usage
- Week 3: Comprehensive testing
- Week 4: Documentation & deployment

**Risk Level**: LOW
- Local operations unchanged
- Sync is optional and non-blocking
- Easy rollback via environment variable

---

## Conclusion

The hybrid database architecture can be integrated with **minimal changes** to existing route files thanks to Sequelize's hook system. The Sequelize hook approach provides automatic cloud sync for all database operations without requiring route-by-route refactoring, significantly reducing implementation time and regression risk.
