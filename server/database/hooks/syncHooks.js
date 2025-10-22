/**
 * Sequelize Sync Hooks for Cloud Synchronization
 * Automatically queues cloud sync operations for all Sequelize model changes
 *
 * This provides transparent cloud sync without modifying route files.
 * Works with the hybrid database architecture to queue operations for Supabase.
 */

const { syncQueueService } = require('../../services/syncQueue');
const { syncConfigService } = require('../../services/syncConfig');

/**
 * Tables to exclude from sync (local-only data)
 */
const SYNC_EXCLUDE_TABLES = [
  'SequelizeMeta',        // Migration tracking
  'Sessions',             // Local sessions
  'temp_logs',            // Temporary logs
  'cache',                // Cache tables
];

/**
 * Register cloud sync hooks on all Sequelize models
 *
 * @param {Sequelize} sequelize - Sequelize instance
 */
function registerSyncHooks(sequelize) {
  if (!sequelize || !sequelize.models) {
    console.error('[SyncHooks] Invalid sequelize instance provided');
    return;
  }

  const models = sequelize.models;
  let registeredCount = 0;

  Object.keys(models).forEach((modelName) => {
    const Model = models[modelName];
    const tableName = Model.tableName;

    // Skip excluded tables
    if (SYNC_EXCLUDE_TABLES.includes(tableName)) {
      console.log(`[SyncHooks] Skipping sync hooks for ${tableName} (excluded)`);
      return;
    }

    try {
      // ============================================================
      // AFTER CREATE HOOK
      // ============================================================
      Model.addHook('afterCreate', `sync-afterCreate-${modelName}`, async (instance, options) => {
        await handleAfterCreate(tableName, instance, options);
      });

      // ============================================================
      // AFTER UPDATE HOOK
      // ============================================================
      Model.addHook('afterUpdate', `sync-afterUpdate-${modelName}`, async (instance, options) => {
        await handleAfterUpdate(tableName, instance, options);
      });

      // ============================================================
      // AFTER DESTROY HOOK
      // ============================================================
      Model.addHook('afterDestroy', `sync-afterDestroy-${modelName}`, async (instance, options) => {
        await handleAfterDestroy(tableName, instance, options);
      });

      // ============================================================
      // AFTER BULK CREATE HOOK
      // ============================================================
      Model.addHook('afterBulkCreate', `sync-afterBulkCreate-${modelName}`, async (instances, options) => {
        await handleAfterBulkCreate(tableName, instances, options);
      });

      // ============================================================
      // AFTER BULK UPDATE HOOK
      // ============================================================
      Model.addHook('afterBulkUpdate', `sync-afterBulkUpdate-${modelName}`, async (options) => {
        await handleAfterBulkUpdate(tableName, options);
      });

      // ============================================================
      // AFTER BULK DESTROY HOOK
      // ============================================================
      Model.addHook('afterBulkDestroy', `sync-afterBulkDestroy-${modelName}`, async (options) => {
        await handleAfterBulkDestroy(tableName, options);
      });

      registeredCount++;
    } catch (error) {
      console.error(`[SyncHooks] Error registering hooks for ${modelName}:`, error);
    }
  });

  console.log(`[SyncHooks] Successfully registered sync hooks for ${registeredCount} models`);
}

/**
 * Handle after create event
 */
async function handleAfterCreate(tableName, instance, options) {
  if (!shouldSync(options)) {
    return;
  }

  try {
    const data = instance.toJSON();
    const shopId = extractShopId(data, options);

    syncQueueService.queueCreate(tableName, data, {
      shopId,
      modelName: instance.constructor.name,
      transactionId: options.transaction?.id,
    });

    logSync('CREATE', tableName, instance.id || 'new');
  } catch (error) {
    handleSyncError('afterCreate', tableName, error);
  }
}

/**
 * Handle after update event
 */
async function handleAfterUpdate(tableName, instance, options) {
  if (!shouldSync(options)) {
    return;
  }

  try {
    const data = instance.toJSON();
    const shopId = extractShopId(data, options);
    const changes = instance._changed; // Fields that were changed

    syncQueueService.queueUpdate(
      tableName,
      { id: instance.id },
      data,
      {
        shopId,
        modelName: instance.constructor.name,
        changes: Array.from(changes || []),
        transactionId: options.transaction?.id,
      }
    );

    logSync('UPDATE', tableName, instance.id, changes);
  } catch (error) {
    handleSyncError('afterUpdate', tableName, error);
  }
}

/**
 * Handle after destroy event
 */
async function handleAfterDestroy(tableName, instance, options) {
  if (!shouldSync(options)) {
    return;
  }

  try {
    const shopId = extractShopId(instance, options);

    syncQueueService.queueDelete(
      tableName,
      { id: instance.id },
      {
        shopId,
        modelName: instance.constructor.name,
        transactionId: options.transaction?.id,
      }
    );

    logSync('DELETE', tableName, instance.id);
  } catch (error) {
    handleSyncError('afterDestroy', tableName, error);
  }
}

/**
 * Handle after bulk create event
 */
