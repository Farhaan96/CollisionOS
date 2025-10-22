/**
 * Unit Tests for Sync Queue Service
 * Tests queue operations, processing, retry logic, and error handling
 */

const { SyncQueueService, OPERATION_TYPES, SYNC_STATUS } = require('../../server/services/syncQueue');

// Mock Supabase client
jest.mock('../../server/config/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn(() => ({ data: { id: 'test-id' }, error: null })) })) })),
      update: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ data: [{ id: 'test-id' }], error: null })) })) })),
      delete: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
    })),
  })),
}));

// Mock sync config service
jest.mock('../../server/services/syncConfig', () => ({
  syncConfigService: {
    initialize: jest.fn(() => Promise.resolve({ enabled: false, syncInterval: 30000 })),
    get: jest.fn((key, defaultValue) => {
      const values = {
        'retryAttempts': 3,
        'batchSize': 50,
      };
      return values[key] || defaultValue;
    }),
  },
}));

describe('Sync Queue Service', () => {
  let queueService;

  beforeEach(() => {
    queueService = new SyncQueueService();
    queueService.queue = [];
    queueService.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      lastSync: null,
      lastError: null,
    };
  });

  afterEach(() => {
    if (queueService.processingInterval) {
      queueService.stopProcessor();
    }
  });

  describe('Queue Operations', () => {
    test('should enqueue a create operation', () => {
      const operationId = queueService.enqueue({
        type: OPERATION_TYPES.CREATE,
        table: 'customers',
        data: { name: 'Test Customer' },
      });

      expect(operationId).toBeDefined();
      expect(queueService.queue.length).toBe(1);
      expect(queueService.stats.totalQueued).toBe(1);
      expect(queueService.queue[0].status).toBe(SYNC_STATUS.PENDING);
    });

    test('should enqueue update operation with helper method', () => {
      const operationId = queueService.queueUpdate(
        'jobs',
        { id: 'job-123' },
        { status: 'in_progress' }
      );

      expect(operationId).toBeDefined();
      expect(queueService.queue.length).toBe(1);
      expect(queueService.queue[0].type).toBe(OPERATION_TYPES.UPDATE);
      expect(queueService.queue[0].table).toBe('jobs');
    });

    test('should enqueue delete operation with helper method', () => {
      const operationId = queueService.queueDelete(
        'parts',
        { id: 'part-456' }
      );

      expect(operationId).toBeDefined();
      expect(queueService.queue[0].type).toBe(OPERATION_TYPES.DELETE);
    });

    test('should enqueue bulk create operation', () => {
      const dataArray = [
        { name: 'Customer 1' },
        { name: 'Customer 2' },
        { name: 'Customer 3' },
      ];

      const operationId = queueService.queueBulkCreate('customers', dataArray);

      expect(operationId).toBeDefined();
      expect(queueService.queue[0].type).toBe(OPERATION_TYPES.BULK_CREATE);
      expect(queueService.queue[0].data).toHaveLength(3);
    });

    test('should generate unique operation IDs', () => {
      const id1 = queueService.queueCreate('table1', { data: 1 });
      const id2 = queueService.queueCreate('table2', { data: 2 });
      const id3 = queueService.queueCreate('table3', { data: 3 });

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('Queue Statistics', () => {
    test('should track queued operations', () => {
      queueService.queueCreate('customers', { name: 'Test' });
      queueService.queueUpdate('jobs', { id: '1' }, { status: 'done' });

      const stats = queueService.getStats();

      expect(stats.totalQueued).toBe(2);
      expect(stats.queueSize).toBe(2);
      expect(stats.pendingOperations).toBe(2);
    });

    test('should provide queue size in stats', () => {
      queueService.queueCreate('table1', {});
      queueService.queueCreate('table2', {});
      queueService.queueCreate('table3', {});

      const stats = queueService.getStats();

      expect(stats.queueSize).toBe(3);
    });

    test('should count pending and retrying operations separately', () => {
      queueService.queue = [
        { id: '1', status: SYNC_STATUS.PENDING },
        { id: '2', status: SYNC_STATUS.PENDING },
        { id: '3', status: SYNC_STATUS.RETRY },
        { id: '4', status: SYNC_STATUS.COMPLETED },
      ];

      const stats = queueService.getStats();

      expect(stats.pendingOperations).toBe(2);
      expect(stats.retryingOperations).toBe(1);
    });
  });

  describe('Queue Management', () => {
    test('should get queue contents', () => {
      queueService.queueCreate('customers', { name: 'Test' });
      queueService.queueUpdate('jobs', { id: '1' }, { status: 'done' });

      const queue = queueService.getQueue();

      expect(queue).toHaveLength(2);
      expect(queue[0]).toHaveProperty('id');
      expect(queue[0]).toHaveProperty('type');
      expect(queue[0]).toHaveProperty('table');
      expect(queue[0]).toHaveProperty('status');
      expect(queue[0]).toHaveProperty('attempts');
    });

    test('should clear queue', () => {
      queueService.queueCreate('table1', {});
      queueService.queueCreate('table2', {});
      queueService.queueCreate('table3', {});

      expect(queueService.queue.length).toBe(3);

      const clearedCount = queueService.clearQueue();

      expect(clearedCount).toBe(3);
      expect(queueService.queue.length).toBe(0);
    });

    test('should emit event when queue cleared', (done) => {
      queueService.queueCreate('table1', {});

      queueService.on('queue:cleared', (event) => {
        expect(event.clearedCount).toBe(1);
        done();
      });

      queueService.clearQueue();
    });
  });

  describe('Event Emissions', () => {
    test('should emit operation:queued event', (done) => {
      queueService.on('operation:queued', (operation) => {
        expect(operation).toHaveProperty('id');
        expect(operation).toHaveProperty('type');
        expect(operation.type).toBe(OPERATION_TYPES.CREATE);
        done();
      });

      queueService.queueCreate('customers', { name: 'Test' });
    });

    test('should not start processor if already processing', () => {
      queueService.processing = true;

      queueService.queueCreate('table', {});

      // Should not try to process since already processing
      expect(queueService.processing).toBe(true);
    });
  });

  describe('Processor Management', () => {
    test('should start processor with interval', () => {
      queueService.startProcessor(5000);

      expect(queueService.processingInterval).toBeDefined();
      expect(queueService.processingInterval).not.toBeNull();
    });

    test('should stop processor', () => {
      queueService.startProcessor(5000);
      expect(queueService.processingInterval).toBeDefined();

      queueService.stopProcessor();
      expect(queueService.processingInterval).toBeNull();
    });

    test('should clear old interval when starting new one', () => {
      queueService.startProcessor(5000);
      const firstInterval = queueService.processingInterval;

      queueService.startProcessor(10000);
      const secondInterval = queueService.processingInterval;

      expect(firstInterval).not.toBe(secondInterval);
    });
  });

  describe('Error Handling', () => {
    test('should handle operation error with retry', () => {
      const operation = {
        id: 'test-op',
        type: OPERATION_TYPES.CREATE,
        attempts: 1,
        maxAttempts: 3,
        status: SYNC_STATUS.PROCESSING,
      };

      const error = new Error('Test error');
      queueService.handleOperationError(operation, error);

      expect(operation.status).toBe(SYNC_STATUS.RETRY);
      expect(operation.error).toBeDefined();
      expect(operation.error.message).toBe('Test error');
      expect(queueService.stats.totalRetried).toBe(1);
    });

    test('should fail operation after max retries', () => {
      const operation = {
        id: 'test-op',
        type: OPERATION_TYPES.CREATE,
        attempts: 3,
        maxAttempts: 3,
        status: SYNC_STATUS.PROCESSING,
      };

      const error = new Error('Max retries error');
      queueService.handleOperationError(operation, error);

      expect(operation.status).toBe(SYNC_STATUS.FAILED);
      expect(operation.failedAt).toBeDefined();
      expect(queueService.stats.totalFailed).toBe(1);
      expect(queueService.stats.lastError).toBe(error);
    });

    test('should emit operation:retry event', (done) => {
      const operation = {
        id: 'test-op',
        attempts: 1,
        maxAttempts: 3,
        status: SYNC_STATUS.PROCESSING,
      };

      queueService.on('operation:retry', (op) => {
        expect(op.id).toBe('test-op');
        expect(op.status).toBe(SYNC_STATUS.RETRY);
        done();
      });

      queueService.handleOperationError(operation, new Error('Test'));
    });

    test('should emit operation:failed event', (done) => {
      const operation = {
        id: 'test-op',
        attempts: 3,
        maxAttempts: 3,
        status: SYNC_STATUS.PROCESSING,
      };

      queueService.on('operation:failed', (op) => {
        expect(op.id).toBe('test-op');
        expect(op.status).toBe(SYNC_STATUS.FAILED);
        done();
      });

      queueService.handleOperationError(operation, new Error('Test'));
    });
  });

  describe('History Tracking', () => {
    test('should get recent history', () => {
      for (let i = 0; i < 10; i++) {
        queueService.queueCreate('table', { data: i });
      }

      const history = queueService.getHistory(5);

      expect(history.length).toBeLessThanOrEqual(5);
    });

    test('should return history in reverse order', () => {
      queueService.queueCreate('table1', { data: 1 });
      queueService.queueCreate('table2', { data: 2 });
      queueService.queueCreate('table3', { data: 3 });

      const history = queueService.getHistory(10);

      // Most recent should be first
      expect(history[0].table).toBe('table3');
    });
  });

  describe('Operation Metadata', () => {
    test('should store metadata with operation', () => {
      const metadata = {
        shopId: 'shop-123',
        userId: 'user-456',
        source: 'mobile-app',
      };

      queueService.queueCreate('jobs', { name: 'Test' }, metadata);

      expect(queueService.queue[0].metadata).toEqual(metadata);
    });

    test('should set queuedAt timestamp', () => {
      const beforeQueue = new Date();

      queueService.queueCreate('table', {});

      const afterQueue = new Date();
      const queuedAt = queueService.queue[0].queuedAt;

      expect(queuedAt.getTime()).toBeGreaterThanOrEqual(beforeQueue.getTime());
      expect(queuedAt.getTime()).toBeLessThanOrEqual(afterQueue.getTime());
    });

    test('should initialize attempts to 0', () => {
      queueService.queueCreate('table', {});

      expect(queueService.queue[0].attempts).toBe(0);
    });

    test('should set maxAttempts from config', () => {
      queueService.queueCreate('table', {});

      expect(queueService.queue[0].maxAttempts).toBe(3); // From mocked config
    });
  });
});
