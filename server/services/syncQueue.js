/**
 * Sync Queue Service
 * Manages background synchronization of local database operations to Supabase
 */

const EventEmitter = require('events');
const { getSupabaseClient } = require('../config/supabase');
const { syncConfigService } = require('./syncConfig');

/**
 * Operation types for sync queue
 */
const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  BULK_CREATE: 'bulk_create',
  BULK_UPDATE: 'bulk_update',
};

/**
 * Sync status codes
 */
const SYNC_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRY: 'retry',
};

class SyncQueueService extends EventEmitter {
  constructor() {
    super();
    this.queue = []; // In-memory queue (can be replaced with Redis for production)
    this.processing = false;
    this.processingInterval = null;
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      lastSync: null,
      lastError: null,
    };
  }

  /**
   * Initialize the sync queue processor
   */
  async initialize() {
    const config = await syncConfigService.initialize();

    if (!config.enabled) {
      console.log('[SyncQueue] Cloud sync is disabled - queue processor not started');
      return;
    }

    // Start background processor
    this.startProcessor(config.syncInterval);

    console.log('[SyncQueue] Initialized with interval:', config.syncInterval);
  }

  /**
   * Add operation to sync queue
   * @param {Object} operation - Operation to queue
   * @returns {string} Operation ID
   */
  enqueue(operation) {
    const queueItem = {
      id: this.generateOperationId(),
      ...operation,
      status: SYNC_STATUS.PENDING,
      queuedAt: new Date(),
      attempts: 0,
      maxAttempts: syncConfigService.get('retryAttempts', 3),
      error: null,
    };

    this.queue.push(queueItem);
    this.stats.totalQueued++;

    this.emit('operation:queued', queueItem);

    // Process immediately if not currently processing
    if (!this.processing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  /**
   * Queue a create operation
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @param {Object} metadata - Additional metadata
   * @returns {string} Operation ID
   */
  queueCreate(table, data, metadata = {}) {
    return this.enqueue({
      type: OPERATION_TYPES.CREATE,
      table,
      data,
      metadata,
    });
  }

  /**
   * Queue an update operation
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @param {Object} data - Data to update
   * @param {Object} metadata - Additional metadata
   * @returns {string} Operation ID
   */
  queueUpdate(table, where, data, metadata = {}) {
    return this.enqueue({
      type: OPERATION_TYPES.UPDATE,
      table,
      where,
      data,
      metadata,
    });
  }

  /**
   * Queue a delete operation
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @param {Object} metadata - Additional metadata
   * @returns {string} Operation ID
   */
  queueDelete(table, where, metadata = {}) {
    return this.enqueue({
      type: OPERATION_TYPES.DELETE,
      table,
      where,
      metadata,
    });
  }

  /**
   * Queue bulk create operations
   * @param {string} table - Table name
   * @param {Array} dataArray - Array of data to insert
   * @param {Object} metadata - Additional metadata
   * @returns {string} Operation ID
   */
  queueBulkCreate(table, dataArray, metadata = {}) {
    return this.enqueue({
      type: OPERATION_TYPES.BULK_CREATE,
      table,
      data: dataArray,
      metadata,
    });
  }

  /**
   * Start the background queue processor
   * @param {number} interval - Processing interval in ms
   */
  startProcessor(interval = 30000) {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, interval);

    console.log(`[SyncQueue] Processor started with ${interval}ms interval`);
  }

  /**
   * Stop the background processor
   */
  stopProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[SyncQueue] Processor stopped');
    }
  }

  /**
   * Process the sync queue
   */
  async processQueue() {
    if (this.processing) {
      return; // Already processing
    }

    if (this.queue.length === 0) {
      return; // Nothing to process
    }

    this.processing = true;
    this.emit('queue:processing:start', { queueSize: this.queue.length });

    const batchSize = syncConfigService.get('batchSize', 50);
    const batch = this.queue.slice(0, batchSize);

    console.log(`[SyncQueue] Processing batch of ${batch.length} operations`);

    for (const operation of batch) {
      try {
        await this.processOperation(operation);
      } catch (error) {
        console.error(`[SyncQueue] Error processing operation ${operation.id}:`, error);
        this.handleOperationError(operation, error);
      }
    }

    // Remove completed/failed operations from queue
    this.queue = this.queue.filter(op => {
      return op.status === SYNC_STATUS.PENDING || op.status === SYNC_STATUS.RETRY;
    });

    this.processing = false;
    this.emit('queue:processing:complete', {
      processed: batch.length,
      remaining: this.queue.length,
    });

    this.stats.lastSync = new Date();
  }

  /**
   * Process a single operation
   * @param {Object} operation - Operation to process
   */
  async processOperation(operation) {
    operation.status = SYNC_STATUS.PROCESSING;
    operation.attempts++;

    this.emit('operation:processing', operation);

    try {
      const supabase = getSupabaseClient(true); // Use service role for sync

      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      let result;

      switch (operation.type) {
        case OPERATION_TYPES.CREATE:
          result = await this.executeCreate(supabase, operation);
          break;

        case OPERATION_TYPES.UPDATE:
          result = await this.executeUpdate(supabase, operation);
          break;

        case OPERATION_TYPES.DELETE:
          result = await this.executeDelete(supabase, operation);
          break;

        case OPERATION_TYPES.BULK_CREATE:
          result = await this.executeBulkCreate(supabase, operation);
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      operation.status = SYNC_STATUS.COMPLETED;
      operation.completedAt = new Date();
      operation.result = result;

      this.stats.totalProcessed++;
      this.emit('operation:completed', operation);

      console.log(`[SyncQueue] Completed operation ${operation.id} (${operation.type})`);
    } catch (error) {
      throw error; // Re-throw to be handled by processQueue
    }
  }

  /**
   * Execute CREATE operation
   */
  async executeCreate(supabase, operation) {
    const { table, data } = operation;

    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return result;
  }

  /**
   * Execute UPDATE operation
   */
  async executeUpdate(supabase, operation) {
    const { table, where, data } = operation;

    let query = supabase.from(table).update(data);

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select();

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return result;
  }

  /**
   * Execute DELETE operation
   */
  async executeDelete(supabase, operation) {
    const { table, where } = operation;

    let query = supabase.from(table).delete();

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return { deleted: true };
  }

  /**
   * Execute BULK_CREATE operation
   */
  async executeBulkCreate(supabase, operation) {
    const { table, data } = operation;

    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      throw new Error(`Supabase bulk insert error: ${error.message}`);
    }

    return result;
  }

  /**
   * Handle operation error with retry logic
   */
  handleOperationError(operation, error) {
    operation.error = {
      message: error.message,
      timestamp: new Date(),
      attempt: operation.attempts,
    };

    if (operation.attempts < operation.maxAttempts) {
      // Retry
      operation.status = SYNC_STATUS.RETRY;
      this.stats.totalRetried++;
      this.emit('operation:retry', operation);

      console.warn(
        `[SyncQueue] Retrying operation ${operation.id} (attempt ${operation.attempts}/${operation.maxAttempts})`
      );
    } else {
      // Max retries reached - fail permanently
      operation.status = SYNC_STATUS.FAILED;
      operation.failedAt = new Date();
      this.stats.totalFailed++;
      this.stats.lastError = error;

      this.emit('operation:failed', operation);

      console.error(
        `[SyncQueue] Operation ${operation.id} failed after ${operation.attempts} attempts:`,
        error
      );
    }
  }

  /**
   * Generate unique operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      processing: this.processing,
      pendingOperations: this.queue.filter(op => op.status === SYNC_STATUS.PENDING).length,
      retryingOperations: this.queue.filter(op => op.status === SYNC_STATUS.RETRY).length,
    };
  }

  /**
   * Get queue contents (for debugging)
   */
  getQueue() {
    return this.queue.map(op => ({
      id: op.id,
      type: op.type,
      table: op.table,
      status: op.status,
      attempts: op.attempts,
      queuedAt: op.queuedAt,
      error: op.error,
    }));
  }

  /**
   * Clear the queue (use with caution)
   */
  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue = [];
    this.emit('queue:cleared', { clearedCount });
    console.log(`[SyncQueue] Cleared ${clearedCount} operations from queue`);
    return clearedCount;
  }

  /**
   * Manually trigger sync (force process queue)
   */
  async triggerSync() {
    console.log('[SyncQueue] Manual sync triggered');
    await this.processQueue();
    return this.getStats();
  }

  /**
   * Get sync history (last N operations)
   * @param {number} limit - Number of operations to return
   */
  getHistory(limit = 100) {
    // In production, this would query a sync_history table
    // For now, return recent queue items
    return this.queue.slice(-limit).reverse();
  }
}

// Create singleton instance
const syncQueueService = new SyncQueueService();

module.exports = {
  SyncQueueService,
  syncQueueService,
  OPERATION_TYPES,
  SYNC_STATUS,
};
