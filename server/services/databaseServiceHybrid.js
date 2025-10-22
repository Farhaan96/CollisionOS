/**
 * Hybrid Database Service (Phase 1)
 * Supports dual-write to SQLite (primary) and Supabase (optional cloud sync)
 */

const { databaseService: legacyService } = require('./databaseService');
const { syncConfigService } = require('./syncConfig');
const { syncQueueService, OPERATION_TYPES } = require('./syncQueue');
const { getSupabaseClient } = require('../config/supabase');

/**
 * Enhanced database service with hybrid cloud sync support
 */
class HybridDatabaseService {
  constructor() {
    this.legacyService = legacyService;
    this.syncEnabled = false;
  }

  /**
   * Initialize hybrid database service
   */
  async initialize() {
    // Initialize sync config
    const config = await syncConfigService.initialize();
    this.syncEnabled = config.enabled;

    // Initialize sync queue if enabled
    if (this.syncEnabled) {
      await syncQueueService.initialize();
    }

    console.log('[HybridDB] Initialized in', this.syncEnabled ? 'HYBRID' : 'LOCAL-ONLY', 'mode');
  }

  /**
   * Create a new record (dual-write if sync enabled)
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @param {Object} options - Operation options
   * @returns {Promise<Object>} Created record
   */
  async create(table, data, options = {}) {
    // ALWAYS write to local SQLite first (primary database)
    const localResult = await this.writeToLocal(table, data, 'create');

    // Queue for cloud sync if enabled
    if (this.syncEnabled && !options.skipSync) {
      this.queueCloudSync(table, localResult, 'create', options);
    }

    return localResult;
  }

  /**
   * Update a record (dual-write if sync enabled)
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @param {Object} data - Data to update
   * @param {Object} options - Operation options
   * @returns {Promise<Object>} Updated record
   */
  async update(table, where, data, options = {}) {
    // ALWAYS write to local SQLite first
    const localResult = await this.updateLocal(table, where, data);

    // Queue for cloud sync if enabled
    if (this.syncEnabled && !options.skipSync) {
      this.queueCloudSync(table, { where, data }, 'update', options);
    }

    return localResult;
  }

  /**
   * Delete a record (dual-write if sync enabled)
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @param {Object} options - Operation options
   * @returns {Promise<boolean>} Success status
   */
  async delete(table, where, options = {}) {
    // ALWAYS delete from local SQLite first
    const localResult = await this.deleteLocal(table, where);

    // Queue for cloud sync if enabled
    if (this.syncEnabled && !options.skipSync) {
      this.queueCloudSync(table, { where }, 'delete', options);
    }

    return localResult;
  }

  /**
   * Query records (read from local by default)
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async query(table, options = {}) {
    // Always read from local SQLite for consistency
    return this.legacyService.query(table, options);
  }

  /**
   * Write to local SQLite database
   * @private
   */
  async writeToLocal(table, data, operation) {
    try {
      return await this.legacyService.insert(table, data);
    } catch (error) {
      console.error(`[HybridDB] Local ${operation} failed:`, error);
      throw error; // Re-throw - local write is critical
    }
  }

  /**
   * Update local SQLite database
   * @private
   */
  async updateLocal(table, where, data) {
    try {
      return await this.legacyService.update(table, data, where);
    } catch (error) {
      console.error('[HybridDB] Local update failed:', error);
      throw error;
    }
  }

  /**
   * Delete from local SQLite database
   * @private
   */
  async deleteLocal(table, where) {
    try {
      return await this.legacyService.delete(table, where);
    } catch (error) {
      console.error('[HybridDB] Local delete failed:', error);
      throw error;
    }
  }

  /**
   * Queue operation for cloud sync (non-blocking)
   * @private
   */
  queueCloudSync(table, data, operation, options = {}) {
    try {
      const shopId = options.shopId || data.shop_id || data.shopId;

      switch (operation) {
        case 'create':
          syncQueueService.queueCreate(table, data, { shopId, ...options });
          break;

        case 'update':
          syncQueueService.queueUpdate(table, data.where, data.data, { shopId, ...options });
          break;

        case 'delete':
          syncQueueService.queueDelete(table, data.where, { shopId, ...options });
          break;

        default:
          console.warn(`[HybridDB] Unknown sync operation: ${operation}`);
      }
    } catch (error) {
      // Queue failures are non-critical - log and continue
      console.error('[HybridDB] Failed to queue sync operation:', error);
    }
  }