async function handleAfterBulkCreate(tableName, instances, options) {
  if (!shouldSync(options) || !instances || instances.length === 0) {
    return;
  }

  try {
    const dataArray = instances.map(i => i.toJSON());
    const shopId = extractShopId(dataArray[0], options);

    syncQueueService.queueBulkCreate(tableName, dataArray, {
      shopId,
      count: dataArray.length,
      transactionId: options.transaction?.id,
    });

    logSync('BULK_CREATE', tableName, `${instances.length} records`);
  } catch (error) {
    handleSyncError('afterBulkCreate', tableName, error);
  }
}

/**
 * Handle after bulk update event
 */
async function handleAfterBulkUpdate(tableName, options) {
  if (!shouldSync(options)) {
    return;
  }

  try {
    // For bulk updates, we don't have individual instances
    // Queue a sync task to re-sync affected records
    const where = options.where || {};
    const attributes = options.attributes || {};

    // Note: This is less efficient than individual updates
    // Consider fetching affected records first if needed
    console.log(`[SyncHooks] Bulk update on ${tableName} - consider manual sync`);

    // For now, just log - implement custom sync logic if needed
    logSync('BULK_UPDATE', tableName, JSON.stringify(where));
  } catch (error) {
    handleSyncError('afterBulkUpdate', tableName, error);
  }
}

/**
 * Handle after bulk destroy event
 */
async function handleAfterBulkDestroy(tableName, options) {
  if (!shouldSync(options)) {
    return;
  }

  try {
    const where = options.where || {};

    console.log(`[SyncHooks] Bulk destroy on ${tableName} - consider manual sync`);

    // For now, just log - implement custom sync logic if needed
    logSync('BULK_DESTROY', tableName, JSON.stringify(where));
  } catch (error) {
    handleSyncError('afterBulkDestroy', tableName, error);
  }
}

/**
 * Determine if sync should occur for this operation
 *
 * @param {Object} options - Sequelize operation options
 * @returns {boolean}
 */
function shouldSync(options = {}) {
  // Check if sync is globally enabled
  if (!syncConfigService.isSyncEnabled()) {
    return false;
  }

  // Check for skipSync flag (allows manual override)
  if (options.skipSync === true) {
    return false;
  }

  // Check if this is a sync operation itself (prevent infinite loop)
  if (options.fromSync === true) {
    return false;
  }

  return true;
}

/**
 * Extract shop ID from data or options
 *
 * @param {Object} data - Record data
 * @param {Object} options - Sequelize options
 * @returns {string|null}
 */
function extractShopId(data, options = {}) {
  // Try multiple field names (different models use different conventions)
  return (
    data?.shop_id ||
    data?.shopId ||
    options.shopId ||
    options.shop_id ||
    null
  );
}

/**
 * Log sync operation (only in debug mode)
 *
 * @param {string} operation - Operation type
 * @param {string} tableName - Table name
 * @param {*} identifier - Record identifier
 * @param {*} extra - Extra info
 */
function logSync(operation, tableName, identifier, extra = null) {
  if (process.env.SYNC_DEBUG === 'true') {
    const extraInfo = extra ? ` (${JSON.stringify(extra)})` : '';
    console.log(`[SyncHooks] ${operation} queued: ${tableName} ${identifier}${extraInfo}`);
  }
}

/**
 * Handle sync errors (log but don't throw - sync failures shouldn't break operations)
 *
 * @param {string} hookName - Hook name
 * @param {string} tableName - Table name
 * @param {Error} error - Error object
 */
function handleSyncError(hookName, tableName, error) {
  console.error(
    `[SyncHooks] Error in ${hookName} hook for ${tableName}:`,
    error.message
  );

  // Emit event for monitoring
  if (syncQueueService && syncQueueService.emit) {
    syncQueueService.emit('hook:error', {
      hook: hookName,
      table: tableName,
      error: error.message,
      timestamp: new Date(),
    });
  }

  // Don't throw - sync errors shouldn't break database operations
}

/**
 * Remove sync hooks from all models (for testing or disable sync)
 *
 * @param {Sequelize} sequelize - Sequelize instance
 */
function removeSyncHooks(sequelize) {
  if (!sequelize || !sequelize.models) {
    return;
  }

  const models = sequelize.models;
  let removedCount = 0;

  Object.keys(models).forEach((modelName) => {
    const Model = models[modelName];

    try {
      // Remove hooks by name
      ['afterCreate', 'afterUpdate', 'afterDestroy', 'afterBulkCreate', 'afterBulkUpdate', 'afterBulkDestroy'].forEach(hookType => {
        const hookName = `sync-${hookType}-${modelName}`;
        Model.removeHook(hookType, hookName);
      });

      removedCount++;
    } catch (error) {
      console.error(`[SyncHooks] Error removing hooks for ${modelName}:`, error);
    }
  });

  console.log(`[SyncHooks] Removed sync hooks from ${removedCount} models`);
}

/**
 * Get sync hook statistics
 *
 * @returns {Object}
 */
function getSyncHookStats() {
  return {
    enabled: syncConfigService.isSyncEnabled(),
    queueStats: syncQueueService.getStats(),
    excludedTables: SYNC_EXCLUDE_TABLES,
  };
}

module.exports = {
  registerSyncHooks,
  removeSyncHooks,
  getSyncHookStats,
  SYNC_EXCLUDE_TABLES,
};