  /**
   * Bulk create records with optimized sync
   * @param {string} table - Table name
   * @param {Array} dataArray - Array of records to create
   * @param {Object} options - Operation options
   * @returns {Promise<Array>} Created records
   */
  async bulkCreate(table, dataArray, options = {}) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return [];
    }

    // Write to local SQLite first
    const localResults = [];
    for (const data of dataArray) {
      const result = await this.writeToLocal(table, data, 'create');
      localResults.push(result);
    }

    // Queue single bulk operation for cloud sync
    if (this.syncEnabled && !options.skipSync) {
      try {
        const shopId = options.shopId || dataArray[0]?.shop_id || dataArray[0]?.shopId;
        syncQueueService.queueBulkCreate(table, localResults, { shopId, ...options });
      } catch (error) {
        console.error('[HybridDB] Failed to queue bulk sync:', error);
      }
    }

    return localResults;
  }

  /**
   * Direct write to cloud (synchronous) - use sparingly
   * @param {string} table - Table name
   * @param {Object} data - Data to write
   * @param {string} operation - Operation type
   * @returns {Promise<Object>} Cloud write result
   */
  async writeToCloud(table, data, operation = 'create') {
    if (!this.syncEnabled) {
      throw new Error('Cloud sync is not enabled');
    }

    const supabase = getSupabaseClient(true); // Use service role

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    try {
      let result;

      switch (operation) {
        case 'create':
          const { data: createResult, error: createError } = await supabase
            .from(table)
            .insert(data)
            .select()
            .single();

          if (createError) throw createError;
          result = createResult;
          break;

        case 'update':
          const { where, updateData } = data;
          let updateQuery = supabase.from(table).update(updateData);

          Object.entries(where).forEach(([key, value]) => {
            updateQuery = updateQuery.eq(key, value);
          });

          const { data: updateResult, error: updateError } = await updateQuery.select();

          if (updateError) throw updateError;
          result = updateResult;
          break;

        case 'delete':
          let deleteQuery = supabase.from(table).delete();

          Object.entries(data.where).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value);
          });

          const { error: deleteError } = await deleteQuery;

          if (deleteError) throw deleteError;
          result = { deleted: true };
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return result;
    } catch (error) {
      console.error(`[HybridDB] Direct cloud write failed:`, error);
      throw error;
    }
  }

  /**
   * Sync specific record to cloud immediately (force sync)
   * @param {string} table - Table name
   * @param {Object} where - Record identifier
   * @returns {Promise<Object>} Sync result
   */
  async forceSyncRecord(table, where) {
    if (!this.syncEnabled) {
      throw new Error('Cloud sync is not enabled');
    }

    // Fetch from local database
    const localRecords = await this.query(table, { where, limit: 1 });

    if (!localRecords || localRecords.length === 0) {
      throw new Error('Record not found in local database');
    }

    const record = localRecords[0];

    // Write directly to cloud (bypass queue)
    return await this.writeToCloud(table, record, 'create');
  }

  /**
   * Get sync status for the database service
   * @returns {Promise<Object>} Sync status
   */
  async getSyncStatus() {
    const queueStats = syncQueueService.getStats();
    const configStatus = await syncConfigService.getStatus();

    return {
      mode: this.syncEnabled ? 'hybrid' : 'local-only',
      syncEnabled: this.syncEnabled,
      config: configStatus,
      queue: queueStats,
      lastSync: queueStats.lastSync,
      pendingOperations: queueStats.queueSize,
    };
  }

  /**
   * Manually trigger sync (process queue now)
   * @returns {Promise<Object>} Sync result
   */
  async triggerSync() {
    if (!this.syncEnabled) {
      throw new Error('Cloud sync is not enabled');
    }

    return await syncQueueService.triggerSync();
  }

  /**
   * Clear sync queue (use with caution)
   * @returns {number} Number of cleared operations
   */
  clearSyncQueue() {
    return syncQueueService.clearQueue();
  }

  /**
   * Enable/disable sync at runtime
   * @param {boolean} enabled - Enable or disable sync
   */
  setSyncEnabled(enabled) {
    this.syncEnabled = enabled;

    if (enabled) {
      syncQueueService.startProcessor();
    } else {
      syncQueueService.stopProcessor();
    }

    console.log('[HybridDB] Sync', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get sync queue contents (for debugging)
   * @returns {Array} Queue operations
   */
  getSyncQueue() {
    return syncQueueService.getQueue();
  }

  /**
   * Legacy compatibility methods - delegate to existing service
   */
  async insert(table, data, options = {}) {
    return this.create(table, data, options);
  }

  async rawQuery(sql, replacements = []) {
    return this.legacyService.rawQuery(sql, replacements);
  }

  async beginTransaction() {
    return this.legacyService.beginTransaction();
  }

  async getConnectionStatus() {
    const localStatus = await this.legacyService.getConnectionStatus();
    const syncStatus = await this.getSyncStatus();

    return {
      local: localStatus,
      sync: syncStatus,
      mode: this.syncEnabled ? 'hybrid' : 'local-only',
    };
  }
}

// Create singleton instance
const hybridDatabaseService = new HybridDatabaseService();

module.exports = {
  HybridDatabaseService,
  hybridDatabaseService,
};
